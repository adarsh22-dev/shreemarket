import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users, Plus, Copy, Trash2, Eye, EyeOff, RefreshCw,
  Link2, Shield, CheckCircle, XCircle, Key, User,
  ExternalLink, AlertTriangle, Lock, Package,
  Clock, Search, LogOut, TrendingUp,
  Hash, X, ShieldCheck, Scan, Camera, Minus,
  Layers, ChevronRight, Activity,
  FileText, Bell, CheckSquare, Ban, Timer,
  ChevronDown, Inbox, Send
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorStaffByVendorId, createVendorStaff, updateVendorStaff, deleteVendorStaff } from '../../api/api';

/* ════════════════════════════════════════════════════════════════
   SHARED UTILITIES
════════════════════════════════════════════════════════════════ */
function readLS(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}
function removeLS(key) {
  try { localStorage.removeItem(key); } catch { }
}
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
function generatePassword(len = 9) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length]).join('');
}
function getURLToken() {
  return new URLSearchParams(window.location.search).get('staff_token') || null;
}
function getStaffPageUrl(token) {
  return `${window.location.origin}${window.location.pathname}?staff_token=${token}`;
}
function logAction(entry) {
  const log = readLS('vp_staff_log', []);
  writeLS('vp_staff_log', [...log.slice(-499), { ...entry, time: new Date().toISOString() }]);
}
function getStockStatus(qty, managed) {
  if (!managed) return { label: 'Not tracked', cls: '' };
  const q = Number(qty) || 0;
  if (q <= 0) return { label: 'Out of Stock', cls: 'sb-out' };
  if (q <= 10) return { label: 'Low Stock', cls: 'sb-low' };
  return { label: 'In Stock', cls: 'sb-in' };
}
function useToast() {
  const [t, setT] = useState(null);
  const show = useCallback((msg, type = 'ok') => {
    setT({ msg, type });
    setTimeout(() => setT(null), 2800);
  }, []);
  return [t, show];
}
function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
}

/* ════════════════════════════════════════════════════════════════
   LINK EXPIRY UTILITIES
════════════════════════════════════════════════════════════════ */
const EXPIRY_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 },
  { label: '24 hours', value: 1440 },
  { label: 'No expiry', value: 0 },
];

function getLinkExpiry(userId) {
  const map = readLS('vp_staff_link_expiry', {});
  return map[userId] || null;
}
function setLinkExpiry(userId, durationMinutes) {
  const map = readLS('vp_staff_link_expiry', {});
  if (!durationMinutes || durationMinutes === 0) {
    map[userId] = { expiresAt: null, durationMinutes: 0, setAt: new Date().toISOString() };
  } else {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    map[userId] = { expiresAt, durationMinutes, setAt: new Date().toISOString() };
  }
  writeLS('vp_staff_link_expiry', map);
  return map[userId];
}
function removeLinkExpiry(userId) {
  const map = readLS('vp_staff_link_expiry', {});
  delete map[userId];
  writeLS('vp_staff_link_expiry', map);
}
function isLinkExpired(userId) {
  const exp = getLinkExpiry(userId);
  if (!exp) return false;
  if (!exp.expiresAt) return false;
  return new Date(exp.expiresAt).getTime() < Date.now();
}
function getRemainingMs(userId) {
  const exp = getLinkExpiry(userId);
  if (!exp || !exp.expiresAt) return null;
  const rem = new Date(exp.expiresAt).getTime() - Date.now();
  return rem > 0 ? rem : 0;
}
function formatRemaining(ms) {
  if (ms === null) return 'No expiry';
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}
function computeActivityStats(log) {
  const byUser = {};
  log.forEach(entry => {
    const u = entry.username || 'unknown';
    if (!byUser[u]) byUser[u] = { events: [], actions: 0, lastSeen: null };
    byUser[u].events.push(entry);
    if (entry.type === 'stock_update' || entry.type === 'permission_request') byUser[u].actions++;
    if (!byUser[u].lastSeen || entry.time > byUser[u].lastSeen) byUser[u].lastSeen = entry.time;
  });
  Object.keys(byUser).forEach(u => {
    const events = byUser[u].events.sort((a, b) => new Date(a.time) - new Date(b.time));
    let totalMs = 0, sessionCount = 0, sessionStart = null;
    events.forEach(ev => {
      if ((ev.type === 'login' && ev.success) || ev.type === 'session_restore') {
        if (!sessionStart) { sessionStart = new Date(ev.time).getTime(); sessionCount++; }
      } else if (ev.type === 'logout' && sessionStart) {
        const duration = new Date(ev.time).getTime() - sessionStart;
        totalMs += Math.min(duration, 12 * 3600000);
        sessionStart = null;
      }
    });
    if (sessionStart && byUser[u].lastSeen) {
      const lastActivity = new Date(byUser[u].lastSeen).getTime();
      const elapsed = lastActivity - sessionStart;
      if (elapsed > 0 && elapsed < 12 * 3600000) totalMs += elapsed;
      else if (elapsed <= 0) totalMs += 60000;
    }
    byUser[u].totalSessionMs = totalMs;
    byUser[u].sessionCount = sessionCount;
  });
  return byUser;
}

/* ════════════════════════════════════════════════════════════════
   GLOBAL STYLES
════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ff: 'IBM Plex Sans', system-ui, sans-serif;
    --mono: 'IBM Plex Mono', monospace;
    --vbg: #f1f3f5; --vcard: #ffffff; --vbdr: #e2e5ea;
    --vtxt: #111827; --vmut: #6b7280; --vacc: #2563eb;
    --vgrn: #16a34a; --vred: #dc2626; --vamb: #d97706;
  }
  .vsm { padding: 28px 32px 60px; font-family: var(--ff); background: var(--vbg); min-height: 100vh; }
  @media(max-width:640px){ .vsm { padding: 14px 12px 50px; } }
  .vsm-hdr { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
  .vsm-hdr h1 { font-size:22px; font-weight:700; color:var(--vtxt); display:flex; align-items:center; gap:10px; margin-bottom:4px; }
  .vsm-hdr-ico { width:34px; height:34px; border-radius:8px; background:#e84c1e; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .vsm-hdr p { font-size:13px; color:var(--vmut); margin-left:44px; }
  .vsm-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
  @media(max-width:640px){ .vsm-kpis { grid-template-columns:1fr 1fr; } }
  .vsm-kpi { background:var(--vcard); border:1px solid var(--vbdr); border-radius:10px; padding:14px 16px; border-left:3px solid; }
  .vsm-kpi-l { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--vmut); margin-bottom:5px; }
  .vsm-kpi-v { font-size:24px; font-weight:700; font-family:var(--mono); }
  .vsm-kpi-s { font-size:11px; color:var(--vmut); margin-top:2px; }
  .vsm-tabs { display:flex; gap:4px; margin-bottom:18px; background:var(--vcard); border:1px solid var(--vbdr); border-radius:10px; padding:5px; width:fit-content; flex-wrap:wrap; }
  .vsm-tab { padding:8px 16px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:transparent; color:var(--vmut); font-family:var(--ff); display:flex; align-items:center; gap:6px; transition:all .15s; }
  .vsm-tab.on { background:#e84c1e; color:#fff; }
  .vsm-tab-badge { border-radius:20px; padding:1px 7px; font-size:11px; font-weight:700; }
  .vsm-tab.on .vsm-tab-badge { background:rgba(255,255,255,.3); }
  .vsm-tab:not(.on) .vsm-tab-badge { background:#fee2e2; color:#dc2626; }
  .vsm-grid { display:grid; grid-template-columns:1fr 360px; gap:16px; }
  @media(max-width:900px){ .vsm-grid { grid-template-columns:1fr; } }
  .vsm-card { background:var(--vcard); border:1px solid var(--vbdr); border-radius:12px; overflow:hidden; margin-bottom:16px; }
  .vsm-card:last-child { margin-bottom:0; }
  .vsm-ch { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--vbdr); }
  .vsm-ch h2 { font-size:14px; font-weight:600; color:var(--vtxt); display:flex; align-items:center; gap:7px; }
  .vsm-form { padding:18px; display:flex; flex-direction:column; gap:14px; }
  .vsm-fl label { display:block; font-size:11px; font-weight:600; color:var(--vmut); text-transform:uppercase; letter-spacing:.05em; margin-bottom:5px; }
  .vsm-fr { position:relative; }
  .vsm-i { width:100%; padding:10px 13px; border:1.5px solid var(--vbdr); border-radius:8px; font-size:14px; font-family:var(--ff); color:var(--vtxt); background:#fafbfc; outline:none; transition:border-color .15s; }
  .vsm-i:focus { border-color:var(--vacc); box-shadow:0 0 0 3px rgba(37,99,235,.09); background:#fff; }
  .vsm-ii { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--vmut); display:flex; align-items:center; }
  .vsm-pw { display:flex; gap:7px; }
  .vsm-gpw { padding:10px 12px; border:1.5px solid var(--vbdr); border-radius:8px; background:#f3f4f6; font-size:12px; font-weight:600; color:var(--vmut); cursor:pointer; white-space:nowrap; font-family:var(--ff); transition:all .15s; display:flex; align-items:center; gap:5px; }
  .vsm-gpw:hover { border-color:var(--vacc); color:var(--vacc); background:#eff6ff; }
  .vsm-cta { width:100%; padding:12px; background:#e84c1e; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:var(--ff); transition:all .15s; display:flex; align-items:center; justify-content:center; gap:7px; }
  .vsm-cta:hover { background:#000; transform:translateY(-1px); }
  .vsm-cta:disabled { background:#d1d5db; cursor:not-allowed; transform:none; }
  .vsm-sr { padding:13px 18px; border-bottom:1px solid var(--vbdr); display:flex; align-items:flex-start; gap:10px; flex-wrap:wrap; }
  .vsm-sr:last-child { border-bottom:none; }
  .vsm-av { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; background:#e84c1e !important; color:#fff !important; }
  .vsm-si { flex:1; min-width:0; }
  .vsm-sn { font-size:13px; font-weight:600; color:var(--vtxt); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .vsm-sm { font-size:12px; color:var(--vmut); margin-top:2px; display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
  .vsm-sa { display:flex; gap:5px; flex-shrink:0; }
  .vsm-pill { padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
  .pill-on  { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }
  .pill-off { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
  .pill-exp { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
  .vsm-ib { width:30px; height:30px; border-radius:6px; border:1.5px solid var(--vbdr); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; color:var(--vmut); }
  .vsm-ib:hover     { border-color:var(--vacc); color:var(--vacc); background:#eff6ff; }
  .vsm-ib.del:hover { border-color:var(--vred); color:var(--vred); background:#fef2f2; }
  .vsm-ib.ok:hover  { border-color:var(--vgrn); color:var(--vgrn); background:#f0fdf4; }
  .vsm-lb { margin:0 18px 18px; padding:12px 14px; background:#e84c1e1f; border:1px solid #e84c1e; border-radius:10px; }
  .vsm-lbl { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#e84c1e; margin-bottom:6px; display:flex; align-items:center; gap:4px; }
  .vsm-lu { font-family:var(--mono); font-size:11px; color:#e84c1e; background:#fff; border:1px solid #bfdbfe; border-radius:6px; padding:7px 10px; word-break:break-all; margin-bottom:8px; line-height:1.5; }
  .vsm-la { display:flex; gap:6px; flex-wrap:wrap; }
  .vsm-btn { padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; gap:4px; transition:all .15s; }
  .vsm-btn-p { background:#e84c1e; color:#fff; border:none; }
  .vsm-btn-p:hover { background:#000; }
  .vsm-btn-s { background:#fff; color:#e84c1e; border:1px solid #bfdbfe; }
  .vsm-btn-s:hover { background:#eff6ff; }
  .vsm-btn-d { background:#fff; color:#dc2626; border:1px solid #fca5a5; }
  .vsm-btn-d:hover { background:#fef2f2; }
  .exp-box { margin:0 18px 14px; background:#f8fafc; border:1px solid var(--vbdr); border-radius:10px; overflow:hidden; }
  .exp-hdr { display:flex; align-items:center; justify-content:space-between; padding:9px 13px; border-bottom:1px solid var(--vbdr); }
  .exp-hdr-l { font-size:11px; font-weight:700; color:#374151; display:flex; align-items:center; gap:5px; text-transform:uppercase; letter-spacing:.05em; }
  .exp-body { padding:10px 13px; display:flex; flex-direction:column; gap:8px; }
  .exp-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .exp-timer { display:flex; align-items:center; gap:6px; }
  .exp-timer-v { font-family:var(--mono); font-size:13px; font-weight:700; }
  .exp-timer-v.ok  { color:#16a34a; }
  .exp-timer-v.low { color:#d97706; animation: pulse-warn 1s infinite; }
  .exp-timer-v.out { color:#dc2626; }
  .exp-timer-v.none { color:#9ca3af; }
  @keyframes pulse-warn { 0%,100%{opacity:1} 50%{opacity:.5} }
  .exp-sel { display:flex; gap:5px; flex-wrap:wrap; }
  .exp-opt { padding:4px 9px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; border:1.5px solid var(--vbdr); background:#fff; color:#6b7280; font-family:var(--ff); transition:all .12s; }
  .exp-opt:hover { border-color:#e84c1e; color:#e84c1e; }
  .exp-opt.active { background:#e84c1e; border-color:#e84c1e; color:#fff; }
  .exp-opt.active-none { background:#374151; border-color:#374151; color:#fff; }
  .exp-progress { height:3px; background:#e5e7eb; border-radius:999px; overflow:hidden; }
  .exp-progress-inner { height:100%; border-radius:999px; transition:width .5s linear; }
  .act-grid { padding:16px 18px; display:flex; flex-direction:column; gap:14px; }
  .act-user-row { background:#f9fafb; border:1px solid var(--vbdr); border-radius:10px; overflow:hidden; }
  .act-user-head { display:flex; align-items:center; gap:10px; padding:11px 14px; cursor:pointer; user-select:none; transition:background .12s; flex-wrap:wrap; }
  .act-user-head:hover { background:#f3f4f6; }
  .act-user-av { width:32px; height:32px; border-radius:7px; background:#e84c1e; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
  .act-user-name { flex:1; font-size:13px; font-weight:600; color:var(--vtxt); min-width:80px; }
  .act-user-meta { display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .act-stat-chip { display:flex; flex-direction:column; align-items:center; min-width:44px; }
  .act-stat-v { font-size:15px; font-weight:700; font-family:var(--mono); }
  .act-stat-l { font-size:10px; color:var(--vmut); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
  .act-log-list { border-top:1px solid var(--vbdr); }
  .act-log-row { display:flex; align-items:center; gap:9px; padding:8px 14px; border-bottom:1px solid #f3f4f6; }
  .act-log-row:last-child { border-bottom:none; }
  .act-log-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .act-log-type { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.04em; min-width:64px; flex-shrink:0; }
  .act-log-text { flex:1; font-size:12.5px; color:#374151; }
  .act-log-time { font-size:11px; color:#9ca3af; font-family:var(--mono); white-space:nowrap; }
  .act-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
  .act-sum-card { background:#fff; border:1px solid var(--vbdr); border-radius:10px; padding:12px 14px; text-align:center; }
  .act-sum-v { font-size:22px; font-weight:700; font-family:var(--mono); }
  .act-sum-l { font-size:11px; color:var(--vmut); font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
  .perm-req-row { padding:13px 16px; border-bottom:1px solid var(--vbdr); display:flex; align-items:flex-start; gap:12px; }
  .perm-req-row:last-child { border-bottom:none; }
  .perm-req-icon { width:34px; height:34px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .perm-req-icon.delete { background:#fee2e2; }
  .perm-req-icon.draft  { background:#fef3c7; }
  .perm-req-body { flex:1; }
  .perm-req-title { font-size:13px; font-weight:600; color:var(--vtxt); margin-bottom:2px; }
  .perm-req-sub { font-size:12px; color:var(--vmut); }
  .perm-req-actions { display:flex; gap:6px; margin-top:9px; }
  .perm-approve { padding:6px 13px; background:#16a34a; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; gap:4px; }
  .perm-approve:hover { background:#15803d; }
  .perm-reject  { padding:6px 13px; background:#fff; color:#dc2626; border:1px solid #fca5a5; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; gap:4px; }
  .perm-reject:hover { background:#fef2f2; }
  .perm-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:20px; font-size:11px; font-weight:700; }
  .perm-badge.pending  { background:#fef3c7; color:#92400e; }
  .perm-badge.approved { background:#dcfce7; color:#15803d; }
  .perm-badge.rejected { background:#fee2e2; color:#dc2626; }
  .vsm-log { padding:0 18px 16px; }
  .vsm-lr { display:flex; align-items:center; gap:9px; padding:8px 0; border-bottom:1px solid #f9fafb; }
  .vsm-lr:last-child { border-bottom:none; }
  .vsm-ld { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .vsm-toast { position:fixed; bottom:18px; right:18px; z-index:9999; padding:10px 15px; border-radius:8px; font-size:13px; font-weight:600; font-family:var(--ff); box-shadow:0 4px 20px rgba(0,0,0,.12); animation:fadeUp .2s ease; display:flex; align-items:center; gap:7px; max-width:300px; }
  .vsm-toast.ok   { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
  .vsm-toast.err  { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
  .vsm-toast.info { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .vsm-empty { padding:36px 20px; text-align:center; color:var(--vmut); }
  .vsm-empty-ico { width:40px; height:40px; border-radius:10px; background:var(--vbg); border:1px solid var(--vbdr); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
  .vsm-empty-t { font-size:14px; font-weight:600; color:var(--vtxt); margin-bottom:4px; }
  .vsm-empty-s { font-size:13px; }
  .vsm-ov { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(2px); }
  .vsm-modal { background:#fff; border-radius:14px; padding:22px; max-width:380px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.15); animation:fadeUp .2s ease; }
  .vsm-modal h3 { font-size:15px; font-weight:700; color:var(--vtxt); margin-bottom:8px; }
  .vsm-modal p  { font-size:13px; color:var(--vmut); margin-bottom:18px; line-height:1.5; }
  .vsm-mb { display:flex; gap:10px; }
  .vsm-mc { flex:1; padding:10px; border:1.5px solid var(--vbdr); background:#fff; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:var(--ff); color:var(--vtxt); }
  .vsm-md { flex:1; padding:10px; background:var(--vred); border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:var(--ff); color:#fff; }
  .vsm-md:hover { background:#b91c1c; }
  .vsm-creds { background:#0d1117; border-radius:10px; padding:14px; margin:12px 0; }
  .vsm-cr { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #1e2a38; }
  .vsm-cr:last-child { border-bottom:none; }
  .vsm-ck { color:#6b7280; font-size:11px; font-family:var(--mono); }
  .vsm-cv { color:#4ade80; font-size:12px; font-weight:500; font-family:var(--mono); }

  /* ══ STAFF LOGIN ══ */
  .sil-wrap { min-height:100vh; background:#f1f5f9; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--ff); }
  .sil-card { background:#fff; border-radius:16px; width:100%; max-width:420px; box-shadow:0 4px 40px rgba(0,0,0,.1); overflow:hidden; animation:cardIn .3s ease; }
  @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .sil-top { background:#1e293b; padding:28px 28px 24px; text-align:center; }
  .sil-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:20px; padding:4px 11px; font-size:11px; font-weight:600; color:#94a3b8; letter-spacing:.03em; margin-bottom:16px; }
  .sil-ico { width:58px; height:58px; background:#e84c1e; border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; box-shadow:0 6px 20px rgba(232,76,30,.4); }
  .sil-title { font-size:20px; font-weight:700; color:#f1f5f9; margin-bottom:4px; letter-spacing:-.2px; }
  .sil-sub { font-size:13px; color:#64748b; }
  .sil-store { margin-top:10px; display:inline-flex; align-items:center; gap:5px; background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.2); border-radius:6px; padding:4px 10px; font-size:12px; color:#7dd3fc; font-family:var(--mono); }
  .sil-body { padding:24px 28px 28px; }
  .sil-err { display:flex; align-items:flex-start; gap:8px; padding:10px 13px; background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; font-size:13px; color:#be123c; font-weight:500; line-height:1.4; margin-bottom:16px; }
  .sil-f { display:flex; flex-direction:column; gap:16px; }
  .sil-fl label { display:block; font-size:12px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
  .sil-fr { position:relative; }
  .sil-in { width:100%; padding:13px 44px 13px 16px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; font-size:16px; font-family:var(--ff); color:#0f172a; outline:none; transition:border-color .15s,box-shadow .15s; }
  .sil-in::placeholder { color:#94a3b8; font-size:14px; }
  .sil-in:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
  .sil-ii { position:absolute; right:13px; top:50%; transform:translateY(-50%); color:#94a3b8; background:none; border:none; cursor:pointer; display:flex; align-items:center; }
  .sil-btn { width:100%; padding:14px; background:#e84c1e; border:none; border-radius:10px; font-size:15px; font-weight:700; color:#fff; cursor:pointer; font-family:var(--ff); transition:all .15s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px; }
  .sil-btn:hover { background:#000; transform:translateY(-1px); }
  .sil-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .sil-foot { border-top:1px solid #f1f5f9; padding:11px 28px; text-align:center; font-size:12px; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:5px; }

  /* ════ STAFF APP ════ */
  .sia-root { min-height:100vh; background:#eef0f3; font-family:var(--ff); }
  .sia-hdr { background:#16213e; padding:0 20px; height:54px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; box-shadow:0 2px 12px rgba(0,0,0,.3); }
  .sia-brand { display:flex; align-items:center; gap:10px; }
  .sia-logo  { width:30px; height:30px; background:#e84c1e; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 8px rgba(232,76,30,.5); }
  .sia-name  { font-size:15px; font-weight:700; color:#fff; letter-spacing:-.2px; }
  .sia-store { font-size:10px; color:#5a6a9a; font-family:var(--mono); margin-top:1px; }
  .sia-right { display:flex; align-items:center; gap:8px; }
  .sia-who { display:flex; align-items:center; gap:5px; padding:5px 11px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1); border-radius:20px; font-size:12px; font-weight:600; color:#c8d0e0; }
  .sia-out { width:32px; height:32px; border-radius:7px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:#7888aa; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .sia-out:hover { background:rgba(239,68,68,.2); border-color:rgba(239,68,68,.4); color:#f87171; }

  /* ── Bell notification button ── */
  .sia-bell-wrap { position:relative; }
  .sia-bell-btn {
    width:32px; height:32px; border-radius:7px;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.1);
    color:#7888aa; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .15s;
  }
  .sia-bell-btn:hover { background:rgba(232,76,30,.18); border-color:rgba(232,76,30,.4); color:#fb923c; }
  .sia-bell-btn.has-notif { color:#fb923c; border-color:rgba(232,76,30,.4); background:rgba(232,76,30,.12); }
  .sia-bell-dot {
    position:absolute; top:-3px; right:-3px;
    width:16px; height:16px; border-radius:50%;
    background:#e84c1e; border:2px solid #16213e;
    display:flex; align-items:center; justify-content:center;
    font-size:9px; font-weight:800; color:#fff; line-height:1;
    font-family:var(--mono);
  }

  /* ── Notification dropdown panel ── */
  .sia-notif-panel {
    position:absolute; top:calc(100% + 10px); right:0;
    width:340px; background:#fff;
    border:1px solid #e2e8f0; border-radius:14px;
    box-shadow:0 12px 40px rgba(0,0,0,.18);
    z-index:200;
    animation:notifIn .18s ease;
    overflow:hidden;
  }
  @media(max-width:400px){ .sia-notif-panel { width:calc(100vw - 24px); right:-10px; } }
  @keyframes notifIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .sia-notif-hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 16px 11px;
    border-bottom:1px solid #f1f5f9;
    background:#fafbfc;
  }
  .sia-notif-hdr-l {
    font-size:13px; font-weight:700; color:#111827;
    display:flex; align-items:center; gap:7px;
  }
  .sia-notif-badge {
    background:#e84c1e; color:#fff;
    font-size:10px; font-weight:800;
    padding:1px 7px; border-radius:20px;
    font-family:var(--mono);
  }
  .sia-notif-clear {
    font-size:11px; font-weight:600; color:#9ca3af;
    background:none; border:none; cursor:pointer;
    font-family:var(--ff); padding:3px 6px; border-radius:5px;
    transition:all .12s;
  }
  .sia-notif-clear:hover { background:#f3f4f6; color:#374151; }
  .sia-notif-list { max-height:380px; overflow-y:auto; }
  .sia-notif-empty {
    padding:32px 20px; text-align:center; color:#9ca3af;
    font-size:13px;
  }
  .sia-notif-empty-ico {
    width:40px; height:40px; border-radius:10px;
    background:#f9fafb; border:1px solid #e5e7eb;
    display:flex; align-items:center; justify-content:center;
    margin:0 auto 10px;
  }

  /* ── Single notification row ── */
  .sia-notif-row {
    display:flex; align-items:flex-start; gap:10px;
    padding:11px 16px;
    border-bottom:1px solid #f9fafb;
    transition:background .12s;
    cursor:default;
  }
  .sia-notif-row:last-child { border-bottom:none; }
  .sia-notif-row:hover { background:#fafbfc; }
  .sia-notif-row.unread { background:#fffbf8; }
  .sia-notif-row.unread:hover { background:#fff5f0; }
  .sia-notif-ico {
    width:32px; height:32px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; margin-top:1px;
  }
  .sia-notif-ico.approved  { background:#dcfce7; }
  .sia-notif-ico.rejected  { background:#fee2e2; }
  .sia-notif-ico.pending   { background:#fef3c7; }
  .sia-notif-ico.info      { background:#eff6ff; }
  .sia-notif-body { flex:1; min-width:0; }
  .sia-notif-title {
    font-size:12.5px; font-weight:600; color:#111827;
    line-height:1.35; margin-bottom:3px;
  }
  .sia-notif-sub {
    font-size:11.5px; color:#6b7280; line-height:1.4;
  }
  .sia-notif-time {
    font-size:10.5px; color:#9ca3af;
    font-family:var(--mono); margin-top:4px;
    white-space:nowrap;
  }
  .sia-notif-unread-dot {
    width:7px; height:7px; border-radius:50%;
    background:#e84c1e; flex-shrink:0; margin-top:5px;
  }

  /* Session expiry */
  .sia-session-exp { background:#16213e; border-top:1px solid rgba(255,255,255,.06); padding:5px 20px; display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; }
  .sia-session-exp.warn { background:#451a03; border-top-color:rgba(245,158,11,.2); }
  .sia-session-exp.expired { background:#450a0a; border-top-color:rgba(239,68,68,.2); }
  .sia-session-prog { flex:1; height:2px; background:rgba(255,255,255,.1); border-radius:999px; overflow:hidden; }
  .sia-session-prog-inner { height:100%; border-radius:999px; transition:width 1s linear; }

  /* KPI strip */
  .sia-kpis { display:flex; align-items:center; justify-content:flex-start; background:#fff; border-bottom:1px solid #e2e6eb; padding:0 20px; box-shadow:0 1px 3px rgba(0,0,0,.04); gap:10px; }
  .sia-kpi { display:flex; align-items:center; gap:20px; padding:10px 16px; border-right:1px solid #f0f2f5; }
  .sia-kpi:last-child { border-right:none; }
  .sia-kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sia-kpi-n { font-size:22px; font-weight:800; font-family:var(--mono); line-height:1; }
  .sia-kpi-l { font-size:10px; color:#9ca3af; font-weight:700; text-transform:uppercase; letter-spacing:.07em; margin-top:2px; }

  /* Toolbar */
  .sia-tb { background:#fff; border-bottom:1px solid #e2e6eb; padding:9px 20px; display:flex; gap:8px; align-items:center; flex-wrap:nowrap; }
  .sia-srch { width:240px; flex-shrink:0; display:flex; align-items:center; gap:7px; background:#f4f5f7; border:1.5px solid transparent; border-radius:9px; padding:7px 11px; transition:all .15s; }
  .sia-srch:focus-within { border-color:#e84c1e; background:#fff; box-shadow:0 0 0 3px rgba(232,76,30,.08); }
  .sia-srch input { flex:1; border:none; outline:none; background:transparent; font-size:13px; color:#111; font-family:var(--ff); min-width:0; }
  .sia-srch input::placeholder { color:#bcc0c8; }
  .sia-filters { display:flex; gap:5px; flex-wrap:wrap; }
  .sia-ft { padding:6px 13px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--ff); border:1.5px solid #dde1e7; background:#fff; color:#6b7280; transition:all .14s; white-space:nowrap; }
  .sia-ft:hover { background:#f4f5f7; border-color:#c8cdd6; }
  .sia-ft.f-all.on { background:#16213e; border-color:#16213e; color:#fff; }
  .sia-ft.f-low.on { background:#d97706; border-color:#d97706; color:#fff; }
  .sia-ft.f-out.on { background:#dc2626; border-color:#dc2626; color:#fff; }
  .sia-ft.f-in.on  { background:#16a34a; border-color:#16a34a; color:#fff; }
  .sia-scan-btn { margin-left:auto; flex-shrink:0; padding:8px 16px; background:#e84c1e; border:none; border-radius:9px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; gap:6px; transition:all .15s; white-space:nowrap; box-shadow:0 2px 8px rgba(232,76,30,.35); }
  .sia-scan-btn:hover { background:#c73e15; transform:translateY(-1px); }

  /* Product grid */
  .sia-list { padding:20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
  @media(max-width:640px){ .sia-list { grid-template-columns:1fr; padding:12px; gap:10px; } }
  .sia-pcard { background:#fff; border:1px solid #e4e8ee; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; transition:box-shadow .18s,transform .15s; position:relative; }
  .sia-pcard:hover { box-shadow:0 6px 24px rgba(0,0,0,.09); transform:translateY(-2px); }
  .sia-pcard::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
  .sia-pcard.is-out::before { background:#ef4444; }
  .sia-pcard.is-low::before { background:#f59e0b; }
  .sia-pcard.is-in::before  { background:#22c55e; }
  .sia-crow { display:flex; align-items:flex-start; gap:12px; padding:16px 14px 10px; }
  .sia-pimg { width:46px; height:46px; border-radius:10px; object-fit:cover; border:1px solid #f0f0f0; flex-shrink:0; }
  .sia-pph  { width:46px; height:46px; border-radius:10px; background:#f5f6f8; border:1px solid #eee; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sia-cmid { flex:1; min-width:0; }
  .sia-pname { font-size:13.5px; font-weight:700; color:#111827; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:5px; }
  .sia-ptags { display:flex; gap:4px; flex-wrap:wrap; }
  .sia-tag   { font-size:10px; color:#8b95a5; background:#f4f5f7; border:1px solid #e8eaee; padding:2px 6px; border-radius:4px; font-family:var(--mono); font-weight:600; }
  .sia-cright { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; min-width:56px; }
  .sia-sv { font-size:30px; font-weight:800; line-height:1; font-family:var(--mono); }
  .sia-su { font-size:10px; color:#bbb; font-weight:500; margin-top:-2px; }
  .sia-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; }
  .sia-badge::before { content:''; width:5px; height:5px; border-radius:50%; }
  .sb-in  { background:rgba(34,197,94,.1);  color:#15803d; } .sb-in::before  { background:#22c55e; }
  .sb-low { background:rgba(245,158,11,.12); color:#b45309; } .sb-low::before { background:#f59e0b; }
  .sb-out { background:rgba(239,68,68,.1);  color:#dc2626; } .sb-out::before { background:#ef4444; }
  .sia-price { padding:0 14px 10px; font-size:12px; color:#9ca3af; }
  .sia-price b { color:#374151; font-size:13.5px; font-weight:700; }
  .sia-pend-banner { margin:0 12px 8px; padding:7px 10px; background:#fef9ec; border:1px solid #fde68a; border-radius:8px; font-size:11px; color:#92400e; display:flex; align-items:center; gap:6px; font-weight:600; }
  .sia-qbar { display:grid; grid-template-columns:1fr 1fr 1fr; background:#f8f9fb; border-top:1px solid #eef0f3; }
  .sia-qbtn { display:flex; align-items:center; justify-content:center; flex-direction:column; gap:3px; padding:10px 4px; font-size:11px; font-weight:700; cursor:pointer; border:none; background:transparent; font-family:var(--ff); transition:background .12s; border-right:1px solid #eef0f3; line-height:1; }
  .sia-qbtn:last-child { border-right:none; }
  .sia-qbtn.qb-sale    { color:#dc2626; } .sia-qbtn.qb-restock { color:#16a34a; } .sia-qbtn.qb-set { color:#2563eb; }
  .sia-qbtn.qb-sale:hover    { background:#fef2f2; } .sia-qbtn.qb-restock:hover { background:#f0fdf4; } .sia-qbtn.qb-set:hover { background:#eff6ff; }
  .sia-qbtn.qb-sale.act    { background:#fee2e2; } .sia-qbtn.qb-restock.act { background:#dcfce7; } .sia-qbtn.qb-set.act { background:#dbeafe; }
  .sia-qbtn:disabled { opacity:.3; cursor:not-allowed; }
  .sia-perm-bar { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:8px 12px 12px; background:#f8f9fb; border-top:1px solid #eef0f3; }
  .sia-perm-btn { display:flex; align-items:center; justify-content:center; gap:5px; padding:7px 8px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; font-family:var(--ff); transition:all .12s; border:1.5px solid; white-space:nowrap; }
  .sia-perm-del   { color:#dc2626; border-color:rgba(220,38,38,.2); background:rgba(220,38,38,.04); } .sia-perm-del:hover  { background:rgba(220,38,38,.1); border-color:#ef4444; }
  .sia-perm-draft { color:#b45309; border-color:rgba(217,119,6,.2); background:rgba(217,119,6,.04); } .sia-perm-draft:hover { background:rgba(217,119,6,.1); border-color:#f59e0b; }
  .sia-panel { margin:8px 12px 4px; background:#f4f5f7; border:1px solid #e2e6eb; border-radius:10px; padding:11px 12px; animation:panelIn .15s ease; }
  @keyframes panelIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  .sia-plbl { font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
  .sia-prow { display:flex; gap:6px; align-items:center; }
  .sia-qi { flex:1; padding:10px 8px; background:#fff; border:1.5px solid #e2e6eb; border-radius:8px; font-size:24px; font-weight:800; font-family:var(--mono); color:#111; outline:none; text-align:center; transition:border-color .15s; min-width:0; }
  .sia-qi:focus { border-color:#e84c1e; box-shadow:0 0 0 3px rgba(232,76,30,.08); }
  .sia-qi::placeholder { font-size:13px; font-weight:400; color:#d1d5db; }
  .sia-confirm { padding:10px 14px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:var(--ff); white-space:nowrap; transition:all .12s; }
  .sia-cancel { width:36px; height:42px; flex-shrink:0; border:1.5px solid #e2e6eb; border-radius:8px; background:#fff; color:#9ca3af; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .12s; }
  .sia-cancel:hover { border-color:#9ca3af; color:#374151; }
  .c-sale    { background:#dc2626; color:#fff; } .c-restock { background:#16a34a; color:#fff; } .c-set { background:#2563eb; color:#fff; }
  .sia-prev { margin-top:7px; font-size:12px; color:#6b7280; text-align:center; background:#fff; border-radius:6px; padding:6px 8px; border:1px solid #e8eaee; }
  .sia-prev b { color:#111; }
  .sia-flash { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:9999; padding:12px 22px; border-radius:12px; font-size:13px; font-weight:700; font-family:var(--ff); box-shadow:0 8px 32px rgba(0,0,0,.22); animation:flashIn .22s ease; display:flex; align-items:center; gap:8px; white-space:nowrap; max-width:90vw; }
  .sia-flash.ok   { background:#16a34a; color:#fff; } .sia-flash.err { background:#dc2626; color:#fff; } .sia-flash.warn { background:#d97706; color:#fff; }
  @keyframes flashIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .sia-denied { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:#fff; font-family:var(--ff); }
  .sia-denied-box { max-width:340px; text-align:center; animation:fadeUp .3s ease; }
  .sia-denied-ico { width:64px; height:64px; border-radius:50%; border:2px solid rgba(239,68,68,.3); background:rgba(239,68,68,.08); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .sia-denied h2 { font-size:20px; font-weight:700; color:#e84c1e; margin-bottom:8px; }
  .sia-denied p  { font-size:13px; color:#64748b; line-height:1.7; }
  .sia-empty { padding:56px 20px; text-align:center; color:#9ca3af; grid-column:1/-1; }
  .sia-empty h3 { font-size:15px; font-weight:600; color:#64748b; margin-bottom:6px; }

  @media (min-width:300px) and (max-width:767px) {
    .sia-tb { flex-direction:column !important; }
    .sia-kpi-icon { display:none; }
    .sia-kpis { justify-content:space-between; gap:4px; }
    .sia-scan-btn { margin-left:inherit; }
  }

  /* Scanner */
  .scan-ov { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  @media(min-width:600px){ .scan-ov { align-items:center; padding:20px; } }
  .scan-sheet { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:480px; overflow:hidden; animation:sheetUp .22s ease; max-height:92vh; display:flex; flex-direction:column; }
  @media(min-width:600px){ .scan-sheet { border-radius:14px; } }
  @keyframes sheetUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
  .scan-hdr { display:flex; align-items:center; justify-content:space-between; padding:15px 17px; border-bottom:1px solid #e5e7eb; flex-shrink:0; }
  .scan-hdr h3 { font-size:15px; font-weight:700; color:#111; display:flex; align-items:center; gap:7px; }
  .scan-close { width:28px; height:28px; border-radius:6px; border:1px solid #e5e7eb; background:transparent; color:#9ca3af; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .scan-body { padding:15px 17px; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
  .scan-cam { background:#111; border-radius:10px; overflow:hidden; position:relative; aspect-ratio:4/3; display:flex; align-items:center; justify-content:center; }
  #sia-vid { width:100%; height:100%; object-fit:cover; display:block; }
  .scan-vf { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
  .scan-vf-b { width:55%; aspect-ratio:1; border:2px solid rgba(232,76,30,.75); border-radius:12px; box-shadow:0 0 0 9999px rgba(0,0,0,.45); }
  .scan-off { color:#9ca3af; font-size:13px; text-align:center; padding:20px; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .scan-cam-btn { width:100%; padding:11px; background:#e84c1e; border:none; border-radius:8px; font-size:14px; font-weight:700; color:#fff; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; justify-content:center; gap:7px; }
  .scan-cam-btn:hover { background:#c73e15; }
  .scan-cam-btn.stop { background:#374151; }
  .scan-mode { display:flex; gap:7px; }
  .scan-mb { flex:1; padding:9px; border:1.5px solid #e5e7eb; border-radius:8px; background:transparent; color:#9ca3af; font-size:13px; font-weight:600; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; justify-content:center; gap:5px; transition:all .12s; }
  .scan-mb.ms-sale    { background:rgba(220,38,38,.08); border-color:#ef4444; color:#dc2626; }
  .scan-mb.ms-restock { background:rgba(22,163,74,.08); border-color:#22c55e; color:#16a34a; }
  .scan-field label { display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
  .scan-inp { width:100%; padding:11px 13px; background:#fff5f3; border:1.5px solid #e84c1e; border-radius:8px; font-size:16px; font-family:var(--mono); color:#111; outline:none; }
  .scan-apply { width:100%; padding:12px; background:#e84c1e; border:none; border-radius:8px; font-size:14px; font-weight:700; color:#fff; cursor:pointer; font-family:var(--ff); display:flex; align-items:center; justify-content:center; gap:7px; }
  .scan-apply:hover { background:#c73e15; }
  .scan-res { padding:11px 13px; border-radius:8px; font-size:13px; font-weight:600; display:flex; align-items:flex-start; gap:7px; border:1px solid; line-height:1.4; }
  .scan-res.ok  { background:rgba(34,197,94,.08); border-color:rgba(34,197,94,.2); color:#15803d; }
  .scan-res.err { background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.2); color:#dc2626; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ════════════════════════════════════════════════════════════════
   EXPIRY TIMER COMPONENT
════════════════════════════════════════════════════════════════ */
function ExpiryTimer({ userId, onExpiryChange }) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(userId));
  const [expInfo, setExpInfo] = useState(() => getLinkExpiry(userId));
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const tick = () => { setRemaining(getRemainingMs(userId)); setExpInfo(getLinkExpiry(userId)); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [userId]);

  const handleSetDuration = (minutes) => {
    const info = setLinkExpiry(userId, minutes);
    setExpInfo(info); setRemaining(getRemainingMs(userId)); setSelecting(false);
    if (onExpiryChange) onExpiryChange(info);
  };

  const expired = expInfo && expInfo.expiresAt && remaining === 0;
  const hasExpiry = expInfo && expInfo.expiresAt;
  const totalMs = expInfo ? expInfo.durationMinutes * 60 * 1000 : null;
  const progressPct = (hasExpiry && totalMs && remaining !== null)
    ? Math.max(0, Math.min(100, (remaining / totalMs) * 100)) : 100;

  let timerClass = 'none', timerLabel = 'No expiry set';
  if (hasExpiry) {
    if (expired) { timerClass = 'out'; timerLabel = 'EXPIRED'; }
    else if (remaining !== null && remaining < 5 * 60 * 1000) { timerClass = 'low'; timerLabel = formatRemaining(remaining); }
    else { timerClass = 'ok'; timerLabel = formatRemaining(remaining); }
  } else if (expInfo && !expInfo.expiresAt) { timerClass = 'none'; timerLabel = 'No expiry'; }

  const progressColor = expired ? '#dc2626' : timerClass === 'low' ? '#d97706' : timerClass === 'ok' ? '#16a34a' : '#9ca3af';

  return (
    <div className="exp-box">
      <div className="exp-hdr">
        <span className="exp-hdr-l"><Timer size={11} /> Link Expiry Timer</span>
        <button style={{ fontSize: 11, fontWeight: 700, color: '#e84c1e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ff)' }}
          onClick={() => setSelecting(s => !s)}>{selecting ? 'Close' : '+ Set Duration'}</button>
      </div>
      <div className="exp-body">
        <div className="exp-row">
          <div className="exp-timer">
            <Timer size={13} color={progressColor} />
            <span className={`exp-timer-v ${timerClass}`}>{timerLabel}</span>
          </div>
          {expired && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 20 }}>Link Expired</span>}
          {!hasExpiry && expInfo && <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Link never expires</span>}
          {!expInfo && <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>No expiry configured</span>}
        </div>
        {hasExpiry && !expired && (
          <div className="exp-progress">
            <div className="exp-progress-inner" style={{ width: `${progressPct}%`, background: progressColor }} />
          </div>
        )}
        {selecting && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Choose expiry duration:</div>
            <div className="exp-sel">
              {EXPIRY_OPTIONS.map(opt => {
                const isCurrent = expInfo ? opt.value === expInfo.durationMinutes : opt.value === 0;
                const cls = isCurrent ? (opt.value === 0 ? 'exp-opt active-none' : 'exp-opt active') : 'exp-opt';
                return <button key={opt.value} className={cls} onClick={() => handleSetDuration(opt.value)}>{opt.label}</button>;
              })}
            </div>
          </div>
        )}
        {hasExpiry && expInfo.expiresAt && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            Expires: <span style={{ fontFamily: 'var(--mono)', color: '#374151' }}>
              {new Date(expInfo.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {' at '}
              {new Date(expInfo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DEFAULT EXPORT — smart router
════════════════════════════════════════════════════════════════ */
export default function StaffInventorySystem() {
  return getURLToken() ? <StaffInventory /> : <VendorStaffManager />;
}

/* ════════════════════════════════════════════════════════════════
   PART 1 — VENDOR STAFF MANAGER
════════════════════════════════════════════════════════════════ */
export function VendorStaffManager() {
  const [toast, showToast] = useToast();
  const [staffList, setStaffList] = useState([]);
  const [accessLog, setAccessLog] = useState([]);
  const [permRequests, setPermRequests] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreds, setShowCreds] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('staff');
  const [expandedUser, setExpandedUser] = useState(null);
  const [defaultExpiry, setDefaultExpiry] = useState(60);

  const refresh = useCallback(async () => {
    setAccessLog(readLS('vp_staff_log', []));
    setPermRequests(readLS('vp_perm_requests', []));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        const staff = await getVendorStaffByVendorId(user.id);
        setStaffList(staff);
        // Sync with local fallback too, just in case
        writeLS('vp_staff_users', staff);
      } else {
        setStaffList(readLS('vp_staff_users', []));
      }
    } catch (e) {
      console.warn("Failed to fetch vendor staff:", e);
      setStaffList(readLS('vp_staff_users', []));
    }
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 8000); return () => clearInterval(i); }, [refresh]);

  const kpis = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.active).length,
    inactive: staffList.filter(s => !s.active).length,
    logins: accessLog.filter(l => l.type === 'login' && l.success && (Date.now() - new Date(l.time).getTime()) < 86400000).length,
  }), [staffList, accessLog]);

  const pendingCount = useMemo(() => permRequests.filter(r => r.status === 'pending').length, [permRequests]);
  const knownUsernames = useMemo(() => new Set(staffList.map(s => s.username.toLowerCase())), [staffList]);
  const filteredLog = useMemo(() => accessLog.filter(e => e.username && knownUsernames.has(e.username.toLowerCase())), [accessLog, knownUsernames]);
  const activityStats = useMemo(() => computeActivityStats(filteredLog), [filteredLog]);
  const logsByUser = useMemo(() => {
    const map = {};
    [...filteredLog].sort((a, b) => new Date(b.time) - new Date(a.time)).forEach(e => {
      if (!map[e.username]) map[e.username] = [];
      map[e.username].push(e);
    });
    return map;
  }, [filteredLog]);
  const totalStats = useMemo(() => {
    let totalSessions = 0, totalActions = 0, totalMs = 0;
    Object.values(activityStats).forEach(s => {
      totalSessions += s.sessionCount || 0; totalActions += s.actions || 0; totalMs += s.totalSessionMs || 0;
    });
    return { totalSessions, totalActions, totalMs };
  }, [activityStats]);

  const validateUsername = u => {
    if (!u.trim()) return 'Username is required';
    if (u.trim().length < 3) return 'Minimum 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(u.trim())) return 'Letters, numbers and underscore only';
    if (staffList.some(s => s.username.toLowerCase() === u.trim().toLowerCase())) return 'Username already exists';
    return null;
  };

  const handleCreate = useCallback(async () => {
    const err = validateUsername(username);
    if (err) { showToast(err, 'err'); return; }
    if (!password.trim()) { showToast('Password is required', 'err'); return; }
    if (password.trim().length < 5) { showToast('Minimum 5 characters', 'err'); return; }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (!user.id && user.roleId !== 3)) {
      showToast('Session error: No vendor logged in.', 'err');
      return;
    }
    const safeVendorId = user.id;

    setCreating(true);

    try {
      let newStaff = {
        vendorId: safeVendorId,
        username: username.trim(),
        password: password.trim(),
        label: label.trim() || username.trim(),
        accessToken: generateToken(),
        active: true,
        createdAt: new Date().toISOString()
      };
      const created = await createVendorStaff(newStaff);

      const next = [...staffList, created];
      setStaffList(next);
      writeLS('vp_staff_users', next);
      setLinkExpiry(created.id, defaultExpiry);
      setUsername('');
      setPassword('');
      setLabel('');
      setCreating(false);
      setShowCreds(created);
      showToast(`Account created successfully for "${created.label}"`, 'ok');
    } catch (e) {
      setCreating(false);
      showToast(e.message || 'Failed to create account. Username might already exist.', 'err');
    }
  }, [username, password, label, staffList, showToast, defaultExpiry]);

  const toggleActive = useCallback(async id => {
    const u = staffList.find(s => s.id === id);
    if (!u) return;

    // Optimistic Update
    const next = staffList.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setStaffList(next);
    writeLS('vp_staff_users', next);

    try {
      await updateVendorStaff(id, { active: !u.active });
      showToast(`${u?.label} successfully ${!u?.active ? 'activated' : 'deactivated'}`, 'ok');
    } catch (e) {
      showToast(`Failed to update status: ${e.message || 'Server Error'}`, 'err');
      // rollback
      const rollback = staffList.map(s => s.id === id ? { ...s, active: u.active } : s);
      setStaffList(rollback); writeLS('vp_staff_users', rollback);
    }
  }, [staffList, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    // Optimistic Update
    const next = staffList.filter(s => s.id !== target.id);
    setStaffList(next);
    writeLS('vp_staff_users', next);
    removeLinkExpiry(target.id);

    try {
      await deleteVendorStaff(target.id);
      showToast(`"${target.label}" successfully removed`, 'ok');
    } catch (e) {
      showToast(`Removal failed: ${e.message || 'Server Error'}`, 'err');
      refresh(); // Reload original list
    }
  }, [deleteTarget, staffList, showToast, refresh]);

  const copyLink = useCallback(user => {
    navigator.clipboard.writeText(getStaffPageUrl(user.accessToken)).then(() => {
      setCopiedId(user.id); showToast('Link copied to clipboard', 'ok');
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, [showToast]);

  const regenToken = useCallback(async id => {
    const u = staffList.find(s => s.id === id);
    if (!u) return;

    const newToken = generateToken();
    const next = staffList.map(s => s.id === id ? { ...s, accessToken: newToken } : s);
    setStaffList(next);
    writeLS('vp_staff_users', next);

    try {
      await updateVendorStaff(id, { accessToken: newToken });
      showToast('New link generated successfully', 'ok');
    } catch (e) {
      showToast(`Token regen failed: ${e.message || 'Server Error'}`, 'err');
      refresh();
    }
  }, [staffList, showToast, refresh]);

  const renewExpiry = useCallback(userId => {
    const exp = getLinkExpiry(userId);
    const minutes = exp ? (exp.durationMinutes || 60) : 60;
    setLinkExpiry(userId, minutes);
    showToast(`Link expiry renewed for ${minutes} min`, 'ok');
    refresh();
  }, [showToast, refresh]);

  const handlePermission = useCallback((reqId, decision) => {
    const reqs = readLS('vp_perm_requests', []);
    const req = reqs.find(r => r.id === reqId);
    if (!req) return;
    const updatedReqs = reqs.map(r => r.id === reqId ? { ...r, status: decision, decidedAt: new Date().toISOString() } : r);
    writeLS('vp_perm_requests', updatedReqs); setPermRequests(updatedReqs);
    if (decision === 'approved') {
      const products = readLS('vp_products', []);
      if (req.action === 'delete') {
        const deleted = readLS('vp_deleted', []);
        const toDelete = products.find(p => (p._id ?? p.id) === req.productId);
        if (toDelete) { writeLS('vp_deleted', [...deleted, { ...toDelete, deletedAt: new Date().toISOString() }]); writeLS('vp_products', products.filter(p => (p._id ?? p.id) !== req.productId)); }
      } else if (req.action === 'draft') {
        writeLS('vp_products', products.map(p => (p._id ?? p.id) === req.productId ? { ...p, status: 'draft' } : p));
      }
      logAction({ type: 'permission_approved', username: 'vendor', target: req.staffUsername, action: req.action, product: req.productName });
      showToast(`Approved: ${req.action} "${req.productName}"`, 'ok');
    } else {
      logAction({ type: 'permission_rejected', username: 'vendor', target: req.staffUsername, action: req.action, product: req.productName });
      showToast(`Rejected request from ${req.staffUsername}`, 'info');
    }
  }, [showToast]);

  const logDotColor = e => e.type === 'stock_update' ? '#e84c1e' : e.type === 'login' && e.success ? '#22c55e' : e.type === 'login' && !e.success ? '#ef4444' : e.type === 'logout' ? '#9ca3af' : e.type === 'session_restore' ? '#3b82f6' : e.type === 'permission_request' ? '#f59e0b' : e.type === 'permission_approved' ? '#16a34a' : e.type === 'permission_rejected' ? '#dc2626' : '#d1d5db';
  const logTypeLabel = e => e.type === 'stock_update' ? 'Stock' : e.type === 'login' ? e.success ? 'Login' : 'Failed' : e.type === 'logout' ? 'Logout' : e.type === 'session_restore' ? 'Resume' : e.type === 'permission_request' ? 'Request' : e.type === 'permission_approved' ? 'Approved' : e.type === 'permission_rejected' ? 'Rejected' : e.type;
  const logLabel = e => e.type === 'stock_update' ? `"${e.product}" — ${e.mode}: ${e.change} (${e.from}→${e.to})` : e.type === 'login' ? e.success ? 'Logged in successfully' : 'Failed login attempt' : e.type === 'logout' ? 'Signed out' : e.type === 'session_restore' ? 'Session resumed after page reload' : e.type === 'permission_request' ? `Requested ${e.action} for "${e.product}"` : e.type === 'permission_approved' ? `Vendor approved ${e.action} on "${e.product}"` : e.type === 'permission_rejected' ? `Vendor rejected ${e.action} request for "${e.product}"` : e.type;

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={`vsm-toast ${toast.type}`}>{toast.msg}</div>}
      {deleteTarget && (
        <div className="vsm-ov" onClick={() => setDeleteTarget(null)}>
          <div className="vsm-modal" onClick={e => e.stopPropagation()}>
            <h3>Remove Staff Member</h3>
            <p><strong>{deleteTarget.label}</strong> (@{deleteTarget.username}) will lose access immediately.</p>
            <div className="vsm-mb">
              <button className="vsm-mc" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="vsm-md" onClick={handleDelete}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
      {showCreds && (
        <div className="vsm-ov" onClick={() => setShowCreds(null)}>
          <div className="vsm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle size={18} color="#16a34a" /></div>
              <h3 style={{ margin: 0 }}>Staff Account Created</h3>
            </div>
            <p style={{ marginBottom: 4 }}>Share these credentials with <strong>{showCreds.label}</strong>. Save the password — it won't be shown again.</p>
            <div className="vsm-creds">
              {[['Username', showCreds.username], ['Password', showCreds.password], ['Access Link', getStaffPageUrl(showCreds.accessToken).slice(0, 46) + '...'], ['Link Expires', defaultExpiry === 0 ? 'Never' : `In ${defaultExpiry >= 60 ? `${defaultExpiry / 60}h` : `${defaultExpiry}min`}`]].map(([k, v]) => (
                <div key={k} className="vsm-cr"><span className="vsm-ck">{k}</span><span className="vsm-cv">{v}</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="vsm-btn vsm-btn-p" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} onClick={() => {
                const expText = defaultExpiry === 0 ? 'Never' : `In ${defaultExpiry >= 60 ? `${defaultExpiry / 60}h` : `${defaultExpiry}min`}`;
                navigator.clipboard.writeText(`Username: ${showCreds.username}\nPassword: ${showCreds.password}\nLink: ${getStaffPageUrl(showCreds.accessToken)}\nExpires: ${expText}`);
                showToast('Credentials copied', 'ok');
              }}><Copy size={13} /> Copy All</button>
              <button className="vsm-btn vsm-btn-s" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} onClick={() => setShowCreds(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      <VendorLayout>
        <div className="vsm">
          <div className="vsm-hdr">
            <div>
              <h1><div className="vsm-hdr-ico"><Shield size={16} color="#fff" /></div>Staff Access Manager</h1>
              <p>Create staff logins for inventory. Your vendor dashboard stays private.</p>
            </div>
            <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'var(--ff)' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div className="vsm-kpis">
            {[{ l: 'Total Staff', v: kpis.total, s: 'accounts', c: '#2563eb' }, { l: 'Active', v: kpis.active, s: 'can log in', c: '#16a34a' }, { l: 'Inactive', v: kpis.inactive, s: 'revoked', c: '#dc2626' }, { l: 'Logins Today', v: kpis.logins, s: 'last 24 h', c: '#d97706' }].map(k => (
              <div key={k.l} className="vsm-kpi" style={{ borderLeftColor: k.c }}>
                <div className="vsm-kpi-l">{k.l}</div>
                <div className="vsm-kpi-v" style={{ color: k.c }}>{k.v}</div>
                <div className="vsm-kpi-s">{k.s}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '11px 14px', marginBottom: 18, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
              <strong>Permission system active:</strong> Staff must request permission to delete or draft products. Requests appear in the <strong>Permissions</strong> tab. Stock updates happen immediately.
            </span>
          </div>
          <div className="vsm-tabs">
            {[{ id: 'staff', icon: <Users size={13} />, label: 'Staff Accounts' }, { id: 'activity', icon: <Activity size={13} />, label: `Activity (${staffList.length})` }, { id: 'permissions', icon: <Bell size={13} />, label: 'Permissions', badge: pendingCount }].map(t => (
              <button key={t.id} className={`vsm-tab ${activeTab === t.id ? 'on' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
                {t.badge > 0 && <span className="vsm-tab-badge">{t.badge}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'staff' && (
            <div className="vsm-grid">
              <div>
                <div className="vsm-card">
                  <div className="vsm-ch"><h2><Plus size={14} color="#2563eb" /> Create Staff Account</h2></div>
                  <div className="vsm-form">
                    <div className="vsm-fl"><label>Display Name</label><input className="vsm-i" placeholder="e.g. Warehouse Team" value={label} onChange={e => setLabel(e.target.value)} /></div>
                    <div className="vsm-fl"><label>Username <span style={{ color: '#dc2626' }}>*</span></label>
                      <div className="vsm-fr"><input className="vsm-i" placeholder="e.g. staff01" value={username} onChange={e => setUsername(e.target.value)} style={{ paddingRight: 36 }} /><span className="vsm-ii"><User size={14} /></span></div>
                    </div>
                    <div className="vsm-fl"><label>Password <span style={{ color: '#dc2626' }}>*</span></label>
                      <div className="vsm-pw">
                        <div className="vsm-fr" style={{ flex: 1 }}>
                          <input className="vsm-i" type={showPw ? 'text' : 'password'} placeholder="Minimum 5 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 36 }} />
                          <button className="vsm-ii" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                        </div>
                        <button className="vsm-gpw" onClick={() => { setPassword(generatePassword(9)); setShowPw(true); }}><Key size={12} /> Generate</button>
                      </div>
                    </div>
                    <div className="vsm-fl">
                      <label><Timer size={11} /> Default Link Expiry</label>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                        {EXPIRY_OPTIONS.map(opt => (
                          <button key={opt.value} className={`exp-opt ${defaultExpiry === opt.value ? (opt.value === 0 ? 'active-none' : 'active') : ''}`} onClick={() => setDefaultExpiry(opt.value)}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <button className="vsm-cta" onClick={handleCreate} disabled={creating}>
                      {creating ? <><RefreshCw size={14} style={{ animation: 'spin .7s linear infinite' }} /> Creating...</> : <><Plus size={14} /> Create Staff Account</>}
                    </button>
                  </div>
                </div>
                <div className="vsm-card">
                  <div className="vsm-ch"><h2><Clock size={14} color="#9ca3af" /> Recent Activity Log</h2><span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{accessLog.length} events</span></div>
                  <div className="vsm-log">
                    {accessLog.length === 0
                      ? <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No activity recorded yet</div>
                      : [...accessLog].reverse().filter(l => l.type !== 'session_restore' && l.type !== 'visit').slice(0, 15).map((log, i) => (
                        <div key={i} className="vsm-lr">
                          <div className="vsm-ld" style={{ background: logDotColor(log) }} />
                          <div style={{ flex: 1 }}><span style={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>{log.username}</span><span style={{ color: '#9ca3af', marginLeft: 6, fontSize: 12 }}>{logLabel(log)}</span></div>
                          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', flexShrink: 0 }}>{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
              <div>
                <div className="vsm-card">
                  <div className="vsm-ch"><h2><Users size={14} color="#374151" /> Staff Accounts</h2><span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{staffList.length}</span></div>
                  {staffList.length === 0 ? (
                    <div className="vsm-empty"><div className="vsm-empty-ico"><Users size={18} color="#9ca3af" /></div><div className="vsm-empty-t">No staff accounts yet</div><div className="vsm-empty-s">Create one using the form</div></div>
                  ) : staffList.map(user => {
                    const uStats = activityStats[user.username];
                    const expired = isLinkExpired(user.id);
                    return (
                      <div key={user.id} className="vsm-sr">
                        <div className="vsm-av">{user.label.charAt(0).toUpperCase()}</div>
                        <div className="vsm-si">
                          <div className="vsm-sn">{user.label}</div>
                          <div className="vsm-sm">
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>@{user.username}</span>
                            <span className={`vsm-pill ${user.active ? (expired ? 'pill-exp' : 'pill-on') : 'pill-off'}`}>{user.active ? (expired ? 'Link Expired' : 'Active') : 'Inactive'}</span>
                          </div>
                          {user.lastLogin && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Last login: {timeAgo(user.lastLogin)}</div>}
                          {uStats && (
                            <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#6b7280' }}><strong style={{ color: '#374151' }}>{uStats.sessionCount || 0}</strong> sessions</span>
                              <span style={{ fontSize: 11, color: '#6b7280' }}><strong style={{ color: '#374151' }}>{uStats.actions || 0}</strong> actions</span>
                              {uStats.totalSessionMs > 0 && <span style={{ fontSize: 11, color: '#6b7280' }}>~<strong style={{ color: '#374151' }}>{formatDuration(uStats.totalSessionMs)}</strong> online</span>}
                            </div>
                          )}
                        </div>
                        <div className="vsm-sa">
                          <button className={`vsm-ib ${revealedIds.has(user.id) ? 'ok' : ''}`} title={revealedIds.has(user.id) ? "Hide Credentials" : "Show Credentials"} onClick={() => {
                            const next = new Set(revealedIds);
                            if (next.has(user.id)) next.delete(user.id);
                            else next.add(user.id);
                            setRevealedIds(next);
                          }}>
                            {revealedIds.has(user.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button className={`vsm-ib ${copiedId === user.id ? 'ok' : ''}`} title="Copy access link" onClick={() => copyLink(user)}>{copiedId === user.id ? <CheckCircle size={13} color="#16a34a" /> : <Link2 size={13} />}</button>
                          <button className="vsm-ib" title={user.active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(user.id)}>{user.active ? <XCircle size={13} color="#dc2626" /> : <CheckCircle size={13} color="#16a34a" />}</button>
                          <button className="vsm-ib del" title="Remove" onClick={() => setDeleteTarget(user)}><Trash2 size={13} /></button>
                        </div>
                        <ExpiryTimer key={`exp-${user.id}`} userId={user.id} onExpiryChange={() => refresh()} />
                        {user.active && (
                          <div className="vsm-lb" style={{ width: '100%' }}>
                            {revealedIds.has(user.id) && (
                              <div style={{ marginBottom: 10, padding: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Username</span>
                                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#334155' }}>{user.username}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Password</span>
                                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#334155' }}>{user.password}</span>
                                </div>
                              </div>
                            )}
                            <div className="vsm-lbl"><Link2 size={10} /> Staff Access Link</div>
                            {expired && <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontSize: 12, color: '#be123c', fontWeight: 600 }}><AlertTriangle size={12} />Link expired — renew or regenerate to restore access</div>}
                            <div className="vsm-lu">{getStaffPageUrl(user.accessToken)}</div>
                            <div className="vsm-la">
                              <button className="vsm-btn vsm-btn-p" onClick={() => copyLink(user)}><Copy size={11} /> Copy</button>
                              <button className="vsm-btn vsm-btn-s" onClick={() => window.open(getStaffPageUrl(user.accessToken), '_blank')}><ExternalLink size={11} /> Open</button>
                              <button className="vsm-btn vsm-btn-s" onClick={() => renewExpiry(user.id)}><RefreshCw size={11} /> Renew</button>
                              <button className="vsm-btn vsm-btn-d" onClick={() => regenToken(user.id)}><Key size={11} /> New Token</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="vsm-card">
              <div className="vsm-ch"><h2><Activity size={14} color="#e84c1e" /> All Staff Activity</h2><span style={{ fontSize: 12, color: '#9ca3af' }}>{filteredLog.length} events · {staffList.length} staff</span></div>
              {staffList.length === 0 ? (
                <div className="vsm-empty"><div className="vsm-empty-ico"><Inbox size={18} color="#9ca3af" /></div><div className="vsm-empty-t">No staff accounts yet</div><div className="vsm-empty-s">Create staff accounts first</div></div>
              ) : (
                <>
                  <div style={{ padding: '14px 18px 2px' }}>
                    <div className="act-summary">
                      <div className="act-sum-card"><div className="act-sum-v" style={{ color: '#2563eb' }}>{totalStats.totalSessions}</div><div className="act-sum-l">Total Sessions</div></div>
                      <div className="act-sum-card"><div className="act-sum-v" style={{ color: '#e84c1e' }}>{totalStats.totalActions}</div><div className="act-sum-l">Stock Actions</div></div>
                      <div className="act-sum-card"><div className="act-sum-v" style={{ color: '#16a34a', fontSize: 18 }}>{formatDuration(totalStats.totalMs)}</div><div className="act-sum-l">Est. Total Time</div></div>
                    </div>
                  </div>
                  <div className="act-grid">
                    {[...staffList].sort((a, b) => { const al = activityStats[a.username]?.lastSeen || ''; const bl = activityStats[b.username]?.lastSeen || ''; return bl > al ? 1 : -1; }).map(staffMeta => {
                      const uname = staffMeta.username;
                      const stats = activityStats[uname] || { sessionCount: 0, actions: 0, totalSessionMs: 0, lastSeen: null };
                      const displayName = staffMeta.label || uname;
                      const logs = (logsByUser[uname] || []).filter(e => e.type !== 'session_restore').slice(0, 30);
                      const isExpanded = expandedUser === uname;
                      return (
                        <div key={uname} className="act-user-row">
                          <div className="act-user-head" onClick={() => setExpandedUser(isExpanded ? null : uname)}>
                            <div className="act-user-av">{displayName.charAt(0).toUpperCase()}</div>
                            <div className="act-user-name"><div style={{ fontWeight: 600 }}>{displayName}</div><div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', fontWeight: 400, marginTop: 1 }}>@{uname}</div></div>
                            <div className="act-user-meta">
                              <div className="act-stat-chip"><div className="act-stat-v" style={{ color: '#2563eb' }}>{stats.sessionCount}</div><div className="act-stat-l">Sessions</div></div>
                              <div className="act-stat-chip"><div className="act-stat-v" style={{ color: '#e84c1e' }}>{stats.actions}</div><div className="act-stat-l">Actions</div></div>
                              <div className="act-stat-chip"><div className="act-stat-v" style={{ color: '#16a34a', fontSize: 13 }}>{formatDuration(stats.totalSessionMs || 0)}</div><div className="act-stat-l">Time Online</div></div>
                              <div className="act-stat-chip"><div className="act-stat-v" style={{ fontSize: 11, color: stats.lastSeen ? '#6b7280' : '#d1d5db' }}>{stats.lastSeen ? timeAgo(stats.lastSeen) : 'Never'}</div><div className="act-stat-l">Last Seen</div></div>
                            </div>
                            <ChevronDown size={14} color="#9ca3af" style={{ transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
                          </div>
                          {isExpanded && (
                            <div className="act-log-list">
                              {logs.length === 0
                                ? <div style={{ padding: '14px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No activity logged yet</div>
                                : logs.map((entry, j) => (
                                  <div key={j} className="act-log-row">
                                    <div className="act-log-dot" style={{ background: logDotColor(entry) }} />
                                    <span className="act-log-type">{logTypeLabel(entry)}</span>
                                    <div className="act-log-text">{logLabel(entry)}</div>
                                    <div className="act-log-time">{new Date(entry.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="vsm-card">
              <div className="vsm-ch"><h2><Bell size={14} color="#d97706" /> Permission Requests</h2>{pendingCount > 0 && <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{pendingCount} pending</span>}</div>
              {permRequests.length === 0 ? (
                <div className="vsm-empty"><div className="vsm-empty-ico"><CheckSquare size={18} color="#9ca3af" /></div><div className="vsm-empty-t">No permission requests</div><div className="vsm-empty-s">When staff request to delete or draft a product, it appears here</div></div>
              ) : [...permRequests].reverse().map(req => (
                <div key={req.id} className="perm-req-row">
                  <div className={`perm-req-icon ${req.action}`}>{req.action === 'delete' ? <Trash2 size={16} color="#dc2626" /> : <FileText size={16} color="#d97706" />}</div>
                  <div className="perm-req-body">
                    <div className="perm-req-title"><span className={`perm-badge ${req.status}`}>{req.status}</span> {req.action === 'delete' ? 'Delete' : 'Draft'} — <em>"{req.productName}"</em></div>
                    <div className="perm-req-sub">From <strong>@{req.staffUsername}</strong>{req.staffLabel && req.staffLabel !== req.staffUsername && ` (${req.staffLabel})`} · {timeAgo(req.requestedAt)}{req.reason && <span> · <em>"{req.reason}"</em></span>}</div>
                    {req.status === 'pending' && <div className="perm-req-actions"><button className="perm-approve" onClick={() => handlePermission(req.id, 'approved')}><CheckCircle size={12} /> Approve</button><button className="perm-reject" onClick={() => handlePermission(req.id, 'rejected')}><Ban size={12} /> Reject</button></div>}
                    {req.status === 'approved' && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> Approved · Action executed {timeAgo(req.decidedAt)}</div>}
                    {req.status === 'rejected' && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Ban size={11} /> Rejected {timeAgo(req.decidedAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </VendorLayout>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   PART 2 — STAFF INVENTORY
════════════════════════════════════════════════════════════════ */
export function StaffInventory() {
  const urlToken = getURLToken();
  const [phase, setPhase] = useState('checking');
  const [staffUser, setStaffUser] = useState(null);
  const [vendorInfo, setVendorInfo] = useState({});
  const SESSION_KEY = useMemo(() => `vp_staff_session_${urlToken}`, [urlToken]);
  const sessionRestoreLogged = useRef(false);

  useEffect(() => {
    if (!urlToken) { setPhase('denied'); return; }
    const users = readLS('vp_staff_users', []);
    const match = users.find(u => u.accessToken === urlToken);
    if (!match || !match.active) { setPhase('denied'); return; }
    if (isLinkExpired(match.id)) { logAction({ type: 'link_expired_access', username: match.username }); setPhase('expired'); return; }
    setVendorInfo(readLS('vp_vendor_info', {}));
    setStaffUser(match);
    const saved = readLS(SESSION_KEY, null);
    if (saved && saved.userId === match.id) {
      if (!sessionRestoreLogged.current) { sessionRestoreLogged.current = true; logAction({ type: 'session_restore', username: match.username, success: true }); }
      setPhase('app');
    } else { setPhase('login'); }
  }, [urlToken, SESSION_KEY]);

  useEffect(() => {
    if (phase !== 'app' || !staffUser) return;
    const id = setInterval(() => { if (isLinkExpired(staffUser.id)) { removeLS(SESSION_KEY); setPhase('expired'); } }, 10000);
    return () => clearInterval(id);
  }, [phase, staffUser, SESSION_KEY]);

  const handleLogin = useCallback(user => {
    if (isLinkExpired(user.id)) { setPhase('expired'); return; }
    writeLS(SESSION_KEY, { userId: user.id, username: user.username, loginAt: new Date().toISOString() });
    setStaffUser(user); setPhase('app');
  }, [SESSION_KEY]);

  const handleLogout = useCallback(() => {
    removeLS(SESSION_KEY);
    logAction({ type: 'logout', username: staffUser?.username });
    setPhase('login');
  }, [staffUser, SESSION_KEY]);

  if (phase === 'checking') return <><style>{CSS}</style><div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'IBM Plex Sans,sans-serif', gap: 10, fontSize: 14 }}><RefreshCw size={17} style={{ animation: 'spin .7s linear infinite' }} /> Verifying access...</div></>;
  if (phase === 'denied') return <><style>{CSS}</style><div className="sia-denied"><div className="sia-denied-box"><div className="sia-denied-ico"><Lock size={26} color="#f87171" /></div><h2>Access Denied</h2><p>This link is invalid, expired, or access has been revoked.</p></div></div></>;
  if (phase === 'expired') return <><style>{CSS}</style><div className="sia-denied"><div className="sia-denied-box"><div className="sia-denied-ico" style={{ borderColor: 'rgba(217,119,6,.3)', background: 'rgba(217,119,6,.08)' }}><Timer size={26} color="#d97706" /></div><h2 style={{ color: '#d97706' }}>Link Expired</h2><p>This access link has expired. Please contact your store manager to get a renewed link.</p></div></div></>;
  if (phase === 'login') return <><style>{CSS}</style><SILogin staffUser={staffUser} vendorInfo={vendorInfo} urlToken={urlToken} onLogin={handleLogin} /></>;
  return <><style>{CSS}</style><SIApp staffUser={staffUser} vendorInfo={vendorInfo} onLogout={handleLogout} /></>;
}

/* ── Login page ── */
function SILogin({ staffUser, vendorInfo, urlToken, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(() => {
    if (!username.trim() || !password.trim()) { setError('Please enter your username and password.'); return; }
    setLoading(true); setError('');
    setTimeout(() => {
      const users = readLS('vp_staff_users', []);
      const user = users.find(u => u.accessToken === urlToken);
      if (!user || !user.active) { setError('Your access has been revoked.'); setLoading(false); return; }
      if (isLinkExpired(user.id)) { setError('This access link has expired. Please request a new link.'); setLoading(false); return; }
      if (user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password.trim()) {
        writeLS('vp_staff_users', users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u));
        logAction({ type: 'login', username: user.username, success: true });
        onLogin(user);
      } else {
        logAction({ type: 'login', username: username.trim(), success: false });
        setError('Incorrect username or password.'); setLoading(false);
      }
    }, 600);
  }, [username, password, urlToken, onLogin]);

  return (
    <div className="sil-wrap">
      <div className="sil-card">
        <div className="sil-top">
          <div className="sil-badge"><Shield size={10} /> Secure Staff Portal</div>
          <div className="sil-ico"><Package size={26} color="#fff" /></div>
          <div className="sil-title">Staff Inventory</div>
          <div className="sil-sub">Authorized access only</div>
          {vendorInfo.storeName && <div className="sil-store"><Package size={10} /> {vendorInfo.storeName}</div>}
        </div>
        <div className="sil-body">
          {error && <div className="sil-err"><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{error}</div>}
          <div className="sil-f">
            <div className="sil-fl"><label>Username</label><div className="sil-fr"><input className="sil-in" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoCapitalize="off" autoComplete="username" /><span className="sil-ii"><User size={16} /></span></div></div>
            <div className="sil-fl"><label>Password</label><div className="sil-fr"><input className="sil-in" type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password" /><button className="sil-ii" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
            <button className="sil-btn" onClick={handleLogin} disabled={loading}>{loading ? <><RefreshCw size={15} style={{ animation: 'spin .7s linear infinite' }} /> Signing in...</> : <><Lock size={15} /> Sign In</>}</button>
          </div>
        </div>
        <div className="sil-foot"><ShieldCheck size={12} /> Restricted to inventory management only</div>
      </div>
    </div>
  );
}

/* ── Permission Request Modal ── */
function PermRequestModal({ product, action, staffUser, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <div className="vsm-ov" onClick={onClose}>
      <div className="vsm-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: action === 'delete' ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{action === 'delete' ? <Trash2 size={17} color="#dc2626" /> : <FileText size={17} color="#d97706" />}</div>
          <h3 style={{ margin: 0 }}>Request {action === 'delete' ? 'Delete' : 'Draft'} Permission</h3>
        </div>
        <p>You need vendor permission to <strong>{action}</strong> <em>"{product.name}"</em>. Your request will be sent for approval.</p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Reason (optional)</label>
          <textarea style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontFamily: 'IBM Plex Sans,sans-serif', fontSize: 14, resize: 'vertical', minHeight: 70, outline: 'none', transition: 'border-color .15s' }} placeholder="Briefly explain why..." value={reason} onChange={e => setReason(e.target.value)} onFocus={e => e.target.style.borderColor = '#e84c1e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        </div>
        <div className="vsm-mb">
          <button className="vsm-mc" onClick={onClose}>Cancel</button>
          <button style={{ flex: 1, padding: '10px', background: '#e84c1e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'IBM Plex Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => onSubmit(reason)}><Send size={13} /> Send Request</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   NOTIFICATION BELL — staff app
   Shows the current staff member's own permission requests
   and their vendor-side approval/rejection outcomes
════════════════════════════════════════════════════════════════ */
function NotificationBell({ staffUser, permReqs, onReload }) {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(() => {
    const k = `vp_notif_seen_${staffUser?.id}`;
    return new Set(readLS(k, []));
  });
  const panelRef = useRef(null);

  // Build notification list from this staff member's requests
  const notifications = useMemo(() => {
    if (!staffUser) return [];
    return [...permReqs]
      .filter(r => r.staffUsername === staffUser.username)
      .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      .map(r => {
        let title = '', sub = '', type = 'pending';
        if (r.status === 'pending') {
          title = `Request pending approval`;
          sub = `You requested to ${r.action} "${r.productName}"`;
          type = 'pending';
        } else if (r.status === 'approved') {
          title = `Request approved`;
          sub = `Vendor approved your ${r.action} request for "${r.productName}"`;
          type = 'approved';
        } else if (r.status === 'rejected') {
          title = `Request rejected`;
          sub = `Vendor rejected your ${r.action} request for "${r.productName}"`;
          type = 'rejected';
        }
        return { id: r.id, title, sub, type, time: r.decidedAt || r.requestedAt, unread: !seenIds.has(r.id) };
      });
  }, [permReqs, staffUser, seenIds]);

  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllSeen = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    const next = new Set([...seenIds, ...allIds]);
    setSeenIds(next);
    const k = `vp_notif_seen_${staffUser?.id}`;
    writeLS(k, [...next]);
  }, [notifications, seenIds, staffUser]);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const notifIcon = (type) => {
    if (type === 'approved') return <CheckCircle size={14} color="#16a34a" />;
    if (type === 'rejected') return <Ban size={14} color="#dc2626" />;
    return <Timer size={14} color="#d97706" />;
  };

  return (
    <div className="sia-bell-wrap" ref={panelRef}>
      <button
        className={`sia-bell-btn ${unreadCount > 0 ? 'has-notif' : ''}`}
        onClick={handleOpen}
        title="Notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="sia-bell-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="sia-notif-panel">
          <div className="sia-notif-hdr">
            <div className="sia-notif-hdr-l">
              <Bell size={14} color="#e84c1e" />
              Notifications
              {unreadCount > 0 && <span className="sia-notif-badge">{unreadCount}</span>}
            </div>
            {unreadCount > 0 && (
              <button className="sia-notif-clear" onClick={markAllSeen}>Mark all read</button>
            )}
          </div>

          <div className="sia-notif-list">
            {notifications.length === 0 ? (
              <div className="sia-notif-empty">
                <div className="sia-notif-empty-ico"><Bell size={18} color="#d1d5db" /></div>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4, fontSize: 13 }}>No notifications yet</div>
                <div style={{ fontSize: 12 }}>Request updates will appear here</div>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`sia-notif-row ${n.unread ? 'unread' : ''}`}>
                <div className={`sia-notif-ico ${n.type}`}>{notifIcon(n.type)}</div>
                <div className="sia-notif-body">
                  <div className="sia-notif-title">{n.title}</div>
                  <div className="sia-notif-sub">{n.sub}</div>
                  <div className="sia-notif-time">{timeAgo(n.time)}</div>
                </div>
                {n.unread && <div className="sia-notif-unread-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main staff inventory app ── */
function SIApp({ staffUser, vendorInfo, onLogout }) {
  const [products, setProducts] = useState([]);
  const [flash, setFlash] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activePanel, setActivePanel] = useState(null);
  const [qty, setQty] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [permModal, setPermModal] = useState(null);
  const [permReqs, setPermReqs] = useState([]);
  const [sessionRemaining, setSessionRemaining] = useState(null);

  const showFlash = useCallback((msg, type = 'ok') => {
    setFlash({ msg, type }); setTimeout(() => setFlash(null), 2500);
  }, []);

  const loadData = useCallback(() => {
    setProducts(readLS('vp_products', []));
    setPermReqs(readLS('vp_perm_requests', []));
  }, []);

  useEffect(() => { loadData(); const i = setInterval(loadData, 8000); return () => clearInterval(i); }, [loadData]);

  useEffect(() => {
    if (!staffUser) return;
    const tick = () => setSessionRemaining(getRemainingMs(staffUser.id));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [staffUser]);

  const kpis = useMemo(() => {
    let total = 0, inStock = 0, low = 0, out = 0;
    products.forEach(p => {
      const m = p.stockManagement !== 'no' && p.stock !== undefined && p.stock !== '';
      if (!m) return; total++;
      const q = Number(p.stock) || 0;
      if (q <= 0) out++; else if (q <= 10) low++; else inStock++;
    });
    return { total, inStock, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const m = p.stock !== undefined && p.stock !== '' && p.stockManagement !== 'no';
      const sq = Number(p.stock) || 0;
      const mQ = !q || (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      const mF = filter === 'all' ? true : filter === 'low' ? (m && sq > 0 && sq <= 10) : filter === 'out' ? (m && sq <= 0) : filter === 'in' ? (m && sq > 10) : true;
      return mQ && mF;
    });
  }, [products, search, filter]);

  const openPanel = useCallback((pid, mode) => {
    setActivePanel(prev => (prev?.pid === pid && prev?.mode === mode) ? null : { pid, mode }); setQty('');
  }, []);

  const applyChange = useCallback((product, mode, amount) => {
    const n = parseFloat(amount);
    if (isNaN(n) || n < 0) { showFlash('Enter a valid quantity', 'err'); return; }
    const pid = product._id ?? product.id ?? product.name;
    const old = Number(product.stock) || 0;
    const ns = mode === 'sale' ? Math.max(0, old - n) : mode === 'restock' ? old + n : n;
    const next = products.map(p => (p._id ?? p.id ?? p.name) === pid ? { ...p, stock: ns } : p);
    setProducts(next); writeLS('vp_products', next);
    logAction({ type: 'stock_update', username: staffUser.username, product: product.name, mode, from: old, to: ns, change: n });
    setActivePanel(null); setQty('');
    showFlash(`${mode === 'sale' ? 'Deducted' : mode === 'restock' ? 'Added' : 'Set to'} ${mode === 'set' ? ns : n} — Stock now: ${ns}`, 'ok');
  }, [products, staffUser, showFlash]);

  const applyBySku = useCallback((sku, mode) => {
    const p = products.find(pr => pr.sku && pr.sku.toLowerCase() === sku.toLowerCase());
    if (!p) return { ok: false, msg: `SKU "${sku}" not found` };
    const pid = p._id ?? p.id ?? p.name;
    const old = Number(p.stock) || 0;
    const ns = mode === 'sale' ? Math.max(0, old - 1) : old + 1;
    const next = products.map(pr => (pr._id ?? pr.id ?? pr.name) === pid ? { ...pr, stock: ns } : pr);
    setProducts(next); writeLS('vp_products', next);
    logAction({ type: 'stock_update', username: staffUser.username, product: p.name, mode, from: old, to: ns, change: 1 });
    return { ok: true, msg: `${p.name}: ${old} → ${ns}` };
  }, [products, staffUser]);

  const submitPermRequest = useCallback((product, action, reason) => {
    const pid = product._id ?? product.id ?? product.name;
    const existing = permReqs.find(r => r.productId === pid && r.action === action && r.status === 'pending');
    if (existing) { showFlash('A request for this action is already pending', 'warn'); setPermModal(null); return; }
    const req = { id: `req_${Date.now()}`, productId: pid, productName: product.name, staffUsername: staffUser.username, staffLabel: staffUser.label || staffUser.username, action, reason: reason || '', status: 'pending', requestedAt: new Date().toISOString() };
    const allReqs = readLS('vp_perm_requests', []);
    writeLS('vp_perm_requests', [...allReqs, req]);
    setPermReqs(prev => [...prev, req]);
    logAction({ type: 'permission_request', username: staffUser.username, product: product.name, action });
    showFlash(`Permission request sent to vendor for "${product.name}"`, 'ok');
    setPermModal(null);
  }, [permReqs, staffUser, showFlash]);

  const getPendingReq = (product, action) => {
    const pid = product._id ?? product.id ?? product.name;
    return permReqs.find(r => r.productId === pid && r.action === action && r.status === 'pending');
  };

  const getPreview = (product, mode) => {
    const n = parseFloat(qty);
    if (isNaN(n) || qty === '') return '';
    const old = Number(product.stock) || 0;
    if (mode === 'sale') return `${old} → ${Math.max(0, old - n)} units`;
    if (mode === 'restock') return `${old} → ${old + n} units`;
    if (mode === 'set') return `Set to exactly ${n} units`;
    return '';
  };

  const expInfo = staffUser ? getLinkExpiry(staffUser.id) : null;
  const hasExpiry = expInfo && expInfo.expiresAt;
  const totalMs = expInfo ? expInfo.durationMinutes * 60 * 1000 : null;
  const expProgressPct = (hasExpiry && totalMs && sessionRemaining !== null) ? Math.max(0, Math.min(100, (sessionRemaining / totalMs) * 100)) : null;
  const expIsLow = sessionRemaining !== null && sessionRemaining < 5 * 60 * 1000 && sessionRemaining > 0;
  const expBarColor = expIsLow ? '#f59e0b' : '#22c55e';
  const expBarClass = !hasExpiry ? '' : expIsLow ? 'warn' : '';

  return (
    <div className="sia-root">
      {flash && <div className={`sia-flash ${flash.type}`}>{flash.msg}</div>}

      {scanOpen && <SIScanner onApplyBySku={applyBySku} onClose={() => setScanOpen(false)} showFlash={showFlash} />}

      {permModal && (
        <PermRequestModal
          product={permModal.product} action={permModal.action} staffUser={staffUser}
          onClose={() => setPermModal(null)}
          onSubmit={reason => submitPermRequest(permModal.product, permModal.action, reason)}
        />
      )}

      {/* ── Header ── */}
      <div className="sia-hdr">
        <div className="sia-brand">
          <div className="sia-logo"><Layers size={16} color="#fff" /></div>
          <div>
            <div className="sia-name">StockPilot</div>
            {vendorInfo.storeName && <div className="sia-store">{vendorInfo.storeName}</div>}
          </div>
        </div>
        <div className="sia-right">
          {/* ── Bell notification icon ── */}
          <NotificationBell
            staffUser={staffUser}
            permReqs={permReqs}
            onReload={loadData}
          />

          {/* Session expiry chip */}
          {hasExpiry && sessionRemaining !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: expIsLow ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.07)', border: expIsLow ? '1px solid rgba(245,158,11,.35)' : '1px solid rgba(255,255,255,.1)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: expIsLow ? '#fbbf24' : '#8899bb' }}>
              <Timer size={11} />
              {sessionRemaining <= 0 ? 'Expired' : formatRemaining(sessionRemaining)}
            </div>
          )}

          <div className="sia-who"><User size={11} /> {staffUser?.label || staffUser?.username}</div>
          <button className="sia-out" onClick={onLogout} title="Sign out"><LogOut size={15} /></button>
        </div>
      </div>

      {/* Session expiry progress bar */}
      {hasExpiry && expProgressPct !== null && (
        <div className={`sia-session-exp ${expBarClass}`}>
          <Timer size={11} color={expBarColor} />
          <span style={{ fontSize: 11, fontWeight: 700, color: expIsLow ? '#fbbf24' : '#6b7280', minWidth: 120 }}>
            {sessionRemaining !== null && sessionRemaining > 0 ? `Access expires in ${formatRemaining(sessionRemaining)}` : 'Access expired'}
          </span>
          <div className="sia-session-prog">
            <div className="sia-session-prog-inner" style={{ width: `${expProgressPct}%`, background: expBarColor }} />
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="sia-kpis">
        {[{ l: 'Total', v: kpis.total, c: '#2563eb', bg: 'rgba(37,99,235,.08)' }, { l: 'In Stock', v: kpis.inStock, c: '#16a34a', bg: 'rgba(22,163,74,.08)' }, { l: 'Low', v: kpis.low, c: '#d97706', bg: 'rgba(217,119,6,.08)' }, { l: 'Out', v: kpis.out, c: '#dc2626', bg: 'rgba(220,38,38,.08)' }].map(k => (
          <div key={k.l} className="sia-kpi">
            <div className="sia-kpi-icon" style={{ background: k.bg }}><span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--mono)', color: k.c }}>{k.v}</span></div>
            <div><div className="sia-kpi-n" style={{ color: k.c }}>{k.v}</div><div className="sia-kpi-l">{k.l}</div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sia-tb">
        <div className="sia-srch">
          <Search size={14} color="#e84c1e" />
          <input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', flexShrink: 0 }} onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
        <div className="sia-filters">
          {[{ id: 'all', l: 'All' }, { id: 'low', l: 'Low Stock' }, { id: 'out', l: 'Out of Stock' }, { id: 'in', l: 'In Stock' }].map(f => (
            <button key={f.id} className={`sia-ft f-${f.id} ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>{f.l}</button>
          ))}
        </div>
        <button className="sia-scan-btn" onClick={() => setScanOpen(true)}><Scan size={15} /> Scan</button>
      </div>

      {/* Product grid */}
      <div className="sia-list">
        {filtered.length === 0 && (
          <div className="sia-empty"><h3>No products found</h3><p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'No products match this filter'}</p></div>
        )}
        {filtered.map(product => {
          const pid = product._id ?? product.id ?? product.name;
          const managed = product.stock !== undefined && product.stock !== '' && product.stockManagement !== 'no';
          const qNow = managed ? Number(product.stock) : null;
          const sb = getStockStatus(qNow, managed);
          const isPanelOpen = activePanel?.pid === pid;
          const mode = activePanel?.mode;
          const sc = qNow <= 0 ? '#dc2626' : qNow <= 10 ? '#d97706' : '#16a34a';
          const pendDelete = getPendingReq(product, 'delete');
          const pendDraft = getPendingReq(product, 'draft');
          const cardCls = `sia-pcard ${qNow <= 0 ? 'is-out' : qNow <= 10 ? 'is-low' : 'is-in'}`;

          return (
            <div key={pid} className={cardCls}>
              <div className="sia-crow">
                {product.image
                  ? <img src={product.image} className="sia-pimg" alt="" onError={e => e.currentTarget.style.display = 'none'} />
                  : <div className="sia-pph"><Package size={20} color="#d1d5db" /></div>
                }
                <div className="sia-cmid">
                  <div className="sia-pname">{product.name || '(Unnamed)'}</div>
                  <div className="sia-ptags">
                    <span className="sia-tag">{product.sku || 'NO SKU'}</span>
                    {product.category && <span className="sia-tag">{product.category}</span>}
                  </div>
                </div>
                <div className="sia-cright">
                  {managed ? <><span className="sia-sv" style={{ color: sc }}>{qNow}</span><span className="sia-su">units</span></> : <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>}
                  {sb.cls && <span className={`sia-badge ${sb.cls}`}>{sb.label}</span>}
                </div>
              </div>
              {product.price && (
                <div className="sia-price">
                  <b>₹{product.salePrice || product.price}</b>
                  {product.salePrice && <span style={{ textDecoration: 'line-through', marginLeft: 8, opacity: .4 }}>₹{product.price}</span>}
                </div>
              )}
              {pendDelete && <div className="sia-pend-banner"><Timer size={11} /> Delete request pending approval</div>}
              {pendDraft && <div className="sia-pend-banner"><Timer size={11} /> Draft request pending approval</div>}
              <div className="sia-qbar">
                {[{ id: 'sale', Icon: Minus, l: 'Sale', c: 'qb-sale' }, { id: 'restock', Icon: TrendingUp, l: 'Restock', c: 'qb-restock' }, { id: 'set', Icon: Hash, l: 'Set Qty', c: 'qb-set' }].map(({ id, Icon, l, c }) => (
                  <button key={id} className={`sia-qbtn ${c} ${isPanelOpen && mode === id ? 'act' : ''}`} onClick={() => openPanel(pid, id)} disabled={!managed && id !== 'set'}>
                    <Icon size={14} /><span>{l}</span>
                  </button>
                ))}
              </div>
              {isPanelOpen && (
                <div className="sia-panel">
                  <div className="sia-plbl">
                    {mode === 'sale' && <><Minus size={11} color="#dc2626" /> Qty sold</>}
                    {mode === 'restock' && <><TrendingUp size={11} color="#16a34a" /> Qty received</>}
                    {mode === 'set' && <><Hash size={11} color="#2563eb" /> New total</>}
                  </div>
                  <div className="sia-prow">
                    <input className="sia-qi" type="number" min="0" step="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') applyChange(product, mode, qty); if (e.key === 'Escape') setActivePanel(null); }} />
                    <button className={`sia-confirm c-${mode}`} onClick={() => applyChange(product, mode, qty)}>
                      {mode === 'sale' ? 'Deduct' : mode === 'restock' ? 'Add' : 'Set'}
                    </button>
                    <button className="sia-cancel" onClick={() => setActivePanel(null)}><X size={14} /></button>
                  </div>
                  {qty !== '' && (
                    <div className="sia-prev">
                      {getPreview(product, mode) ? <>Result: <b>{getPreview(product, mode)}</b></> : <span style={{ color: '#dc2626' }}>Enter a valid number</span>}
                    </div>
                  )}
                </div>
              )}
              <div className="sia-perm-bar">
                <button className="sia-perm-btn sia-perm-del" onClick={() => setPermModal({ product, action: 'delete' })}>
                  <Trash2 size={12} />{pendDelete ? 'Delete (Pending)' : 'Request Delete'}
                </button>
                <button className="sia-perm-btn sia-perm-draft" onClick={() => setPermModal({ product, action: 'draft' })}>
                  <FileText size={12} />{pendDraft ? 'Draft (Pending)' : 'Request Draft'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 32 }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCANNER MODAL
════════════════════════════════════════════════════════════════ */
function SIScanner({ onApplyBySku, onClose, showFlash }) {
  const [mode, setMode] = useState('sale');
  const [manual, setManual] = useState('');
  const [camOn, setCamOn] = useState(false);
  const [result, setResult] = useState(null);
  const [noBD, setNoBD] = useState(false);
  const [camErr, setCamErr] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanRef = useRef(null);

  const applyCode = useCallback((code) => {
    const c = code.trim(); if (!c) return;
    const r = onApplyBySku(c, mode);
    setResult(r); setManual('');
    if (r.ok) showFlash(r.msg, 'ok');
    setTimeout(() => setResult(null), 3500);
  }, [mode, onApplyBySku, showFlash]);

  const startCam = useCallback(async () => {
    setCamErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => { }); }
      setCamOn(true);
      if (!('BarcodeDetector' in window)) { setNoBD(true); return; }
      const det = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf'] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try { const barcodes = await det.detect(videoRef.current); if (barcodes.length) applyCode(barcodes[0].rawValue); } catch { }
        scanRef.current = requestAnimationFrame(tick);
      };
      scanRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err?.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' : err?.name === 'NotFoundError' ? 'No camera found on this device.' : 'Camera unavailable — use manual entry below.';
      setCamErr(msg); setCamOn(false);
    }
  }, [applyCode]);

  const stopCam = useCallback(() => {
    if (scanRef.current) cancelAnimationFrame(scanRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamOn(false);
  }, []);

  useEffect(() => () => stopCam(), []);

  return (
    <div className="scan-ov" onClick={onClose}>
      <div className="scan-sheet" onClick={e => e.stopPropagation()}>
        <div className="scan-hdr"><h3><Scan size={15} /> Scan to Update Stock</h3><button className="scan-close" onClick={() => { stopCam(); onClose(); }}><X size={15} /></button></div>
        <div className="scan-body">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>Mode (1 unit per scan)</div>
            <div className="scan-mode">
              <button className={`scan-mb ${mode === 'sale' ? 'ms-sale' : ''}`} onClick={() => setMode('sale')}><Minus size={13} /> Sale — deduct 1</button>
              <button className={`scan-mb ${mode === 'restock' ? 'ms-restock' : ''}`} onClick={() => setMode('restock')}><TrendingUp size={13} /> Restock — add 1</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>Camera Scanner</div>
            <div className="scan-cam">
              <video ref={videoRef} id="sia-vid" playsInline muted style={{ display: camOn ? 'block' : 'none' }} />
              {!camOn && <div className="scan-off"><Camera size={28} style={{ opacity: .3 }} />{camErr ? <span style={{ color: '#dc2626', fontSize: 12, lineHeight: 1.4, textAlign: 'center', maxWidth: 280 }}>{camErr}</span> : <span>Camera is off</span>}</div>}
              {camOn && <div className="scan-vf"><div className="scan-vf-b" /></div>}
            </div>
            <div style={{ marginTop: 8 }}>
              {!camOn ? <button className="scan-cam-btn" onClick={startCam}><Camera size={14} /> Start Camera</button> : <button className="scan-cam-btn stop" onClick={stopCam}><X size={14} /> Stop Camera</button>}
            </div>
            {noBD && camOn && <div style={{ marginTop: 8, fontSize: 12, color: '#d97706', padding: '7px 10px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6 }}>Auto-scan not supported in this browser. Use manual entry.</div>}
          </div>
          <div className="scan-field">
            <label>Manual Code Entry (SKU or Barcode)</label>
            <input className="scan-inp" placeholder="Type or paste code here..." value={manual} onChange={e => setManual(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyCode(manual)} autoComplete="off" inputMode="text" />
          </div>
          <button className="scan-apply" onClick={() => applyCode(manual)}><CheckCircle size={15} /> Apply to Stock</button>
          {result && <div className={`scan-res ${result.ok ? 'ok' : 'err'}`}>{result.ok ? <CheckCircle size={14} style={{ flexShrink: 0 }} /> : <AlertTriangle size={14} style={{ flexShrink: 0 }} />}{result.msg}</div>}
        </div>
      </div>
    </div>
  );
}