import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import VendorLayout from '../../components/vendor/VendorLayout';
import * as XLSX from 'xlsx';
import { getVendorOwnPayouts, getVendorEligibleOrders, submitVendorWithdrawalRequest, log, logError } from '../../api/api';
import './VendorPayouts.css';

const IconTrendingUp = () => (
  <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
);
const IconWallet = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
);
const IconSearch = () => (
  <svg className="vp-search-icon" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);

const VendorPayouts = () => {
  const [activeTab, setActiveTab] = useState('Transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [payouts, setPayouts] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [ineligibleOrders, setIneligibleOrders] = useState([]);
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEligibleOrders = () => {
    getVendorEligibleOrders().then((res) => {
      setEligibleOrders(res.orders || []);
      setIneligibleOrders(res.ineligibleOrders || []);
      setEligibleTotal(res.totalGrossAmount || 0);
    }).catch((err) => {
      logError('VENDOR_PAGE', 'Eligible orders fetch failed:', err.message);
    });
  };

  useEffect(() => {
    log('VENDOR_PAGE', 'VendorPayouts mounted');
    setFetchError(null);
    getVendorOwnPayouts().then(setPayouts).catch((err) => {
      logError('VENDOR_PAGE', 'VendorPayouts fetch failed:', err.message);
      setFetchError(err.message);
    });
    loadEligibleOrders();
  }, []);

  const filteredPayouts = useMemo(
    () => payouts.filter(item => String(item.payoutId || item.id).toLowerCase().includes(searchTerm.toLowerCase())),
    [payouts, searchTerm]
  );

  const parseAmount = (val) => {
    if (!val) return 0;
    const num = parseFloat(val.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const totalEarnings = payouts.reduce((s, i) => s + parseAmount(i.netAmount != null ? i.netAmount : i.amount), 0);
  const totalCharges = payouts.reduce((s, i) => s + (parseAmount(i.commission) + parseAmount(i.fee) + parseAmount(i.tds) + parseAmount(i.penalty)), 0);
  const totalNet = payouts.reduce((s, i) => s + parseAmount(i.netAmount != null ? i.netAmount : i.amount), 0);

  const getFormattedDate = () => new Date().toISOString().slice(0, 10);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const data = activeTab === 'Transactions' ? filteredPayouts : eligibleOrders;
    const isOrders = activeTab === 'Withdrawal';
    w.document.write(`
      <html><head><title>${isOrders ? 'Eligible Orders' : 'Payout Report'}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px}
        h2{color:#006d77}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ccc;padding:10px;text-align:left}
        th{background:#008a99;color:#fff}
        .bold{font-weight:bold}
      </style></head><body>
      <h2>EmpowerHome — ${isOrders ? 'Eligible Orders for Withdrawal' : 'Payout Report'}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>
        ${isOrders ? '<th>Order ID</th><th>Order Number</th><th>Amount</th><th>Delivered</th><th>Lock Days</th>' : '<th>Payout ID</th><th>Gross Amount</th><th>Commission</th><th>Charges</th><th>Net Payment</th><th>Date</th><th>Status</th>'}
      </tr></thead><tbody>
      ${data.map(item => {
        if (isOrders) {
          return `<tr><td>${item.id}</td><td>${item.orderNumber}</td><td>&#8377;${parseAmount(item.totalAmount).toLocaleString()}</td><td>${item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString() : '—'}</td><td>${item.withdrawalLockDays || 90}</td></tr>`;
        }
        const gross = parseAmount(item.grossAmount);
        const comm = parseAmount(item.commission);
        const net = parseAmount(item.netAmount != null ? item.netAmount : item.amount);
        return `<tr><td class="bold">${item.payoutId || item.id}</td><td>&#8377;${gross.toLocaleString()}</td><td>&#8377;${comm.toLocaleString()}</td><td>&#8377;0</td><td class="bold">&#8377;${net.toLocaleString()}</td><td>${item.date}</td><td>${item.status || '—'}</td></tr>`;
      }).join('')}
      </tbody></table></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const toSheet = () => {
    if (activeTab === 'Withdrawal') {
      return eligibleOrders.map(item => ({
        'Order ID': item.id,
        'Order Number': item.orderNumber,
        'Amount': parseAmount(item.totalAmount),
        'Delivered': item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString() : '',
        'Lock Days': item.withdrawalLockDays || 90,
      }));
    }
    return filteredPayouts.map(item => ({
      'Payout ID': item.payoutId || item.id,
      'Gross': parseAmount(item.grossAmount),
      'Commission': parseAmount(item.commission),
      'Charges': 0,
      'Net Payout': parseAmount(item.netAmount != null ? item.netAmount : item.amount),
      'Date': item.date,
      'Status': item.status || '',
    }));
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toSheet()), activeTab === 'Withdrawal' ? 'EligibleOrders' : 'Payouts');
    XLSX.writeFile(wb, `${activeTab === 'Withdrawal' ? 'Eligible_Orders' : 'Vendor_Payouts'}_${getFormattedDate()}.xlsx`);
  };

  const handleExportCSV = () => {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(toSheet()));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `${activeTab === 'Withdrawal' ? 'Eligible_Orders' : 'Vendor_Payouts'}_${getFormattedDate()}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAdminRequest = async () => {
    if (selectedRows.size === 0) return;
    setSubmitting(true);
    try {
      const orderIds = Array.from(selectedRows).map(Number);
      const result = await submitVendorWithdrawalRequest(orderIds);
      toast.success('Withdrawal request sent to admin successfully.');
      setSelectedRows(new Set());
      const res = await getVendorEligibleOrders();
      setEligibleOrders(res.orders || []);
      setIneligibleOrders(res.ineligibleOrders || []);
      setEligibleTotal(res.totalGrossAmount || 0);
      getVendorOwnPayouts().then(setPayouts).catch(() => {});
    } catch (error) {
      toast.error('Failed to send withdrawal request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (id) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  const formatDate = (epoch) => {
    if (!epoch) return '—';
    return new Date(epoch).toLocaleDateString();
  };

  const remainingDays = (remainingMs) => {
    if (!remainingMs || remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  };

  const selectedAmount = Array.from(selectedRows).reduce((sum, id) => {
    const order = eligibleOrders.find(o => o.id === id);
    return sum + (order ? parseAmount(order.totalAmount) : 0);
  }, 0);

  return (
    <VendorLayout>
      <div className="vp-container">
        <div className="vp-card-wrapper">

          {/* ── Header ── */}
          <header className="vp-header-flex">
            <div>
              <h2 className="vp-page-title">
                {activeTab === 'Transactions' ? 'Payments History' : 'Withdrawal Request'}
              </h2>
              <p className="vp-page-subtitle">
                {activeTab === 'Transactions'
                  ? 'View and export your complete transaction ledger.'
                  : 'Select eligible delivered orders to request a withdrawal.'}
              </p>
            </div>
            <div className="vp-tab-pills">
              <button
                className={activeTab === 'Transactions' ? 'active' : ''}
                onClick={() => setActiveTab('Transactions')}
              >
                Ledger Book
              </button>
              <button
                className={activeTab === 'Withdrawal' ? 'active' : ''}
                onClick={() => setActiveTab('Withdrawal')}
              >
                Withdrawal
              </button>
            </div>
          </header>

          {/* ── Stat Cards ── */}
          <div className="vp-stats-row">
            <div className="vp-stat-card">
              <div className="vp-stat-top-row">
                <div className="vp-stat-icon-box"><IconTrendingUp /></div>
              </div>
              <div className="vp-stat-label">Total Earnings (Net Paid)</div>
              <div className="vp-stat-value">&#8377;{totalEarnings.toLocaleString()}</div>
            </div>

            <div className="vp-stat-card">
              <div className="vp-stat-top-row">
                <div className="vp-stat-icon-box"><IconTag /></div>
              </div>
              <div className="vp-stat-label">Total Deductions</div>
              <div className="vp-stat-value">&#8377;{totalCharges.toLocaleString()}</div>
            </div>

            <div className="vp-stat-card">
              <div className="vp-stat-top-row">
                <div className="vp-stat-icon-box"><IconWallet /></div>
              </div>
              <div className="vp-stat-label">Available for Withdrawal</div>
              <div className="vp-stat-value">&#8377;{eligibleTotal.toLocaleString()}</div>
            </div>
          </div>

          {/* ── Main Table Card ── */}
          <div className="vp-main-card">
            {activeTab === 'Withdrawal' && eligibleTotal > 0 && (
              <p className="vp-pending-label">
                Available for Withdrawal: <strong>&#8377;{eligibleTotal.toLocaleString()}</strong>
                &nbsp;(from {eligibleOrders.length} eligible orders)
              </p>
            )}

            {fetchError && (
              <div className="vp-error" style={{ padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', marginBottom: '16px' }}>
                Failed to load data: {fetchError}
              </div>
            )}

            {/* Toolbar */}
            <div className="vp-table-tools">
              <div className="vp-export-btns">
                <button onClick={handlePrint} className="btn-export">PRINT</button>
                <button onClick={handleExportExcel} className="btn-export">EXCEL</button>
                <button onClick={handleExportCSV} className="btn-export">CSV</button>
              </div>
              <div className="vp-search-wrap">
                <IconSearch />
                <input
                  type="text"
                  placeholder={activeTab === 'Withdrawal' ? 'Search Order ID...' : 'Search Payout ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="vp-scrollable-table">
              {activeTab === 'Withdrawal' ? (
                <>
                  {eligibleOrders.length > 0 && (
                    <>
                      <p style={{padding: '8px 18px', fontWeight: 600, color: '#16a34a', fontSize: '.85rem'}}>
                        Eligible Orders (lock period passed)
                      </p>
                      <table className="vp-table">
                        <thead><tr>
                          <th>Select</th>
                          <th>Order ID</th>
                          <th>Order Number</th>
                          <th>Amount</th>
                          <th>Delivered On</th>
                          <th>Lock Days</th>
                        </tr></thead>
                        <tbody>
                          {eligibleOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(order.id)}
                                  onChange={() => toggleRow(order.id)}
                                />
                              </td>
                              <td className="vp-order-id">{order.id}</td>
                              <td>{order.orderNumber}</td>
                              <td>&#8377;{parseAmount(order.totalAmount).toLocaleString()}</td>
                              <td>{formatDate(order.deliveredAt)}</td>
                              <td>{order.withdrawalLockDays || 90}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {ineligibleOrders.length > 0 && (
                    <>
                      <p style={{padding: '8px 18px', fontWeight: 600, color: '#92400e', fontSize: '.85rem', marginTop: 16}}>
                        Locked Orders (awaiting release)
                      </p>
                      <table className="vp-table">
                        <thead><tr>
                          <th></th>
                          <th>Order ID</th>
                          <th>Order Number</th>
                          <th>Amount</th>
                          <th>Delivered On</th>
                          <th>Lock Days</th>
                          <th>Releases In</th>
                        </tr></thead>
                        <tbody>
                          {ineligibleOrders.map((order) => (
                            <tr key={order.id} className="row-locked">
                              <td><IconLock /></td>
                              <td className="vp-order-id">{order.id}</td>
                              <td>{order.orderNumber}</td>
                              <td>&#8377;{parseAmount(order.totalAmount).toLocaleString()}</td>
                              <td>{formatDate(order.deliveredAt)}</td>
                              <td>{order.withdrawalLockDays || 90}</td>
                              <td>
                                <span className="vp-lock-tag">
                                  {remainingDays(order.remainingLockMs)} days remaining
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {eligibleOrders.length === 0 && ineligibleOrders.length === 0 && !fetchError && (
                    <p className="vp-empty">No delivered orders found.</p>
                  )}
                </>
              ) : (
                <table className="vp-table">
                  <thead><tr>
                    <th>Payout ID</th>
                    <th>Gross Amount</th>
                    <th>Commission</th>
                    <th>TDS</th>
                    <th>Net Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    {filteredPayouts.map((item) => (
                      <tr key={item.id}>
                        <td className="vp-order-id">{item.payoutId || item.id}</td>
                        <td>&#8377;{parseAmount(item.grossAmount).toLocaleString()}</td>
                        <td>&#8377;{parseAmount(item.commission).toLocaleString()}</td>
                        <td>&#8377;{parseAmount(item.tds).toLocaleString()}</td>
                        <td className="vp-bold">&#8377;{parseAmount(item.netAmount != null ? item.netAmount : item.amount).toLocaleString()}</td>
                        <td>{item.date}</td>
                        <td><span className={`vp-status-badge vp-status-${(item.status || '').toLowerCase()}`}>{item.status || '—'}</span></td>
                      </tr>
                    ))}
                    {!fetchError && filteredPayouts.length === 0 && (
                      <tr><td colSpan="7" className="vp-empty">No records found matching your search.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'Withdrawal' && (
              <div className="vp-footer">
                <p className="vp-note">
                  <strong>Calculation Preview:</strong> Selected: &#8377;{selectedAmount.toLocaleString()} |
                  Commission and TDS will be calculated by admin upon processing.
                </p>
                <button
                  className="vp-request-btn"
                  disabled={selectedRows.size === 0 || submitting}
                  onClick={handleAdminRequest}
                >
                  {submitting ? 'SUBMITTING...' : `REQUEST WITHDRAWAL (${selectedRows.size} orders)`}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorPayouts;
