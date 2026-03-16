import React, { useState, useEffect, useCallback } from 'react';

const API = '/api';

// Styles
const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f0f2f5',
    minHeight: '100vh',
    color: '#333',
  },
  header: {
    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
    color: '#fff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  headerSub: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '2px',
  },
  triggerBtn: {
    background: '#ff6f00',
    color: '#fff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '0',
    padding: '4px 4px 0',
    background: '#e8eaf6',
    borderRadius: '10px 10px 0 0',
    overflow: 'hidden',
  },
  tab: {
    padding: '14px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    fontSize: '15px',
    fontWeight: 600,
    color: '#5c6bc0',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
    position: 'relative',
    letterSpacing: '0.5px',
  },
  tabActive: {
    color: '#1a237e',
    background: '#fff',
    boxShadow: '0 -2px 8px rgba(26,35,126,0.1)',
  },
  panel: {
    background: '#fff',
    borderRadius: '0 0 8px 8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #e0e0e0',
    color: '#555',
    fontWeight: 600,
    background: '#fafafa',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: (type) => {
    const colors = {
      link_error: { bg: '#ffebee', color: '#c62828' },
      link_broken: { bg: '#ffebee', color: '#c62828' },
      empty_file: { bg: '#fff3e0', color: '#e65100' },
      missing_title: { bg: '#fff8e1', color: '#f57f17' },
      invalid_date: { bg: '#e3f2fd', color: '#1565c0' },
      high: { bg: '#ffebee', color: '#c62828' },
      medium: { bg: '#fff3e0', color: '#e65100' },
      low: { bg: '#e8f5e9', color: '#2e7d32' },
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      completed_with_issues: { bg: '#fff3e0', color: '#e65100' },
      running: { bg: '#e3f2fd', color: '#1565c0' },
    };
    const c = colors[type] || { bg: '#f5f5f5', color: '#666' };
    return {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      background: c.bg,
      color: c.color,
    };
  },
  resolveBtn: {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '4px 12px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  catFilter: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  catBtn: (active) => ({
    padding: '6px 14px',
    borderRadius: '16px',
    border: active ? '1px solid #1a237e' : '1px solid #ddd',
    background: active ? '#1a237e' : '#fff',
    color: active ? '#fff' : '#666',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
  }),
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#bbb',
    fontSize: '14px',
  },
  pdfLink: {
    color: '#1565c0',
    textDecoration: 'none',
  },
};

function App() {
  const [tab, setTab] = useState('docs');
  const [dashboard, setDashboard] = useState(null);
  const [docs, setDocs] = useState({ docs: [], total: 0 });
  const [runs, setRuns] = useState([]);
  const [issues, setIssues] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [docPage, setDocPage] = useState(1);
  const [issueFilter, setIssueFilter] = useState('open');
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(() => {
    fetch(`${API}/dashboard`).then(r => r.json()).then(setDashboard).catch(console.error);
  }, []);

  const fetchDocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: docPage });
    if (catFilter) params.set('category', catFilter);
    fetch(`${API}/docs?${params}`).then(r => r.json()).then(d => { setDocs(d); setLoading(false); }).catch(() => setLoading(false));
  }, [catFilter, docPage]);

  const fetchRuns = useCallback(() => {
    fetch(`${API}/runs`).then(r => r.json()).then(d => setRuns(d || [])).catch(console.error);
  }, []);

  const fetchIssues = useCallback(() => {
    const params = new URLSearchParams();
    if (issueFilter === 'open') params.set('resolved', 'false');
    else if (issueFilter === 'resolved') params.set('resolved', 'true');
    fetch(`${API}/issues?${params}`).then(r => r.json()).then(d => setIssues(d || [])).catch(console.error);
  }, [issueFilter]);

  useEffect(() => { fetchDashboard(); fetchDocs(); }, [fetchDashboard, fetchDocs]);
  useEffect(() => { if (tab === 'docs') fetchDocs(); }, [tab, fetchDocs]);
  useEffect(() => { if (tab === 'runs') fetchRuns(); }, [tab, fetchRuns]);
  useEffect(() => { if (tab === 'issues') fetchIssues(); }, [tab, fetchIssues]);

  const triggerRun = () => {
    fetch(`${API}/trigger`, { method: 'POST' })
      .then(() => { alert('巡检任务已启动！'); setTimeout(fetchDashboard, 3000); })
      .catch(() => alert('启动失败'));
  };

  const resolveIssue = (id) => {
    fetch(`${API}/issues/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then(() => fetchIssues()).catch(console.error);
  };

  const baseUrl = 'http://www.bdfund.cn';

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>信披文件自动巡检系统</h1>
          <div style={styles.headerSub}>博道基金 · 信息披露监控平台</div>
        </div>
        <button style={styles.triggerBtn} onClick={triggerRun}>立即巡检</button>
      </div>

      <div style={styles.container}>
        {/* Dashboard Stats */}
        {dashboard && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#1a237e' }}>{dashboard.total_docs}</div>
              <div style={styles.statLabel}>已采集文档</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#0d47a1' }}>{dashboard.total_runs}</div>
              <div style={styles.statLabel}>巡检次数</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: dashboard.open_issues > 0 ? '#c62828' : '#2e7d32' }}>
                {dashboard.open_issues}
              </div>
              <div style={styles.statLabel}>待处理异常</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#666', fontSize: '16px', marginTop: '8px' }}>
                {dashboard.last_run_at !== 'N/A' ? dashboard.last_run_at : '尚未运行'}
              </div>
              <div style={styles.statLabel}>
                最近巡检
                {dashboard.last_run_status !== 'N/A' && (
                  <span style={{ ...styles.badge(dashboard.last_run_status), marginLeft: '8px' }}>
                    {dashboard.last_run_status}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {dashboard && dashboard.categories && dashboard.categories.length > 0 && (
          <div style={{ ...styles.statCard, marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>各栏目文档数量</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {dashboard.categories.map(c => (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#e3f2fd', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                    {c.category}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1a237e' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { key: 'docs', label: '文档列表', icon: '\u{1F4C4}' },
            { key: 'issues', label: '异常记录', icon: '\u{26A0}\uFE0F' },
            { key: 'runs', label: '巡检历史', icon: '\u{1F552}' },
          ].map(t => (
            <button
              key={t.key}
              style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}
              onClick={() => setTab(t.key)}
              onMouseEnter={e => { if (tab !== t.key) { e.target.style.background = '#d1d9ff'; e.target.style.color = '#1a237e'; } }}
              onMouseLeave={e => { if (tab !== t.key) { e.target.style.background = 'transparent'; e.target.style.color = '#5c6bc0'; } }}
            >
              <span style={{ marginRight: '6px' }}>{t.icon}</span>
              {t.label}
              {t.key === 'issues' && dashboard && dashboard.open_issues > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: '#c62828',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'inline-block',
                }}>
                  {dashboard.open_issues}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={styles.panel}>
          {/* Docs Tab */}
          {tab === 'docs' && (
            <>
              <div style={styles.catFilter}>
                <button style={styles.catBtn(!catFilter)} onClick={() => { setCatFilter(''); setDocPage(1); }}>
                  全部
                </button>
                {['发行文件','季报/年报','公司公告','招募说明书','产品概要','销售公告','产品风险评级','维护通知','其他公告'].map(c => (
                  <button key={c} style={styles.catBtn(catFilter === c)} onClick={() => { setCatFilter(c); setDocPage(1); }}>
                    {c}
                  </button>
                ))}
              </div>
              {loading ? (
                <div style={styles.loading}>加载中...</div>
              ) : docs.docs && docs.docs.length > 0 ? (
                <>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                    共 {docs.total} 条记录，第 {docPage} 页
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>日期</th>
                          <th style={styles.th}>栏目</th>
                          <th style={styles.th}>标题</th>
                          <th style={styles.th}>文件大小</th>
                          <th style={styles.th}>SHA256</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.docs.map(d => (
                          <tr key={d.id}>
                            <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{d.publish_date}</td>
                            <td style={styles.td}>
                              <span style={styles.badge('running')}>{d.category}</span>
                            </td>
                            <td style={{ ...styles.td, maxWidth: '450px' }}>
                              <a href={d.pdf_url.startsWith('http') ? d.pdf_url : baseUrl + d.pdf_url}
                                target="_blank" rel="noreferrer" style={styles.pdfLink} title={d.title}>
                                {d.title}
                              </a>
                            </td>
                            <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                              {d.file_size > 0 ? `${(d.file_size / 1024).toFixed(0)} KB` : '-'}
                            </td>
                            <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', maxWidth: '120px' }}>
                              {d.file_sha256 ? d.file_sha256.substring(0, 16) + '...' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                    <button
                      style={styles.catBtn(false)}
                      onClick={() => setDocPage(p => Math.max(1, p - 1))}
                      disabled={docPage <= 1}
                    >
                      上一页
                    </button>
                    <span style={{ padding: '6px 14px', fontSize: '13px', color: '#666' }}>第 {docPage} 页</span>
                    <button
                      style={styles.catBtn(false)}
                      onClick={() => setDocPage(p => p + 1)}
                      disabled={docs.docs.length < 20}
                    >
                      下一页
                    </button>
                  </div>
                </>
              ) : (
                <div style={styles.noData}>暂无数据，请先运行巡检</div>
              )}
            </>
          )}

          {/* Issues Tab */}
          {tab === 'issues' && (
            <>
              <div style={{ ...styles.catFilter, marginBottom: '16px' }}>
                {[
                  { key: 'open', label: '待处理' },
                  { key: 'resolved', label: '已解决' },
                  { key: 'all', label: '全部' },
                ].map(f => (
                  <button key={f.key} style={styles.catBtn(issueFilter === f.key)} onClick={() => setIssueFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {issues.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>时间</th>
                        <th style={styles.th}>异常类型</th>
                        <th style={styles.th}>严重程度</th>
                        <th style={styles.th}>文档</th>
                        <th style={styles.th}>预期</th>
                        <th style={styles.th}>实际</th>
                        <th style={styles.th}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(i => (
                        <tr key={i.id}>
                          <td style={{ ...styles.td, whiteSpace: 'nowrap', fontSize: '12px' }}>{i.created_at}</td>
                          <td style={styles.td}><span style={styles.badge(i.issue_type)}>{i.issue_type}</span></td>
                          <td style={styles.td}><span style={styles.badge(i.severity)}>{i.severity}</span></td>
                          <td style={{ ...styles.td, maxWidth: '300px' }} title={i.doc_title}>{i.doc_title}</td>
                          <td style={{ ...styles.td, fontSize: '12px', fontFamily: 'monospace' }}>{i.expected_value}</td>
                          <td style={{ ...styles.td, fontSize: '12px', fontFamily: 'monospace', maxWidth: '200px' }}>{i.actual_value}</td>
                          <td style={styles.td}>
                            {!i.resolved && (
                              <button style={styles.resolveBtn} onClick={() => resolveIssue(i.id)}>标记解决</button>
                            )}
                            {i.resolved && <span style={{ color: '#4caf50', fontSize: '12px' }}>已解决</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.noData}>
                  {issueFilter === 'open' ? '没有待处理的异常' : '暂无记录'}
                </div>
              )}
            </>
          )}

          {/* Runs Tab */}
          {tab === 'runs' && (
            <>
              {runs.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>开始时间</th>
                      <th style={styles.th}>结束时间</th>
                      <th style={styles.th}>状态</th>
                      <th style={styles.th}>检查数</th>
                      <th style={styles.th}>异常数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map(r => (
                      <tr key={r.id}>
                        <td style={styles.td}>#{r.id}</td>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{r.started_at}</td>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{r.finished_at || '-'}</td>
                        <td style={styles.td}><span style={styles.badge(r.status)}>{r.status}</span></td>
                        <td style={styles.td}>{r.checked_count}</td>
                        <td style={{ ...styles.td, color: r.issue_count > 0 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
                          {r.issue_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={styles.noData}>暂无巡检记录</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
