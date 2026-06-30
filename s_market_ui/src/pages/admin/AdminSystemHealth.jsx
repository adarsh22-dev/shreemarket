import React, { useState, useEffect } from 'react';
import './AdminSystemHealth.css';
import {
  Monitor, Database, Clock, Users, Package,
  ShoppingCart, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../api/api';

const API_BASE = API_BASE_URL;

async function checkHealth() {
  const results = [];
  const checks = [
    { label: 'Backend API', url: `${API_BASE.replace('/api', '')}/api/categories` },
    { label: 'Database', url: `${API_BASE}/admin/customer-segments/stats` },
  ];
  for (const c of checks) {
    try {
      const res = await fetch(c.url, { credentials: 'include', signal: AbortSignal.timeout(5000) });
      results.push({ ...c, status: res.ok ? 'up' : 'degraded', statusCode: res.status });
    } catch {
      results.push({ ...c, status: 'down', statusCode: null });
    }
  }
  return results;
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState('—');
  const [memory, setMemory] = useState({ used: 0, total: 0, pct: 0 });

  const run = async () => {
    setLoading(true);
    const results = await checkHealth();
    setHealth(results);
    const start = performance.now();
    setTimeout(() => {
      const secs = Math.floor((performance.now() - start) / 1000);
      setUptime(`${secs}s`);
    }, 100);
    setMemory({
      used: Math.round((performance.memory?.usedJSHeapSize || 0) / 1048576),
      total: Math.round((performance.memory?.totalJSHeapSize || 0) / 1048576),
      pct: performance.memory ? Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100) : 0,
    });
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <div className="sh">
      <div className="sh-hdr">
        <div>
          <h1 className="sh-hdr__t"><Monitor size={20} style={{ color: '#E03E1A' }} /> System Health</h1>
          <p className="sh-hdr__s">Monitor platform uptime, services, and resource usage</p>
        </div>
        <button className="sh-refresh" onClick={run} disabled={loading}>
          <RefreshCw size={14} />{loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="sh-grid">
        <div className="sh-card">
          <p className="sh-card__ttl"><Database size={16} style={{ color: '#2563eb' }} /> Service Status</p>
          {health.map((h, i) => (
            <div key={i} className="sh-row">
              <span className="sh-row__lbl">{h.label}</span>
              <span className="sh-row__val">
                {h.status === 'up' ? <CheckCircle size={14} style={{ color: '#16a34a' }} /> : <XCircle size={14} style={{ color: '#dc2626' }} />}
                <span className={`sh-bdg sh-bdg--${h.status}`}>{h.status}{h.statusCode ? ` (${h.statusCode})` : ''}</span>
              </span>
            </div>
          ))}
          <div className="sh-row">
            <span className="sh-row__lbl">Uptime</span>
            <span className="sh-row__val"><Clock size={13} style={{ color: '#64748b' }} />{uptime}</span>
          </div>
        </div>

        <div className="sh-card">
          <p className="sh-card__ttl"><Monitor size={16} style={{ color: '#16a34a' }} /> Resource Usage</p>
          <div className="sh-row">
            <span className="sh-row__lbl">Memory (Heap)</span>
            <span className="sh-row__val">{memory.used}MB / {memory.total}MB</span>
          </div>
          <div className="sh-progress">
            <div className="sh-progress__fill" style={{
              width: `${Math.min(memory.pct, 100)}%`,
              background: memory.pct > 80 ? '#dc2626' : memory.pct > 50 ? '#d97706' : '#16a34a'
            }} />
          </div>
          <div className="sh-row">
            <span className="sh-row__lbl">Usage</span>
            <span className="sh-row__val"><span className={`sh-bdg ${memory.pct > 80 ? 'sh-bdg--dn' : memory.pct > 50 ? 'sh-bdg--warn' : 'sh-bdg--up'}`}>{memory.pct}%</span></span>
          </div>
        </div>

        <div className="sh-card">
          <p className="sh-card__ttl"><Users size={16} style={{ color: '#7c3aed' }} /> Quick Stats</p>
          <div className="sh-row"><span className="sh-row__lbl"><Users size={13} style={{ marginRight: 4 }} />User Roles</span><span className="sh-row__val">Admin, Vendor, Customer</span></div>
          <div className="sh-row"><span className="sh-row__lbl"><Package size={13} style={{ marginRight: 4 }} />Backend</span><span className="sh-row__val">Spring Boot 3.2.3 / Java 17</span></div>
          <div className="sh-row"><span className="sh-row__lbl"><ShoppingCart size={13} style={{ marginRight: 4 }} />Frontend</span><span className="sh-row__val">React 19 / Vite 7</span></div>
          <div className="sh-row"><span className="sh-row__lbl"><Database size={13} style={{ marginRight: 4 }} />Database</span><span className="sh-row__val">MySQL</span></div>
        </div>

        <div className="sh-card">
          <p className="sh-card__ttl"><CheckCircle size={16} style={{ color: '#16a34a' }} /> Environment</p>
          <div className="sh-row"><span className="sh-row__lbl">Mode</span><span className="sh-row__val"><span className="sh-bdg sh-bdg--up">Development</span></span></div>
          <div className="sh-row"><span className="sh-row__lbl">API Base</span><span className="sh-row__val" style={{ fontSize: '.75rem', fontFamily: 'monospace' }}>{API_BASE}</span></div>
          <div className="sh-row"><span className="sh-row__lbl">CORS</span><span className="sh-row__val">localhost:5173</span></div>
          <div className="sh-row"><span className="sh-row__lbl">Auth</span><span className="sh-row__val">Session-based</span></div>
        </div>
      </div>
    </div>
  );
}
