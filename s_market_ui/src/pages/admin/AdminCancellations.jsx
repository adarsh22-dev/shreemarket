import React, { useState, useEffect, useCallback } from 'react';
import { getAdminOrders } from '../../api/api';
import toast from 'react-hot-toast';
import './AdminCancellations.css';

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const initials  = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const avatarBg  = n => PALETTE[n.charCodeAt(0) % PALETTE.length];
const fmt       = n => 'Rs.' + Number(n).toLocaleString('en-IN');

const formatDate = (epoch) => {
  if (!epoch) return '—';
  return new Date(epoch).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const cls = status === 'Cancelled' ? 'app' : 'pend';
  return <span className={`cn-bdg cn-bdg--${cls}`}><span className="cn-bdg__dot"/>{status}</span>;
};

const ByBadge = ({ by }) => {
  const cls = { Customer:'cust', Vendor:'vend', System:'sys', Admin:'sys' }[by] || 'sys';
  return <span className={`cn-by cn-by--${cls}`}>{by}</span>;
};

const deriveCancelledBy = (order) => {
  const reasons = {
    customer: 'Customer',
    vendor: 'Vendor',
    system: 'System',
    admin: 'System',
    payment: 'System',
  };
  const reason = (order.returnReason || '').toLowerCase();
  for (const [key, val] of Object.entries(reasons)) {
    if (reason.includes(key)) return val;
  }
  return '—';
};

const PAGE_SIZE = 10;

export default function AdminCancellations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const fetchCancellations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ status: 'CANCELLED', page, size: PAGE_SIZE, search });
      const orders = (res.content || []).map(order => ({
        id: order.orderNumber || `CAN-${order.id}`,
        orderId: order.orderNumber || `ORD-${order.id}`,
        customer: order.customerName || 'Unknown',
        city: order.deliveryLocation || '—',
        amount: order.totalAmount || 0,
        reason: order.returnReason || 'Cancelled',
        cancelledBy: deriveCancelledBy(order),
        status: order.status === 'CANCELLED' ? 'Cancelled' : (order.status || 'Cancelled'),
        date: formatDate(order.datePlaced),
      }));
      setData(orders);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load cancellations');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCancellations();
  }, [fetchCancellations]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div className="cn">

      <div className="cn-hdr">
        <div>
          <h2 className="cn-hdr__title">Cancelled Orders</h2>
          <p className="cn-hdr__sub">{totalElements} cancellation{totalElements !== 1 ? 's' : ''} total</p>
        </div>
        <div>
          <input
            type="text"
            className="modal-input"
            placeholder="Search cancellations..."
            value={search}
            onChange={handleSearch}
            style={{ minWidth: 220 }}
          />
        </div>
      </div>

      <div className="cn-card">
        <div className="cn-tw">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No cancellations found.</div>
          ) : (
          <table className="cn-tbl">
            <thead>
              <tr>
                <th className="cn-th">Product Info</th>
                <th className="cn-th cn-hm">Customer</th>
                <th className="cn-th">Amount</th>
                <th className="cn-th cn-hm">Date</th>
                <th className="cn-th">Cancelled By</th>
                <th className="cn-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id} className="cn-tr">
                  <td className="cn-td">
                    <div className="cn-prod">
                      <div className="cn-prod__text">
                        <span className="cn-prod__name">{c.orderId}</span>
                        <span className="cn-prod__id">{c.reason}</span>
                      </div>
                    </div>
                  </td>
                  <td className="cn-td cn-hm">
                    <div className="cn-cust">
                      <div className="cn-cust__av" style={{ background: avatarBg(c.customer) }}>{initials(c.customer)}</div>
                      <div>
                        <div className="cn-cust__name">{c.customer}</div>
                        <div className="cn-cust__city">{c.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cn-td"><span className="cn-amt">{fmt(c.amount)}</span></td>
                  <td className="cn-td cn-hm"><span className="cn-date">{c.date}</span></td>
                  <td className="cn-td"><ByBadge by={c.cancelledBy}/></td>
                  <td className="cn-td"><StatusBadge status={c.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            <button
              className="modal-btn modal-btn--secondary"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="modal-btn modal-btn--secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
