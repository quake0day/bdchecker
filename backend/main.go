package main

import (
	"crypto/sha256"
	"crypto/tls"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/robfig/cron/v3"
	"golang.org/x/net/html"
)

// ============== Models ==============

type Category struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Path string `json:"path"`
}

type DisclosureDoc struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	PublishDate string `json:"publish_date"`
	PdfURL      string `json:"pdf_url"`
	FileSHA256  string `json:"file_sha256"`
	FileSize    int64  `json:"file_size"`
	Source      string `json:"source"` // "website"
	CreatedAt   string `json:"created_at"`
}

type CheckRun struct {
	ID           int64  `json:"id"`
	StartedAt    string `json:"started_at"`
	FinishedAt   string `json:"finished_at"`
	Status       string `json:"status"`
	CheckedCount int    `json:"checked_count"`
	IssueCount   int    `json:"issue_count"`
}

type CheckIssue struct {
	ID            int64  `json:"id"`
	RunID         int64  `json:"run_id"`
	DocTitle      string `json:"doc_title"`
	IssueType     string `json:"issue_type"`
	ExpectedValue string `json:"expected_value"`
	ActualValue   string `json:"actual_value"`
	PageURL       string `json:"page_url"`
	Severity      string `json:"severity"`
	Resolved      bool   `json:"resolved"`
	CreatedAt     string `json:"created_at"`
}

type DashboardStats struct {
	TotalDocs    int          `json:"total_docs"`
	TotalRuns    int          `json:"total_runs"`
	TotalIssues  int          `json:"total_issues"`
	OpenIssues   int          `json:"open_issues"`
	LastRunAt    string       `json:"last_run_at"`
	LastRunStatus string      `json:"last_run_status"`
	Categories   []CatCount   `json:"categories"`
}

type CatCount struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

// ============== Globals ==============

var (
	db         *sql.DB
	baseURL    = "http://www.bdfund.cn"
	categories = []Category{
		{Name: "发行文件", Slug: "laws", Path: "/news/information/laws/"},
		{Name: "季报/年报", Slug: "dingqi", Path: "/news/information/dingqi/"},
		{Name: "公司公告", Slug: "company", Path: "/news/information/company/"},
		{Name: "招募说明书", Slug: "zhaomu", Path: "/news/information/zhaomu/"},
		{Name: "产品概要", Slug: "gaiyao", Path: "/news/information/gaiyao/"},
		{Name: "销售公告", Slug: "sale", Path: "/news/information/sale/"},
		{Name: "产品风险评级", Slug: "productrisk", Path: "/news/information/productrisk/"},
		{Name: "维护通知", Slug: "tongzhi", Path: "/news/information/tongzhi/"},
		{Name: "其他公告", Slug: "funds", Path: "/news/information/funds/"},
	}
	httpClient *http.Client
	isRunning  sync.Mutex
)

// ============== Database ==============

func initDB() {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/data/inspector.db"
	}
	db, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS disclosure_docs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		category TEXT NOT NULL,
		publish_date TEXT NOT NULL,
		pdf_url TEXT NOT NULL,
		file_sha256 TEXT DEFAULT '',
		file_size INTEGER DEFAULT 0,
		source TEXT DEFAULT 'website',
		created_at TEXT DEFAULT (datetime('now')),
		UNIQUE(pdf_url)
	);

	CREATE TABLE IF NOT EXISTS check_runs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		started_at TEXT NOT NULL,
		finished_at TEXT DEFAULT '',
		status TEXT DEFAULT 'running',
		checked_count INTEGER DEFAULT 0,
		issue_count INTEGER DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS check_issues (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		run_id INTEGER NOT NULL,
		doc_title TEXT NOT NULL,
		issue_type TEXT NOT NULL,
		expected_value TEXT DEFAULT '',
		actual_value TEXT DEFAULT '',
		page_url TEXT DEFAULT '',
		severity TEXT DEFAULT 'high',
		resolved INTEGER DEFAULT 0,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (run_id) REFERENCES check_runs(id)
	);

	CREATE INDEX IF NOT EXISTS idx_docs_category ON disclosure_docs(category);
	CREATE INDEX IF NOT EXISTS idx_docs_date ON disclosure_docs(publish_date);
	CREATE INDEX IF NOT EXISTS idx_issues_run ON check_issues(run_id);
	CREATE INDEX IF NOT EXISTS idx_issues_resolved ON check_issues(resolved);
	`
	_, err = db.Exec(schema)
	if err != nil {
		log.Fatal("Failed to create schema:", err)
	}
	log.Println("Database initialized successfully")
}

// ============== Scraper ==============

func initHTTPClient() {
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
}

func fetchPage(url string) (string, error) {
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; DisclosureInspector/1.0)")
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch error: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read error: %w", err)
	}
	return string(body), nil
}

type ScrapedItem struct {
	Title       string
	PublishDate string
	PdfURL      string
}

func parseCategoryPage(htmlContent string, cat Category) []ScrapedItem {
	var items []ScrapedItem
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		log.Printf("Parse error for %s: %v", cat.Name, err)
		return items
	}

	// Find div.law-list > ul > li elements
	var findItems func(*html.Node)
	findItems = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "div" {
			for _, a := range n.Attr {
				if a.Key == "class" && strings.Contains(a.Val, "law-list") {
					// Found the list container, now find li elements
					extractListItems(n, &items)
					return
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			findItems(c)
		}
	}
	findItems(doc)
	return items
}

func extractListItems(n *html.Node, items *[]ScrapedItem) {
	if n.Type == html.ElementNode && n.Data == "li" {
		item := ScrapedItem{}
		var extractFromLi func(*html.Node)
		extractFromLi = func(child *html.Node) {
			if child.Type == html.ElementNode {
				if child.Data == "span" {
					// Date
					item.PublishDate = strings.TrimSpace(getTextContent(child))
				}
				if child.Data == "a" {
					for _, a := range child.Attr {
						if a.Key == "href" {
							item.PdfURL = a.Val
						}
						if a.Key == "title" {
							item.Title = a.Val
						}
					}
					if item.Title == "" {
						item.Title = strings.TrimSpace(getTextContent(child))
					}
				}
			}
			for c := child.FirstChild; c != nil; c = c.NextSibling {
				extractFromLi(c)
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			extractFromLi(c)
		}
		if item.Title != "" && item.PdfURL != "" {
			*items = append(*items, item)
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		extractListItems(c, items)
	}
}

func getTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}
	var text string
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text += getTextContent(c)
	}
	return text
}

func getMaxPage(htmlContent string) int {
	// Find max page from pagination: pattern like index26.html
	re := regexp.MustCompile(`index(\d+)\.html`)
	matches := re.FindAllStringSubmatch(htmlContent, -1)
	maxPage := 1
	for _, m := range matches {
		var p int
		fmt.Sscanf(m[1], "%d", &p)
		if p > maxPage {
			maxPage = p
		}
	}
	return maxPage
}

func scrapeCategory(cat Category, maxPages int) []ScrapedItem {
	var allItems []ScrapedItem

	// First page
	url := baseURL + cat.Path + "index.html"
	htmlContent, err := fetchPage(url)
	if err != nil {
		log.Printf("Error fetching %s page 1: %v", cat.Name, err)
		return allItems
	}

	items := parseCategoryPage(htmlContent, cat)
	allItems = append(allItems, items...)

	totalPages := getMaxPage(htmlContent)
	if maxPages > 0 && totalPages > maxPages {
		totalPages = maxPages
	}

	// Subsequent pages
	for page := 2; page <= totalPages; page++ {
		url = fmt.Sprintf("%s%sindex%d.html", baseURL, cat.Path, page)
		htmlContent, err = fetchPage(url)
		if err != nil {
			log.Printf("Error fetching %s page %d: %v", cat.Name, page, err)
			continue
		}
		items = parseCategoryPage(htmlContent, cat)
		allItems = append(allItems, items...)
		time.Sleep(200 * time.Millisecond) // polite crawling
	}

	return items
}

// ============== Checker ==============

func checkPDFLink(pdfURL string) (int, int64, string, error) {
	fullURL := pdfURL
	if !strings.HasPrefix(pdfURL, "http") {
		fullURL = baseURL + pdfURL
	}

	resp, err := httpClient.Get(fullURL)
	if err != nil {
		return 0, 0, "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, 0, "", err
	}

	h := sha256.Sum256(body)
	return resp.StatusCode, int64(len(body)), hex.EncodeToString(h[:]), nil
}

func runInspection() {
	if !isRunning.TryLock() {
		log.Println("Inspection already running, skipping")
		return
	}
	defer isRunning.Unlock()

	log.Println("=== Starting inspection run ===")
	startedAt := time.Now().UTC().Format("2006-01-02 15:04:05")

	res, err := db.Exec("INSERT INTO check_runs (started_at, status) VALUES (?, 'running')", startedAt)
	if err != nil {
		log.Printf("Failed to create check run: %v", err)
		return
	}
	runID, _ := res.LastInsertId()

	totalChecked := 0
	totalIssues := 0

	for _, cat := range categories {
		log.Printf("Scraping category: %s", cat.Name)
		// Scrape first 3 pages for MVP (covers recent docs)
		items := scrapeCategory(cat, 3)
		log.Printf("  Found %d items in %s", len(items), cat.Name)

		for _, item := range items {
			totalChecked++

			// Normalize URL
			pdfURL := item.PdfURL
			if !strings.HasPrefix(pdfURL, "http") {
				pdfURL = baseURL + pdfURL
			}

			// Store/update doc
			_, err := db.Exec(`INSERT OR IGNORE INTO disclosure_docs
				(title, category, publish_date, pdf_url, source)
				VALUES (?, ?, ?, ?, 'website')`,
				item.Title, cat.Name, item.PublishDate, item.PdfURL)
			if err != nil {
				log.Printf("  DB insert error: %v", err)
			}

			// Check PDF link accessibility
			statusCode, fileSize, sha256Hash, err := checkPDFLink(item.PdfURL)
			if err != nil {
				totalIssues++
				db.Exec(`INSERT INTO check_issues
					(run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity)
					VALUES (?, ?, 'link_error', '200', ?, ?, 'high')`,
					runID, item.Title, fmt.Sprintf("error: %v", err),
					baseURL+cat.Path+"index.html")
				log.Printf("  ISSUE [link_error] %s: %v", item.Title, err)
				continue
			}

			if statusCode != 200 {
				totalIssues++
				db.Exec(`INSERT INTO check_issues
					(run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity)
					VALUES (?, ?, 'link_broken', '200', ?, ?, 'high')`,
					runID, item.Title, fmt.Sprintf("%d", statusCode),
					baseURL+cat.Path+"index.html")
				log.Printf("  ISSUE [link_broken] %s: HTTP %d", item.Title, statusCode)
				continue
			}

			// Update file info
			db.Exec(`UPDATE disclosure_docs SET file_sha256=?, file_size=? WHERE pdf_url=?`,
				sha256Hash, fileSize, item.PdfURL)

			// Check for zero-size files
			if fileSize == 0 {
				totalIssues++
				db.Exec(`INSERT INTO check_issues
					(run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity)
					VALUES (?, ?, 'empty_file', '>0', '0', ?, 'high')`,
					runID, item.Title, pdfURL)
				log.Printf("  ISSUE [empty_file] %s", item.Title)
			}

			// Check title consistency (non-empty)
			if strings.TrimSpace(item.Title) == "" {
				totalIssues++
				db.Exec(`INSERT INTO check_issues
					(run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity)
					VALUES (?, ?, 'missing_title', 'non-empty', 'empty', ?, 'medium')`,
					runID, "(untitled)", baseURL+cat.Path+"index.html")
			}

			// Check date format
			if !isValidDate(item.PublishDate) {
				totalIssues++
				db.Exec(`INSERT INTO check_issues
					(run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity)
					VALUES (?, ?, 'invalid_date', 'YYYY-MM-DD', ?, ?, 'medium')`,
					runID, item.Title, item.PublishDate,
					baseURL+cat.Path+"index.html")
			}

			time.Sleep(100 * time.Millisecond) // polite checking
		}
	}

	finishedAt := time.Now().UTC().Format("2006-01-02 15:04:05")
	status := "completed"
	if totalIssues > 0 {
		status = "completed_with_issues"
	}
	db.Exec(`UPDATE check_runs SET finished_at=?, status=?, checked_count=?, issue_count=? WHERE id=?`,
		finishedAt, status, totalChecked, totalIssues, runID)

	log.Printf("=== Inspection complete: checked=%d issues=%d ===", totalChecked, totalIssues)
}

func isValidDate(d string) bool {
	_, err := time.Parse("2006-01-02", d)
	return err == nil
}

// ============== API Handlers ==============

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(200)
			return
		}
		next(w, r)
	}
}

func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func handleDashboard(w http.ResponseWriter, r *http.Request) {
	stats := DashboardStats{}
	db.QueryRow("SELECT COUNT(*) FROM disclosure_docs").Scan(&stats.TotalDocs)
	db.QueryRow("SELECT COUNT(*) FROM check_runs").Scan(&stats.TotalRuns)
	db.QueryRow("SELECT COUNT(*) FROM check_issues").Scan(&stats.TotalIssues)
	db.QueryRow("SELECT COUNT(*) FROM check_issues WHERE resolved=0").Scan(&stats.OpenIssues)
	db.QueryRow("SELECT COALESCE(started_at,'N/A'), COALESCE(status,'N/A') FROM check_runs ORDER BY id DESC LIMIT 1").Scan(&stats.LastRunAt, &stats.LastRunStatus)

	rows, _ := db.Query("SELECT category, COUNT(*) FROM disclosure_docs GROUP BY category ORDER BY COUNT(*) DESC")
	defer rows.Close()
	for rows.Next() {
		var c CatCount
		rows.Scan(&c.Category, &c.Count)
		stats.Categories = append(stats.Categories, c)
	}

	jsonResponse(w, stats)
}

func handleDocs(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	limit := 20
	var offset int
	fmt.Sscanf(page, "%d", &offset)
	offset = (offset - 1) * limit

	var rows *sql.Rows
	var err error
	if category != "" {
		rows, err = db.Query(`SELECT id, title, category, publish_date, pdf_url, file_sha256, file_size, source, created_at
			FROM disclosure_docs WHERE category=? ORDER BY publish_date DESC LIMIT ? OFFSET ?`, category, limit, offset)
	} else {
		rows, err = db.Query(`SELECT id, title, category, publish_date, pdf_url, file_sha256, file_size, source, created_at
			FROM disclosure_docs ORDER BY publish_date DESC LIMIT ? OFFSET ?`, limit, offset)
	}
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var docs []DisclosureDoc
	for rows.Next() {
		var d DisclosureDoc
		rows.Scan(&d.ID, &d.Title, &d.Category, &d.PublishDate, &d.PdfURL, &d.FileSHA256, &d.FileSize, &d.Source, &d.CreatedAt)
		docs = append(docs, d)
	}

	// Get total count
	var total int
	if category != "" {
		db.QueryRow("SELECT COUNT(*) FROM disclosure_docs WHERE category=?", category).Scan(&total)
	} else {
		db.QueryRow("SELECT COUNT(*) FROM disclosure_docs").Scan(&total)
	}

	jsonResponse(w, map[string]interface{}{
		"docs":  docs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func handleRuns(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, started_at, finished_at, status, checked_count, issue_count
		FROM check_runs ORDER BY id DESC LIMIT 20`)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var runs []CheckRun
	for rows.Next() {
		var r CheckRun
		rows.Scan(&r.ID, &r.StartedAt, &r.FinishedAt, &r.Status, &r.CheckedCount, &r.IssueCount)
		runs = append(runs, r)
	}
	jsonResponse(w, runs)
}

func handleIssues(w http.ResponseWriter, r *http.Request) {
	resolved := r.URL.Query().Get("resolved")
	runID := r.URL.Query().Get("run_id")

	query := `SELECT id, run_id, doc_title, issue_type, expected_value, actual_value, page_url, severity, resolved, created_at
		FROM check_issues WHERE 1=1`
	var args []interface{}

	if resolved == "false" {
		query += " AND resolved=0"
	} else if resolved == "true" {
		query += " AND resolved=1"
	}
	if runID != "" {
		query += " AND run_id=?"
		args = append(args, runID)
	}
	query += " ORDER BY id DESC LIMIT 100"

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var issues []CheckIssue
	for rows.Next() {
		var i CheckIssue
		var resolvedInt int
		rows.Scan(&i.ID, &i.RunID, &i.DocTitle, &i.IssueType, &i.ExpectedValue,
			&i.ActualValue, &i.PageURL, &i.Severity, &resolvedInt, &i.CreatedAt)
		i.Resolved = resolvedInt == 1
		issues = append(issues, i)
	}
	jsonResponse(w, issues)
}

func handleResolveIssue(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID int64 `json:"id"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	_, err := db.Exec("UPDATE check_issues SET resolved=1 WHERE id=?", req.ID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	jsonResponse(w, map[string]string{"status": "ok"})
}

func handleTriggerRun(w http.ResponseWriter, r *http.Request) {
	go runInspection()
	jsonResponse(w, map[string]string{"status": "started"})
}

func handleCategories(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, categories)
}

// ============== Main ==============

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting Disclosure Inspector...")

	initHTTPClient()
	initDB()

	// Setup cron: run every 30 minutes
	c := cron.New()
	c.AddFunc("*/30 * * * *", runInspection)
	c.Start()
	log.Println("Cron job scheduled: every 30 minutes")

	// Run initial inspection on startup
	go func() {
		time.Sleep(2 * time.Second)
		runInspection()
	}()

	// API routes
	mux := http.NewServeMux()
	mux.HandleFunc("/api/dashboard", corsMiddleware(handleDashboard))
	mux.HandleFunc("/api/docs", corsMiddleware(handleDocs))
	mux.HandleFunc("/api/runs", corsMiddleware(handleRuns))
	mux.HandleFunc("/api/issues", corsMiddleware(handleIssues))
	mux.HandleFunc("/api/issues/resolve", corsMiddleware(handleResolveIssue))
	mux.HandleFunc("/api/trigger", corsMiddleware(handleTriggerRun))
	mux.HandleFunc("/api/categories", corsMiddleware(handleCategories))

	// Serve frontend static files
	fs := http.FileServer(http.Dir("/app/static"))
	mux.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
