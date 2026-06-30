import React, { useState, useEffect, useCallback } from 'react';
import './AllCustomers.css';
import { Icon, initials, avatarBg, fmt, fmtDate, exportCSV } from './VendorShared';
import { getAdminCustomers, updateCustomerStatus } from '../../api/api';
import toast from 'react-hot-toast';

const PER = 6;

export default function AllCustomers() {
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');
  const [sortBy,    setSortBy]    = useState('spent');
  const [sortDir,   setSortDir]   = useState('desc');
  const [page,      setPage]      = useState(0);
  const [sel,       setSel]       = useState(null);
  const [customers, setCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,   setLoading]   = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER };
      if (search) params.search = search;
      if (filter !== 'All') params.status = filter;
      const data = await getAdminCustomers(params);
      const mapped = (data.content || []).map(c => ({
        id:     c.id,
        name:   c.fullName || '',
        email:  c.email || '',
        phone:  c.phone || '',
        roleId: c.roleId,
        status: c.status || 'active',
        joined: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
      }));
      setCustomers(mapped);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleStatusUpdate = async (e, customerId, newStatus) => {
    e.stopPropagation();
    try {
      await updateCustomerStatus(customerId, newStatus);
      toast.success('Customer status updated');
      fetchCustomers();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const sorted = [...customers].sort((a, b) => {
    const av = a[sortBy] || 0;
    const bv = b[sortBy] || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const toggleSort = k => {
    if (sortBy === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(k); setSortDir('desc'); }
  };

  const stats = [
    { label:'Total Customers', value: totalElements,  icon:'Users',       c:'#2563eb', bg:'#dbeafe', trend:`${totalElements} total` },
    { label:'Active',          value: customers.filter(c=>c.status==='active').length, icon:'CheckCircle', c:'#16a34a', bg:'#dcfce7', trend:'' },
    { label:'Inactive',        value: customers.filter(c=>c.status==='inactive').length, icon:'XCircle', c:'#E03E1A', bg:'#ffe4de', trend:'' },
    { label:'Suspended',       value: customers.filter(c=>c.status==='suspended').length, icon:'ShoppingBag', c:'#7c3aed', bg:'#ede9fe', trend:'' },
  ];

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">All Customers</h2>
          <p className="vm-hdr__sub">Manage and monitor your entire customer base · {totalElements} total customers</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => {
            const rows = customers.map(c => [c.name, c.email, c.city || '—', c.totalSpent || 0, c.orders || 0, c.status || 'Active', c.joined || '—']);
            exportCSV([['Name','Email','City','Total Spent','Orders','Status','Joined'], ...rows], 'customers.csv');
            toast.success('Customers exported');
          }}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary"><Icon name="Plus" size={13} color="#fff"/>Add Customer</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {stats.map((k,i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}><Icon name={k.icon} size={18} color={k.c} sw={2.1}/></div>
              {k.trend && <span className="vm-kpi__trend vm-kpi__trend--up">{k.trend}</span>}
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Customer Directory</p>
            <p className="vm-sh__sub">Click a row to view details · Sort by any column</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search name or email…" value={search}
                onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            </div>
            <div className="vm-pills">
              {['All','active','inactive','suspended'].map(f=>(
                <button key={f} className={`vm-pill${filter===f?' vm-pill--active':''}`}
                  onClick={()=>{setFilter(f);setPage(0);}}>
                  {f==='All'?'All':f[0].toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'48px 0',color:'#94a3b8',fontSize:'.9rem'}}>
              Loading customers…
            </div>
          ) : (
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',padding:'32px 0',color:'#94a3b8'}}>No customers found.</td></tr>
              ) : sorted.map(c=>(
                <React.Fragment key={c.id}>
                  <tr style={{cursor:'pointer', background:sel===c.id?'#fff8f6':undefined}}
                    onClick={()=>setSel(sel===c.id?null:c.id)}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{background:avatarBg(c.name)}}>{initials(c.name)}</div>
                        <div>
                          <div className="vm-vcell__name">{c.name}</div>
                          <div className="vm-vcell__id">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize:'.78rem',color:'#475569',lineHeight:1.6}}>
                        <div>{c.email}</div>
                        <div style={{color:'#94a3b8',fontSize:'.72rem'}}>{c.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`vm-status vm-status--${c.status}`}>
                        <span className="vm-status__dot"/>
                        {c.status[0].toUpperCase()+c.status.slice(1)}
                      </span>
                    </td>
                    <td><span style={{fontSize:'.75rem',color:'#94a3b8'}}>{fmtDate(c.joined)}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={e=>{e.stopPropagation();}}><Icon name="Eye" size={12} color="#475569"/></button>
                        {c.status !== 'active' && (
                          <button className="vm-btn vm-btn--outline vm-btn--sm" title="Activate"
                            onClick={e => handleStatusUpdate(e, c.id, 'active')}>
                            <Icon name="CheckCircle" size={12} color="#16a34a"/>
                          </button>
                        )}
                        {c.status !== 'suspended' && (
                          <button className="vm-btn vm-btn--outline vm-btn--sm" title="Suspend"
                            onClick={e => handleStatusUpdate(e, c.id, 'suspended')}>
                            <Icon name="XCircle" size={12} color="#dc2626"/>
                          </button>
                        )}
                        {c.status !== 'inactive' && (
                          <button className="vm-btn vm-btn--outline vm-btn--sm" title="Deactivate"
                            onClick={e => handleStatusUpdate(e, c.id, 'inactive')}>
                            <Icon name="Edit" size={12} color="#475569"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {sel===c.id && (
                    <tr>
                      <td colSpan={5} style={{padding:0}}>
                        <div style={{padding:'18px 16px',background:'#fff8f6',borderBottom:'1px solid #fde8e4',borderTop:'2px solid #E03E1A'}}>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
                            {[
                              {label:'Customer ID', value:c.id,    icon:'Tag'},
                              {label:'Email',       value:c.email, icon:'Mail'},
                              {label:'Phone',       value:c.phone, icon:'Phone'},
                              {label:'Status',      value:c.status[0].toUpperCase()+c.status.slice(1), icon:'CheckCircle'},
                            ].map((item,i)=>(
                              <div key={i} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:10,padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start'}}>
                                <div style={{width:28,height:28,background:'#fff0ed',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                  <Icon name={item.icon} size={13} color="#E03E1A"/>
                                </div>
                                <div>
                                  <div style={{fontSize:'.65rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>{item.label}</div>
                                  <div style={{fontSize:'.83rem',fontWeight:700,color:'#0f172a',marginTop:2}}>{item.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'flex-end'}}>
                            <button className="vm-btn vm-btn--primary vm-btn--sm"><Icon name="Eye" size={12} color="#fff"/>View Full Profile</button>
                            <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={()=>setSel(null)}><Icon name="X" size={12} color="#475569"/>Close</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{totalElements === 0 ? '0' : `${page*PER+1}–${Math.min((page+1)*PER, totalElements)}`} of {totalElements}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p-1)} disabled={page===0}><Icon name="ChevLeft" size={12}/></button>
            <span className="vm-pag__label">{page+1} / {totalPages}</span>
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p+1)} disabled={page+1>=totalPages}><Icon name="ChevRight" size={12}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
