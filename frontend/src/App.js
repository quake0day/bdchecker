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
  // Expected docs page styles
  editInput: {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #1a237e',
    borderRadius: '3px',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#e8eaf6',
  },
  editSelect: {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #1a237e',
    borderRadius: '3px',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#e8eaf6',
  },
  deleteBtn: {
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '3px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  statusDot: (status) => {
    const colors = { approved: '#ff9800', published: '#4caf50', retired: '#9e9e9e' };
    return {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: colors[status] || '#ccc',
      marginRight: '6px',
    };
  },
};

// ============== Expected Docs Full Page ==============
function ExpectedDocsPage({ onBack }) {
  const [expectedDocs, setExpectedDocs] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [dirtyRows, setDirtyRows] = useState(new Set());
  const [expectedCatFilter, setExpectedCatFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const fetchExpectedDocs = useCallback(() => {
    const params = new URLSearchParams();
    if (expectedCatFilter) params.set('category', expectedCatFilter);
    fetch(`${API}/expected-docs?${params}`).then(r => r.json()).then(d => setExpectedDocs(d || [])).catch(console.error);
  }, [expectedCatFilter]);

  useEffect(() => { fetchExpectedDocs(); }, [fetchExpectedDocs]);

  const addExpectedRow = () => {
    const newDoc = {
      id: -(Date.now()),
      doc_id: '', title: '', category: '公司公告',
      publish_date: new Date().toISOString().split('T')[0],
      expected_url: '', file_sha256: '', file_size: 0,
      version: '', status: 'approved', publish_deadline: '', remark: '',
      _isNew: true,
    };
    setExpectedDocs(prev => [newDoc, ...prev]);
    setDirtyRows(prev => new Set(prev).add(newDoc.id));
  };

  const startEdit = (rowId, field, currentValue) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue || '');
  };

  const commitEdit = (rowId, field) => {
    setExpectedDocs(prev => prev.map(d => {
      if (d.id === rowId) {
        return { ...d, [field]: field === 'file_size' ? parseInt(editValue) || 0 : editValue };
      }
      return d;
    }));
    setDirtyRows(prev => new Set(prev).add(rowId));
    setEditingCell(null);
  };

  const saveRow = async (doc) => {
    try {
      if (doc._isNew) {
        const res = await fetch(`${API}/expected-docs/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        });
        if (!res.ok) { alert('保存失败: ' + await res.text()); return; }
        const saved = await res.json();
        setExpectedDocs(prev => prev.map(d => d.id === doc.id ? { ...saved, _isNew: false } : d));
      } else {
        const res = await fetch(`${API}/expected-docs/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        });
        if (!res.ok) { alert('保存失败: ' + await res.text()); return; }
      }
      setDirtyRows(prev => { const s = new Set(prev); s.delete(doc.id); return s; });
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  const saveAllDirty = async () => {
    const dirtyDocs = expectedDocs.filter(d => dirtyRows.has(d.id));
    for (const doc of dirtyDocs) {
      await saveRow(doc);
    }
  };

  const deleteExpectedRow = async (doc) => {
    if (!window.confirm(`确定删除「${doc.title || '空记录'}」？`)) return;
    if (doc._isNew) {
      setExpectedDocs(prev => prev.filter(d => d.id !== doc.id));
      setDirtyRows(prev => { const s = new Set(prev); s.delete(doc.id); return s; });
      return;
    }
    try {
      await fetch(`${API}/expected-docs/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });
      setExpectedDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (e) {
      alert('删除失败');
    }
  };

  const exportCSV = () => {
    const headers = ['文档ID', '标题', '栏目', '发布日期', '预期URL', 'SHA256', '文件大小', '版本', '状态', '发布截止', '备注'];
    const fields = ['doc_id', 'title', 'category', 'publish_date', 'expected_url', 'file_sha256', 'file_size', 'version', 'status', 'publish_deadline', 'remark'];
    const csvContent = [
      headers.join(','),
      ...expectedDocs.map(d => fields.map(f => `"${String(d[f] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `应发布清单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('CSV 文件为空'); return; }
      const fields = ['doc_id', 'title', 'category', 'publish_date', 'expected_url', 'file_sha256', 'file_size', 'version', 'status', 'publish_deadline', 'remark'];
      const docs = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^,]*)(,|$)/g)?.map(v => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        const doc = {};
        fields.forEach((f, idx) => { doc[f] = values[idx] || ''; });
        doc.file_size = parseInt(doc.file_size) || 0;
        if (doc.title && doc.category) docs.push(doc);
      }
      if (docs.length === 0) { alert('未找到有效数据'); return; }
      try {
        const res = await fetch(`${API}/expected-docs/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docs),
        });
        const result = await res.json();
        alert(`成功导入 ${result.inserted} 条记录`);
        fetchExpectedDocs();
      } catch (err) {
        alert('导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const expectedFields = [
    { key: 'doc_id', label: '文档ID', width: 90 },
    { key: 'title', label: '标题', width: 280 },
    { key: 'category', label: '栏目', width: 110, type: 'select', options: ['发行文件','季报/年报','公司公告','招募说明书','产品概要','销售公告','产品风险评级','维护通知','其他公告'] },
    { key: 'publish_date', label: '发布日期', width: 120, type: 'date' },
    { key: 'expected_url', label: '预期URL', width: 250 },
    { key: 'file_sha256', label: 'SHA256', width: 140 },
    { key: 'file_size', label: '文件大小', width: 90, type: 'number' },
    { key: 'version', label: '版本', width: 60 },
    { key: 'status', label: '状态', width: 90, type: 'select', options: ['approved', 'published', 'retired'] },
    { key: 'publish_deadline', label: '发布截止', width: 120, type: 'date' },
    { key: 'remark', label: '备注', width: 150 },
  ];

  const totalWidth = expectedFields.reduce((s, f) => s + f.width, 0) + 100; // +100 for action col

  const renderEditableCell = (doc, field) => {
    const isEditing = editingCell?.rowId === doc.id && editingCell?.field === field.key;
    const value = doc[field.key];

    if (isEditing) {
      if (field.type === 'select') {
        return (
          <select style={styles.editSelect} value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => commitEdit(doc.id, field.key)} autoFocus>
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      return (
        <input style={styles.editInput}
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => commitEdit(doc.id, field.key)}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(doc.id, field.key); if (e.key === 'Escape') setEditingCell(null); }}
          autoFocus />
      );
    }

    let displayValue = value;
    if (field.key === 'status' && value) {
      return (
        <span onClick={() => startEdit(doc.id, field.key, value)} style={{ cursor: 'pointer' }}>
          <span style={styles.statusDot(value)} />
          {value === 'approved' ? '待发布' : value === 'published' ? '已发布' : '已废弃'}
        </span>
      );
    }
    if (field.key === 'file_size' && value > 0) {
      displayValue = `${(value / 1024).toFixed(0)} KB`;
    }
    if (field.key === 'file_sha256' && value) {
      displayValue = value.substring(0, 16) + '...';
    }

    return (
      <span onClick={() => startEdit(doc.id, field.key, field.key === 'file_size' ? value : (value || ''))}
        style={{ cursor: 'pointer', display: 'block', minHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={String(value || '')}>
        {displayValue || <span style={{ color: '#ccc' }}>-</span>}
      </span>
    );
  };

  // Filter by search
  const filteredDocs = searchText
    ? expectedDocs.filter(d => d.title.includes(searchText) || d.doc_id.includes(searchText) || d.remark.includes(searchText))
    : expectedDocs;

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={{ ...styles.header, padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
            padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          }}>
            &larr; 返回主页
          </button>
          <div>
            <h1 style={{ ...styles.headerTitle, fontSize: '18px' }}>应发布清单管理</h1>
            <div style={styles.headerSub}>Source of Truth &middot; 内部应发布文档维护</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>
            共 {expectedDocs.length} 条
            {dirtyRows.size > 0 && <span style={{ color: '#ffeb3b', fontWeight: 600, marginLeft: '8px' }}>{dirtyRows.size} 条未保存</span>}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '12px 24px',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button style={{
          background: '#1a237e', color: '#fff', border: 'none', padding: '8px 20px',
          borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        }} onClick={addExpectedRow}>
          + 新增记录
        </button>
        <button style={{
          background: dirtyRows.size > 0 ? '#2e7d32' : '#a5d6a7', color: '#fff', border: 'none',
          padding: '8px 20px', borderRadius: '4px', cursor: dirtyRows.size > 0 ? 'pointer' : 'default',
          fontSize: '13px', fontWeight: 600,
        }} onClick={saveAllDirty} disabled={dirtyRows.size === 0}>
          保存全部 {dirtyRows.size > 0 && `(${dirtyRows.size})`}
        </button>
        <div style={{ width: '1px', height: '28px', background: '#e0e0e0' }} />
        <button style={{
          background: '#0d47a1', color: '#fff', border: 'none', padding: '8px 16px',
          borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
        }} onClick={exportCSV}>
          导出 CSV
        </button>
        <label style={{
          background: '#4527a0', color: '#fff', border: 'none', padding: '8px 16px',
          borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'inline-block',
        }}>
          导入 CSV
          <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
        </label>
        <div style={{ width: '1px', height: '28px', background: '#e0e0e0' }} />
        <input
          type="text" placeholder="搜索标题/文档ID/备注..."
          value={searchText} onChange={e => setSearchText(e.target.value)}
          style={{
            padding: '7px 14px', border: '1px solid #ddd', borderRadius: '4px',
            fontSize: '13px', width: '220px', outline: 'none',
          }}
        />
      </div>

      {/* Category filter */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '10px 24px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button style={styles.catBtn(!expectedCatFilter)} onClick={() => setExpectedCatFilter('')}>全部</button>
          {['发行文件','季报/年报','公司公告','招募说明书','产品概要','销售公告','产品风险评级','维护通知','其他公告'].map(c => (
            <button key={c} style={styles.catBtn(expectedCatFilter === c)} onClick={() => setExpectedCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table - full width */}
      <div style={{ padding: '0', overflowX: 'auto' }}>
        {filteredDocs.length > 0 ? (
          <table style={{ ...styles.table, minWidth: `${totalWidth}px`, fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '40px', textAlign: 'center', position: 'sticky', left: 0, background: '#fafafa', zIndex: 2 }}>#</th>
                {expectedFields.map(f => (
                  <th key={f.key} style={{ ...styles.th, width: `${f.width}px`, fontSize: '12px' }}>{f.label}</th>
                ))}
                <th style={{ ...styles.th, width: '100px', textAlign: 'center', position: 'sticky', right: 0, background: '#fafafa', zIndex: 2 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, idx) => (
                <tr key={doc.id} style={{
                  background: dirtyRows.has(doc.id) ? '#fffde7' : (doc._isNew ? '#e8f5e9' : idx % 2 === 0 ? '#fff' : '#fafafa'),
                  transition: 'background 0.15s',
                }}>
                  <td style={{
                    padding: '6px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'center',
                    color: '#aaa', fontSize: '11px', position: 'sticky', left: 0,
                    background: dirtyRows.has(doc.id) ? '#fffde7' : (doc._isNew ? '#e8f5e9' : idx % 2 === 0 ? '#fff' : '#fafafa'),
                    zIndex: 1,
                  }}>
                    {idx + 1}
                  </td>
                  {expectedFields.map(f => (
                    <td key={f.key} style={{
                      padding: '5px 8px', borderBottom: '1px solid #f0f0f0',
                      width: `${f.width}px`, maxWidth: `${f.width}px`,
                      overflow: 'hidden', cursor: 'text',
                    }}>
                      {renderEditableCell(doc, f)}
                    </td>
                  ))}
                  <td style={{
                    padding: '5px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'center',
                    position: 'sticky', right: 0, zIndex: 1,
                    background: dirtyRows.has(doc.id) ? '#fffde7' : (doc._isNew ? '#e8f5e9' : idx % 2 === 0 ? '#fff' : '#fafafa'),
                  }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {dirtyRows.has(doc.id) && (
                        <button style={{
                          background: '#2e7d32', color: '#fff', border: 'none',
                          padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px',
                        }} onClick={() => saveRow(doc)}>
                          保存
                        </button>
                      )}
                      <button style={styles.deleteBtn} onClick={() => deleteExpectedRow(doc)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ ...styles.noData, padding: '80px 40px' }}>
            暂无数据，点击「+ 新增记录」添加应发布文档，或通过「导入 CSV」批量导入
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Main App ==============
function App() {
  const [page, setPage] = useState('main'); // 'main' or 'expected'
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

  // Show expected docs page
  if (page === 'expected') {
    return <ExpectedDocsPage onBack={() => setPage('main')} />;
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>信披文件自动巡检系统</h1>
          <div style={styles.headerSub}>博道基金 · 信息披露监控平台</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)',
            padding: '8px 20px', borderRadius: '4px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500,
          }} onClick={() => setPage('expected')}>
            应发布清单
          </button>
          <button style={styles.triggerBtn} onClick={triggerRun}>立即巡检</button>
        </div>
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
