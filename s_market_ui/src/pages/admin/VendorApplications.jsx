import React, { useState, useEffect, useCallback } from 'react';
import './VendorApplications.css';
import { Icon, initials, avatarBg, exportCSV } from './VendorShared';
import { getVendors, updateVendorStatus, getVendorKyc } from '../../api/api';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'Pending', 'Reviewing', 'Active', 'Rejected'];
const PER      = 6;
const scoreCls = (s) => s >= 85 ? 'vm-score--great' : s >= 70 ? 'vm-score--good' : s >= 50 ? 'vm-score--avg' : 'vm-score--poor';
const docColor = (d) => d >= 5 ? '#16a34a' : d >= 3 ? '#d97706' : '#dc2626';

const formatDate = (epochMs) => {
  if (!epochMs) return 'N/A';
  return new Date(epochMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calcDocs = (v) => {
  let count = 0;
  if (v.pan && v.pan !== 'Not Started') count++;
  if (v.gst && v.gst !== 'Not Started') count++;
  if (v.stores && v.stores.length > 0) count++;
  if (v.paymentMethod) count++;
  if (v.paymentEmail || v.beneficiaryName) count++;
  return Math.min(count, 5);
};

const calcScore = (v) => {
  const docs = calcDocs(v);
  // Base score from docs (50%) + status-based (50%)
  const docsScore = (docs / 5) * 50;
  const statusScore = v.status === 'Active' ? 50 : v.status === 'Reviewing' ? 25 : 10;
  return Math.round(docsScore + statusScore);
};

const mapVendorToApp = (v, kycRecord) => {
  const store = v.stores?.[0] || {};
  const bankParts = (kycRecord?.bank || '').split('||');
  const rawPayMethod = bankParts[1] || '';
  const payMethod = rawPayMethod.toLowerCase() === 'bank transfer' ? 'bank' : rawPayMethod.toLowerCase() === 'upi' ? 'upi' : rawPayMethod.toLowerCase() === 'paypal' ? 'paypal' : rawPayMethod || v.paymentMethod || '';
  return {
    id: v.id,
    name: v.name || v.fullName || 'Unknown',
    cat: store.storeName || 'N/A',
    owner: v.name || v.fullName || 'Unknown',
    city: store.city || store.address?.split(',')[0]?.trim() || 'N/A',
    email: v.email || 'N/A',
    phone: v.phone || 'N/A',
    applied: formatDate(v.createdAt),
    status: v.status || 'Pending',
    docs: calcDocs(v),
    score: calcScore(v),
    gst: v.gst || '',
    pan: v.pan || '',
    // Account Details
    fullName: v.name || v.fullName || '—',
    emailAddress: v.email || '—',
    phoneNumber: v.phone || '—',
    // Store Details (keys match @JsonProperty annotations in Store.java)
    storeName: store.storeName || '—',
    storeDesc: store.storeDescription || '—',
    storePhone: store.storePhone || '—',
    storeEmail: store.storeEmail || '—',
    storeAddress: store.address || '—',
    storeCity: store.city || '—',
    storeState: store.state || '—',
    storeCountry: store.country || '—',
    storePincode: store.pincode || '—',
    storeLatitude: store.latitude ?? '—',
    storeLongitude: store.longitude ?? '—',
    // KYC
    aadhaar: kycRecord?.aadhaar || 'Not submitted',
    // Payment
    paymentMethod: payMethod || 'Not set',
    bankStatus: bankParts[0] || '—',
    payDetail1: bankParts[2] || '',
    payDetail2: bankParts[3] || '',
    payDetail3: bankParts[4] || '',
    payDetail4: bankParts[5] || '',
    payDetail5: bankParts[6] || '',
  };
};

const ApplicationDetailModal = ({ app, onClose, onApprove, onReject }) => {
  React.useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow=''; };
  }, [onClose]);

  const Row = ({ label, value }) => (
    <tr>
      <td style={{padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontSize:'.78rem', fontWeight:700, color:'#64748b', whiteSpace:'nowrap', width:'38%'}}>{label}</td>
      <td style={{padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontSize:'.84rem', color:'#0f172a', fontWeight:600}}>{value || '—'}</td>
    </tr>
  );

  const Section = ({ title, rows }) => (
    <>
      <tr><td colSpan={2} style={{padding:'10px 12px 4px', fontSize:'.72rem', fontWeight:800, color:'#4338ca', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #e2e8f0'}}>{title}</td></tr>
      {rows.map((r, i) => <Row key={i} label={r.label} value={r.value}/>)}
    </>
  );

  const payLabel = app.paymentMethod === 'bank' ? 'Bank Transfer' : app.paymentMethod === 'upi' ? 'UPI' : app.paymentMethod === 'paypal' ? 'PayPal' : app.paymentMethod;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'rgb(255,255,255)', borderRadius:'20px', width:'100%', maxWidth:640, boxShadow:'rgba(0,0,0,0.22) 0px 24px 60px', overflow:'hidden', overflowY:'auto', maxHeight:'100vh' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize:'1rem', fontWeight:800, margin:'0 0 2px' }}>Application Details</h3>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{app.name} — {app.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div style={{ padding:16 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              <Section title="Account Details" rows={[
                {label:'Full Name', value:app.fullName},
                {label:'Phone Number', value:app.phoneNumber},
                {label:'Email Address', value:app.emailAddress},
              ]}/>
              <Section title="Store Info" rows={[
                {label:'Store Name', value:app.storeName},
                {label:'Description', value:app.storeDesc},
                {label:'Phone', value:app.storePhone},
                {label:'Email', value:app.storeEmail},
                {label:'Address', value:app.storeAddress},
                {label:'City', value:app.storeCity},
                {label:'State', value:app.storeState},
                {label:'Country', value:app.storeCountry},
                {label:'Pincode', value:app.storePincode},
                {label:'Latitude', value:app.storeLatitude},
                {label:'Longitude', value:app.storeLongitude},
              ]}/>
              <Section title="KYC Documents" rows={[
                {label:'PAN Card', value:app.pan},
                {label:'GST Number', value:app.gst},
                {label:'Aadhaar Card', value:app.aadhaar},
              ]}/>
              <Section title="Payment Details" rows={[
                {label:'Method', value:payLabel},
                ...(app.paymentMethod === 'bank' ? [
                  {label:'Account Type', value:app.payDetail3},
                  {label:'Beneficiary', value:app.payDetail1},
                  {label:'Account', value:app.payDetail2 ? 'XXXX'+app.payDetail2.slice(-4) : '—'},
                  {label:'IFSC', value:app.payDetail4},
                  {label:'Remittance Email', value:app.payDetail5},
                ] : []),
                ...(app.paymentMethod === 'upi' ? [
                  {label:'UPI ID', value:app.payDetail1},
                  {label:'Bank Name', value:app.payDetail2},
                  {label:'PAN (TDS)', value:app.payDetail3},
                  {label:'Remittance Email', value:app.payDetail4},
                ] : []),
                ...(app.paymentMethod === 'paypal' ? [
                  {label:'PayPal Email', value:app.payDetail1},
                  {label:'Legal Name', value:app.payDetail2},
                  {label:'PAN (Compliance)', value:app.payDetail3},
                  {label:'Purpose Code', value:app.payDetail4},
                ] : []),
              ]}/>
            </tbody>
          </table>
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Close</button>
          {(app.status === 'Pending' || app.status === 'Reviewing') && (
            <>
              <button onClick={() => { onApprove(app.id); onClose(); }} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Approve
              </button>
              <button onClick={() => { onReject(app.id); onClose(); }} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function VendorApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const [viewModal, setViewModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', cat: 'Grocery' });
  const [totalElements, setTotalElements] = useState(0);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorData, kycData] = await Promise.all([
        getVendors(search, 0, 200, 'createdAt', 'desc'),
        getVendorKyc().catch(() => []),
      ]);
      // Build KYC map: vendorId -> kyc record
      const kycArr = Array.isArray(kycData) ? kycData : (kycData?.content || []);
      const kycMap = {};
      kycArr.forEach(k => { kycMap[k.vendorId] = k; });
      const allVendors = (vendorData?.content || []).map(v => mapVendorToApp(v, kycMap[v.id]));
      // Filter to only show Pending or Reviewing vendors as applications
      const applications = allVendors.filter(
        (v) => v.status === 'Pending' || v.status === 'Reviewing'
      );
      setApps(applications);
      setTotalElements(applications.length);
    } catch (err) {
      toast.error('Failed to load vendor applications');
      console.error('Error fetching vendor applications:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const list  = apps.filter(a =>
    (filter === 'All' || a.status === filter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || String(a.id).includes(search))
  );
  const pages = Math.ceil(list.length / PER) || 1;
  const slice = list.slice(page * PER, (page + 1) * PER);

  const handleApprove = async (vendorId) => {
    try {
      await updateVendorStatus(vendorId, 'Active');
      toast.success('Vendor approved successfully');
      setApps(prev => prev.filter(x => x.id !== vendorId));
      setSel(null);
    } catch (err) {
      toast.error('Failed to approve vendor');
      console.error('Error approving vendor:', err);
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await updateVendorStatus(vendorId, 'Rejected');
      toast.success('Vendor rejected');
      setApps(prev => prev.filter(x => x.id !== vendorId));
      setSel(null);
    } catch (err) {
      toast.error('Failed to reject vendor');
      console.error('Error rejecting vendor:', err);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    const newApp = {
      id: `VAP-${Date.now()}`,
      name: inviteForm.name,
      cat: inviteForm.cat,
      owner: inviteForm.name,
      city: 'Pending',
      email: inviteForm.email,
      phone: 'Pending',
      applied: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending',
      docs: 0,
      score: 0,
      gst: '',
      pan: '',
      fullName: inviteForm.name,
      emailAddress: inviteForm.email,
      phoneNumber: 'Pending',
      storeName: '—',
      storeDesc: '—',
      storePhone: '—',
      storeEmail: '—',
      storeAddress: '—',
      storeCity: '—',
      storeState: '—',
      storeCountry: '—',
      storePincode: '—',
      storeLatitude: '—',
      storeLongitude: '—',
      aadhaar: 'Not submitted',
      paymentMethod: 'Not set',
      bankStatus: '—',
      payDetail1: '',
      payDetail2: '',
      payDetail3: '',
      payDetail4: '',
      payDetail5: '',
    };
    setApps([newApp, ...apps]);
    setShowInvite(false);
    setInviteForm({ name: '', email: '', cat: 'Grocery' });
  };

  return (
    <div className="vm">
      {viewModal && <ApplicationDetailModal app={viewModal} onClose={() => setViewModal(null)} onApprove={handleApprove} onReject={handleReject}/>}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Vendor Applications</h2>
          <p className="vm-hdr__sub">Review, approve or reject new vendor registration requests</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV([['ID','Name','Category','Owner','City','Email','Phone','Applied','Status'],...apps.map(a=>[a.id,a.name,a.cat,a.owner,a.city,a.email,a.phone,a.applied,a.status])],'vendor-applications.csv')}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary" onClick={() => setShowInvite(true)}>
            <Icon name="Plus" size={13} color="#fff"/>Invite Vendor
          </button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total Applications',  value: totalElements.toString(), trend:'+46', up:true,  icon:'Store',       c:'#2563eb', bg:'#dbeafe'},
          {label:'Pending Review',      value: apps.filter(a => a.status === 'Pending').length.toString(),    trend:'+9',  up:false, icon:'Clock',       c:'#d97706', bg:'#fef3c7'},
          {label:'Reviewing',           value: apps.filter(a => a.status === 'Reviewing').length.toString(),  trend:'+7',  up:true,  icon:'CheckCircle', c:'#16a34a', bg:'#dcfce7'},
          {label:'Rejected',            value: apps.filter(a => a.status === 'Rejected').length.toString(),   trend:'+3',  up:false, icon:'X',           c:'#dc2626', bg:'#fee2e2'},
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background: k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
              <span className={`vm-kpi__trend vm-kpi__trend--${k.up ? 'up' : 'dn'}`}>{k.up ? '↑' : '↓'} {k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">All Applications</p>
            <p className="vm-sh__sub">Click a row to expand application details</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search vendor, ID…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); setSel(null); }}/>
            </div>
            <div className="vm-pills">
              {STATUSES.map(s => (
                <button key={s} className={`vm-pill${filter === s ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(s); setPage(0); setSel(null); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Loading applications...</div>
          ) : (
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>City</th>
                <th>Applied</th>
                <th>Docs</th>
                <th>Score</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No applications found</td></tr>
              ) : slice.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{background: avatarBg(a.name)}}>{initials(a.name)}</div>
                        <div>
                          <div className="vm-vcell__name">{a.name}</div>
                          <div className="vm-vcell__sub">{a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vm-mu">{a.cat}</td>
                    <td className="vm-mu">
                      <div style={{display:'flex', alignItems:'center', gap:4}}>
                        <Icon name="MapPin" size={11} color="#94a3b8"/>{a.city}
                      </div>
                    </td>
                    <td className="vm-mu">{a.applied}</td>
                    <td>
                      <span style={{display:'flex', alignItems:'center', gap:5, fontSize:'.8rem', fontWeight:600, color: docColor(a.docs)}}>
                        <Icon name="FileText" size={12} color={docColor(a.docs)}/>{a.docs}/5
                      </span>
                    </td>
                    <td><span className={`vm-score ${scoreCls(a.score)}`}>{a.score}</span></td>
                    <td>
                      <span className={`vm-badge vm-badge--${a.status.toLowerCase()}`}>
                        <span className="vm-badge__dot"/>{a.status}
                      </span>
                    </td>
                    <td className="vm-td-r">
                      <div className="vm-acts">
                        {(a.status === 'Pending' || a.status === 'Reviewing') && (
                          <>
                            <button className="vm-btn vm-btn--success vm-btn--sm" onClick={() => handleApprove(a.id)}>
                              <Icon name="Check" size={12} color="#16a34a"/>Approve
                            </button>
                            <button className="vm-btn vm-btn--danger vm-btn--sm" onClick={() => handleReject(a.id)}>
                              <Icon name="X" size={12} color="#dc2626"/>Reject
                            </button>
                          </>
                        )}
                        <button className="vm-ib vm-ib--view" onClick={() => setViewModal(a)}><Icon name="Eye" size={13}/></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{list.length === 0 ? '0 results' : `${page * PER + 1}–${Math.min((page + 1) * PER, list.length)} of ${list.length}`}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER >= list.length}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>

      <div className="vm-2col">
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Applications by Category</p>
          <p className="vm-sh__sub" style={{marginBottom:16}}>Top categories in pending queue</p>
          <div className="vm-stat-list">
            {[
              {l:'Electronics', pct:32, c:'#2563eb'},
              {l:'Apparel',     pct:24, c:'#db2777'},
              {l:'Grocery',     pct:18, c:'#16a34a'},
              {l:'Home Decor',  pct:14, c:'#d97706'},
              {l:'Others',      pct:12, c:'#64748b'},
            ].map((s, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{s.l}</span>
                  <span className="vm-sbar__val">{s.pct}%</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${s.pct}%`, background: s.c}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Approval Rate Trend</p>
          <p className="vm-sh__sub" style={{marginBottom:16}}>Monthly approval outcomes</p>
          <div className="vm-stat-list">
            {[
              {l:'Approved', val:28, pct:67, c:'#16a34a'},
              {l:'Pending',  val:42, pct:24, c:'#d97706'},
              {l:'Rejected', val:14, pct:9,  c:'#dc2626'},
            ].map((s, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{s.l}</span>
                  <span className="vm-sbar__val">{s.val} ({s.pct}%)</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${s.pct}%`, background: s.c}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showInvite && (
        <div className="vm-modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="vm-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <h3 className="vm-modal__title">Invite New Vendor</h3>
              <button className="vm-ib" onClick={() => setShowInvite(false)}>
                <Icon name="X" size={16}/>
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="vm-modal__body">
                <div className="vm-field">
                  <label className="vm-field__lbl">Vendor Name</label>
                  <input className="vm-field__input" required placeholder="e.g. Fresh Mart"
                    value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})}/>
                </div>
                <div className="vm-field">
                  <label className="vm-field__lbl">Email Address</label>
                  <input className="vm-field__input" type="email" required placeholder="vendor@example.com"
                    value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})}/>
                </div>
                <div className="vm-field">
                  <label className="vm-field__lbl">Category</label>
                  <select className="vm-field__input" value={inviteForm.cat} onChange={e => setInviteForm({...inviteForm, cat: e.target.value})}>
                    <option>Grocery</option>
                    <option>Electronics</option>
                    <option>Apparel</option>
                    <option>Home Decor</option>
                    <option>Toys</option>
                  </select>
                </div>
              </div>
              <div className="vm-modal__ftr">
                <button type="button" className="vm-btn vm-btn--outline" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="vm-btn vm-btn--primary">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
