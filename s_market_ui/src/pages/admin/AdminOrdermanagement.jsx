import React, { useState, useEffect, useCallback } from 'react';
import './AdminOrdermanagement.css';
import { getAdminOrders, updateOrderStatus as apiUpdateOrderStatus, getAdminDashboardStats, getDeliveryPartners, getProduct, getPrimaryGalleryImage } from '../../api/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, RotateCcw, XCircle, Truck,
  Search as SearchIcon, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight,
  Download, Edit2, Eye, Check, X, AlertTriangle,
  Clock, DollarSign, MapPin, Package, TrendingUp,
  RefreshCw, Star, CheckCircle, Circle, Navigation,
  Calendar, Users, Activity, User,
  Phone, Zap, Plus,
} from 'lucide-react';

const PALETTE = [
  '#E03E1A','#2563eb','#16a34a','#7c3aed',
  '#d97706','#0d9488','#db2777','#64748b',
];

const PER_PAGE = 8;

function initials(n) { return n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); }
function avatarBg(n) { return PALETTE[n.charCodeAt(0) % PALETTE.length]; }

const STATUS_CLS = {
  Placed:'placed', Confirmed:'confirmed', Packed:'packed',
  Shipped:'shipped', Delivered:'delivered', Cancelled:'cancelled',
  Returned:'returned', Refunded:'refunded', Replaced:'replaced',
  Pending:'pending', Approved:'approved', Processing:'processing', Rejected:'rejected',
  Active:'active', Inactive:'inactive',
};

// eslint-disable-next-line no-unused-vars
const Kpi = ({ label, value, trend, up, Icon, color, bg }) => (
  <div className="om-kpi">
    <div className="om-kpi__top">
      <div className="om-kpi__ico" style={{ background: bg }}>
        <Icon size={18} color={color} strokeWidth={2.1}/>
      </div>
      <span className={`om-kpi__trend ${up ? 'up' : 'dn'}`}>
        {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
        {trend}
      </span>
    </div>
    <div>
      <div className="om-kpi__val">{value}</div>
      <div className="om-kpi__lbl">{label}</div>
    </div>
  </div>
);

const Bdg = ({ label, cls }) => <span className={`om-bdg ${cls}`}>{label}</span>;

const exportCSV = (rows, filename) => {
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const Btn = ({ children, cls = 'out', sm, icon: Icon, onClick }) => (
  <button className={`om-btn ${cls}${sm ? ' sm' : ''}`} onClick={onClick}>
    {Icon && <Icon size={13}/>}
    {children}
  </button>
);

// eslint-disable-next-line no-unused-vars
const Ib = ({ icon: Icon, cls = 'v', title, onClick }) => (
  <button className={`om-ib ${cls}`} title={title} onClick={onClick}>
    <Icon size={13}/>
  </button>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div className="om-search">
    <span className="om-search__ico"><SearchIcon size={14}/></span>
    <input className="om-search__inp" placeholder={placeholder || 'Search...'} value={value !== undefined ? value : undefined} onChange={onChange}/>
  </div>
);

const Pills = ({ opts, val, set }) => (
  <div className="om-pills">
    {opts.map(o => (
      <button key={o} className={`om-pill${val === o ? ' on' : ''}`} onClick={() => set(o)}>{o}</button>
    ))}
  </div>
);

const Pager = ({ page, total, prev, next, totalPages: tpOverride, pageSize: psOverride }) => {
  const ps = psOverride || PER_PAGE;
  const pages = tpOverride !== undefined ? tpOverride : Math.ceil(total / ps);
  return (
    <div className="om-pag">
      <span className="om-pag__i">
        {total > 0 ? page * ps + 1 : 0}&#8211;{Math.min((page + 1) * ps, total)} of {total}
      </span>
      <div className="om-pag__c">
        <button className="om-pag__b" onClick={prev} disabled={page === 0}><ChevronLeft size={13}/></button>
        <span className="om-pag__l">{page + 1} / {pages || 1}</span>
        <button className="om-pag__b" onClick={next} disabled={page + 1 >= pages}><ChevronRight size={13}/></button>
      </div>
    </div>
  );
};

const Sh = ({ title, sub, children }) => (
  <div className="om-sh">
    <div><p className="om-sh__t">{title}</p><p className="om-sh__s">{sub}</p></div>
    {children && <div className="om-sh__r">{children}</div>}
  </div>
);

const Av = ({ name }) => (
  <div className="om-av" style={{ background: avatarBg(name) }}>{initials(name)}</div>
);

const StatBar = ({ label, val, pct, color }) => (
  <div>
    <div className="om-stat-item__hd">
      <span className="om-stat-item__lbl">{label}</span>
      <span className="om-stat-item__val">{val !== undefined ? `${val} (${pct}%)` : `${pct}%`}</span>
    </div>
    <div className="om-stat-item__bar">
      <div className="om-stat-item__fill" style={{ width: `${pct}%`, background: color }}/>
    </div>
  </div>
);

const AllOrders = ({ dashStats }) => {
  const [page, setPage]         = useState(0);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [detail, setDetail]     = useState(null);
  const [orders, setOrders]     = useState([]);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null);
  const [orderProducts, setOrderProducts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [productCache, setProductCache] = useState({});

  const STATUSES = ['All','Placed','Confirmed','Packed','Shipped','Delivered','Cancelled','Returned'];

  const formatDate = (epoch) => {
    if (!epoch) return '--';
    const d = new Date(epoch);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      + ', ' + d.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit', hour12:true });
  };

  const formatCurrency = (amt) => {
    if (amt === null || amt === undefined) return '--';
    return 'Rs.' + Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const mapOrder = (o) => ({
    ...o,
    id: o.orderNumber || `ORD-${o.id}`,
    _backendId: o.id,
    date: formatDate(o.datePlaced),
    customer: o.customerName || '--',
    city: o.deliveryLocation || '--',
    items: o.additionalItems != null ? o.additionalItems + 1 : (o.productQuantities ? Object.keys(o.productQuantities).length : 1),
    amount: formatCurrency(o.totalAmount),
    _rawAmount: o.totalAmount,
    payment: '--',
    partner: '--',
    status: o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase() : 'Placed',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimeout, setSearchTimeout]     = useState(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400));
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER_PAGE, sortBy: 'datePlaced', sortDir: 'desc' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filter !== 'All') params.status = filter.toUpperCase();
      const data = await getAdminOrders(params);
      if (data) {
        const mappedOrders = (data.content || []).map(mapOrder);
        setOrders(mappedOrders);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);

        // Fetch product details for any products not yet in cache
        const allProductIds = new Set();
        mappedOrders.forEach(o => {
          if (o.productQuantities) {
            Object.keys(o.productQuantities).forEach(id => {
              if (!productCache[id]) allProductIds.add(id);
            });
          }
        });
        if (allProductIds.size > 0) {
          const newProducts = {};
          await Promise.all(
            [...allProductIds].map(async (id) => {
              try {
                const p = await getProduct(id);
                newProducts[id] = p;
              } catch {
                newProducts[id] = { id, name: 'Unknown Product', sku: '' };
              }
            })
          );
          setProductCache(prev => ({ ...prev, ...newProducts }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filter, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (order) => {
    if (detail?.id === order.id) {
      setDetail(null);
      setOrderProducts([]);
      return;
    }
    setDetail(order);
    setOrderProducts([]);
    setDetailLoading(true);
    try {
      const rawOrder = orders.find(o => o.id === order.id);
      if (rawOrder?.productQuantities && Object.keys(rawOrder.productQuantities).length > 0) {
        const productEntries = Object.entries(rawOrder.productQuantities);
        const products = await Promise.all(
          productEntries.map(async ([productId, qty]) => {
            try {
              const product = await getProduct(productId);
              return { ...product, orderedQty: qty };
            } catch {
              return { id: productId, name: 'Product unavailable', orderedQty: qty };
            }
          })
        );
        setOrderProducts(products);
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditStatus = (order) => {
    setModal({ type: 'editStatus', order });
  };

  const handleStatusUpdate = async (orderId, backendId, newStatus) => {
    try {
      await apiUpdateOrderStatus(backendId, newStatus.toUpperCase());
      toast.success(`Order status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o._backendId === backendId ? { ...o, status: newStatus } : o));
      if (detail?._backendId === backendId) {
        setDetail(prev => ({ ...prev, status: newStatus }));
      }
      setModal(null);
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Failed to update status: ' + (err.message || 'Unknown error'));
    }
  };

  const handleContact = (order) => {
    setModal({ type: 'contact', order });
  };

  const handleReturn = (order) => {
    setModal({ type: 'return', order });
  };

  const totalOrders = dashStats?.totalOrders || 0;
  const deliveredCount = dashStats?.deliveredOrders || 0;
  const shippedProcessing = (dashStats?.shippedOrders || 0) + (dashStats?.processingOrders || 0);
  const totalRevenue = dashStats?.totalRevenue || 0;

  return (
    <div className="om-sub">
      <div className="om-kpi-grid">
        <Kpi label="Total Orders"    value={totalOrders.toLocaleString('en-IN')}  trend="All time"    up Icon={ShoppingBag} color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Delivered"       value={deliveredCount.toLocaleString('en-IN')}  trend="Completed"    up Icon={CheckCircle} color="#16a34a" bg="#dcfce7"/>
        <Kpi label="In Transit"      value={shippedProcessing.toLocaleString('en-IN')}     trend="Shipping"     up Icon={Truck}       color="#d97706" bg="#fef3c7"/>
        <Kpi label="Order Value"     value={'Rs.' + Number(totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })} trend="Revenue" up Icon={DollarSign} color="#7c3aed" bg="#ede9fe"/>
      </div>

      <div className="om-card">
        <Sh title="All Orders" sub="Track and manage every order across all vendors">
          <SearchBar placeholder="Search order ID, customer..." value={search} onChange={handleSearchChange}/>
          <Pills opts={STATUSES} val={filter} set={f => { setFilter(f); setPage(0); }}/>
          <Btn cls="out" icon={Download} onClick={() => exportCSV([
            ['Order ID','Customer','City','Products','Items','Amount','Status','Date'],
            ...orders.map(o => {
              const pq = o.productQuantities || {};
              const productNames = Object.keys(pq).map(pid => {
                const p = productCache[pid];
                return p ? (p.sku ? `${p.name} (${p.sku})` : p.name) : `#${pid}`;
              }).join('; ');
              return [o.id, o.customer, o.city, productNames, o.items, o.amount, o.status, o.date];
            })
          ], 'orders.csv')}>Export</Btn>
        </Sh>

        {loading && <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8', fontSize:'.85rem' }}>Loading orders...</div>}
        <div className="om-tw">
          <table className="om-tbl">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Products</th>
                <th className="hm">Items</th>
                <th>Amount</th>
                <th className="hm">Payment</th>
                <th className="hm">Partner</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && orders.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8' }}>No orders found</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <div className="om-oid">{o.id}</div>
                    <div className="om-odate">{o.date}</div>
                  </td>
                  <td>
                    <div className="om-cust">
                      <Av name={o.customer}/>
                      <div>
                        <div className="om-av-name">{o.customer}</div>
                        <div className="om-av-loc">
                          <MapPin size={10}/>{o.city}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 220 }}>
                      {(() => {
                        const pq = o.productQuantities || {};
                        const ids = Object.keys(pq);
                        if (ids.length === 0) return <span style={{ color:'#94a3b8', fontSize:'.78rem' }}>--</span>;
                        const shown = ids.slice(0, 2);
                        const extra = ids.length - shown.length;
                        return (
                          <div>
                            {shown.map((pid) => {
                              const p = productCache[pid];
                              return (
                                <div key={pid} style={{ marginBottom: 2 }}>
                                  <span style={{ fontSize:'.8rem', fontWeight:600, color:'#0f172a', display:'block', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {p?.name || 'Loading...'}
                                  </span>
                                  {p?.sku && <span style={{ fontSize:'.68rem', color:'#94a3b8', fontFamily:'monospace' }}>{p.sku}</span>}
                                </div>
                              );
                            })}
                            {extra > 0 && <span style={{ fontSize:'.7rem', color:'#6b7280' }}>+{extra} more</span>}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="hm">
                    <div className="om-items">
                      <div className="om-items__ico"><Package size={13} color="#94a3b8" strokeWidth={1.8}/></div>
                      <div className="om-items__n">{o.items} item{o.items > 1 ? 's' : ''}</div>
                    </div>
                  </td>
                  <td className="bo">{o.amount}</td>
                  <td className="mu hm">{o.payment}</td>
                  <td className="mu hm">{o.partner}</td>
                  <td><Bdg label={o.status} cls={STATUS_CLS[o.status] || 'placed'}/></td>
                  <td className="r">
                    <div className="om-acts">
                      <Ib icon={Eye}   cls="v" title="View order" onClick={() => handleViewDetail(o)}/>
                      <Ib icon={Edit2} cls="e" title="Edit status" onClick={() => handleEditStatus(o)}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={totalElements} totalPages={totalPages} pageSize={PER_PAGE}
          prev={() => setPage(p => p - 1)} next={() => setPage(p => p + 1)}/>
      </div>

      {detail && (
        <div className="om-detail-grid">
          <div className="om-col om-g12">
            <div className="om-detail-card">
              <div className="om-detail-card__hd">
                <p className="om-detail-card__hd-t">{detail.id} &mdash; Order Items</p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Bdg label={detail.status} cls={STATUS_CLS[detail.status] || 'placed'}/>
                  <Ib icon={X} cls="d" title="Close" onClick={() => setDetail(null)}/>
                </div>
              </div>
              <div className="om-detail-card__body">
                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '.85rem' }}>Loading product details...</div>
                ) : orderProducts.length > 0 ? (
                  orderProducts.map((product, i) => (
                    <div key={product.id || i} className="om-item-line">
                      <div className="om-item-line__ico">
                        {getPrimaryGalleryImage(product) ? (
                          <img src={getPrimaryGalleryImage(product)} alt={product.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}/>
                        ) : (
                          <Package size={15} color="#94a3b8" strokeWidth={1.6}/>
                        )}
                      </div>
                      <div className="om-f1">
                        <div className="om-item-line__name">{product.name || 'Product unavailable'}</div>
                        <div className="om-item-line__meta">
                          Qty: {product.orderedQty || 1}
                          {product.sku && <>&nbsp;&middot;&nbsp; SKU: {product.sku}</>}
                        </div>
                      </div>
                      <div className="om-item-line__price">
                        Rs.{(product.discountPrice || product.regularPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  [...Array(detail.items)].map((_, i) => (
                    <div key={i} className="om-item-line">
                      <div className="om-item-line__ico">
                        <Package size={15} color="#94a3b8" strokeWidth={1.6}/>
                      </div>
                      <div className="om-f1">
                        <div className="om-item-line__name">Item {i + 1}</div>
                        <div className="om-item-line__meta">Qty: 1</div>
                      </div>
                      <div className="om-item-line__price">
                        Rs.{detail._rawAmount ? Math.round(detail._rawAmount / detail.items).toLocaleString('en-IN') : '--'}
                      </div>
                    </div>
                  ))
                )}
                <div className="om-mt12">
                  <div className="om-sum-row"><span className="om-sum-row__lbl">Subtotal</span><span className="om-sum-row__val">{detail.amount}</span></div>
                  <div className="om-sum-row"><span className="om-sum-row__lbl">Delivery</span><span className="om-sum-row__val" style={{color:'#16a34a'}}>FREE</span></div>
                  <div className="om-sum-row total"><span className="om-sum-row__lbl">Total Paid</span><span className="om-sum-row__val">{detail.amount}</span></div>
                </div>
              </div>
            </div>

            <div className="om-detail-card">
              <div className="om-detail-card__hd">
                <p className="om-detail-card__hd-t">Order Timeline</p>
              </div>
              <div className="om-detail-card__body">
                <div className="om-timeline">
                  {[
                    { label:'Order Placed', done: true },
                    { label:'Order Confirmed', done: true },
                    { label:'Packed', done: ['Packed','Shipped','Delivered'].includes(detail.status) },
                    { label:'Shipped', done: ['Shipped','Delivered'].includes(detail.status) },
                    { label: detail.status === 'Delivered' ? 'Delivered' : 'Out for Delivery', done: detail.status === 'Delivered', curr: detail.status === 'Shipped' },
                  ].map((step, i) => {
                    const isLast = i === 4;
                    const dotCls = step.done ? 'done' : step.curr ? 'curr' : 'pend';
                    return (
                      <div key={i} className="om-tl-step">
                        <div className="om-tl-step__left">
                          <div className={`om-tl-step__dot ${dotCls}`}>
                            {step.done
                              ? <Check size={14} color="#16a34a" strokeWidth={2.5}/>
                              : step.curr
                              ? <Activity size={14} color="#E03E1A" strokeWidth={2.2}/>
                              : <Circle size={10} color="#cbd5e1" strokeWidth={2}/>}
                          </div>
                          {!isLast && <div className={`om-tl-step__line ${step.done ? 'done' : 'pend'}`}/>}
                        </div>
                        <div className="om-tl-step__body">
                          <p className="om-tl-step__title" style={{ color: step.curr ? '#E03E1A' : undefined }}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="om-col om-g12">
            <div className="om-detail-card">
              <div className="om-detail-card__hd">
                <p className="om-detail-card__hd-t">Customer Details</p>
              </div>
              <div className="om-detail-card__body">
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div className="om-av" style={{ background: avatarBg(detail.customer), width:42, height:42, borderRadius:11, fontSize:'.9rem' }}>
                    {initials(detail.customer)}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0f172a' }}>{detail.customer}</div>
                    <div style={{ fontSize:'.73rem', color:'#94a3b8', marginTop:2 }}>{detail.city}</div>
                  </div>
                </div>
                <div className="om-addr">
                  <strong>Delivery Address</strong>
                  123 Sample Lane, {detail.city}, 400001
                  <br/>
                  <span style={{display:'flex', alignItems:'center', gap:4, marginTop:4}}>
                    <Phone size={12} color="#94a3b8"/>+91 98765 00000
                  </span>
                </div>
                <div className="om-divider"/>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <Btn cls="pri" sm icon={Truck} onClick={() => handleEditStatus(detail)}>Update Status</Btn>
                  <Btn cls="out" sm icon={Phone} onClick={() => handleContact(detail)}>Contact</Btn>
                  <Btn cls="warn" sm icon={RotateCcw} onClick={() => handleReturn(detail)}>Return</Btn>
                </div>
              </div>
            </div>

            <div className="om-detail-card">
              <div className="om-detail-card__hd">
                <p className="om-detail-card__hd-t">Payment</p>
              </div>
              <div className="om-detail-card__body">
                <div className="om-sum-row"><span className="om-sum-row__lbl">Method</span><span className="om-sum-row__val">{detail.payment}</span></div>
                <div className="om-sum-row"><span className="om-sum-row__lbl">Amount</span><span className="om-sum-row__val">{detail.amount}</span></div>
                <div className="om-sum-row">
                  <span className="om-sum-row__lbl">Status</span>
                  <span><Bdg label="Paid" cls="delivered"/></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'editStatus' && (
        <div className="om-modal-overlay" onClick={() => setModal(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal__hd">
              <h3>Update Order Status</h3>
              <button className="om-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="om-modal__body">
              <p style={{ marginBottom: 16, color: '#64748b' }}>
                Order: <strong>{modal.order.id}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Placed','Confirmed','Packed','Shipped','Delivered','Cancelled','Returned','Replaced'].map(s => (
                  <button
                    key={s}
                    className="om-modal__opt"
                    onClick={() => handleStatusUpdate(modal.order.id, modal.order._backendId, s)}
                  >
                    <Bdg label={s} cls={STATUS_CLS[s] || 'placed'}/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'contact' && (
        <div className="om-modal-overlay" onClick={() => setModal(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal__hd">
              <h3>Contact Customer</h3>
              <button className="om-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="om-modal__body">
              <p style={{ marginBottom: 12 }}><strong>Customer:</strong> {modal.order.customer}</p>
              <p style={{ marginBottom: 12 }}><strong>Order:</strong> {modal.order.id}</p>
              <p style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8ecf0' }}>
                <strong>Phone:</strong> +91 98765 00000
              </p>
              <button className="om-btn pri" onClick={() => { setModal(null); }} style={{ width: '100%' }}>
                <Phone size={13}/> Call Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'return' && (
        <div className="om-modal-overlay" onClick={() => setModal(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal__hd">
              <h3>Initiate Return</h3>
              <button className="om-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="om-modal__body">
              <p style={{ marginBottom: 12 }}><strong>Order:</strong> {modal.order.id}</p>
              <p style={{ marginBottom: 12 }}><strong>Amount:</strong> {modal.order.amount}</p>
              <p style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8ecf0' }}>
                <strong>Status:</strong> <Bdg label={modal.order.status} cls={STATUS_CLS[modal.order.status] || 'placed'}/>
              </p>
              <textarea
                placeholder="Return reason..."
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #e8ecf0',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  marginBottom: 12,
                  minHeight: 80,
                  fontSize: '.85rem',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="om-btn out" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                <button className="om-btn warn" style={{ flex: 1 }} onClick={() => { setModal(null); }}>
                  Initiate Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReturnsRefunds = () => {
  const [filter, setFilter] = useState('All');
  const [returns, setReturns] = useState([]);
  const [allReturns, setAllReturns] = useState([]);
  const [modal, setModal]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ status: 'RETURN REQUESTED', page: 0, size: 200 });
      setReturns((res.content || []).map(mapReturn));
    } catch {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllReturnStatuses = useCallback(async () => {
    try {
      const res = await getAdminOrders({ page: 0, size: 500 });
      const ret = (res.content || []).filter(o =>
        ['RETURN REQUESTED', 'RETURNED', 'RETURN REJECTED'].includes(o.status)
      );
      setAllReturns(ret);
    } catch { console.warn('Analytics fetch failed'); }
  }, []);

  useEffect(() => {
    fetchReturns();
    fetchAllReturnStatuses();
  }, [fetchReturns, fetchAllReturnStatuses]);

  const mapReturn = (o) => ({
    id: o.orderNumber || `RET-${o.id}`,
    orderId: o.orderNumber || `ORD-${o.id}`,
    customer: o.customerName || '--',
    city: o.deliveryLocation || '--',
    item: `Order #${o.orderNumber || o.id}`,
    amount: 'Rs.' + Number(o.totalAmount || 0).toLocaleString('en-IN'),
    _rawAmount: o.totalAmount,
    reason: o.returnReason || 'No reason provided',
    status: o.status === 'RETURN REQUESTED' ? 'Pending'
          : o.status === 'RETURNED' ? 'Refunded'
          : o.status === 'RETURN REJECTED' ? 'Rejected'
          : o.status || 'Pending',
    date: o.datePlaced
      ? new Date(o.datePlaced).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : '--',
    refundMode: 'Original Payment',
    _backendId: o.id,
  });

  const list = returns.filter(r => filter === 'All' || r.status === filter);

  const updateReturnStatus = async (returnId, backendId, newStatus) => {
    try {
      await apiUpdateOrderStatus(backendId, newStatus);
      toast.success(`Return ${newStatus === 'RETURNED' ? 'approved and refunded' : 'rejected'} successfully`);
      setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: newStatus === 'RETURNED' ? 'Refunded' : 'Rejected' } : r));
      setModal(null);
      fetchReturns();
      fetchAllReturnStatuses();
    } catch {
      toast.error('Failed to update return status');
    }
  };

  const handleApprove = (ret) => updateReturnStatus(ret.id, ret._backendId, 'RETURNED');
  const handleReject = (ret) => updateReturnStatus(ret.id, ret._backendId, 'RETURN REJECTED');
  const handleProcess = (ret) => updateReturnStatus(ret.id, ret._backendId, 'RETURNED');

  const totalReturns = allReturns.length;
  const pendingReview = allReturns.filter(r => r.status === 'RETURN REQUESTED').length;
  const refundAmount = allReturns.reduce((s, r) => s + (r.totalAmount || 0), 0);
  const resolved = allReturns.filter(r => r.status === 'RETURNED').length;
  const approvalRate = totalReturns ? (resolved / totalReturns) * 100 : 0;

  const reasonsMap = {};
  allReturns.forEach(r => {
    const reason = r.returnReason || 'No reason';
    reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
  });
  const reasonStats = Object.entries(reasonsMap).map(([label, count], i) => ({
    label, count,
    pct: totalReturns ? Math.round((count / totalReturns) * 100) : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const statusCounts = {};
  allReturns.forEach(r => {
    const s = r.status === 'RETURN REQUESTED' ? 'Pending'
            : r.status === 'RETURNED' ? 'Refunded'
            : r.status === 'RETURN REJECTED' ? 'Rejected' : r.status;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const refundStatusData = Object.entries(statusCounts).map(([label, val]) => ({
    label, val,
    pct: totalReturns ? Math.round((val / totalReturns) * 100) : 0,
    color: ({ Refunded: '#16a34a', Approved: '#2563eb', Processing: '#d97706', Pending: '#f59e0b', Rejected: '#dc2626' })[label] || '#64748b',
  }));

  return (
    <div className="om-sub">
      <div className="om-kpi-grid">
        <Kpi label="Total Returns"  value={String(totalReturns)}       trend="All time" up={false} Icon={RotateCcw}  color="#db2777" bg="#fce7f3"/>
        <Kpi label="Pending Review" value={String(pendingReview)}      trend="Awaiting" up={false} Icon={Clock}      color="#d97706" bg="#fef3c7"/>
        <Kpi label="Refund Amount"  value={'Rs.' + Number(refundAmount).toLocaleString('en-IN')} trend="Total" up={false} Icon={DollarSign} color="#dc2626" bg="#fee2e2"/>
        <Kpi label="Approval Rate"  value={approvalRate.toFixed(1) + '%'} trend={resolved + ' resolved'} up Icon={TrendingUp} color="#16a34a" bg="#dcfce7"/>
      </div>

      <div className="om-card">
        <Sh title="Returns & Refunds" sub="Manage return requests and process customer refunds">
          <SearchBar placeholder="Search order ID, customer..."/>
          <Pills opts={['All','Pending','Approved','Processing','Rejected','Refunded']} val={filter} set={setFilter}/>
          <Btn cls="out" icon={Download} onClick={() => exportCSV([
            ['Return ID','Order ID','Customer','City','Amount','Reason','Status','Date'],
            ...list.map(r => [r.id, r.orderId, r.customer, r.city, r.amount, r.reason, r.status, r.date])
          ], 'returns.csv')}>Export</Btn>
        </Sh>

        {loading && <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>Loading...</div>}
        {!loading && list.length === 0 && <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>No returns found</div>}

        <div className="om-col om-g10">
          {list.map(r => (
            <div key={r.id} className="om-rcard">
              <div className="om-rcard__ico">
                <RotateCcw size={20} color="#db2777" strokeWidth={1.8}/>
              </div>
              <div className="om-rcard__info">
                <div className="om-rcard__top">
                  <div>
                    <div className="om-rcard__name">{r.item}</div>
                    <div className="om-rcard__id">{r.id} &nbsp;&middot;&nbsp; {r.orderId}</div>
                  </div>
                  <Bdg label={r.status} cls={STATUS_CLS[r.status] || 'pending'}/>
                </div>
                <div className="om-rcard__meta">
                  <span><User size={11}/>{r.customer}, {r.city}</span>
                  <span><DollarSign size={11}/>{r.amount}</span>
                  <span><Calendar size={11}/>{r.date}</span>
                  <span><RefreshCw size={11}/>{r.refundMode}</span>
                </div>
                <div className="om-rcard__reason">
                  <AlertTriangle size={12} color="#92400e" style={{ flexShrink:0, marginTop:1 }}/>
                  <span>{r.reason}</span>
                </div>
              </div>
              <div className="om-rcard__acts">
                {r.status === 'Pending' && (
                  <>
                    <Btn cls="suc" sm onClick={() => handleApprove(r)}><Check size={12}/>Approve</Btn>
                    <Btn cls="dan" sm onClick={() => handleReject(r)}><X size={12}/>Reject</Btn>
                  </>
                )}
                {r.status === 'Approved' && <Btn cls="warn" sm icon={RefreshCw} onClick={() => handleProcess(r)}>Process</Btn>}
                <Ib icon={Eye} cls="v" title="View order" onClick={() => setModal({ type: 'viewReturn', return: r })}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="om-2col">
        <div className="om-card">
          <Sh title="Return Reasons" sub="Top reasons for product returns"/>
          <div className="om-stat-list">
            {reasonStats.map((r, i) => <StatBar key={i} label={r.label} val={r.count} pct={r.pct} color={r.color}/>)}
          </div>
        </div>
        <div className="om-card">
          <Sh title="Refund Status" sub="Current refund processing breakdown"/>
          <div className="om-stat-list">
            {refundStatusData.map((s, i) => <StatBar key={i} label={s.label} val={s.val} pct={s.pct} color={s.color}/>)}
          </div>
        </div>
      </div>

      {modal?.type === 'viewReturn' && (
        <div className="om-modal-overlay" onClick={() => setModal(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal__hd">
              <h3>Return Details</h3>
              <button className="om-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="om-modal__body">
              <p style={{ marginBottom: 12 }}><strong>Return ID:</strong> {modal.return.id}</p>
              <p style={{ marginBottom: 12 }}><strong>Order:</strong> {modal.return.orderId}</p>
              <p style={{ marginBottom: 12 }}><strong>Item:</strong> {modal.return.item}</p>
              <p style={{ marginBottom: 12 }}><strong>Amount:</strong> {modal.return.amount}</p>
              <p style={{ marginBottom: 12 }}><strong>Reason:</strong> {modal.return.reason}</p>
              <p style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8ecf0' }}>
                <strong>Status:</strong> <Bdg label={modal.return.status} cls={STATUS_CLS[modal.return.status] || 'pending'}/>
              </p>
              <button className="om-btn out" style={{ width: '100%' }} onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Cancellations = () => {
  const [filter, setFilter] = useState('All');
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal]   = useState(null);

  const BY = ['All','Customer','System','Admin','Vendor'];

  const fetchCancellations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ status: 'CANCELLED', page: 0, size: 200 });
      setCancellations((res.content || []).map(o => ({
        id: o.orderNumber || `CAN-${o.id}`,
        orderId: o.orderNumber || `ORD-${o.id}`,
        customer: o.customerName || '--',
        city: o.deliveryLocation || '--',
        items: o.additionalItems != null ? o.additionalItems + 1 : 1,
        amount: 'Rs.' + Number(o.totalAmount || 0).toLocaleString('en-IN'),
        _rawAmount: o.totalAmount,
        reason: o.returnReason || 'Cancelled',
        cancelledBy: 'Customer',
        date: o.datePlaced
          ? new Date(o.datePlaced).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
          : '--',
        refundStatus: 'N/A',
        _backendId: o.id,
      })));
    } catch {
      toast.error('Failed to load cancellations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCancellations();
  }, [fetchCancellations]);

  const list = cancellations.filter(c => filter === 'All' || c.cancelledBy === filter);

  const handleProcessRefund = async (cancellation) => {
    try {
      await apiUpdateOrderStatus(cancellation._backendId, 'REFUNDED');
      toast.success('Refund processed');
      setCancellations(prev => prev.map(c => c.id === cancellation.id ? { ...c, refundStatus: 'Refunded' } : c));
      setModal(null);
    } catch {
      toast.error('Failed to process refund');
    }
  };

  const refundCls = s => ({ Refunded:'refunded', Pending:'pending', 'N/A':'na' }[s] || 'pending');

  const totalCancelled = cancellations.length;

  return (
    <div className="om-sub">
      <div className="om-kpi-grid">
        <Kpi label="Total Cancelled"   value={String(totalCancelled)} trend="All time" up={false} Icon={XCircle}    color="#dc2626" bg="#fee2e2"/>
        <Kpi label="Cancellation Rate" value={totalCancelled > 0 ? 'Active' : '0%'}  trend="Tracked" up Icon={TrendingUp}  color="#16a34a" bg="#dcfce7"/>
      </div>

      <div className="om-card">
        <Sh title="Cancellations" sub="Review all cancelled orders and manage refunds">
          <SearchBar placeholder="Search order ID, customer..."/>
          <Pills opts={BY} val={filter} set={setFilter}/>
          <Btn cls="out" icon={Download} onClick={() => exportCSV([
            ['Cancellation ID','Order ID','Customer','City','Items','Amount','Reason','Cancelled By','Date'],
            ...list.map(c => [c.id, c.orderId, c.customer, c.city, c.items, c.amount, c.reason, c.cancelledBy, c.date])
          ], 'cancellations.csv')}>Export</Btn>
        </Sh>

        {loading && <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>Loading...</div>}
        {!loading && list.length === 0 && <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>No cancellations found</div>}

        <div className="om-col om-g10">
          {list.map(c => (
            <div key={c.id} className="om-canc">
              <div className="om-canc__ico">
                <XCircle size={20} color="#dc2626" strokeWidth={1.8}/>
              </div>
              <div className="om-canc__info">
                <div className="om-canc__name">{c.orderId}</div>
                <div className="om-canc__id">{c.id}</div>
                <div className="om-canc__meta">
                  <span><User size={11}/>{c.customer}, {c.city}</span>
                  <span><Package size={11}/>{c.items} item{c.items > 1 ? 's' : ''}</span>
                  <span><DollarSign size={11}/>{c.amount}</span>
                  <span><Calendar size={11}/>{c.date}</span>
                  <span><Users size={11}/>By: {c.cancelledBy}</span>
                </div>
                <div className="om-canc__reason">{c.reason}</div>
              </div>
              <div className="om-canc__acts">
                <Bdg label={c.refundStatus} cls={refundCls(c.refundStatus)}/>
                {c.refundStatus === 'Pending' && <Btn cls="suc" sm icon={DollarSign} onClick={() => handleProcessRefund(c)}>Refund</Btn>}
                <Ib icon={Eye} cls="v" title="View order" onClick={() => setModal({ type: 'viewCancel', cancel: c })}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal?.type === 'viewCancel' && (
        <div className="om-modal-overlay" onClick={() => setModal(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal__hd">
              <h3>Cancellation Details</h3>
              <button className="om-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="om-modal__body">
              <p style={{ marginBottom: 12 }}><strong>Cancellation ID:</strong> {modal.cancel.id}</p>
              <p style={{ marginBottom: 12 }}><strong>Order:</strong> {modal.cancel.orderId}</p>
              <p style={{ marginBottom: 12 }}><strong>Customer:</strong> {modal.cancel.customer}</p>
              <p style={{ marginBottom: 12 }}><strong>Items:</strong> {modal.cancel.items}</p>
              <p style={{ marginBottom: 12 }}><strong>Amount:</strong> {modal.cancel.amount}</p>
              <p style={{ marginBottom: 12 }}><strong>Reason:</strong> {modal.cancel.reason}</p>
              <p style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8ecf0' }}>
                <strong>Status:</strong> <Bdg label={modal.cancel.refundStatus} cls={refundCls(modal.cancel.refundStatus)}/>
              </p>
              <button className="om-btn out" style={{ width: '100%' }} onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DeliveryPartners = () => {
  const [sel, setSel] = useState(0);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryPartners();
      setPartners(data || []);
    } catch {
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const partner = partners[sel];

  const activePartners = partners.filter(p => p.status === 'Active').length;
  const totalDeliveries = partners.reduce((s, p) => s + (p.delivered || 0), 0);
  const avgSuccess = partners.length ? Math.round(partners.reduce((s, p) => s + (p.rating || 0) * 20, 0) / partners.length) : 0;

  return (
    <div className="om-sub">
      <div className="om-kpi-grid">
        <Kpi label="Active Partners"  value={String(activePartners)} trend="Active" up Icon={Truck}       color="#2563eb" bg="#dbeafe"/>
        <Kpi label="Total Deliveries" value={totalDeliveries.toLocaleString('en-IN')} trend="All time" up Icon={Package}     color="#16a34a" bg="#dcfce7"/>
        <Kpi label="Avg Success Rate" value={avgSuccess + '%'} trend="Average" up Icon={CheckCircle} color="#d97706" bg="#fef3c7"/>
        <Kpi label="Total Partners"   value={String(partners.length)} trend="Registered" up Icon={Users}       color="#7c3aed" bg="#ede9fe"/>
      </div>

      <div className="om-card">
        <Sh title="Delivery Partners" sub="Manage logistics partners and performance metrics">
          <Btn cls="pri" icon={Plus}>Add Partner</Btn>
        </Sh>

        {loading && <div style={{ textAlign:'center', padding:'24px', color:'#94a3b8' }}>Loading delivery partners...</div>}

        {!loading && partners.length === 0 && <div style={{ textAlign:'center', padding:'24px', color:'#94a3b8' }}>No delivery partners found</div>}

        <div className="om-dp-grid">
          {partners.map((p, i) => (
            <div
              key={p.id}
              className={`om-dpcard${sel === i ? ' sel' : ''}`}
              style={{ borderColor: sel === i ? (p.color || '#2563eb') : undefined, boxShadow: sel === i ? `0 0 0 2px ${(p.color || '#2563eb')}22` : undefined }}
              onClick={() => setSel(i)}
            >
              <div className="om-dpcard__hd">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="om-dpcard__logo" style={{ background: p.color || '#2563eb' }}>{p.code || p.name.slice(0,2).toUpperCase()}</div>
                  <div className="om-dpcard__info">
                    <p className="om-dpcard__name">{p.name}</p>
                    <p className="om-dpcard__zone">{p.coverage}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <Bdg label={p.status || 'Inactive'} cls={(p.status || 'Inactive') === 'Active' ? 'active' : 'inactive'}/>
                </div>
              </div>

              <div className="om-dpcard__stats">
                <div className="om-dpcard__stat">
                  <div className="om-dpcard__stat-val">{p.delivered?.toLocaleString() || 0}</div>
                  <div className="om-dpcard__stat-lbl">Deliveries</div>
                </div>
                <div className="om-dpcard__stat">
                  <div className="om-dpcard__stat-val">{p.activeOrders || 0}</div>
                  <div className="om-dpcard__stat-lbl">Pending</div>
                </div>
                <div className="om-dpcard__stat">
                  <div className="om-dpcard__stat-val">{p.rating ? Math.round(p.rating * 20) + '%' : '—'}</div>
                  <div className="om-dpcard__stat-lbl">Success</div>
                </div>
                <div className="om-dpcard__stat">
                  <div className="om-dpcard__stat-val">{p.avgDays ? p.avgDays + 'd' : '—'}</div>
                  <div className="om-dpcard__stat-lbl">Avg Days</div>
                </div>
              </div>

              <div className="om-dpcard__bar-wrap">
                <div className="om-dpcard__bar-lbl">
                  <span>Rating</span><span>{p.rating || '—'}/5</span>
                </div>
                <div className="om-dpcard__bar">
                  <div className="om-dpcard__bar-fill" style={{ width: `${(p.rating || 0) / 5 * 100}%`, background: p.color || '#2563eb' }}/>
                </div>
              </div>

              <div className="om-dpcard__tags">
                <span style={{fontSize:'.69rem',fontWeight:600,padding:'3px 8px',borderRadius:'999px',background:'#f1f5f9',border:'1px solid #e8ecf0',color:'#64748b'}}>{p.coverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {partner && (
        <div className="om-card">
          <Sh title={`${partner.name} — Details`} sub="Partner information and performance">
            <Bdg label={partner.status || 'Inactive'} cls={(partner.status || 'Inactive') === 'Active' ? 'active' : 'inactive'}/>
          </Sh>

          <div className="om-2col om-mt16">
            <div>
              <p style={{fontSize:'.82rem',fontWeight:700,color:'#0f172a',marginBottom:12}}>Performance</p>
              <div className="om-stat-list">
                {[
                  { label:'Delivered on Time', pct: partner.rating ? Math.round(partner.rating * 20) : 0, color: partner.color || '#2563eb' },
                  { label:'Avg Days', pct: partner.avgDays ? Math.round((3 - partner.avgDays) / 3 * 100) : 0, color: '#d97706' },
                ].map((s, i) => <StatBar key={i} label={s.label} pct={Math.min(s.pct, 100)} color={s.color}/>)}
              </div>
            </div>
            <div>
              <p style={{fontSize:'.82rem',fontWeight:700,color:'#0f172a',marginBottom:12}}>Quick Info</p>
              <div className="om-col om-g8">
                {[
                  { label:'Coverage',          val: partner.coverage || '—' },
                  { label:'Avg Delivery',      val: partner.avgDays ? `${partner.avgDays} days` : '—' },
                  { label:'Total Deliveries',  val: partner.delivered?.toLocaleString() || 0 },
                  { label:'Currently Pending', val: partner.activeOrders || 0 },
                ].map((row, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', padding:'5px 0', borderBottom:'1px solid #f1f5f9' }}>
                    <span style={{color:'#94a3b8'}}>{row.label}</span>
                    <span style={{fontWeight:600,color:'#0f172a'}}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrderManagement() {
  const [dashStats, setDashStats] = useState(null);

  useEffect(() => {
    getAdminDashboardStats().then(setDashStats).catch(() => {});
  }, []);

  return (
    <div className="om">
      <div className="om-hdr">
        <div>
          <h2 className="om-hdr__t">Order Management</h2>
          <p className="om-hdr__s">Track orders, manage returns, cancellations and delivery partners.</p>
        </div>
        <div className="om-hdr__a">
          <Btn cls="pri" icon={RefreshCw}>Refresh</Btn>
        </div>
      </div>

      <AllOrders dashStats={dashStats}/>
    </div>
  );
}
