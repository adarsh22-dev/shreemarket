import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAdminCustomers, updateCustomerStatus, getLoyaltyCustomers, createLoyaltyCustomer, getRefunds, createRefund, deleteRefund } from '../../api/api';
import './AdminCustomermanagement.css';

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const avatarBg = n => PALETTE[n.charCodeAt(0) % PALETTE.length];
const initials = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const fmt      = n => 'Rs.' + Number(n).toLocaleString('en-IN');

/* ── Icons ── */
const I = ({ d, size=14, color='currentColor', sw=2, fill='none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const P = {
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  rotCcw:   'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  trash:    ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  mail:     ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  phone:    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.27a16 16 0 0 0 6 6l.85-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  mappin:   'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  gift:     ['M20 12v10H4V12','M22 7H2v5h20V7z','M12 22V7','M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z','M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  zap:      'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  info:     ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M12 16v-4','M12 8h.01'],
  plus:     'M12 5v14M5 12h14',
};

const PER_PAGE = 8;

/* ── Shared sub-components ── */
const Av = ({ name, size='sm' }) => (
  <div className={`cm-av cm-av--${size}`} style={{ background: avatarBg(name) }}>
    {initials(name)}
  </div>
);

const TierBdg = ({ tier }) => {
  const map = { Platinum:'plat', Gold:'gold', Silver:'silv', Bronze:'brnz' };
  return <span className={`cm-tier cm-tier--${map[tier]||'brnz'}`}>{tier}</span>;
};

const StatusBdg = ({ status }) => {
  const map = { Active:'act', Inactive:'inact', Blocked:'blck' };
  return <span className={`cm-bdg cm-bdg--${map[status]||'inact'}`}><span className="cm-bdg__dot"/>{status}</span>;
};

const RefundBdg = ({ status }) => {
  const map = { Refunded:'ref', Processing:'proc', Approved:'app', Rejected:'rej' };
  return <span className={`cm-bdg cm-bdg--${map[status]||'proc'}`}><span className="cm-bdg__dot"/>{status}</span>;
};

const Chk = ({ checked, onChange }) => (
  <input type="checkbox" className="cm-chk" checked={checked} onChange={onChange}/>
);

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total / PER_PAGE) || 1;
  return (
    <div className="cm-pag">
      <span className="cm-pag__info">
        {total === 0 ? '0 results' : `${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,total)} of ${total}`}
      </span>
      <div className="cm-pag__ctrl">
        <button className="cm-pag__btn" onClick={onPrev} disabled={page===0}><I d={P.chevL} size={13} color="#475569"/></button>
        <span className="cm-pag__label">{page+1} / {pages}</span>
        <button className="cm-pag__btn" onClick={onNext} disabled={(page+1)*PER_PAGE>=total}><I d={P.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="cm-search">
    <span className="cm-search__ico"><I d={P.search} size={14} color="#94a3b8"/></span>
    <input className="cm-search__inp" placeholder={placeholder} value={value} onChange={onChange}/>
  </div>
);

/* ── Generic Modal shell ── */
const Modal = ({ title, sub, onClose, children, footer }) => (
  <div className="cm-overlay" onClick={onClose}>
    <div className="cm-modal" onClick={e=>e.stopPropagation()}>
      <div className="cm-modal__hdr">
        <div>
          <p className="cm-modal__title">{title}</p>
          {sub && <p className="cm-modal__sub">{sub}</p>}
        </div>
        <button className="cm-act cm-act--view" style={{flexShrink:0}} onClick={onClose}>
          <I d={P.x} size={14}/>
        </button>
      </div>
      <div className="cm-modal__body">{children}</div>
      {footer && <div className="cm-modal__footer">{footer}</div>}
    </div>
  </div>
);

/* ── Form field helpers ── */
const Field = ({ label, children, span2 }) => (
  <div className={`cm-field${span2?' cm-field--span2':''}`}>
    <label className="cm-label">{label}</label>
    {children}
  </div>
);
const Inp = (props) => <input className="cm-inp" {...props}/>;
const Sel = ({ value, onChange, options }) => (
  <select className="cm-inp cm-sel" value={value} onChange={onChange}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/* ── Toast ── */
const Toast = ({ msg, type }) => (
  <div className={`cm-toast cm-toast--${type}`}>
    <I d={type==='success'?P.check:type==='error'?P.x:P.info} size={14}
      color={type==='success'?'#16a34a':type==='error'?'#dc2626':'#2563eb'}/>
    {msg}
  </div>
);

/* ── Export CSV helper ── */
const exportCSV = (rows, filename) => {
  const csv  = rows.map(r => r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
};

/* ================================================================
   TAB 1 — ALL CUSTOMERS
   ================================================================ */
const formatDate = (epoch) => {
  if (!epoch) return '—';
  const d = new Date(epoch);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapCustomer = (c) => ({
  id: c.id,
  name: c.fullName || '—',
  email: c.email || '—',
  phone: c.phone || '—',
  status: c.status || 'Active',
  joined: formatDate(c.createdAt),
  rawData: c,
});

const AllCustomers = ({ showToast }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [checked, setChecked]     = useState({});
  const [page, setPage]           = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [viewModal,   setViewModal]   = useState(null);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [statusUpdating, setStatusUpdating] = useState(false);

  const STATUS_OPTS = ['All','Active','Inactive','Blocked'];

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PER_PAGE,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
      if (search.trim()) params.search = search.trim();
      if (filter !== 'All') params.status = filter;

      const data = await getAdminCustomers(params);
      const mapped = (data.content || []).map(mapCustomer);
      setCustomers(mapped);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search: reset page when search/filter changes
  useEffect(() => {
    setPage(0);
  }, [search, filter]);

  const slice   = customers;
  const allC    = slice.length>0 && slice.every(c=>checked[c.id]);
  const toggleAll = () => {
    if(allC) setChecked(p=>{const n={...p};slice.forEach(c=>delete n[c.id]);return n;});
    else     setChecked(p=>{const n={...p};slice.forEach(c=>n[c.id]=true);return n;});
  };

  const openEdit = c => { setEditModal(c); setEditForm({...c}); };
  const saveEdit = async () => {
    if (editForm.status !== editModal.status) {
      setStatusUpdating(true);
      try {
        await updateCustomerStatus(editModal.id, editForm.status);
        toast.success(`${editForm.name} status updated to ${editForm.status}`);
        setEditModal(null);
        fetchCustomers();
      } catch (err) {
        console.error('Failed to update customer status:', err);
        toast.error(err.message || 'Failed to update customer');
      } finally {
        setStatusUpdating(false);
      }
    } else {
      showToast(`${editForm.name} updated`,'success');
      setEditModal(null);
    }
  };
  const confirmDelete = () => {
    setCustomers(prev=>prev.filter(c=>c.id!==deleteModal.id));
    showToast(`${deleteModal.name} removed from view`,'error');
    setDeleteModal(null);
  };
  const handleStatusToggle = async (c) => {
    const newStatus = c.status === 'Blocked' ? 'Active' : 'Blocked';
    setStatusUpdating(true);
    try {
      await updateCustomerStatus(c.id, newStatus);
      toast.success(`${c.name} ${newStatus === 'Blocked' ? 'blocked' : 'activated'} successfully`);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.message || 'Failed to update customer status');
    } finally {
      setStatusUpdating(false);
    }
  };
  const handleExport = () => {
    exportCSV([
      ['ID','Name','Email','Phone','Joined','Status'],
      ...customers.map(c=>[c.id,c.name,c.email,c.phone,c.joined,c.status])
    ],'customers.csv');
    showToast('Customers CSV downloaded','success');
  };

  return (
    <div className="cm-sub">
      <div className="cm-card">
        <div className="cm-sh">
          <div>
            <p className="cm-sh__t">All Customers</p>
            <p className="cm-sh__s">{totalElements} customer{totalElements!==1?'s':''} found</p>
          </div>
          <div className="cm-sh__r">
            <SearchBar value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email…"/>
            <div className="cm-pills">
              {STATUS_OPTS.map(s=>(
                <button key={s} className={`cm-pill${filter===s?' cm-pill--on':''}`}
                  onClick={()=>setFilter(s)}>{s}</button>
              ))}
            </div>
            <button className="cm-btn cm-btn--out" onClick={handleExport}>
              <I d={P.download} size={13} color="#475569"/>Export
            </button>
          </div>
        </div>

        <div className="cm-tw">
          <table className="cm-tbl">
            <thead>
              <tr>
                <th className="cm-th cm-th--chk"><Chk checked={allC} onChange={toggleAll}/></th>
                <th className="cm-th">Customer</th>
                <th className="cm-th cm-hm">Contact</th>
                <th className="cm-th cm-hm">Joined</th>
                <th className="cm-th">Status</th>
                <th className="cm-th cm-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="cm-empty">Loading customers...</td></tr>}
              {!loading && slice.length===0 && <tr><td colSpan="6" className="cm-empty">No customers match your search.</td></tr>}
              {!loading && slice.map(c=>(
                <tr key={c.id} className={`cm-tr${checked[c.id]?' cm-tr--sel':''}`}>
                  <td className="cm-td cm-td--chk"><Chk checked={!!checked[c.id]} onChange={()=>setChecked(p=>({...p,[c.id]:!p[c.id]}))}/></td>
                  <td className="cm-td">
                    <div className="cm-cust"><Av name={c.name}/><div><div className="cm-cust__n">{c.name}</div><div className="cm-cust__id">#{c.id}</div></div></div>
                  </td>
                  <td className="cm-td cm-hm">
                    <div className="cm-contact">
                      <span><I d={P.mail} size={11} color="#94a3b8"/>{c.email}</span>
                      <span><I d={P.phone} size={11} color="#94a3b8"/>{c.phone}</span>
                    </div>
                  </td>
                  <td className="cm-td cm-hm"><span className="cm-date">{c.joined}</span></td>
                  <td className="cm-td"><StatusBdg status={c.status}/></td>
                  <td className="cm-td cm-td--r">
                    <div className="cm-acts">
                      <button className="cm-act cm-act--view" title="View" onClick={()=>setViewModal(c)}><I d={P.eye} size={13}/></button>
                      <button className="cm-act cm-act--edit" title="Edit" onClick={()=>openEdit(c)}><I d={P.edit} size={13}/></button>
                      <button
                        className={`cm-act ${c.status==='Blocked'?'cm-act--approve':'cm-act--trash'}`}
                        title={c.status==='Blocked'?'Activate':'Block'}
                        disabled={statusUpdating}
                        onClick={()=>handleStatusToggle(c)}>
                        <I d={c.status==='Blocked'?P.check:P.x} size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={totalElements} onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

      {/* View Modal */}
      {viewModal && (
        <Modal title="Customer Details" sub={`#${viewModal.id}`} onClose={()=>setViewModal(null)}
          footer={<button className="cm-btn cm-btn--out" style={{width:'100%'}} onClick={()=>setViewModal(null)}>Close</button>}>
          <div className="cm-view-grid">
            {[
              {l:'Full Name',    v:viewModal.name},
              {l:'Email',        v:viewModal.email},
              {l:'Phone',        v:viewModal.phone},
              {l:'Joined',       v:viewModal.joined},
              {l:'Status',       v:viewModal.status},
            ].map((r,i)=>(
              <div key={i} className="cm-view-row">
                <span className="cm-view-lbl">{r.l}</span>
                <span className="cm-view-val">{r.v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Customer" sub={`#${editModal.id}`} onClose={()=>setEditModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setEditModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--pri" disabled={statusUpdating} onClick={saveEdit}><I d={P.check} size={13} color="#fff"/>{statusUpdating ? 'Saving...' : 'Save Changes'}</button>
          </>}>
          <div className="cm-form-grid">
            <Field label="Full Name" span2><Inp value={editForm.name} disabled/></Field>
            <Field label="Email"><Inp type="email" value={editForm.email} disabled/></Field>
            <Field label="Phone"><Inp value={editForm.phone} disabled/></Field>
            <Field label="Status"><Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} options={['Active','Inactive','Blocked']}/></Field>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteModal && (
        <Modal title="Delete Customer" sub={deleteModal.name} onClose={()=>setDeleteModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setDeleteModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--danger" onClick={confirmDelete}><I d={P.trash} size={13} color="#fff"/>Delete</button>
          </>}>
          <div className="cm-alert cm-alert--danger">
            <I d={P.info} size={16} color="#dc2626"/>
            Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ================================================================
   TAB 2 — LOYALTY POINTS
   ================================================================ */
const LoyaltyPoints = ({ showToast }) => {
  const [loyalty, setLoyalty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tier,    setTier]    = useState('All');
  const [page,    setPage]    = useState(0);
  const [editModal,  setEditModal]  = useState(null);
  const [bonusModal, setBonusModal] = useState(null);
  const [viewModal,  setViewModal]  = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [bonusAmt,   setBonusAmt]   = useState('');

  useEffect(() => {
    getLoyaltyCustomers().then(data => {
      if (data) setLoyalty(data.map(l => ({
        id: l.id,
        name: l.name,
        city: l.email?.split('@')[0] || '',
        tier: l.tier,
        points: l.points || 0,
        earned: l.earned || 0,
        redeemed: l.redeemed || 0,
        expiry: l.expires || '—',
        lastActivity: l.lastActivity || '—',
      })));
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const TIER_OPTS = ['All','Platinum','Gold','Silver','Bronze'];
  const tierStars = { Platinum:5, Gold:4, Silver:3, Bronze:2 };
  const maxPoints = Math.max(...loyalty.map(l=>l.points));

  const list = loyalty.filter(c => {
    const mT = tier==='All' || c.tier===tier;
    const q  = search.toLowerCase();
    const mQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    return mT && mQ;
  });
  const slice = list.slice(page*PER_PAGE,(page+1)*PER_PAGE);

  const Stars = ({ n }) => (
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i<=n?'#f59e0b':'none'} stroke={i<=n?'#f59e0b':'#cbd5e1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={P.star}/>
        </svg>
      ))}
    </div>
  );

  const openEdit = c => { setEditModal(c); setEditForm({...c}); };
  const saveEdit = async () => {
    try {
      const payload = { name: editForm.name, tier: editForm.tier, points: Number(editForm.points), earned: Number(editForm.earned), redeemed: Number(editForm.redeemed), expires: editForm.expiry };
      await createLoyaltyCustomer(payload);
      setLoyalty(prev=>prev.map(c=>c.id===editModal.id?{...editForm,points:Number(editForm.points),earned:Number(editForm.earned),redeemed:Number(editForm.redeemed)}:c));
      showToast(`${editForm.name} loyalty updated`,'success');
    } catch (err) {
      showToast(err.message || 'Failed to update loyalty', 'error');
    }
    setEditModal(null);
  };
  const awardBonus = async () => {
    const pts = Number(bonusAmt);
    if(!pts || pts<=0) return;
    try {
      const updated = loyalty.find(c=>c.id===bonusModal.id);
      if (updated) {
        await createLoyaltyCustomer({ ...updated, points: updated.points + pts, earned: updated.earned + pts });
      }
      setLoyalty(prev=>prev.map(c=>c.id===bonusModal.id?{...c,points:c.points+pts,earned:c.earned+pts}:c));
      showToast(`+${pts} points awarded to ${bonusModal.name}`,'success');
    } catch (err) {
      showToast(err.message || 'Failed to award points', 'error');
    }
    setBonusModal(null); setBonusAmt('');
  };
  const handleExport = () => {
    exportCSV([
      ['ID','Name','City','Tier','Points','Earned','Redeemed','Expiry','Last Activity'],
      ...loyalty.map(c=>[c.id,c.name,c.city,c.tier,c.points,c.earned,c.redeemed,c.expiry,c.lastActivity])
    ],'loyalty_points.csv');
    showToast('Loyalty CSV downloaded','success');
  };

  return (
    <div className="cm-sub">
      <div className="cm-card">
        <div className="cm-sh">
          <div>
            <p className="cm-sh__t">Loyalty Points</p>
            <p className="cm-sh__s">Customer reward tiers and point balances</p>
          </div>
          <div className="cm-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search customer…"/>
            <div className="cm-pills">
              {TIER_OPTS.map(t=>(
                <button key={t} className={`cm-pill${tier===t?' cm-pill--on':''}`} onClick={()=>{setTier(t);setPage(0);}}>{t}</button>
              ))}
            </div>
            <button className="cm-btn cm-btn--out" onClick={handleExport}><I d={P.download} size={13} color="#475569"/>Export</button>
          </div>
        </div>

        <div className="cm-tw">
          <table className="cm-tbl">
            <thead>
              <tr>
                <th className="cm-th">Customer</th>
                <th className="cm-th cm-hm">Location</th>
                <th className="cm-th">Tier</th>
                <th className="cm-th">Points Balance</th>
                <th className="cm-th cm-hm">Earned</th>
                <th className="cm-th cm-hm">Redeemed</th>
                <th className="cm-th cm-hm">Expiry</th>
                <th className="cm-th cm-hm">Last Activity</th>
                <th className="cm-th cm-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="9" className="cm-empty">Loading loyalty data...</td></tr>}
              {!loading && slice.length===0 && <tr><td colSpan="9" className="cm-empty">No records found.</td></tr>}
              {slice.map(c=>{
                const pct = Math.round((c.points/maxPoints)*100);
                return (
                  <tr key={c.id} className="cm-tr">
                    <td className="cm-td">
                      <div className="cm-cust"><Av name={c.name}/><div><div className="cm-cust__n">{c.name}</div><div className="cm-cust__id">{c.id}</div></div></div>
                    </td>
                    <td className="cm-td cm-hm"><div style={{display:'flex',alignItems:'center',gap:4,fontSize:'.78rem',color:'#475569'}}><I d={P.mappin} size={12} color="#94a3b8"/>{c.city}</div></td>
                    <td className="cm-td"><div style={{display:'flex',flexDirection:'column',gap:4}}><TierBdg tier={c.tier}/><Stars n={tierStars[c.tier]||2}/></div></td>
                    <td className="cm-td">
                      <div className="cm-pts">
                        <span className="cm-pts__val">{c.points.toLocaleString()}</span>
                        <div className="cm-pts__bar"><div className="cm-pts__fill" style={{width:`${pct}%`}}/></div>
                      </div>
                    </td>
                    <td className="cm-td cm-hm"><span className="cm-num cm-num--green">{c.earned.toLocaleString()}</span></td>
                    <td className="cm-td cm-hm"><span className="cm-num cm-num--red">{c.redeemed.toLocaleString()}</span></td>
                    <td className="cm-td cm-hm"><div style={{display:'flex',alignItems:'center',gap:4}}><I d={P.calendar} size={11} color="#94a3b8"/><span className="cm-date">{c.expiry}</span></div></td>
                    <td className="cm-td cm-hm"><span className="cm-date">{c.lastActivity}</span></td>
                    <td className="cm-td cm-td--r">
                      <div className="cm-acts">
                        <button className="cm-act cm-act--view"  title="View details"  onClick={()=>setViewModal(c)}><I d={P.eye} size={13}/></button>
                        <button className="cm-act cm-act--edit"  title="Edit tier"     onClick={()=>openEdit(c)}><I d={P.edit} size={13}/></button>
                        <button className="cm-act cm-act--bonus" title="Award bonus"   onClick={()=>{setBonusModal(c);setBonusAmt('');}}><I d={P.zap} size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={list.length} onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

      {/* View Modal */}
      {viewModal && (
        <Modal title="Loyalty Details" sub={`${viewModal.name} · ${viewModal.id}`} onClose={()=>setViewModal(null)}
          footer={<button className="cm-btn cm-btn--out" style={{width:'100%'}} onClick={()=>setViewModal(null)}>Close</button>}>
          <div className="cm-view-grid">
            {[
              {l:'Tier',          v:viewModal.tier},
              {l:'Points Balance',v:viewModal.points.toLocaleString()},
              {l:'Total Earned',  v:viewModal.earned.toLocaleString()},
              {l:'Total Redeemed',v:viewModal.redeemed.toLocaleString()},
              {l:'Expiry Date',   v:viewModal.expiry},
              {l:'Last Activity', v:viewModal.lastActivity},
            ].map((r,i)=>(
              <div key={i} className="cm-view-row">
                <span className="cm-view-lbl">{r.l}</span>
                <span className="cm-view-val">{r.v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit Loyalty Modal */}
      {editModal && (
        <Modal title="Edit Loyalty Record" sub={`${editModal.name} · ${editModal.id}`} onClose={()=>setEditModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setEditModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--pri" onClick={saveEdit}><I d={P.check} size={13} color="#fff"/>Save</button>
          </>}>
          <div className="cm-form-grid">
            <Field label="Loyalty Tier" span2>
              <Sel value={editForm.tier} onChange={e=>setEditForm(f=>({...f,tier:e.target.value}))} options={['Bronze','Silver','Gold','Platinum']}/>
            </Field>
            <Field label="Points Balance"><Inp type="number" value={editForm.points} onChange={e=>setEditForm(f=>({...f,points:e.target.value}))}/></Field>
            <Field label="Total Earned"><Inp type="number" value={editForm.earned} onChange={e=>setEditForm(f=>({...f,earned:e.target.value}))}/></Field>
            <Field label="Total Redeemed"><Inp type="number" value={editForm.redeemed} onChange={e=>setEditForm(f=>({...f,redeemed:e.target.value}))}/></Field>
            <Field label="Expiry Date"><Inp value={editForm.expiry} onChange={e=>setEditForm(f=>({...f,expiry:e.target.value}))}/></Field>
          </div>
        </Modal>
      )}

      {/* Award Bonus Modal */}
      {bonusModal && (
        <Modal title="Award Bonus Points" sub={`${bonusModal.name} · current balance: ${bonusModal.points.toLocaleString()} pts`} onClose={()=>setBonusModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setBonusModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--pri" onClick={awardBonus}><I d={P.zap} size={13} color="#fff"/>Award Points</button>
          </>}>
          <Field label="Bonus Points to Award">
            <Inp type="number" value={bonusAmt} onChange={e=>setBonusAmt(e.target.value)} placeholder="e.g. 500" autoFocus/>
          </Field>
          {bonusAmt>0 && (
            <div className="cm-alert cm-alert--info" style={{marginTop:12}}>
              <I d={P.info} size={14} color="#2563eb"/>
              New balance will be <strong>{(Number(bonusModal.points)+Number(bonusAmt)).toLocaleString()}</strong> points
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

/* ================================================================
   TAB 3 — REFUND HISTORY
   ================================================================ */
const RefundHistory = ({ showToast }) => {
  const [refunds,  setRefunds]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [checked,  setChecked]  = useState({});
  const [page,     setPage]     = useState(0);
  const [viewModal,   setViewModal]   = useState(null);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editForm,    setEditForm]    = useState({});

  useEffect(() => {
    getRefunds().then(data => {
      if (data) setRefunds(data.map(r => ({
        id: r.id,
        cusId: '',
        name: r.customerName,
        orderId: r.orderId,
        product: r.product,
        amount: r.amount || 0,
        method: r.method,
        reason: r.reason,
        status: r.status,
        date: r.requestedOn,
      })));
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const STATUS_OPTS = ['All','Refunded','Processing','Approved','Rejected'];

  const list = refunds.filter(r => {
    const mS = filter==='All' || r.status===filter;
    const q  = search.toLowerCase();
    const mQ = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.product.toLowerCase().includes(q);
    return mS && mQ;
  });
  const slice = list.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const allC  = slice.length>0 && slice.every(r=>checked[r.id]);
  const toggleAll = () => {
    if(allC) setChecked(p=>{const n={...p};slice.forEach(r=>delete n[r.id]);return n;});
    else     setChecked(p=>{const n={...p};slice.forEach(r=>n[r.id]=true);return n;});
  };

  const updateStatus = async (id, status) => {
    const existing = refunds.find(r => r.id === id);
    if (existing) {
      try {
        await createRefund({ ...existing, status, customerName: existing.name, requestedOn: existing.date });
        setRefunds(prev=>prev.map(r=>r.id===id?{...r,status}:r));
        showToast(`Status updated to "${status}"`,'success');
      } catch (err) {
        showToast(err.message || 'Failed to update status', 'error');
      }
    }
  };
  const openEdit = r => { setEditModal(r); setEditForm({...r}); };
  const saveEdit = async () => {
    try {
      await createRefund({ customerName: editForm.name, orderId: editForm.orderId, product: editForm.product, reason: editForm.reason, amount: Number(editForm.amount), method: editForm.method, status: editForm.status, requestedOn: editForm.date });
      setRefunds(prev=>prev.map(r=>r.id===editModal.id?{...editForm,amount:Number(editForm.amount)}:r));
      showToast(`${editForm.id} updated`,'success');
    } catch (err) {
      showToast(err.message || 'Failed to update refund', 'error');
    }
    setEditModal(null);
  };
  const confirmDelete = async () => {
    try {
      await deleteRefund(deleteModal.id);
      setRefunds(prev=>prev.filter(r=>r.id!==deleteModal.id));
      showToast(`${deleteModal.id} deleted`,'error');
    } catch (err) {
      showToast(err.message || 'Failed to delete refund', 'error');
    }
    setDeleteModal(null);
  };
  const handleExport = () => {
    exportCSV([
      ['Refund ID','Customer','Order ID','Product','Reason','Amount','Method','Date','Status'],
      ...refunds.map(r=>[r.id,r.name,r.orderId,r.product,r.reason,r.amount,r.method,r.date,r.status])
    ],'refunds.csv');
    showToast('Refunds CSV downloaded','success');
  };

  return (
    <div className="cm-sub">
      <div className="cm-card">
        <div className="cm-sh">
          <div>
            <p className="cm-sh__t">Refund History</p>
            <p className="cm-sh__s">{list.length} refund record{list.length!==1?'s':''} found</p>
          </div>
          <div className="cm-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search customer, order, product…"/>
            <div className="cm-pills">
              {STATUS_OPTS.map(s=>(
                <button key={s} className={`cm-pill${filter===s?' cm-pill--on':''}`} onClick={()=>{setFilter(s);setPage(0);}}>{s}</button>
              ))}
            </div>
            <button className="cm-btn cm-btn--out" onClick={handleExport}><I d={P.download} size={13} color="#475569"/>Export</button>
          </div>
        </div>

        <div className="cm-tw">
          <table className="cm-tbl">
            <thead>
              <tr>
                <th className="cm-th cm-th--chk"><Chk checked={allC} onChange={toggleAll}/></th>
                <th className="cm-th">Refund ID</th>
                <th className="cm-th">Customer</th>
                <th className="cm-th cm-hm">Product</th>
                <th className="cm-th cm-hm">Reason</th>
                <th className="cm-th">Amount</th>
                <th className="cm-th cm-hm">Method</th>
                <th className="cm-th cm-hm">Date</th>
                <th className="cm-th">Status</th>
                <th className="cm-th cm-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="10" className="cm-empty">Loading refund records...</td></tr>}
              {!loading && slice.length===0 && <tr><td colSpan="10" className="cm-empty">No refund records found.</td></tr>}
              {slice.map(r=>(
                <tr key={r.id} className={`cm-tr${checked[r.id]?' cm-tr--sel':''}`}>
                  <td className="cm-td cm-td--chk"><Chk checked={!!checked[r.id]} onChange={()=>setChecked(p=>({...p,[r.id]:!p[r.id]}))}/></td>
                  <td className="cm-td">
                    <div className="cm-refid"><span className="cm-refid__id">{r.id}</span><span className="cm-refid__ord">{r.orderId}</span></div>
                  </td>
                  <td className="cm-td">
                    <div className="cm-cust"><Av name={r.name}/><div><div className="cm-cust__n">{r.name}</div><div className="cm-cust__id">{r.cusId}</div></div></div>
                  </td>
                  <td className="cm-td cm-hm"><span className="cm-prod">{r.product}</span></td>
                  <td className="cm-td cm-hm"><span className="cm-reason">{r.reason}</span></td>
                  <td className="cm-td"><span className="cm-spent">{fmt(r.amount)}</span></td>
                  <td className="cm-td cm-hm"><span className="cm-method">{r.method}</span></td>
                  <td className="cm-td cm-hm"><span className="cm-date">{r.date}</span></td>
                  <td className="cm-td"><RefundBdg status={r.status}/></td>
                  <td className="cm-td cm-td--r">
                    <div className="cm-acts">
                      <button className="cm-act cm-act--view"  title="View details" onClick={()=>setViewModal(r)}><I d={P.eye} size={13}/></button>
                      <button className="cm-act cm-act--edit"  title="Edit refund"  onClick={()=>openEdit(r)}><I d={P.edit} size={13}/></button>
                      {/* Approve — only for Processing/Pending */}
                      {(r.status==='Processing'||r.status==='Approved') && (
                        <button className="cm-act cm-act--approve" title="Approve" onClick={()=>updateStatus(r.id,'Refunded')}><I d={P.check} size={13}/></button>
                      )}
                      {/* Reject */}
                      {r.status!=='Rejected' && r.status!=='Refunded' && (
                        <button className="cm-act cm-act--trash" title="Reject" onClick={()=>updateStatus(r.id,'Rejected')}><I d={P.x} size={13}/></button>
                      )}
                      <button className="cm-act cm-act--trash" title="Delete" onClick={()=>setDeleteModal(r)}><I d={P.trash} size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={list.length} onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

      {/* View Modal */}
      {viewModal && (
        <Modal title="Refund Details" sub={`${viewModal.id} · ${viewModal.orderId}`} onClose={()=>setViewModal(null)}
          footer={<button className="cm-btn cm-btn--out" style={{width:'100%'}} onClick={()=>setViewModal(null)}>Close</button>}>
          <div className="cm-view-grid">
            {[
              {l:'Customer',  v:viewModal.name},
              {l:'Product',   v:viewModal.product},
              {l:'Reason',    v:viewModal.reason},
              {l:'Amount',    v:fmt(viewModal.amount)},
              {l:'Method',    v:viewModal.method},
              {l:'Date',      v:viewModal.date},
              {l:'Status',    v:viewModal.status},
            ].map((r,i)=>(
              <div key={i} className="cm-view-row">
                <span className="cm-view-lbl">{r.l}</span>
                <span className="cm-view-val">{r.v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit Refund Modal */}
      {editModal && (
        <Modal title="Edit Refund" sub={`${editModal.id} · ${editModal.name}`} onClose={()=>setEditModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setEditModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--pri" onClick={saveEdit}><I d={P.check} size={13} color="#fff"/>Save Changes</button>
          </>}>
          <div className="cm-form-grid">
            <Field label="Product" span2><Inp value={editForm.product} onChange={e=>setEditForm(f=>({...f,product:e.target.value}))}/></Field>
            <Field label="Reason" span2><Inp value={editForm.reason} onChange={e=>setEditForm(f=>({...f,reason:e.target.value}))}/></Field>
            <Field label="Amount (Rs.)"><Inp type="number" value={editForm.amount} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}/></Field>
            <Field label="Refund Method">
              <Sel value={editForm.method} onChange={e=>setEditForm(f=>({...f,method:e.target.value}))} options={['UPI','Card','Wallet','Original']}/>
            </Field>
            <Field label="Status">
              <Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} options={['Processing','Approved','Refunded','Rejected']}/>
            </Field>
            <Field label="Date"><Inp value={editForm.date} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))}/></Field>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteModal && (
        <Modal title="Delete Refund Record" sub={deleteModal.id} onClose={()=>setDeleteModal(null)}
          footer={<>
            <button className="cm-btn cm-btn--out" onClick={()=>setDeleteModal(null)}>Cancel</button>
            <button className="cm-btn cm-btn--danger" onClick={confirmDelete}><I d={P.trash} size={13} color="#fff"/>Delete</button>
          </>}>
          <div className="cm-alert cm-alert--danger">
            <I d={P.info} size={16} color="#dc2626"/>
            Delete refund record <strong>{deleteModal.id}</strong> for <strong>{deleteModal.name}</strong>? This cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ================================================================
   ROOT
   ================================================================ */
const TABS = [
  { key:'customers', label:'All Customers',  icon: P.users,  Comp: AllCustomers  },
  { key:'loyalty',   label:'Loyalty Points', icon: P.star,   Comp: LoyaltyPoints },
  { key:'refunds',   label:'Refund History', icon: P.rotCcw, Comp: RefundHistory  },
];

export default function CustomerManagement() {
  const [active, setActive] = useState('customers');
  const [toast,  setToast]  = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const { Comp } = TABS.find(t=>t.key===active);

  return (
    <div className="cm">
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      <div className="cm-hdr">
        <div>
          <h2 className="cm-hdr__t">Customer Management</h2>
          <p className="cm-hdr__s">Manage customers, loyalty rewards and refund history.</p>
        </div>
      </div>

      <div className="cm-tabs">
        {TABS.map(t=>(
          <button key={t.key} className={`cm-tab${active===t.key?' cm-tab--on':''}`} onClick={()=>setActive(t.key)}>
            <I d={t.icon} size={14} color={active===t.key?'#E03E1A':'#64748b'} sw={active===t.key?2.3:1.9}
              fill={t.key==='loyalty'&&active===t.key?'#E03E1A':'none'}/>
            {t.label}
          </button>
        ))}
      </div>

      <Comp showToast={showToast}/>
    </div>
  );
}