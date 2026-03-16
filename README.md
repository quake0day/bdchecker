# 信披文件自动巡检系统 (BDChecker)

针对[博道基金](http://www.bdfund.cn/)信息披露页面的自动化巡检系统，定时抓取网站公开页面并与预期状态进行多维校验，及时发现漏挂、错挂、链接失效等问题。

## 功能特性

- **自动定时巡检** — 每 30 分钟自动抓取博道基金网站 9 个信披栏目
- **PDF 文件校验** — 下载每个 PDF 验证链接可达性、文件大小、SHA256 哈希
- **多维异常检测** — 链接失效(404/403)、空文件、标题缺失、日期格式异常
- **手动触发** — 支持一键立即执行巡检
- **可视化仪表盘** — 文档总数、巡检次数、异常统计等关键指标
- **文档浏览** — 按栏目筛选、分页浏览所有已采集文档
- **异常管理** — 查看、筛选、标记解决异常记录
- **巡检历史** — 每次巡检的时间、状态、检查数和异常数

## 覆盖栏目

| 栏目 | 路径 |
|------|------|
| 发行文件 | `/news/information/laws/` |
| 季报/年报 | `/news/information/dingqi/` |
| 公司公告 | `/news/information/company/` |
| 招募说明书 | `/news/information/zhaomu/` |
| 产品概要 | `/news/information/gaiyao/` |
| 销售公告 | `/news/information/sale/` |
| 产品风险评级 | `/news/information/productrisk/` |
| 维护通知 | `/news/information/tongzhi/` |
| 其他公告 | `/news/information/funds/` |

## 技术栈

- **后端**: Go (net/http + SQLite + robfig/cron)
- **前端**: React 18 (单文件 SPA)
- **部署**: Docker (多阶段构建，单容器)
- **数据库**: SQLite (持久化到 Docker Volume)

## 项目结构

```
.
├── backend/
│   ├── main.go          # Go 后端（爬虫 + API + 定时任务）
│   └── go.mod
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js       # React 前端（仪表盘 + 文档列表 + 异常管理）
│   │   └── index.js
│   └── package.json
├── Dockerfile           # 多阶段构建（Node + Go + Alpine）
├── docker-compose.yml
└── README.md
```

## 快速部署

### 前置要求

- Docker & Docker Compose

### 一键启动

```bash
git clone https://github.com/quake0day/bdchecker.git
cd bdchecker
docker compose up -d --build
```

启动后访问 `http://localhost:8088` 即可。

系统会在启动 2 秒后自动执行首次巡检，之后每 30 分钟自动运行。

### 自定义端口

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "你想要的端口:8080"
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard` | 仪表盘统计数据 |
| GET | `/api/docs?category=&page=` | 文档列表（支持栏目筛选和分页） |
| GET | `/api/runs` | 巡检运行记录 |
| GET | `/api/issues?resolved=false` | 异常记录（支持按状态筛选） |
| POST | `/api/trigger` | 手动触发巡检 |
| POST | `/api/issues/resolve` | 标记异常为已解决 |
| GET | `/api/categories` | 获取栏目列表 |

## 数据库表结构

### disclosure_docs — 信披文档

| 字段 | 类型 | 说明 |
|------|------|------|
| title | TEXT | 文档标题 |
| category | TEXT | 所属栏目 |
| publish_date | TEXT | 发布日期 |
| pdf_url | TEXT | PDF 链接（唯一） |
| file_sha256 | TEXT | 文件 SHA256 哈希 |
| file_size | INTEGER | 文件大小（字节） |

### check_runs — 巡检记录

| 字段 | 类型 | 说明 |
|------|------|------|
| started_at | TEXT | 开始时间 |
| finished_at | TEXT | 结束时间 |
| status | TEXT | 状态（running / completed / completed_with_issues） |
| checked_count | INTEGER | 检查文档数 |
| issue_count | INTEGER | 发现异常数 |

### check_issues — 异常记录

| 字段 | 类型 | 说明 |
|------|------|------|
| run_id | INTEGER | 关联巡检记录 |
| doc_title | TEXT | 文档标题 |
| issue_type | TEXT | 异常类型（link_error / link_broken / empty_file / missing_title / invalid_date） |
| expected_value | TEXT | 预期值 |
| actual_value | TEXT | 实际值 |
| severity | TEXT | 严重等级（high / medium / low） |
| resolved | INTEGER | 是否已解决 |

## 巡检逻辑

1. 遍历 9 个信披栏目，抓取每个栏目前 3 页（覆盖近期文档）
2. 解析页面 HTML，提取文档标题、日期、PDF 链接
3. 对每个 PDF 执行以下校验：
   - HTTP 状态码是否为 200
   - 文件大小是否 > 0
   - 计算 SHA256 哈希并记录（用于后续版本变更检测）
   - 标题是否非空
   - 日期格式是否合法（YYYY-MM-DD）
4. 发现异常写入 `check_issues` 表
5. 更新 `check_runs` 状态和统计

## License

MIT
