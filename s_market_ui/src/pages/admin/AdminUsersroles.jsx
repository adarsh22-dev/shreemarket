import React, { useState, useEffect, useCallback } from 'react';
import './AdminUsersroles.css';
import {
  Users, ShieldCheck, UserPlus, Search, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Plus, Download, Edit2, Trash2, Eye,
  Check, X, Lock, Mail, Phone, MapPin, Calendar, Activity,
  Settings, Shield, AlertCircle, Clock, UserCheck,
  MoreVertical, Key, RefreshCw, CheckCircle,
} from 'lucide-react';
import { getAdminCustomers, getVendors, updateCustomerStatus, getAdminRoles, getAuditLogs, deleteUser } from '../../api/api';
import toast from 'react-hot-toast';
import { exportCSV } from './VendorShared';

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const COLORS = ['red','blue','green','amber','purple','indigo','pink','slate'];
const pickColor = name => COLORS[(name || '').charCodeAt(0) % COLORS.length];

const ACTIVITY_CFG = {
  info:    { icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
  warning: { icon: AlertCircle, color: '#d97706', bg: '#fef3c7' },
  error:   { icon: X,           color: '#dc2626', bg: '#fee2e2' },
};
const ACTIVITY_DEFAULT = { icon: Settings, color: '#2563eb', bg: '#dbeafe' };

const relTime = (ts) => {
  if (!ts) return '—';
  const parts = ts.match(/(\d+) (\w+) (\d{4}) (\d+):(\d+)/);
  if (!parts) return ts;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const d = new Date(+parts[3], months[parts[2]]||0, +parts[1], +parts[4], +parts[5]);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + ' min ago';
  if (diff < 86400) return Math.floor(diff/3600) + ' hr ago';
  if (diff < 604800) return Math.floor(diff/86400) + ' days ago';
  return ts;
};

const PAGE_SIZE = 8;

const ROLE_MAP = {
  1: 'Admin',
  2: 'Vendor',
  3: 'Customer',
  4: 'Moderator',
  5: 'Support',
  6: 'Editor',
};

const formatDate = (epochMs) => {
  if (!epochMs) return '—';
  const d = new Date(epochMs);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/* ══════════════════════════════════════════════
   REUSABLE COMPONENTS
══════════════════════════════════════════════ */
const KpiCard = ({ label, value, trend, up, Icon, color, bg }) => (
  <div className="ur-kpi">
    <div className="ur-kpi__top">
      <div className="ur-kpi__icon" style={{ background: bg }}>
        <Icon size={18} color={color} strokeWidth={2.1} />
      </div>
      <span className={`ur-kpi__trend ur-kpi__trend--${up === null ? 'neu' : up ? 'up' : 'down'}`}>
        {up === true  && <ArrowUpRight size={12} />}
        {up === false && <ArrowDownRight size={12} />}
        {trend}
      </span>
    </div>
    <div>
      <div className="ur-kpi__value">{value}</div>
      <div className="ur-kpi__label">{label}</div>
    </div>
  </div>
);

const Avatar = ({ name, size = 'md' }) => (
  <div className={`ur-avatar ur-avatar--${size} ur-avatar--${pickColor(name || '')}`}>
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

const RoleBadge = ({ role }) => (
  <span className={`ur-role ur-role--${(role || '').toLowerCase()}`}>{role}</span>
);

const StatusBadge = ({ status }) => (
  <span className={`ur-badge ur-badge--${(status || '').toLowerCase()}`}>{status}</span>
);

const OnlineDot = ({ when }) => {
  const cls = when === 'Online' ? 'online' : when.includes('m') || when.includes('h') ? 'away' : 'offline';
  return <span className={`ur-online ur-online--${cls}`}>{when}</span>;
};

const Btn = ({ children, variant = 'outline', sm, icon: Icon, onClick }) => (
  <button className={`ur-btn ur-btn--${variant}${sm ? ' ur-btn--sm' : ''}`} onClick={onClick}>
    {Icon && <Icon size={13} />}{children}
  </button>
);

const IconBtn = ({ icon: Icon, variant = 'view', title, onClick }) => (
  <button className={`ur-icon-btn ur-icon-btn--${variant}`} title={title} onClick={onClick}>
    <Icon size={13} />
  </button>
);

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  return (
    <div className="ur-pag">
      <span className="ur-pag__info">
        {total === 0 ? '0 of 0' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
      </span>
      <div className="ur-pag__ctrl">
        <button className="ur-pag__btn" onClick={onPrev} disabled={page === 0}><ChevronLeft size={13} /></button>
        <span className="ur-pag__label">{page + 1} / {pages}</span>
        <button className="ur-pag__btn" onClick={onNext} disabled={(page + 1) * PAGE_SIZE >= total}><ChevronRight size={13} /></button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   TAB 1 — ALL USERS
══════════════════════════════════════════════ */
const AllUsers = ({ onAddUser }) => {
  const [page,   setPage]   = useState(0);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [users,  setUsers]  = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (filter === 'Vendor') {
        const data = await getVendors(search, page, PAGE_SIZE);
        const mapped = (data.content || []).map(v => ({
          id: v.id,
          name: v.name || v.fullName || '—',
          email: v.email || '—',
          phone: '—',
          city: (v.stores && v.stores.length > 0) ? v.stores[0] : '—',
          role: 'Vendor',
          status: v.status || 'Active',
          joined: formatDate(v.createdAt),
          lastSeen: '—',
          orders: '—',
          spent: '—',
        }));
        setUsers(mapped);
        setTotalElements(data.totalElements || 0);
      } else {
        const params = { page, size: PAGE_SIZE };
        if (search) params.search = search;
        if (filter !== 'All') params.role = filter;
        const data = await getAdminCustomers(params);
        const mapped = (data.content || []).map(u => ({
          id: u.id,
          name: u.fullName || '—',
          email: u.email || '—',
          phone: u.phone || '—',
          city: '—',
          role: ROLE_MAP[u.roleId] || 'Customer',
          status: u.status || 'Active',
          joined: formatDate(u.createdAt),
          lastSeen: '—',
          orders: '—',
          spent: '—',
        }));
        setUsers(mapped);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch users');
      setUsers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    getAuditLogs({ page: 0, size: 7 })
      .then(data => setActivities(data?.content || []))
      .catch(() => {});
  }, []);

  const handleStatusToggle = async (user) => {
    if (user.role === 'Vendor') return;
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateCustomerStatus(user.id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id, '');
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ur-subpage">
      {/* KPIs */}
      <div className="ur-kpi-grid">
        <KpiCard label="Total Users"     value={totalElements.toLocaleString()}  trend="" up={null}  Icon={Users}      color="#2563eb" bg="#dbeafe" />
        <KpiCard label="Active Users"    value="—"  trend=""  up={null}  Icon={UserCheck}  color="#16a34a" bg="#dcfce7" />
        <KpiCard label="New This Month"  value="—"    trend="" up={null}  Icon={UserPlus}   color="#7c3aed" bg="#ede9fe" />
        <KpiCard label="Banned / Inactive" value="—" trend=""     up={null}  Icon={AlertCircle} color="#d97706" bg="#fef3c7" />
      </div>

      {/* Two-col: table + activity */}
      <div className="ur-two-col">
        {/* Main table */}
        <div className="ur-card">
          <div className="ur-section-head">
            <div>
              <p className="ur-section-head__title">All Users</p>
              <p className="ur-section-head__sub">{totalElements} users found</p>
            </div>
            <div className="ur-section-head__right">
              <div className="ur-search">
                <span className="ur-search__icon"><Search size={14} /></span>
                <input
                  className="ur-search__input"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
              </div>
              <div className="ur-filters">
                {['All','Admin','Moderator','Support','Editor','Vendor','Customer'].map(r => (
                  <button key={r} className={`ur-filter${filter === r ? ' is-active' : ''}`}
                    onClick={() => { setFilter(r); setPage(0); }}>{r}</button>
                ))}
              </div>
              <Btn icon={Download} onClick={() => {
                const rows = users.map(u => [u.id, u.name, u.email, u.role, u.status, u.city, u.joined]);
                exportCSV([['ID','Name','Email','Role','Status','City','Joined'], ...rows], 'users.csv');
                toast.success('Users exported');
              }}>Export</Btn>
            </div>
          </div>

          <div className="ur-table-wrap">
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                Loading users…
              </div>
            ) : (
            <table className="ur-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th className="vm-col-hide-md">City</th>
                  <th>Status</th>
                  <th className="vm-col-hide-md">Last Seen</th>
                  <th className="vm-col-hide-md">Joined</th>
                  <th className="vm-col-hide-sm">Orders</th>
                  <th style={{ textAlign:'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                      No users found
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="ur-ucell">
                        <Avatar name={u.name} />
                        <div>
                          <div className="ur-ucell__name">{u.name}</div>
                          <div className="ur-ucell__email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td className="td-muted vm-col-hide-md">{u.city}</td>
                    <td>
                      <span
                        style={{ cursor: u.role !== 'Vendor' ? 'pointer' : 'default' }}
                        onClick={() => handleStatusToggle(u)}
                        title={u.role !== 'Vendor' ? 'Click to toggle status' : ''}
                      >
                        <StatusBadge status={u.status} />
                      </span>
                    </td>
                    <td className="vm-col-hide-md"><span className="td-muted">{u.lastSeen}</span></td>
                    <td className="td-muted vm-col-hide-md" style={{ fontSize:'0.78rem' }}>{u.joined}</td>
                    <td className="td-bold vm-col-hide-sm">{u.orders || '—'}</td>
                    <td>
                      <div className="ur-tbl-actions">
                        <IconBtn icon={Eye}    variant="view"   title="View profile" />
                        <IconBtn icon={Edit2}  variant="edit"   title="Edit user" />
                        <IconBtn icon={Trash2} variant="delete" title="Delete user" onClick={() => setDeleteTarget(u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          <Pager page={page} total={totalElements}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="ur-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="ur-modal" onClick={e => e.stopPropagation()}>
              <div className="ur-modal-icon"><Trash2 size={24} color="#dc2626" /></div>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? This action cannot be undone.</p>
              <div className="ur-modal-actions">
                <button className="ur-btn ur-btn--outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button className="ur-btn ur-btn--danger" onClick={handleDeleteUser} disabled={deleting}>
                  {deleting ? 'Deleting...' : <><Trash2 size={13} color="#fff" /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity log */}
        <div className="ur-card">
          <div className="ur-section-head">
            <div>
              <p className="ur-section-head__title">Recent Activity</p>
              <p className="ur-section-head__sub">Admin & staff actions log</p>
            </div>
            <Btn icon={RefreshCw} sm>Refresh</Btn>
          </div>
          <div className="ur-activity">
            {activities.length === 0 ? (
              <div style={{ padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'0.82rem' }}>
                No recent activity
              </div>
            ) : activities.map((a, i) => {
              const cfg = ACTIVITY_CFG[a.severity] || ACTIVITY_DEFAULT;
              const Icon = cfg.icon;
              return (
                <div key={a.id || i} className="ur-activity-item">
                  <div className="ur-activity-icon" style={{ background: cfg.bg }}>
                    <Icon size={14} color={cfg.color} strokeWidth={2.2} />
                  </div>
                  <div className="ur-activity-body">
                    <div className="ur-activity-text">
                      <span style={{ fontWeight: 700 }}>{a.admin}</span> {a.action}{a.details ? ` — ${a.details}` : ''}
                    </div>
                    <div className="ur-activity-time">
                      <Clock size={10} style={{ display:'inline', marginRight:3, verticalAlign:'middle' }} />
                      {relTime(a.ts)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   TAB 2 — ROLES & PERMISSIONS
══════════════════════════════════════════════ */
const PERMISSION_DEFS = [
  { name:'Manage all users',  sub:'Create, edit, delete accounts' },
  { name:'Manage roles',      sub:'Define and assign role permissions' },
  { name:'Manage vendors',    sub:'Approve and suspend vendors' },
  { name:'Approve products',  sub:'Review and publish listings' },
  { name:'Manage orders',     sub:'View and update all orders' },
  { name:'Process refunds',   sub:'Approve refund requests' },
  { name:'View analytics',    sub:'Access reports and dashboards' },
  { name:'Manage payouts',    sub:'Process vendor payouts' },
  { name:'View reports',      sub:'Generate and export reports' },
  { name:'Manage tickets',    sub:'Handle support tickets' },
  { name:'Manage banners',    sub:'Edit homepage banners' },
  { name:'Publish content',   sub:'Create and schedule posts' },
];

const parsePerms = (permissions) => {
  try { return JSON.parse(permissions || '[]'); } catch { return []; }
};

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminRoles()
      .then(data => setRoles((data || []).map(r => ({
        ...r,
        perms: parsePerms(r.permissions),
        desc: r.description || '',
        bg: (r.color || '#2563eb') + '18',
        border: (r.color || '#2563eb') + '30',
        color: r.color || '#2563eb',
        users: r.users || 0,
      }))))
      .catch(e => console.error('Failed to fetch roles', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="ur-subpage"><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>Loading roles…</div></div>;
  }

  return (
    <div className="ur-subpage">
      <div className="ur-kpi-grid">
        <KpiCard label="Total Roles" value={roles.length} trend="Defined" up={null} Icon={Shield} color="#7c3aed" bg="#ede9fe" />
        <KpiCard label="Admin Staff" value="—" trend="—" up={null} Icon={ShieldCheck} color="#E03E1A" bg="#fff0ed" />
        <KpiCard label="Permissions" value={PERMISSION_DEFS.length} trend="Defined" up={null} Icon={Key} color="#2563eb" bg="#dbeafe" />
      </div>

      <div className="ur-card">
        <div className="ur-section-head">
          <div>
            <p className="ur-section-head__title">Roles</p>
            <p className="ur-section-head__sub">Platform roles and their permission sets</p>
          </div>
        </div>
        {roles.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text-3)' }}>No roles defined yet.</div>
        ) : (
        <div className="ur-roles-grid">
          {roles.map((role) => (
            <div key={role.id} className="ur-role-card" style={{ borderTopColor: role.color }}>
              <div className="ur-role-card__head">
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:role.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Shield size={18} color={role.color} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="ur-role-card__name">{role.name}</p>
                      <span className="ur-role-card__count">{role.users.toLocaleString()} users</span>
                    </div>
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-3)', margin:0, lineHeight:1.4 }}>{role.desc}</p>
                </div>
              </div>
              <hr className="ur-form-divider" style={{ margin:'14px 0' }} />
              <p className="ur-perm-label">Permissions</p>
              <div className="ur-perm-list">
                {role.perms.length === 0 ? (
                  <div style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>No permissions assigned</div>
                ) : role.perms.map((p, j) => (
                  <div key={j} className="ur-perm-item">
                    <div className="ur-perm-icon" style={{ background: role.bg }}>
                      <Check size={10} color={role.color} strokeWidth={3} />
                    </div>
                    <span className="ur-perm-text">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="ur-card">
        <div className="ur-section-head">
          <div>
            <p className="ur-section-head__title">Permission Matrix</p>
            <p className="ur-section-head__sub">Quick overview of role access levels</p>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <div style={{ minWidth: 560 }}>
            <div style={{ display:'grid', gridTemplateColumns:'200px repeat(' + Math.max(roles.length, 1) + ',1fr)', padding:'10px 16px', background:'var(--bg-input)', borderRadius:'var(--r-sm) var(--r-sm) 0 0', border:'1px solid var(--border-light)' }}>
              <span style={{ fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-3)' }}>Permission</span>
              {roles.map(r => (
                <span key={r.id} style={{ fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-3)',textAlign:'center' }}>{r.name}</span>
              ))}
            </div>
            {PERMISSION_DEFS.map((p, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'200px repeat(' + roles.length + ',1fr)',
                padding:'12px 16px',
                border:'1px solid var(--border-light)', borderTop:'none',
                borderRadius: i === PERMISSION_DEFS.length-1 ? '0 0 var(--r-sm) var(--r-sm)' : 0,
                alignItems:'center', transition:'background 0.13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div>
                  <div className="ur-matrix-perm-name">{p.name}</div>
                  <div className="ur-matrix-perm-sub">{p.sub}</div>
                </div>
                {roles.map(r => {
                  const has = r.perms.includes(p.name);
                  return (
                    <div key={r.id} style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
                      {has
                        ? <div style={{ width:22,height:22,borderRadius:6,background:'var(--green-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><Check size={12} color="var(--green)" strokeWidth={2.5} /></div>
                        : <div style={{ width:22,height:22,borderRadius:6,background:'var(--border-light)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={10} color="#cbd5e1" strokeWidth={2} /></div>
                      }
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   TAB 3 — ADD USER
══════════════════════════════════════════════ */
const PERM_OPTIONS = [
  'View Dashboard','Manage Users','Manage Vendors','Approve Products',
  'Process Refunds','View Analytics','Manage Payouts','System Settings',
  'Manage Tickets','Content & Banners','Manage Coupons','View Reports',
];

const AddUser = () => {
  const [form, setForm]       = useState({ firstName:'', lastName:'', email:'', phone:'', city:'', role:'Customer', status:'Active', password:'', bio:'' });
  const [perms, setPerms]     = useState(['View Dashboard']);
  const [pwStrength, setPwStr]= useState(0);
  const [submitted, setSubmit]= useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  useEffect(() => { getAdminRoles().then(data => setAllRoles(data || [])).catch(() => {}); }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await getAdminCustomers({ page: 0, size: 5 });
        const mapped = (data.content || []).map(u => ({
          id: u.id,
          name: u.fullName || '—',
          role: ROLE_MAP[u.roleId] || 'Customer',
          joined: formatDate(u.createdAt),
        }));
        setRecentUsers(mapped);
      } catch {
        // silently fail for sidebar
      }
    };
    fetchRecent();
  }, []);

  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcStrength = pw => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strColor  = ['#e5e7eb','#dc2626','#d97706','#16a34a','#16a34a'][pwStrength];
  const strLabel  = ['','Weak','Fair','Good','Strong'][pwStrength];
  const strWidth  = `${pwStrength * 25}%`;

  const togglePerm = p => setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSubmit = e => {
    e.preventDefault();
    setSubmit(true);
    setTimeout(() => setSubmit(false), 3000);
  };

  return (
    <div className="ur-subpage">
      <div className="ur-kpi-grid">
        <KpiCard label="Total Users"    value="—" trend="" up={null} Icon={Users}    color="#2563eb" bg="#dbeafe" />
        <KpiCard label="Admin / Staff"  value="—"    trend=""              up={null} Icon={ShieldCheck} color="#E03E1A" bg="#fff0ed" />
        <KpiCard label="Vendors"        value="—"   trend=""              up={null} Icon={Users}    color="#d97706" bg="#fef3c7" />
        <KpiCard label="Customers"      value="—" trend=""          up={null} Icon={UserPlus} color="#16a34a" bg="#dcfce7" />
      </div>

      <div className="ur-two-col" style={{ alignItems:'start' }}>
        {/* Form */}
        <div className="ur-card">
          <div className="ur-section-head">
            <div>
              <p className="ur-section-head__title">Add New User</p>
              <p className="ur-section-head__sub">Fill in the details to create a new account</p>
            </div>
          </div>

          {submitted && (
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:'var(--r-md)',background:'var(--green-bg)',border:'1px solid #bbf7d0',marginBottom:20 }}>
              <CheckCircle size={16} color="var(--green)" />
              <span style={{ fontSize:'0.84rem',fontWeight:600,color:'var(--green)' }}>User created successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar */}
            <div className="ur-form-group" style={{ marginBottom: 20 }}>
              <label className="ur-form-label">Profile Photo</label>
              <div className="ur-avatar-picker">
                <div className="ur-avatar-picker__preview" style={{ background:'linear-gradient(135deg,#ffe0d6,#ffcfbf)',color:'var(--accent)' }}>
                  {form.firstName ? form.firstName.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <div className="ur-avatar-picker__text">Click to upload photo</div>
                  <div className="ur-avatar-picker__hint">JPG, PNG or GIF · Max 2MB</div>
                </div>
              </div>
            </div>

            <p className="ur-form-section-label">Personal Information</p>
            <hr className="ur-form-divider" style={{ marginBottom:16 }} />

            <div className="ur-form-grid" style={{ marginBottom:20 }}>
              <div className="ur-form-group">
                <label className="ur-form-label">First Name <span>*</span></label>
                <input className="ur-form-input" placeholder="e.g. Arjun"
                  value={form.firstName} onChange={e => updateField('firstName', e.target.value)} />
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">Last Name <span>*</span></label>
                <input className="ur-form-input" placeholder="e.g. Mehta"
                  value={form.lastName} onChange={e => updateField('lastName', e.target.value)} />
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">Email Address <span>*</span></label>
                <input className="ur-form-input" type="email" placeholder="user@example.com"
                  value={form.email} onChange={e => updateField('email', e.target.value)} />
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">Phone Number</label>
                <input className="ur-form-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={e => updateField('phone', e.target.value)} />
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">City</label>
                <input className="ur-form-input" placeholder="e.g. Mumbai"
                  value={form.city} onChange={e => updateField('city', e.target.value)} />
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">Status</label>
                <select className="ur-form-select" value={form.status} onChange={e => updateField('status', e.target.value)}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              </div>
              <div className="ur-form-group ur-form-full">
                <label className="ur-form-label">Bio / Notes</label>
                <textarea className="ur-form-textarea" placeholder="Optional notes about this user…"
                  value={form.bio} onChange={e => updateField('bio', e.target.value)} />
              </div>
            </div>

            <p className="ur-form-section-label">Access & Security</p>
            <hr className="ur-form-divider" style={{ marginBottom:16 }} />

            <div className="ur-form-grid" style={{ marginBottom:20 }}>
              <div className="ur-form-group">
                <label className="ur-form-label">Role <span>*</span></label>
                <select className="ur-form-select" value={form.role} onChange={e => updateField('role', e.target.value)}>
                  {['Admin','Moderator','Support','Editor','Vendor','Customer'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="ur-form-group">
                <label className="ur-form-label">Password <span>*</span></label>
                <input className="ur-form-input" type="password" placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => { updateField('password', e.target.value); setPwStr(e.target.value ? calcStrength(e.target.value) : 0); }} />
                {form.password && (
                  <>
                    <div className="ur-pw-bar"><div className="ur-pw-bar__fill" style={{ width: strWidth, background: strColor }} /></div>
                    <div className="ur-pw-hint" style={{ color: strColor }}>{strLabel} password</div>
                  </>
                )}
              </div>
            </div>

            <p className="ur-form-section-label">Permissions</p>
            <hr className="ur-form-divider" style={{ marginBottom:16 }} />
            <div className="ur-perm-check-grid" style={{ marginBottom:24 }}>
              {PERM_OPTIONS.map(p => (
                <label key={p} className={`ur-perm-check-item${perms.includes(p) ? ' is-checked' : ''}`}>
                  <input type="checkbox" checked={perms.includes(p)} onChange={() => togglePerm(p)} />
                  <div className="ur-perm-check-box">
                    {perms.includes(p) && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span className="ur-perm-check-label">{p}</span>
                </label>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
              <Btn variant="ghost">Cancel</Btn>
              <Btn variant="primary" icon={UserPlus}>Create User</Btn>
            </div>
          </form>
        </div>

        {/* Right panel: role preview + recent users */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Role preview */}
          <div className="ur-card">
            <p className="ur-section-head__title" style={{ marginBottom:4 }}>Role Preview</p>
            <p className="ur-section-head__sub" style={{ marginBottom:16 }}>Permissions for selected role</p>
            {(() => {
              const raw = allRoles.find(r => r.name === form.role);
              if (!raw) return null;
              const role = {
                ...raw,
                perms: parsePerms(raw.permissions),
                desc: raw.description || '',
                color: raw.color || '#2563eb',
                bg: (raw.color || '#2563eb') + '18',
                users: raw.users || 0,
              };
              return (
                <>
                  <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:'var(--r-md)',background:role.bg,marginBottom:16,border:`1px solid ${role.color}22` }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Shield size={18} color={role.color} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize:'0.9rem',fontWeight:800,color:role.color }}>{role.name}</div>
                      <div style={{ fontSize:'0.72rem',color:'var(--text-3)',marginTop:1 }}>{role.users.toLocaleString()} users with this role</div>
                    </div>
                  </div>
                  <div className="ur-perm-list">
                    {role.perms.length === 0 ? (
                      <div style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>No permissions assigned</div>
                    ) : role.perms.map((p, j) => (
                      <div key={j} className="ur-perm-item">
                        <div className="ur-perm-icon" style={{ background: role.bg }}>
                          <Check size={10} color={role.color} strokeWidth={3} />
                        </div>
                        <span className="ur-perm-text">{p}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Recent users */}
          <div className="ur-card">
            <p className="ur-section-head__title" style={{ marginBottom:4 }}>Recently Added</p>
            <p className="ur-section-head__sub" style={{ marginBottom:16 }}>Last 5 users created</p>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {recentUsers.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', padding: '10px 0' }}>No recent users</div>
              ) : recentUsers.map((u, i) => (
                <div key={u.id || i} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 0', borderBottom: i < recentUsers.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <Avatar name={u.name} size="sm" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize:'0.69rem',color:'var(--text-3)',marginTop:1 }}>{u.role} · {u.joined}</div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
const TABS = [
  { key: 'users', label: 'All Users',           Icon: Users      },
  { key: 'roles', label: 'Roles & Permissions', Icon: ShieldCheck },
  { key: 'add',   label: 'Add User',            Icon: UserPlus   },
];

const UsersRoles = () => {
  const [active, setActive] = useState('users');

  return (
    <div className="ur">
      {/* Header */}
      <div className="ur-header">
        <div>
          <h2 className="ur-header__title">Users & Roles</h2>
          <p className="ur-header__sub">Manage user accounts, roles, permissions and access control.</p>
        </div>
        <div className="ur-header__actions">
          <Btn icon={Download} onClick={() => {
            getAdminCustomers({ page: 0, size: 10000 })
              .then(data => {
                const items = (data.content || []).map(u => [u.id, u.fullName || '—', u.email || '—', ROLE_MAP[u.roleId] || 'Customer', u.status || 'Active']);
                exportCSV([['ID','Name','Email','Role','Status'], ...items], 'all-users.csv');
                toast.success('All users exported');
              })
              .catch(err => toast.error(err?.message || 'Export failed'));
          }}>Export</Btn>
          <Btn variant="primary" icon={UserPlus} onClick={() => setActive('add')}>Add User</Btn>
        </div>
      </div>

      {/* Tab bar */}
      <div className="ur-tabbar">
        {TABS.map(t => (
          <button key={t.key} className={`ur-tab${active === t.key ? ' is-active' : ''}`} onClick={() => setActive(t.key)}>
            <t.Icon size={14} strokeWidth={active === t.key ? 2.3 : 1.9} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab */}
      {active === 'users' && <AllUsers onAddUser={() => setActive('add')} />}
      {active === 'roles' && <RolesPermissions />}
      {active === 'add'   && <AddUser />}
    </div>
  );
};

export default UsersRoles;
