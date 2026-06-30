import React, { useState, useEffect } from 'react';
import './RolesPermissions.css';
import {
  Shield, ShieldCheck, Key, Users, Check, X, Plus, Download,
  Edit2, Search, ChevronDown, ChevronUp, Copy, Trash2,
  AlertCircle, CheckCircle, MoreVertical,
  UserCog, Package, DollarSign, FileText, Headphones, ShoppingCart,
} from 'lucide-react';
import { getAdminRoles, createAdminRole, updateAdminRole, deleteAdminRole } from '../../api/api';
import { exportCSV } from './VendorShared';

const PERM_GROUPS = [
  { group:'User Management',   icon: UserCog,      items:['Manage all users','Manage roles','Manage vendors'] },
  { group:'Products & Orders', icon: Package,      items:['Approve products','Manage orders','Process refunds'] },
  { group:'Finance',           icon: DollarSign,   items:['View analytics','Manage payouts','View reports'] },
  { group:'Content',           icon: FileText,     items:['Content moderation','Manage banners','Publish content'] },
  { group:'Support',           icon: Headphones,   items:['Manage tickets','View customers','Edit categories'] },
  { group:'Store Access',      icon: ShoppingCart, items:['Browse products','Place orders','Manage profile'] },
];

const ALL_FLAT_PERMS = PERM_GROUPS.flatMap(g => g.items);

const PRESET_COLORS = [
  '#E03E1A','#2563eb','#7c3aed','#16a34a','#d97706','#4f46e5','#be185d','#0891b2',
];

const MATRIX_ROWS = [
  { name:'Manage all users',  sub:'Create, edit, delete accounts' },
  { name:'Manage roles',      sub:'Define and assign role permissions' },
  { name:'Manage vendors',    sub:'Approve and suspend vendors' },
  { name:'Approve products',  sub:'Review and publish listings' },
  { name:'Manage orders',     sub:'View and update all orders' },
  { name:'Process refunds',   sub:'Approve refund requests' },
  { name:'View analytics',    sub:'Access reports and dashboards' },
  { name:'Manage payouts',    sub:'Process vendor payouts' },
  { name:'View reports',      sub:'Generate and export reports' },
  { name:'Content moderation',sub:'Review content and reviews' },
  { name:'Manage banners',    sub:'Edit homepage banners' },
  { name:'Publish content',   sub:'Create and schedule posts' },
  { name:'Manage tickets',    sub:'Handle support tickets' },
  { name:'View customers',    sub:'Access customer profiles' },
  { name:'Edit categories',   sub:'Manage product categories' },
  { name:'Browse products',   sub:'View product catalog' },
  { name:'Place orders',      sub:'Create new orders' },
  { name:'Manage profile',    sub:'Edit personal profile' },
];

const STAFF_COLS = ['Admin','Moderator','Support','Editor','Vendor'];

function deriveUI(role) {
  const c = role.color || '#2563eb';
  return {
    ...role,
    perms: (() => { try { return JSON.parse(role.permissions || '[]'); } catch { return []; } })(),
    desc: role.description || '',
    color: c,
    bg: c + '18',
    border: c + '30',
    users: role.users || 0,
  };
}

function RoleModal({ role, onClose, onSaved }) {
  const isEdit = Boolean(role);
  const [step,  setStep]  = useState(1);
  const [name,  setName]  = useState(role?.name  ?? '');
  const [desc,  setDesc]  = useState(role?.desc  ?? '');
  const [color, setColor] = useState(role?.color ?? '#2563eb');
  const [perms, setPerms] = useState(role?.perms ? [...role.perms] : []);
  const [saving, setSaving] = useState(false);
  const [done,  setDone]  = useState(false);

  const allOn     = ALL_FLAT_PERMS.every(p => perms.includes(p));
  const someOn    = !allOn && ALL_FLAT_PERMS.some(p => perms.includes(p));
  const allToggle = () => setPerms(allOn ? [] : [...ALL_FLAT_PERMS]);

  const togglePerm = p =>
    setPerms(pr => pr.includes(p) ? pr.filter(x => x !== p) : [...pr, p]);

  const toggleGroup = items => {
    const on = items.every(p => perms.includes(p));
    setPerms(pr => on ? pr.filter(p => !items.includes(p)) : [...new Set([...pr, ...items])]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { name, description: desc, permissions: JSON.stringify(perms), color };
      if (isEdit) {
        await updateAdminRole(role.id, data);
      } else {
        await createAdminRole(data);
      }
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); onSaved(); }, 1200);
    } catch (e) {
      console.error('Save role failed', e);
      setSaving(false);
    }
  };

  const canAdvance = name.trim().length > 0;

  return (
    <div className="crpm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="crpm">
        <div className="crpm__header">
          <div className="crpm__header-icon" style={{ background: color + '20' }}>
            <Shield size={20} color={color} strokeWidth={2} />
          </div>
          <div className="crpm__header-text">
            <div className="crpm__title">{isEdit ? 'Edit Role' : 'Create New Role'}</div>
            <div className="crpm__sub">
              {isEdit
                ? <span className="crpm__role-tag" style={{ background: role.bg, color: role.color }}>{role.name}</span>
                : `Step ${step} of 2 — ${step === 1 ? 'Role details' : 'Permissions'}`
              }
            </div>
          </div>
          <button className="crpm__close" onClick={onClose}><X size={15} /></button>
        </div>

        {!isEdit && (
          <div className="crpm__steps">
            <div className="crpm__steps-track" />
            {['Details','Permissions'].map((label, i) => (
              <button key={i}
                className={`crpm__step${step === i+1 ? ' active' : step > i+1 ? ' done' : ''}`}
                onClick={() => (isEdit || i+1 < step) && setStep(i+1)}>
                <div className="crpm__step-dot">
                  {step > i+1 ? <Check size={9} color="#fff" strokeWidth={3} /> : i+1}
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {done && (
          <div className="crpm__success">
            <CheckCircle size={15} color="#16a34a" />
            <span>{isEdit ? 'Changes saved!' : `Role "${name}" created!`}</span>
          </div>
        )}

        <div className="crpm__body">
          {(step === 1 && !isEdit) ? (
            <div className="crpm__details">
              <div className="crpm__field">
                <label className="crpm__label">Role Name <span>*</span></label>
                <input className="crpm__input" placeholder="e.g. Finance Manager"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="crpm__field">
                <label className="crpm__label">Description</label>
                <textarea className="crpm__textarea" placeholder="What can this role do?"
                  value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="crpm__field">
                <label className="crpm__label">Badge Color</label>
                <div className="crpm__colors">
                  {PRESET_COLORS.map(c => (
                    <button key={c} className={`crpm__color-dot${color === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => setColor(c)}>
                      {color === c && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                {name && (
                  <div className="crpm__preview">
                    <span className="crpm__preview-badge"
                      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                      <Shield size={11} color={color} strokeWidth={2} />{name}
                    </span>
                    <span className="crpm__preview-hint">Preview</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="crpm__perms">
              <label className="crpm__select-all">
                <div className="crpm__cb"
                  style={allOn ? { background: color, borderColor: color } : someOn ? { borderColor: color } : {}}
                  onClick={allToggle}>
                  {allOn && <Check size={10} color="#fff" strokeWidth={3} />}
                  {someOn && !allOn && <div className="crpm__cb-dash" style={{ background: color }} />}
                </div>
                <span className="crpm__select-all-label">Select all permissions</span>
                <span className="crpm__select-all-count">{perms.length} / {ALL_FLAT_PERMS.length}</span>
              </label>

              <div className="crpm__groups">
                {PERM_GROUPS.map(({ group, icon, items }) => {
                  const GroupIcon = icon;
                  const groupOn   = items.every(p => perms.includes(p));
                  const groupSome = !groupOn && items.some(p => perms.includes(p));
                  const active    = items.filter(p => perms.includes(p)).length;
                  return (
                    <div key={group} className="crpm__group">
                      <label className="crpm__group-header">
                        <div className="crpm__cb"
                          style={groupOn ? { background: color, borderColor: color }
                            : groupSome ? { borderColor: color } : {}}
                          onClick={() => toggleGroup(items)}>
                          {groupOn && <Check size={10} color="#fff" strokeWidth={3} />}
                          {groupSome && !groupOn && <div className="crpm__cb-dash" style={{ background: color }} />}
                        </div>
                        <span className="crpm__group-icon">
                          <GroupIcon size={15} strokeWidth={2} />
                        </span>
                        <span className="crpm__group-name">{group}</span>
                        <span className="crpm__group-count"
                          style={active > 0 ? { background: color + '18', color } : {}}>
                          {active}/{items.length}
                        </span>
                      </label>
                      <div className="crpm__group-items">
                        {items.map(p => (
                          <label key={p} className={`crpm__item${perms.includes(p) ? ' on' : ''}`}
                            onClick={() => togglePerm(p)}>
                            <div className="crpm__cb"
                              style={perms.includes(p) ? { background: color, borderColor: color } : {}}>
                              {perms.includes(p) && <Check size={9} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={perms.includes(p) ? { color, fontWeight: 700 } : {}}>{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="crpm__footer">
          <button className="crp-btn crp-btn--ghost"
            onClick={step === 1 || isEdit ? onClose : () => setStep(1)}>
            {step === 1 || isEdit ? 'Cancel' : '← Back'}
          </button>
          {(!isEdit && step === 1) ? (
            <button className="crp-btn crp-btn--primary"
              disabled={!canAdvance} onClick={() => setStep(2)}>
              Next: Permissions →
            </button>
          ) : (
            <button className="crp-btn crp-btn--primary" onClick={handleSave} disabled={saving}>
              <CheckCircle size={13} />
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateRolePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole,   setEditRole]   = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(null);
  const [search,     setSearch]     = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await getAdminRoles();
      setRoles((data || []).map(deriveUI));
    } catch (e) {
      console.error('Failed to fetch roles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  useEffect(() => {
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const totalUsers = roles.reduce((s, r) => s + r.users, 0);
  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role? This action is irreversible.')) return;
    try {
      await deleteAdminRole(id);
      setRoles(pr => pr.filter(r => r.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <div className="crp">

      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'40px 0', color:'#6b7280' }}>
          Loading roles…
        </div>
      )}

      {!loading && (
        <>
          <div className="crp-header">
            <div>
              <h1 className="crp-header__title">Roles & Permissions</h1>
              <p className="crp-header__sub">Define platform roles, permission sets, and access control policies</p>
            </div>
            <div className="crp-header__actions">
              <button className="crp-btn crp-btn--outline" onClick={() => exportCSV([['Role Name','Description','Users','Permissions'],...roles.map(r=>[r.name,r.desc,r.users,r.perms.join('; ')])],'roles.csv')}>
                <Download size={14} />Export
              </button>
              <button className="crp-btn crp-btn--primary" onClick={() => setShowCreate(true)}>
                <Plus size={14} />Create Role
              </button>
            </div>
          </div>

          <div className="crp-kpis">
            {[
              { label:'Total Roles',   value: roles.length,                icon: Shield,      color:'#7c3aed', bg:'#ede9fe', tag:'Platform roles'  },
              { label:'Total Users',   value: totalUsers.toLocaleString(), icon: Users,       color:'#2563eb', bg:'#dbeafe', tag:'All role types'   },
              { label:'Staff Members', value:'31',                         icon: ShieldCheck, color:'#E03E1A', bg:'#fff0ed', tag:'+2 this month'    },
              { label:'Permissions',   value: ALL_FLAT_PERMS.length,       icon: Key,         color:'#16a34a', bg:'#dcfce7', tag:'Tracked actions'  },
            ].map((k, i) => (
              <div key={i} className="crp-kpi">
                <div className="crp-kpi__top">
                  <div className="crp-kpi__icon" style={{ background: k.bg }}>
                    <k.icon size={18} color={k.color} strokeWidth={2.1} />
                  </div>
                  <span className="crp-kpi__tag">{k.tag}</span>
                </div>
                <div className="crp-kpi__value">{k.value}</div>
                <div className="crp-kpi__label">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="crp-card">
            <div className="crp-card-head">
              <div>
                <p className="crp-card-head__title">All Roles</p>
                <p className="crp-card-head__sub">{roles.length} roles · {totalUsers.toLocaleString()} total users</p>
              </div>
              <div className="crp-card-head__right">
                <div className="crp-search">
                  <Search size={14} className="crp-search__icon" />
                  <input className="crp-search__input" placeholder="Search roles…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="crp-btn crp-btn--primary crp-btn--sm"
                  onClick={() => setShowCreate(true)}>
                  <Plus size={13} />New Role
                </button>
              </div>
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                {search ? 'No roles match your search' : 'No roles created yet. Create your first role to get started.'}
              </div>
            )}

            <div className="crp-roles-grid">
              {filtered.map((role, i) => {
                const isOpen = expanded === i;
                const isMenu = menuOpen === i;
                const pct    = Math.min(96, Math.max(4, Math.round((role.users / (totalUsers || 1)) * 100 * 7)));

                return (
                  <div key={role.id} className="crp-rc"
                    style={{ '--rc': role.color, '--rcbg': role.bg, '--rcb': role.border }}>

                    <div className="crp-rc__strip" />

                    <div className="crp-rc__top">
                      <div className="crp-rc__icon-wrap">
                        <Shield size={17} color={role.color} strokeWidth={2.1} />
                      </div>
                      <div className="crp-rc__title-block">
                        <div className="crp-rc__name">{role.name}</div>
                        <div className="crp-rc__user-count">
                          <Shield size={10} strokeWidth={2.2} />{role.users.toLocaleString()} users
                        </div>
                      </div>

                      <div className="crp-rc__kebab-wrap" onClick={e => e.stopPropagation()}>
                        <button className="crp-rc__kebab"
                          onClick={() => setMenuOpen(isMenu ? null : i)}>
                          <MoreVertical size={15} />
                        </button>
                        {isMenu && (
                          <div className="crp-rc__menu">
                            <button className="crp-rc__mi"
                              onClick={() => { setEditRole(role); setMenuOpen(null); }}>
                              <Edit2 size={13} />Edit permissions
                            </button>
                            <button className="crp-rc__mi">
                              <Copy size={13} />Duplicate role
                            </button>
                            {role.name !== 'Admin' && <>
                              <div className="crp-rc__mi-sep" />
                              <button className="crp-rc__mi crp-rc__mi--danger"
                                onClick={() => handleDelete(role.id)}>
                                <Trash2 size={13} />Delete role
                              </button>
                            </>}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="crp-rc__desc">{role.desc}</p>

                    <div className="crp-rc__share">
                      <span className="crp-rc__share-label">User share</span>
                      <span className="crp-rc__share-pct">
                        {totalUsers > 0 ? Math.round((role.users/totalUsers)*100) + '%' : '—'}
                      </span>
                    </div>
                    <div className="crp-rc__bar">
                      <div className="crp-rc__bar-fill" style={{ width:`${pct}%` }} />
                    </div>

                    <div className="crp-rc__sep" />

                    <button className="crp-rc__perm-hd"
                      onClick={() => setExpanded(isOpen ? null : i)}>
                      <span className="crp-rc__perm-hd-left">
                        <span className="crp-rc__perm-label">Permissions</span>
                        <span className="crp-rc__perm-badge">{role.perms.length}</span>
                      </span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <div className={`crp-rc__perm-list${isOpen ? ' open' : ''}`}>
                      {role.perms.map((p, j) => (
                        <div key={j} className="crp-rc__perm-row">
                          <div className="crp-rc__perm-tick">
                            <Check size={9} color={role.color} strokeWidth={3} />
                          </div>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>

                    {!isOpen && role.perms.length > 3 && (
                      <button className="crp-rc__more" style={{ color: role.color }}
                        onClick={() => setExpanded(i)}>
                        +{role.perms.length - 3} more permissions
                      </button>
                    )}

                    <button className="crp-rc__edit-cta" onClick={() => setEditRole(role)}>
                      <Edit2 size={12} />Edit permissions
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="crp-card">
            <div className="crp-card-head">
              <div>
                <p className="crp-card-head__title">Permission Matrix</p>
                <p className="crp-card-head__sub">Full access overview across all roles</p>
              </div>
              <button className="crp-btn crp-btn--outline crp-btn--sm" onClick={() => { const hd = ['Permission','Description',...roles.map(r=>r.name)]; const bd = MATRIX_ROWS.map(mr => [mr.name, mr.sub, ...roles.map(r => r.perms.includes(mr.name) ? 'Yes' : '')]); exportCSV([hd, ...bd], 'permissions.csv'); }}>
                <Download size={13} />Export
              </button>
            </div>

            {roles.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                No roles to display in matrix.
              </div>
            )}

            {roles.length > 0 && (
              <div className="crp-matrix-scroll">
                <table className="crp-matrix">
                  <thead>
                    <tr>
                      <th className="crp-matrix__th crp-matrix__th--label">Permission</th>
                      {roles.map(r => (
                        <th key={r.id} className="crp-matrix__th crp-matrix__th--role">
                          <div className="crp-matrix__role-cell">
                            <div className="crp-matrix__role-ico" style={{ background: r.bg }}>
                              <Shield size={12} color={r.color} strokeWidth={2} />
                            </div>
                            <span style={{ color: r.color }}>{r.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX_ROWS.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'crp-matrix__tr--alt' : ''}>
                        <td className="crp-matrix__td crp-matrix__td--label">
                          <div className="crp-matrix__perm-name">{row.name}</div>
                          <div className="crp-matrix__perm-sub">{row.sub}</div>
                        </td>
                        {roles.map(r => {
                          const has = r.perms.includes(row.name);
                          return (
                            <td key={r.id} className="crp-matrix__td crp-matrix__td--cell">
                              {has
                                ? <div className="crp-matrix__tick on" style={{ background: r.bg }}>
                                    <Check size={11} color={r.color} strokeWidth={2.8} />
                                  </div>
                                : <div className="crp-matrix__tick off">
                                    <X size={9} color="#cbd5e1" strokeWidth={2} />
                                  </div>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="crp-card crp-danger">
            <div className="crp-danger__header">
              <div className="crp-danger__icon"><AlertCircle size={17} color="#dc2626" strokeWidth={2} /></div>
              <div>
                <div className="crp-danger__title">Danger Zone</div>
                <div className="crp-danger__sub">These actions are irreversible — proceed with caution</div>
              </div>
            </div>
            <div className="crp-danger__list">
              {[
                { label:'Reset All Permissions', desc:'Revert every role to factory default permission sets',    btn:'Reset',       cls:'crp-btn--danger'  },
                { label:'Export Role Config',    desc:'Download the complete permissions configuration as JSON', btn:'Export JSON', cls:'crp-btn--outline' },
                { label:'Delete Custom Roles',   desc:'Permanently remove all non-system roles from platform',   btn:'Delete All',  cls:'crp-btn--danger'  },
              ].map((a, i) => (
                <div key={i} className="crp-danger__row">
                  <div>
                    <div className="crp-danger__row-title">{a.label}</div>
                    <div className="crp-danger__row-desc">{a.desc}</div>
                  </div>
                  <button className={`crp-btn crp-btn--sm ${a.cls}`} onClick={i === 1 ? () => { const cfg = { roles: roles.map(r => ({ name: r.name, description: r.desc, permissions: r.perms, color: r.color })) }; const b = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const el = document.createElement('a'); el.href = u; el.download = 'role-config.json'; el.click(); URL.revokeObjectURL(u); } : undefined}>{a.btn}</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCreate && <RoleModal onClose={() => setShowCreate(false)} onSaved={fetchRoles} />}
      {editRole   && <RoleModal role={editRole} onClose={() => setEditRole(null)} onSaved={fetchRoles} />}
    </div>
  );
}
