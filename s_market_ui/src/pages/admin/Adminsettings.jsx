import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './Adminsettings.css';
import {
  Settings, Shield, Users, Bell, Globe, Sliders, Link,
  FileText, Wrench, Menu, X, AlertCircle,
  AlertTriangle, Check, Search, Download, RefreshCw,
  Trash2, Archive, Zap, Image, Edit2, UserPlus, Send,
  ShieldOff, CreditCard, Truck, Mail, BarChart2, Camera,
} from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings, getAuditLogs } from '../../api/api.js';
import { exportCSV } from './VendorShared';

/* ── Toggle (checkbox) ── */
const Toggle = ({ on, onChange }) => (
  <label className="as-toggle">
    <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} />
    <span className="as-toggle__knob" />
  </label>
);

/* ── Section wrapper ── */
const Section = ({ title, desc, children }) => (
  <div className="as-section">
    <div className="as-section__hdr">
      <h3 className="as-section__title">{title}</h3>
      {desc && <p className="as-section__desc">{desc}</p>}
    </div>
    <div className="as-section__body">{children}</div>
  </div>
);

/* ── Field row ── */
const Field = ({ label, hint, children, inline }) => (
  <div className={`as-field ${inline ? 'as-field--inline' : ''}`}>
    <div className="as-field__meta">
      <label className="as-field__label">{label}</label>
      {hint && <span className="as-field__hint">{hint}</span>}
    </div>
    <div className="as-field__ctrl">{children}</div>
  </div>
);

/* ── Save bar ── */
const SaveBar = ({ visible, onSave, onDiscard }) => visible ? (
  <div className="as-savebar">
    <span className="as-savebar__msg">
      <AlertCircle size={14} color="#d97706" />
      Unsaved changes
    </span>
    <div className="as-savebar__acts">
      <button className="as-btn as-btn--ghost" onClick={onDiscard}>Discard</button>
      <button className="as-btn as-btn--primary" onClick={onSave}>
        <Check size={13} color="#fff" />Save Changes
      </button>
    </div>
  </div>
) : null;

/* ── Nav config ── */
const NAV = [
  { key: 'general',       label: 'General',        Icon: Settings  },
  { key: 'security',      label: 'Security',        Icon: Shield    },
  { key: 'admins',        label: 'Admins & Roles',  Icon: Users     },
  { key: 'notifications', label: 'Notifications',   Icon: Bell      },
  { key: 'platform',      label: 'Platform',        Icon: Globe     },
  { key: 'appearance',    label: 'Appearance',      Icon: Sliders   },
  { key: 'integrations',  label: 'Integrations',    Icon: Link      },
  { key: 'audit',         label: 'Audit Logs',      Icon: FileText  },
  { key: 'maintenance',   label: 'Maintenance',     Icon: Wrench    },
  { key: 'instagram',     label: 'Instagram',       Icon: Camera    },
];

/* ── Static data ── */

const INTEGRATION_ICONS = {
  razorpay: CreditCard,  payu: CreditCard,  cashfree: CreditCard,
  shiprocket: Truck,     delhivery: Truck,
  gst: FileText,
  firebase: Bell,
  sendgrid: Mail,
  sentry: AlertCircle,
  analytics: BarChart2,
};

const MAINT_CACHE = [
  { label:'Clear Application Cache',   sub:'Clears server-side rendered page cache',         Icon: RefreshCw, danger:false },
  { label:'Clear Product Image CDN',   sub:'Forces re-fetch of all product images from CDN', Icon: Image,     danger:false },
  { label:'Rebuild Search Index',      sub:'Re-indexes all product and category data',        Icon: Search,    danger:false },
  { label:'Clear Redis Session Store', sub:'Logs out all currently active admin sessions',    Icon: Zap,       danger:true  },
];

const MAINT_DB = [
  { label:'Download Database Backup',   sub:'Exports a full gzip backup of the production DB',                   Icon: Download, danger:false },
  { label:'Purge Soft-Deleted Records', sub:'Permanently removes records marked for deletion older than 30 days', Icon: Trash2,   danger:true  },
  { label:'Archive Old Audit Logs',     sub:'Moves logs older than 90 days to cold storage',                      Icon: Archive,  danger:false },
];

const AV_COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626'];

/* ─────────────────────────────────────────────────── */
export default function AdminSettings() {
  const [active,    setActive]    = useState('general');
  const [dirty,     setDirty]     = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [general, setGeneral] = useState({
    platformName: '',
    tagline: '',
    supportEmail: '',
    supportPhone: '',
    timezone: 'UTC',
    currency: 'INR',
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    gstNumber: '',
    registeredAddress: '',
    maintenanceMode: false,
  });

  const [security, setSecurity] = useState({
    mfaMandatory: true,
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    passwordMinLength: '10',
    passwordExpiry: '90',
    ipWhitelist: '',
    adminLoginAlert: true,
    suspiciousActivityAlert: true,
    twoFactorMethod: 'totp',
    captchaEnabled: true,
    apiRateLimit: '100',
  });

  const [notif, setNotif] = useState({
    emailNewOrder: true, emailCancellation: true, emailPayoutFailed: true,
    emailKYCAlert: true, emailNewVendor: false,
    pushNewOrder: true,  pushLowStock: true,      pushGatewayDown: true,
    slackWebhook: '',    slackEnabled: false,
    digestFrequency: 'daily', digestTime: '08:00',
  });

  const [platform, setPlatform] = useState({
    vendorAutoApprove: false, productAutoApprove: false,
    maxProductsPerVendor: '500', minPayoutThreshold: '500',
    orderCancelWindow: '24',    returnWindow: '7',
    reviewModeration: true,     allowGuestCheckout: true,
    maxImagesPerProduct: '10',  searchIndexing: true, sitemapAutoGen: true,
  });

  const [appear, setAppear] = useState({
    accentColor: '#2563eb',
    logoUrl: '',
    faviconUrl: '',
    adminTheme: 'light',
    compactMode: false,        sidebarCollapsed: false,
    tableRowDensity: 'default', showBreadcrumbs: true, showKPIAnimations: true,
  });

  const [admins,       setAdmins]       = useState([]);
  const [roles,        setRoles]        = useState([]);
  const [adminModal,   setAdminModal]   = useState(false);
  const [newAdmin,     setNewAdmin]     = useState({ name:'', email:'', role:'Support Admin' });
  const [integrations, setIntegrations] = useState([]);
  const [auditFilter,  setAuditFilter]  = useState('All');
  const [auditSearch,  setAuditSearch]  = useState('');
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  const [instagram, setInstagram] = useState({
    homePageEnabled: true,
    homePageMaxPosts: 3,
    homePageTitle: 'Real-Life Looks',
    productPageEnabled: true,
    productPageLayout: 'slider',
    storyShape: 'circle',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ── Debounce audit search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAuditSearch(auditSearch);
      setAuditPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [auditSearch]);

  // ── Reset page when severity filter changes ──
  useEffect(() => {
    setAuditPage(0);
  }, [auditFilter]);

  // ── Fetch audit logs ──
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = { page: auditPage, size: 20 };
      if (debouncedAuditSearch) params.search = debouncedAuditSearch;
      if (auditFilter !== 'All') params.severity = auditFilter;
      const data = await getAuditLogs(params);
      if (data) {
        setAuditLogs(data.content || []);
        setAuditTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditFilter, debouncedAuditSearch]);

  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    getPlatformSettings()
      .then(data => {
        if (!data) return;
        if (data.general)      setGeneral(data.general);
        if (data.security)     setSecurity(data.security);
        if (data.notifications) setNotif(data.notifications);
        if (data.platform)     setPlatform(data.platform);
        if (data.appearance)   setAppear(data.appearance);
        if (data.instagram)    setInstagram(data.instagram);
        if (data.admins)       setAdmins(data.admins);
        if (data.roles)        setRoles(data.roles);
        if (data.integrations) {
          const arr = Array.isArray(data.integrations) ? data.integrations : Object.values(data.integrations);
          setIntegrations(arr.map(api => ({
            key: api.key, name: api.name || api.key, category: api.category || 'Other',
            connected: api.connected, lastSync: api.lastSync || '—',
          })));
        }
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const mark    = () => { setDirty(true); };
  const save    = () => {
    toast.promise(
      updatePlatformSettings({
        general, security, notifications: notif, platform, appearance: appear,
        instagram, admins, roles, integrations,
      }),
      {
        loading: 'Saving settings…',
        success: 'Settings saved successfully',
        error: 'Failed to save settings',
      }
    );
    setDirty(false);
  };
  const discard = () => {
    setDirty(false);
    loadSettings();
  };
  const setG    = (k,v) => { setGeneral(g  => ({...g,  [k]:v})); mark(); };
  const setSec  = (k,v) => { setSecurity(s => ({...s,  [k]:v})); mark(); };
  const setN    = (k,v) => { setNotif(n    => ({...n,  [k]:v})); mark(); };
  const setP    = (k,v) => { setPlatform(p => ({...p,  [k]:v})); mark(); };
  const setA    = (k,v) => { setAppear(a   => ({...a,  [k]:v})); mark(); };
  const setI    = (k,v) => { setInstagram(i => ({...i, [k]:v})); mark(); };

  const toggleIntegration = key => {
    setIntegrations(is => is.map(i => i.key===key ? {...i, connected:!i.connected} : i));
    mark();
  };

  const auditFiltered = auditLogs;

  const currentNav = NAV.find(n => n.key === active);

  const renderPanel = () => {
    switch (active) {

      /* ── GENERAL ── */
      case 'general': return (
        <>
          <Section title="Platform Identity" desc="Basic information about your marketplace platform.">
            <Field label="Platform Name" hint="Shown in the browser tab and emails">
              <input className="as-input" value={general.platformName} onChange={e=>setG('platformName',e.target.value)} />
            </Field>
            <Field label="Tagline" hint="Displayed on the storefront header">
              <input className="as-input" value={general.tagline} onChange={e=>setG('tagline',e.target.value)} />
            </Field>
            <Field label="Support Email">
              <input className="as-input" type="email" value={general.supportEmail} onChange={e=>setG('supportEmail',e.target.value)} />
            </Field>
            <Field label="Support Phone">
              <input className="as-input" value={general.supportPhone} onChange={e=>setG('supportPhone',e.target.value)} />
            </Field>
          </Section>

          <Section title="Localisation" desc="Regional and locale settings for the platform.">
            <div className="as-grid-2">
              <Field label="Timezone">
                <select className="as-select" value={general.timezone} onChange={e=>setG('timezone',e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>
              <Field label="Currency">
                <select className="as-select" value={general.currency} onChange={e=>setG('currency',e.target.value)}>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="AED">AED — UAE Dirham</option>
                </select>
              </Field>
              <Field label="Language">
                <select className="as-select" value={general.language} onChange={e=>setG('language',e.target.value)}>
                  <option value="en-IN">English (India)</option>
                  <option value="en-US">English (US)</option>
                  <option value="hi-IN">Hindi</option>
                </select>
              </Field>
              <Field label="Date Format">
                <select className="as-select" value={general.dateFormat} onChange={e=>setG('dateFormat',e.target.value)}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Business Details" desc="Legal and registered information for invoicing and tax.">
            <Field label="GST Registration Number" hint="Used on all tax invoices">
              <input className="as-input as-input--mono" value={general.gstNumber} onChange={e=>setG('gstNumber',e.target.value)} />
            </Field>
            <Field label="Registered Address">
              <textarea className="as-textarea" rows={2} value={general.registeredAddress} onChange={e=>setG('registeredAddress',e.target.value)} />
            </Field>
          </Section>

          <Section title="Maintenance Mode" desc="Put the entire storefront into maintenance. Admin dashboard stays accessible.">
            <Field label="Enable Maintenance Mode" hint="Visitors will see a maintenance page" inline>
              <Toggle on={general.maintenanceMode} onChange={v=>setG('maintenanceMode',v)} />
            </Field>
            {general.maintenanceMode && (
              <div className="as-alert as-alert--warn">
                <AlertTriangle size={14} color="#d97706" />
                <span>Maintenance mode is active. The storefront is currently unavailable to customers.</span>
              </div>
            )}
          </Section>
        </>
      );

      /* ── SECURITY ── */
      case 'security': return (
        <>
          <Section title="Multi-Factor Authentication" desc="Control MFA requirements for admin users.">
            <Field label="Mandatory MFA for all admins" hint="Admins without MFA set up will be locked out" inline>
              <Toggle on={security.mfaMandatory} onChange={v=>setSec('mfaMandatory',v)} />
            </Field>
            <Field label="MFA Method">
              <div className="as-radio-group">
                {[['totp','Authenticator App (TOTP)'],['sms','SMS OTP'],['email','Email OTP']].map(([val,lbl]) => (
                  <label key={val} className={`as-radio ${security.twoFactorMethod===val?'as-radio--active':''}`}>
                    <input type="radio" name="mfaMethod" value={val} checked={security.twoFactorMethod===val} onChange={()=>setSec('twoFactorMethod',val)} />
                    <span className="as-radio__dot" />{lbl}
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Session & Login" desc="Control how long admin sessions last and limit brute-force attempts.">
            <div className="as-grid-2">
              <Field label="Session Timeout" hint="Minutes of inactivity before auto-logout">
                <div className="as-input-unit">
                  <input className="as-input" type="number" value={security.sessionTimeout} onChange={e=>setSec('sessionTimeout',e.target.value)} />
                  <span className="as-unit">min</span>
                </div>
              </Field>
              <Field label="Max Login Attempts" hint="Before account is temporarily locked">
                <input className="as-input" type="number" value={security.maxLoginAttempts} onChange={e=>setSec('maxLoginAttempts',e.target.value)} />
              </Field>
              <Field label="Min Password Length">
                <div className="as-input-unit">
                  <input className="as-input" type="number" value={security.passwordMinLength} onChange={e=>setSec('passwordMinLength',e.target.value)} />
                  <span className="as-unit">chars</span>
                </div>
              </Field>
              <Field label="Password Expiry" hint="Force reset after N days (0 = never)">
                <div className="as-input-unit">
                  <input className="as-input" type="number" value={security.passwordExpiry} onChange={e=>setSec('passwordExpiry',e.target.value)} />
                  <span className="as-unit">days</span>
                </div>
              </Field>
            </div>
          </Section>

          <Section title="API & Access Control">
            <Field label="API Rate Limit" hint="Requests per minute per API key">
              <div className="as-input-unit">
                <input className="as-input" type="number" value={security.apiRateLimit} onChange={e=>setSec('apiRateLimit',e.target.value)} />
                <span className="as-unit">req/min</span>
              </div>
            </Field>
            <Field label="IP Whitelist" hint="Comma-separated IPs — leave blank to allow all">
              <input className="as-input as-input--mono" value={security.ipWhitelist} placeholder="e.g. 192.168.1.1, 10.0.0.0/8" onChange={e=>setSec('ipWhitelist',e.target.value)} />
            </Field>
            <Field label="CAPTCHA on Login" inline>
              <Toggle on={security.captchaEnabled} onChange={v=>setSec('captchaEnabled',v)} />
            </Field>
          </Section>

          <Section title="Alerts">
            <Field label="Alert on new admin login" inline>
              <Toggle on={security.adminLoginAlert} onChange={v=>setSec('adminLoginAlert',v)} />
            </Field>
            <Field label="Alert on suspicious activity" inline>
              <Toggle on={security.suspiciousActivityAlert} onChange={v=>setSec('suspiciousActivityAlert',v)} />
            </Field>
          </Section>
        </>
      );

      /* ── ADMINS & ROLES ── */
      case 'admins': return (
        <>
          <Section title="Admin Users" desc="Manage who has access to the admin dashboard and at what permission level.">
            <div className="as-table-wrap">
              <table className="as-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Role</th><th>Last Login</th><th>MFA</th><th>Status</th>
                    <th className="as-th-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="as-user-cell">
                          <div className="as-av" style={{background: AV_COLORS[a.id % AV_COLORS.length]}}>
                            {a.name.split(' ').map(w=>w[0]).join('')}
                          </div>
                          <div>
                            <div className="as-user-name">{a.name}</div>
                            <div className="as-user-email">{a.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="as-role-badge" style={{
                          background: roles.find(r=>r.name===a.role)?.bg||'#f1f5f9',
                          color: roles.find(r=>r.name===a.role)?.color||'#475569',
                        }}>{a.role}</span>
                      </td>
                      <td className="as-td-muted">{a.lastLogin}</td>
                      <td>
                        {a.mfa
                          ? <span className="as-chip as-chip--green"><Shield size={11} color="#16a34a" />Enabled</span>
                          : <span className="as-chip as-chip--red"><ShieldOff size={11} color="#dc2626" />Disabled</span>
                        }
                      </td>
                      <td>
                        <span className={`as-status-dot as-status-dot--${a.status}`}>
                          {a.status[0].toUpperCase()+a.status.slice(1)}
                        </span>
                      </td>
                      <td className="as-td-right">
                        <div className="as-row-acts">
                          <button className="as-ib as-ib--edit" onClick={() => toast.success(`Edit ${a.name}`)}><Edit2 size={13} /></button>
                          {a.role !== 'Super Admin' && (
                            <button className="as-ib as-ib--del" onClick={()=>{ setAdmins(ads=>ads.filter(x=>x.id!==a.id)); mark(); }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="as-btn as-btn--outline as-btn--mt" onClick={()=>setAdminModal(true)}>
              <UserPlus size={13} color="#475569" />Invite Admin
            </button>
          </Section>

          <Section title="Roles & Permissions" desc="Define what each role can access across the platform.">
            <div className="as-roles-grid">
              {roles.map(role => (
                <div key={role.name} className="as-role-card">
                  <div className="as-role-card__hdr">
                    <span className="as-role-badge" style={{background:role.bg,color:role.color}}>{role.name}</span>
                    <button className="as-ib as-ib--edit" onClick={() => toast.success(`Edit ${role.name} permissions`)}><Edit2 size={12} /></button>
                  </div>
                  <p className="as-role-card__desc">{role.desc}</p>
                  <div className="as-perm-list">
                    {['dashboard','orders','vendors','products','finance','customers','catalogue','settings','audit','deliveries','reports'].map(perm => (
                      <span key={perm} className={`as-perm ${role.perms.includes(perm)?'as-perm--on':'as-perm--off'}`}>
                        {role.perms.includes(perm) && <Check size={9} color={role.color} />}
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {adminModal && (
            <div className="as-overlay" onClick={()=>setAdminModal(false)}>
              <div className="as-modal" onClick={e=>e.stopPropagation()}>
                <div className="as-modal__hdr">
                  <div>
                    <p className="as-modal__title">Invite Admin</p>
                    <p className="as-modal__sub">They will receive an email to set up their account</p>
                  </div>
                  <button className="as-ib" onClick={()=>setAdminModal(false)}><X size={14} /></button>
                </div>
                <div className="as-modal__body">
                  <Field label="Full Name">
                    <input className="as-input" value={newAdmin.name} onChange={e=>setNewAdmin(a=>({...a,name:e.target.value}))} placeholder="e.g. Rahul Verma" />
                  </Field>
                  <Field label="Email Address">
                    <input className="as-input" type="email" value={newAdmin.email} onChange={e=>setNewAdmin(a=>({...a,email:e.target.value}))} placeholder="rahul@platform.in" />
                  </Field>
                  <Field label="Assign Role">
                    <select className="as-select" value={newAdmin.role} onChange={e=>setNewAdmin(a=>({...a,role:e.target.value}))}>
                      {roles.map(r=><option key={r.name}>{r.name}</option>)}
                    </select>
                  </Field>
                  <div className="as-modal__acts">
                    <button className="as-btn as-btn--ghost" onClick={()=>setAdminModal(false)}>Cancel</button>
                    <button className="as-btn as-btn--primary" onClick={()=>{
                      setAdmins(ads=>[...ads,{id:Date.now(),...newAdmin,status:'active',lastLogin:'—',mfa:false}]);
                      setAdminModal(false);
                      setNewAdmin({name:'',email:'',role:'Support Admin'});
                      mark();
                    }}>
                      <Send size={13} color="#fff" />Send Invite
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );

      /* ── NOTIFICATIONS ── */
      case 'notifications': return (
        <>
          <Section title="Email Notifications" desc="Control which events trigger email alerts to admins.">
            {[
              ['emailNewOrder',     'New order placed'],
              ['emailCancellation', 'Order cancellation request'],
              ['emailPayoutFailed', 'Payout transaction failed'],
              ['emailKYCAlert',     'KYC document submitted'],
              ['emailNewVendor',    'New vendor application received'],
            ].map(([key,label]) => (
              <Field key={key} label={label} inline>
                <Toggle on={notif[key]} onChange={v=>setN(key,v)} />
              </Field>
            ))}
          </Section>

          <Section title="Push Notifications" desc="In-app and browser push notifications for the admin panel.">
            {[
              ['pushNewOrder',    'New high-value order (above ₹10,000)'],
              ['pushLowStock',    'Product stock falls below threshold'],
              ['pushGatewayDown', 'Payment gateway connectivity issue'],
            ].map(([key,label]) => (
              <Field key={key} label={label} inline>
                <Toggle on={notif[key]} onChange={v=>setN(key,v)} />
              </Field>
            ))}
          </Section>

          <Section title="Slack Integration" desc="Send admin alerts to a Slack channel via webhook.">
            <Field label="Enable Slack Alerts" inline>
              <Toggle on={notif.slackEnabled} onChange={v=>setN('slackEnabled',v)} />
            </Field>
            <Field label="Slack Webhook URL" hint="Paste your incoming webhook URL from Slack App settings">
              <input className="as-input as-input--mono" value={notif.slackWebhook}
                placeholder="https://hooks.slack.com/services/..."
                onChange={e=>setN('slackWebhook',e.target.value)} disabled={!notif.slackEnabled} />
            </Field>
          </Section>

          <Section title="Digest Reports" desc="Schedule a summary report to be emailed to admins.">
            <div className="as-grid-2">
              <Field label="Frequency">
                <select className="as-select" value={notif.digestFrequency} onChange={e=>setN('digestFrequency',e.target.value)}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option><option value="off">Off</option>
                </select>
              </Field>
              <Field label="Send Time">
                <input className="as-input" type="time" value={notif.digestTime} onChange={e=>setN('digestTime',e.target.value)} />
              </Field>
            </div>
          </Section>
        </>
      );

      /* ── PLATFORM ── */
      case 'platform': return (
        <>
          <Section title="Vendor Controls" desc="Approval, onboarding and listing limits for vendors.">
            <Field label="Auto-approve new vendors" hint="Skip manual review — not recommended" inline>
              <Toggle on={platform.vendorAutoApprove} onChange={v=>setP('vendorAutoApprove',v)} />
            </Field>
            <Field label="Auto-approve product listings" hint="Products go live without admin review" inline>
              <Toggle on={platform.productAutoApprove} onChange={v=>setP('productAutoApprove',v)} />
            </Field>
            <Field label="Max products per vendor">
              <div className="as-input-unit">
                <input className="as-input" type="number" value={platform.maxProductsPerVendor} onChange={e=>setP('maxProductsPerVendor',e.target.value)} />
                <span className="as-unit">items</span>
              </div>
            </Field>
            <Field label="Max images per product">
              <div className="as-input-unit">
                <input className="as-input" type="number" value={platform.maxImagesPerProduct} onChange={e=>setP('maxImagesPerProduct',e.target.value)} />
                <span className="as-unit">images</span>
              </div>
            </Field>
            <Field label="Minimum payout threshold" hint="Vendors must accumulate this amount before payout is triggered">
              <div className="as-input-unit">
                <span className="as-prefix">₹</span>
                <input className="as-input as-input--prefixed" type="number" value={platform.minPayoutThreshold} onChange={e=>setP('minPayoutThreshold',e.target.value)} />
              </div>
            </Field>
          </Section>

          <Section title="Order & Returns Policy" desc="Configure windows and limits for order operations.">
            <div className="as-grid-2">
              <Field label="Order cancel window" hint="Hours after placement">
                <div className="as-input-unit">
                  <input className="as-input" type="number" value={platform.orderCancelWindow} onChange={e=>setP('orderCancelWindow',e.target.value)} />
                  <span className="as-unit">hrs</span>
                </div>
              </Field>
              <Field label="Return window" hint="Days after delivery">
                <div className="as-input-unit">
                  <input className="as-input" type="number" value={platform.returnWindow} onChange={e=>setP('returnWindow',e.target.value)} />
                  <span className="as-unit">days</span>
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Storefront Features">
            <Field label="Guest checkout (no login required)" inline>
              <Toggle on={platform.allowGuestCheckout} onChange={v=>setP('allowGuestCheckout',v)} />
            </Field>
            <Field label="Product review moderation" hint="Reviews need admin approval before going live" inline>
              <Toggle on={platform.reviewModeration} onChange={v=>setP('reviewModeration',v)} />
            </Field>
            <Field label="Search indexing" hint="Keep product catalogue indexed for fast search" inline>
              <Toggle on={platform.searchIndexing} onChange={v=>setP('searchIndexing',v)} />
            </Field>
            <Field label="Auto-generate sitemap" hint="Regenerate sitemap.xml on product/category changes" inline>
              <Toggle on={platform.sitemapAutoGen} onChange={v=>setP('sitemapAutoGen',v)} />
            </Field>
          </Section>
        </>
      );

      /* ── APPEARANCE ── */
      case 'appearance': return (
        <>
          <Section title="Branding" desc="Visual identity assets for the admin dashboard.">
            <Field label="Admin Logo URL" hint="SVG or PNG, displayed in the sidebar">
              <input className="as-input" value={appear.logoUrl} onChange={e=>setA('logoUrl',e.target.value)} />
            </Field>
            <Field label="Favicon URL">
              <input className="as-input" value={appear.faviconUrl} onChange={e=>setA('faviconUrl',e.target.value)} />
            </Field>
            <Field label="Accent Colour" hint="Used for buttons, active states and highlights">
              <div className="as-color-row">
                <input type="color" className="as-color-picker" value={appear.accentColor} onChange={e=>setA('accentColor',e.target.value)} />
                <input className="as-input as-input--mono as-input--sm" value={appear.accentColor} onChange={e=>setA('accentColor',e.target.value)} />
              </div>
            </Field>
          </Section>

          <Section title="Dashboard Theme">
            <Field label="Admin Theme">
              <div className="as-theme-cards">
                {[['light','Light'],['dark','Dark'],['system','System']].map(([val,lbl]) => (
                  <button key={val} className={`as-theme-card ${appear.adminTheme===val?'as-theme-card--active':''}`} onClick={()=>setA('adminTheme',val)}>
                    <div className={`as-theme-card__preview as-theme-card__preview--${val}`} />
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Layout & Density" desc="Control how information is displayed in tables and panels.">
            <Field label="Compact Mode" hint="Reduce spacing for more data on screen" inline>
              <Toggle on={appear.compactMode} onChange={v=>setA('compactMode',v)} />
            </Field>
            <Field label="Sidebar collapsed by default" inline>
              <Toggle on={appear.sidebarCollapsed} onChange={v=>setA('sidebarCollapsed',v)} />
            </Field>
            <Field label="Show breadcrumb navigation" inline>
              <Toggle on={appear.showBreadcrumbs} onChange={v=>setA('showBreadcrumbs',v)} />
            </Field>
            <Field label="KPI card animations" inline>
              <Toggle on={appear.showKPIAnimations} onChange={v=>setA('showKPIAnimations',v)} />
            </Field>
            <Field label="Table Row Density">
              <div className="as-radio-group">
                {[['compact','Compact'],['default','Default'],['comfortable','Comfortable']].map(([val,lbl]) => (
                  <label key={val} className={`as-radio ${appear.tableRowDensity===val?'as-radio--active':''}`}>
                    <input type="radio" name="density" value={val} checked={appear.tableRowDensity===val} onChange={()=>setA('tableRowDensity',val)} />
                    <span className="as-radio__dot" />{lbl}
                  </label>
                ))}
              </div>
            </Field>
          </Section>
        </>
      );

      /* ── INTEGRATIONS ── */
      case 'integrations': return (
        <>
          {['Payments','Logistics','Tax','Push','Email','Monitoring','Analytics'].map(cat => {
            const items = integrations.filter(i=>i.category===cat);
            if (!items.length) return null;
            return (
              <Section key={cat} title={cat} desc={`${cat} service integrations`}>
                <div className="as-intg-list">
                  {items.map(intg => {
                    const IntgIcon = INTEGRATION_ICONS[intg.key] || Settings;
                    return (
                      <div key={intg.key} className="as-intg-item">
                        <div className="as-intg-icon"><IntgIcon size={18} color="#475569" /></div>
                        <div className="as-intg-info">
                          <div className="as-intg-name">{intg.name}</div>
                          <div className="as-intg-meta">{intg.connected ? `Last sync: ${intg.lastSync}` : 'Not connected'}</div>
                        </div>
                        <div className="as-intg-right">
                          <span className={`as-chip ${intg.connected?'as-chip--green':'as-chip--grey'}`}>
                            {intg.connected ? 'Connected' : 'Disconnected'}
                          </span>
                          <button className={`as-btn as-btn--sm ${intg.connected?'as-btn--ghost':'as-btn--outline'}`} onClick={()=>toggleIntegration(intg.key)}>
                            {intg.connected ? 'Disconnect' : 'Connect'}
                          </button>
                          {intg.connected && (
                            <button className="as-btn as-btn--sm as-btn--ghost" onClick={() => toast.success(`Configure ${intg.name}`)}>
                              <Settings size={12} color="#64748b" />Configure
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            );
          })}
        </>
      );

      /* ── AUDIT LOGS ── */
      case 'audit': return (
        <>
          <Section title="Audit Trail" desc="Every admin action is logged here. Logs are immutable and retained for 90 days.">
            <div className="as-audit-toolbar">
              <div className="as-search">
                <span className="as-search__icon"><Search size={14} color="#94a3b8" /></span>
                <input className="as-input as-input--search" placeholder="Search action or admin…"
                  value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} />
              </div>
              <div className="as-pills">
                {['All','low','medium','high'].map(f => (
                  <button key={f} className={`as-pill ${auditFilter===f?'as-pill--active':''}`} onClick={()=>setAuditFilter(f)}>
                    {f==='All'?'All':f[0].toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
              <button className="as-btn as-btn--outline as-btn--sm" onClick={() => exportCSV([['Log ID','Admin','Action','Module','IP','Timestamp','Severity'],...auditFiltered.map(l=>[l.id,l.admin,l.action,l.module,l.ip,l.ts,l.severity])],'settings.csv')}>
                <Download size={12} color="#475569" />Export
              </button>
            </div>
            <div className="as-table-wrap">
              {auditLoading ? (
                <div className="as-loading" style={{padding:'40px 0',textAlign:'center',color:'#94a3b8'}}>Loading audit logs…</div>
              ) : auditFiltered.length > 0 ? (
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Log ID</th><th>Admin</th><th>Action</th><th>Module</th>
                      <th>IP</th><th>Timestamp</th><th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditFiltered.map(l => (
                      <tr key={l.id}>
                        <td className="as-td-mono">{l.id}</td>
                        <td className="as-td-bold">{l.admin}</td>
                        <td className="as-td-action">{l.action}</td>
                        <td><span className="as-module-badge">{l.module}</span></td>
                        <td className="as-td-mono">{l.ip}</td>
                        <td className="as-td-muted">{l.ts}</td>
                        <td>
                          <span className={`as-severity as-severity--${l.severity}`}>
                            <span className="as-severity__dot" />{l.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="as-empty-state">
                  <FileText size={32} color="#94a3b8" />
                  <p className="as-empty-title">No audit logs yet</p>
                  <p className="as-empty-desc">Admin actions will appear here once the backend audit system is connected.</p>
                </div>
              )}
            </div>
            {auditTotalPages > 1 && (
              <div className="as-pagination" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'12px',marginTop:'16px'}}>
                <button className="as-btn as-btn--sm as-btn--outline" disabled={auditPage === 0}
                  onClick={() => setAuditPage(p => Math.max(0, p - 1))}>
                  Previous
                </button>
                <span style={{fontSize:'.82rem',color:'#64748b'}}>
                  Page {auditPage + 1} of {auditTotalPages}
                </span>
                <button className="as-btn as-btn--sm as-btn--outline" disabled={auditPage >= auditTotalPages - 1}
                  onClick={() => setAuditPage(p => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </Section>
        </>
      );

      /* ── INSTAGRAM ── */
      case 'instagram': return (
        <>
          <Section title="Home Page Feed" desc="Controls for the 'Real-Life Looks' Instagram story section on the storefront home page.">
            <Field label="Enable home page feed" inline>
              <Toggle on={instagram.homePageEnabled} onChange={v => setI('homePageEnabled', v)} />
            </Field>
            <Field label="Section title" hint="Heading displayed above the feed">
              <input className="as-input" value={instagram.homePageTitle} onChange={e => setI('homePageTitle', e.target.value)} />
            </Field>
            <Field label="Maximum posts" hint="Number of story circles to show (1–3)">
              <div className="as-radio-group">
                {[1, 2, 3].map(n => (
                  <label key={n} className={`as-radio ${instagram.homePageMaxPosts === n ? 'as-radio--active' : ''}`}>
                    <input type="radio" name="homePageMaxPosts" value={n} checked={instagram.homePageMaxPosts === n} onChange={() => setI('homePageMaxPosts', n)} />
                    <span className="as-radio__dot" />{n}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Story shape" hint="Circle for Instagram-like stories, Square for product thumbnails">
              <div className="as-radio-group">
                {[['circle', 'Circle'], ['square', 'Rounded Square']].map(([val, lbl]) => (
                  <label key={val} className={`as-radio ${instagram.storyShape === val ? 'as-radio--active' : ''}`}>
                    <input type="radio" name="storyShape" value={val} checked={instagram.storyShape === val} onChange={() => setI('storyShape', val)} />
                    <span className="as-radio__dot" />{lbl}
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Product Page Feed" desc="Controls for the Instagram/UGC feed appearing on individual product pages.">
            <Field label="Enable product page feed" inline>
              <Toggle on={instagram.productPageEnabled} onChange={v => setI('productPageEnabled', v)} />
            </Field>
            <Field label="Default layout">
              <div className="as-radio-group">
                {[['slider', 'Slider'], ['grid', 'Grid']].map(([val, lbl]) => (
                  <label key={val} className={`as-radio ${instagram.productPageLayout === val ? 'as-radio--active' : ''}`}>
                    <input type="radio" name="productPageLayout" value={val} checked={instagram.productPageLayout === val} onChange={() => setI('productPageLayout', val)} />
                    <span className="as-radio__dot" />{lbl}
                  </label>
                ))}
              </div>
            </Field>
          </Section>
        </>
      );

      /* ── MAINTENANCE ── */
      case 'maintenance': return (
        <>
          <Section title="Cache Management" desc="Clear application and CDN caches. Use with caution during peak hours.">
            <div className="as-maint-actions">
              {MAINT_CACHE.map((a,i) => {
                const MIcon = a.Icon;
                return (
                  <div key={i} className="as-maint-row">
                    <div className="as-maint-icon" style={{background:a.danger?'#fee2e2':'#f1f5f9'}}>
                      <MIcon size={16} color={a.danger?'#dc2626':'#475569'} />
                    </div>
                    <div className="as-maint-info">
                      <div className="as-maint-label">{a.label}</div>
                      <div className="as-maint-sub">{a.sub}</div>
                    </div>
                    <button className={`as-btn as-btn--sm ${a.danger?'as-btn--danger':'as-btn--outline'}`}
                      onClick={() => toast.success(`${a.label} — action triggered`)}>
                      {a.danger && <AlertTriangle size={12} color="#fff" />}
                      {a.label.split(' ')[0]}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Database" desc="Administrative database operations. These actions are irreversible.">
            <div className="as-alert as-alert--danger">
              <AlertTriangle size={14} color="#dc2626" />
              <span>Database operations below are destructive and cannot be undone. Always take a backup before proceeding.</span>
            </div>
            <div className="as-maint-actions" style={{marginTop:14}}>
              {MAINT_DB.map((a,i) => {
                const MIcon = a.Icon;
                return (
                  <div key={i} className="as-maint-row">
                    <div className="as-maint-icon" style={{background:a.danger?'#fee2e2':'#f1f5f9'}}>
                      <MIcon size={16} color={a.danger?'#dc2626':'#475569'} />
                    </div>
                    <div className="as-maint-info">
                      <div className="as-maint-label">{a.label}</div>
                      <div className="as-maint-sub">{a.sub}</div>
                    </div>
                    <button className={`as-btn as-btn--sm ${a.danger?'as-btn--danger':'as-btn--outline'}`}
                      onClick={() => toast.success(`${a.label} — action triggered`)}>
                      {a.label.split(' ')[0]}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="System Information" desc="Current platform version and environment details.">
            <div className="as-empty-state">
              <BarChart2 size={32} color="#94a3b8" />
              <p className="as-empty-title">System info not available</p>
              <p className="as-empty-desc">Platform version, environment and deployment details will appear here once the backend system endpoint is connected.</p>
            </div>
          </Section>
        </>
      );

      default: return null;
    }
  };

  /* ── Root ── */
  return (
    <div className="as-root">
      <button className="as-mobile-nav-btn" onClick={()=>setMobileNav(v=>!v)}>
        {mobileNav ? <X size={18} color="#0f172a" /> : <Menu size={18} color="#0f172a" />}
        <span>{currentNav?.label}</span>
      </button>

      <div className="as-layout">
        <aside className={`as-sidebar ${mobileNav?'as-sidebar--open':''}`}>
          <div className="as-sidebar__inner">
            <div className="as-sidebar__top">
              <div className="as-sidebar__brand">
                <div className="as-brand-icon"><Settings size={16} color="#fff" /></div>
                <span className="as-brand-lbl">Admin Settings</span>
              </div>
            </div>
            <nav className="as-nav">
              {NAV.map(item => {
                const NavIcon = item.Icon;
                return (
                  <button key={item.key}
                    className={`as-nav__item ${active===item.key?'as-nav__item--active':''}`}
                    onClick={()=>{ setActive(item.key); setMobileNav(false); }}>
                    <span className="as-nav__icon">
                      <NavIcon size={16} color={active===item.key?'#E03E1A':'#64748b'} />
                    </span>
                    <span className="as-nav__lbl">{item.label}</span>
                    {active===item.key && <span className="as-nav__pip" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="as-main">
          <div className="as-page-hdr">
            <div>
              <h1 className="as-page-title">{currentNav?.label}</h1>
              <p className="as-page-sub">
                {active==='general'       && 'Configure platform identity, localisation and business details'}
                {active==='security'      && 'Manage authentication, session policies and access control'}
                {active==='admins'        && 'Add, remove and permission admin users and roles'}
                {active==='notifications' && 'Configure email, push and Slack alerts for admin events'}
                {active==='platform'      && 'Set platform-wide rules for vendors, orders and the storefront'}
                {active==='appearance'    && 'Customise the look and feel of the admin dashboard'}
                {active==='integrations'  && 'Connect payment gateways, logistics, tax and third-party services'}
                {active==='audit'         && 'Immutable log of every admin action taken on the platform'}
                {active==='maintenance'   && 'Cache management, database tools and system diagnostics'}
                {active==='instagram'     && 'Configure Instagram/UGC feed settings for home page and product pages'}
              </p>
            </div>
          </div>

          <div className="as-panels">
            {settingsLoading ? (
              <div className="as-loading">Loading settings…</div>
            ) : (
              renderPanel()
            )}
          </div>
          <SaveBar visible={dirty} onSave={save} onDiscard={discard} />
        </main>
      </div>
    </div>
  );
}