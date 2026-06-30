import React, { useState, useEffect, useCallback } from 'react';
import './AdminActivityDashboard.css';
import { getAuditLogs } from '../../api/api';
import {
  Activity, User, Shield, AlertTriangle,
  Search, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';

const SEVERITIES = ['All', 'info', 'warn', 'error', 'success'];

const SEV_CLS = { info: 'ad-bdg--info', warn: 'ad-bdg--warn', error: 'ad-bdg--err', success: 'ad-bdg--suc' };
const ICON_MAP = { info: '#2563eb', warn: '#d97706', error: '#dc2626', success: '#16a34a' };

function fmt(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminActivityDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, recent: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 15, search: search || undefined, severity: severity === 'All' ? undefined : severity };
      const data = await getAuditLogs(params);
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      const all = data.content || [];
      setStats({
        total: data.totalElements || 0,
        admins: new Set(all.map(l => l.adminId)).size,
        recent: all.filter(l => Date.now() - new Date(l.ts).getTime() < 3600000).length,
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, severity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="ad">
      <div className="ad-hdr">
        <div>
          <h1 className="ad-hdr__t"><Activity size={20} style={{ color: '#E03E1A' }} /> Admin Activity Dashboard</h1>
          <p className="ad-hdr__s">Monitor all admin actions across the platform</p>
        </div>
      </div>

      <div className="ad-kpis">
        {[
          { icon: Activity, val: stats.total, lbl: 'Total Events', bg: '#f0f9ff', c: '#2563eb' },
          { icon: User, val: stats.admins, lbl: 'Active Admins', bg: '#f0fdf4', c: '#16a34a' },
          { icon: Shield, val: stats.recent, lbl: 'Last Hour', bg: '#fffbeb', c: '#d97706' },
          { icon: AlertTriangle, val: logs.filter(l => l.severity === 'error').length, lbl: 'Errors', bg: '#fef2f2', c: '#dc2626' },
        ].map((k, i) => (
          <div key={i} className="ad-kpi">
            <div className="ad-kpi__icon" style={{ background: k.bg }}><k.icon size={18} color={k.c} /></div>
            <div><div className="ad-kpi__val">{k.val}</div><div className="ad-kpi__lbl">{k.lbl}</div></div>
          </div>
        ))}
      </div>

      <div className="ad-card">
        <div className="ad-sh">
          <div>
            <p className="ad-sh__t">Audit Log</p>
            <p className="ad-sh__s">Showing {logs.length} of {totalElements} events</p>
          </div>
          <div className="ad-filters" style={{ alignItems: 'center', gap: 8 }}>
            <div className="ad-search">
              <Search size={13} className="ad-search__ico" />
              <input className="ad-search__inp" placeholder="Search admin or action..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
            {SEVERITIES.map(s => (
              <button key={s} className={`ad-pill${severity === s ? ' ad-pill--on' : ''}`} onClick={() => { setSeverity(s); setPage(0); }}>{s}</button>
            ))}
          </div>
        </div>

        <div className="ad-tw">
          <table className="ad-tbl">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Module</th>
                <th>Severity</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id || i}>
                  <td className="ad-ts">{log.ts || fmt(log.timestamp)}</td>
                  <td style={{ fontWeight: 600, fontSize: '.82rem' }}>{log.admin}</td>
                  <td style={{ fontWeight: 500 }}>{log.action}</td>
                  <td><span className="ad-bdg ad-bdg--mod">{log.module}</span></td>
                  <td><span className={`ad-bdg ${SEV_CLS[log.severity] || 'ad-bdg--info'}`}>{log.severity}</span></td>
                  <td>
                    <div className="ad-detail" title={log.details}>{log.details || '—'}</div>
                  </td>
                  <td><span className="ad-ip">{log.ip || '—'}</span></td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="7" className="ad-empty">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ad-pag">
          <span className="ad-pag__info">Page {page + 1} of {totalPages}</span>
          <div className="ad-pag__ctrls">
            <button className="ad-pag__btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = start + i;
              return <button key={p} className={`ad-pag__btn${p === page ? ' ad-pag__btn--active' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>;
            })}
            <button className="ad-pag__btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
