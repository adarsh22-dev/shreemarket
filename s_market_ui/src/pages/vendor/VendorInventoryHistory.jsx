import React, { useState, useEffect, useCallback } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorInventoryMovements, getVendorInventoryStats } from '../../api/api';
import './VendorInventoryHistory.css';

const TYPE_COLORS = {
  IN: { bg: '#dcfce7', color: '#16a34a', label: 'IN' },
  OUT: { bg: '#fee2e2', color: '#dc2626', label: 'OUT' },
  ADJUSTMENT: { bg: '#fef3c7', color: '#d97706', label: 'ADJ' },
};

const StockMovementIcon = ({ type }) => (
  <span className="ih-type-badge" style={{ background: TYPE_COLORS[type]?.bg || '#f1f5f9', color: TYPE_COLORS[type]?.color || '#64748b' }}>
    {TYPE_COLORS[type]?.label || type}
  </span>
);

export default function VendorInventoryHistory() {
  const [movements, setMovements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const PER_PAGE = 15;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER_PAGE };
      if (typeFilter) params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getVendorInventoryMovements(params);
      const data = res?.content || res || [];
      setMovements(Array.isArray(data) ? data : []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (e) {
      console.error('Failed to load inventory history:', e);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, searchTerm, startDate, endDate]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getVendorInventoryStats();
      setStats(res);
    } catch (e) {
      console.error('Failed to load inventory stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchStats();
  }, [fetchMovements, fetchStats]);

  const formatDate = (epoch) => {
    if (!epoch) return '—';
    const d = new Date(epoch);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statCards = [
    { label: 'Total Movements', value: stats?.totalMovements || 0, icon: '📦', color: '#6366f1' },
    { label: 'Stock In', value: stats?.totalIn || 0, icon: '📥', color: '#16a34a' },
    { label: 'Stock Out', value: stats?.totalOut || 0, icon: '📤', color: '#dc2626' },
    { label: 'Adjustments', value: stats?.totalAdjustments || 0, icon: '⚙️', color: '#d97706' },
  ];

  return (
    <VendorLayout>
      <div className="ih-container">
        {/* Header */}
        <div className="ih-header">
          <div>
            <h2 className="ih-header__title">Inventory History</h2>
            <p className="ih-header__sub">Track all stock movements — IN, OUT, and manual adjustments</p>
          </div>
          <button className="ih-btn ih-btn--outline" onClick={() => {
            const csv = [['Date','Product','SKU','Type','Qty','Previous Stock','New Stock','Reference','Notes']];
            movements.forEach(m => {
              csv.push([formatDate(m.createdAt), m.productName, m.productSku, m.type, m.quantity, m.previousStock, m.newStock, m.reference || '', m.notes || '']);
            });
            const blob = new Blob([csv.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'inventory-history.csv'; a.click();
            URL.revokeObjectURL(url);
          }}>📥 Export CSV</button>
        </div>

        {/* Stats Cards */}
        <div className="ih-stats-row">
          {statCards.map((s, i) => (
            <div key={i} className="ih-stat-card">
              <div className="ih-stat-icon" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
              <div>
                <div className="ih-stat-value">{s.value}</div>
                <div className="ih-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        {stats?.dailyChart && stats.dailyChart.length > 0 && (
          <div className="ih-card">
            <h3 className="ih-card-title">Last 7 Days Activity</h3>
            <div className="ih-chart">
              {stats.dailyChart.map((day, i) => {
                const maxVal = Math.max(...stats.dailyChart.map(d => Math.max(d.in, d.out)), 1);
                return (
                  <div key={i} className="ih-chart-col">
                    <span className="ih-chart-date">{day.date.slice(5)}</span>
                    <div className="ih-chart-bars">
                      <div className="ih-chart-bar ih-chart-bar--in" style={{ height: `${(day.in / maxVal) * 60}px` }} title={`IN: ${day.in}`} />
                      <div className="ih-chart-bar ih-chart-bar--out" style={{ height: `${(day.out / maxVal) * 60}px` }} title={`OUT: ${day.out}`} />
                    </div>
                    <div className="ih-chart-legend">
                      <span className="ih-chart-legend-dot ih-chart-legend-dot--in"/>{day.in}
                      <span className="ih-chart-legend-dot ih-chart-legend-dot--out"/>{day.out}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="ih-card">
          <div className="ih-filters">
            <div className="ih-search">
              <input
                className="ih-input"
                placeholder="Search product name, SKU, or reference..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              />
            </div>
            <select className="ih-input ih-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
              <option value="">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
            <input className="ih-input" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(0); }} placeholder="Start date" />
            <input className="ih-input" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(0); }} placeholder="End date" />
            <button className="ih-btn ih-btn--ghost" onClick={() => { setTypeFilter(''); setSearchTerm(''); setStartDate(''); setEndDate(''); setPage(0); }}>✕ Clear</button>
          </div>
        </div>

        {/* Table */}
        <div className="ih-card">
          <div className="ih-table-header">
            <span className="ih-table-title">Stock Movements</span>
            <span className="ih-table-count">{totalElements} records</span>
          </div>

          <div className="ih-table-wrap">
            <table className="ih-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Δ</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" className="ih-empty">Loading movements...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan="10" className="ih-empty">No stock movements found</td></tr>
                ) : (
                  movements.map(m => {
                    const prev = m.previousStock != null ? m.previousStock : 0;
                    const curr = m.newStock != null ? m.newStock : 0;
                    const delta = curr - prev;
                    return (
                      <tr key={m.id}>
                        <td className="ih-cell-date">{formatDate(m.createdAt)}</td>
                        <td><span className="ih-product-name">{m.productName || '—'}</span></td>
                        <td className="ih-cell-mono">{m.productSku || '—'}</td>
                        <td><StockMovementIcon type={m.type} /></td>
                        <td className="ih-cell-bold">{m.quantity}</td>
                        <td className="ih-cell-mono">{prev}</td>
                        <td className="ih-cell-mono">{curr}</td>
                        <td>
                          <span className={`ih-delta ${delta > 0 ? 'ih-delta--up' : delta < 0 ? 'ih-delta--down' : ''}`}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        </td>
                        <td className="ih-cell-ref">{m.reference || '—'}</td>
                        <td className="ih-cell-note">{m.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ih-pagination">
            <span className="ih-page-info">Page {page + 1} of {Math.max(totalPages, 1)}</span>
            <div className="ih-page-controls">
              <button className="ih-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
              <button className="ih-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
