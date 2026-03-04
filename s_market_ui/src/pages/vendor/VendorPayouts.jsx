import React, { useState, useMemo } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import * as XLSX from 'xlsx';
import './VendorPayouts.css';

/* ── Inline SVG Icons (no emoji, no external deps) ── */
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

  const [data] = useState([
    { id: 'ORD-826041', earnings: 3400, charges: 136, payment: 3264, date: '2025-10-10' },
    { id: 'ORD-826189', earnings: 1850, charges: 74, payment: 1776, date: '2025-11-15' },
    { id: 'ORD-826478', earnings: 2150, charges: 86, payment: 2064, date: '2026-01-20' },
    { id: 'ORD-826504', earnings: 980, charges: 39, payment: 941, date: '2026-02-15' },
  ]);

  const today = new Date('2026-02-24');

  const checkEligibility = (dateStr) => {
    const diffDays = Math.ceil((today - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return diffDays >= 90;
  };

  const filteredData = useMemo(
    () => data.filter(item => item.id.toLowerCase().includes(searchTerm.toLowerCase())),
    [data, searchTerm]
  );

  const totalEarnings = data.reduce((s, i) => s + i.earnings, 0);
  const totalCharges = data.reduce((s, i) => s + i.charges, 0);
  const totalNet = data.reduce((s, i) => s + i.payment, 0);

  const getFormattedDate = () => new Date().toISOString().slice(0, 10);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Payout Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px}
        h2{color:#006d77}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ccc;padding:10px;text-align:left}
        th{background:#008a99;color:#fff}
        .oid{color:#e53935;font-weight:bold}
        .bold{font-weight:bold}
        .locked{color:#666;font-style:italic}
      </style></head><body>
      <h2>EmpowerHome — Payout Report</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>
        <th>Order ID</th><th>My Earnings</th><th>Charges</th><th>Net Payment</th><th>Date</th>
      </tr></thead><tbody>
      ${filteredData.map(item => `
        <tr>
          <td class="oid">${item.id}</td>
          <td>&#8377;${item.earnings.toLocaleString()}</td>
          <td>&#8377;${item.charges.toLocaleString()}</td>
          <td class="bold">&#8377;${item.payment.toLocaleString()}</td>
          <td>${item.date}${!checkEligibility(item.date) ? ' <span class="locked">(Locked - 90 days)</span>' : ''}</td>
        </tr>`).join('')}
      </tbody></table></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const toSheet = () =>
    filteredData.map(item => ({
      'Order ID': item.id,
      Earnings: item.earnings,
      Charges: item.charges,
      'Net Payout': item.payment,
      Date: item.date,
      Status: checkEligibility(item.date) ? 'Eligible' : 'Locked (90 days)',
    }));

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toSheet()), 'Payouts');
    XLSX.writeFile(wb, `Vendor_Payouts_${getFormattedDate()}.xlsx`);
  };

  const handleExportCSV = () => {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(toSheet()));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `Vendor_Payouts_${getFormattedDate()}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAdminRequest = () => {
    alert(`Withdrawal request for ${selectedRows.size} order(s) sent to admin.`);
    setSelectedRows(new Set());
  };

  const toggleRow = (id) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

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
                  : 'Select eligible orders to request a withdrawal.'}
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
                <span className="vp-stat-badge positive">+4% from last month</span>
              </div>
              <div className="vp-stat-label">Total Earnings</div>
              <div className="vp-stat-value">&#8377;{totalEarnings.toLocaleString()}</div>
            </div>

            <div className="vp-stat-card">
              <div className="vp-stat-top-row">
                <div className="vp-stat-icon-box"><IconTag /></div>
                <span className="vp-stat-badge negative">-2% from last month</span>
              </div>
              <div className="vp-stat-label">Total Charges</div>
              <div className="vp-stat-value">&#8377;{totalCharges.toLocaleString()}</div>
            </div>

            <div className="vp-stat-card">
              <div className="vp-stat-top-row">
                <div className="vp-stat-icon-box"><IconWallet /></div>
                <span className="vp-stat-badge positive">+1.8% from last month</span>
              </div>
              <div className="vp-stat-label">Net Payout</div>
              <div className="vp-stat-value">&#8377;{totalNet.toLocaleString()}</div>
            </div>
          </div>

          {/* ── Profile Completeness ── */}
          <div className="vp-completeness-box">
            <div className="vp-flex-between">
              <span>Profile Completeness</span>
              <span>42%</span>
            </div>
            <div className="vp-bar-outer">
              <div className="vp-bar-inner" style={{ width: '42%' }} />
            </div>
          </div>

          {/* ── Main Table Card ── */}
          <div className="vp-main-card">
            {activeTab === 'Withdrawal' && (
              <p className="vp-pending-label">
                Pending Withdrawals: <strong>&#8377;272,040.00</strong>
              </p>
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
                  placeholder="Search Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="vp-scrollable-table">
              <table className="vp-table">
                <thead>
                  <tr>
                    {activeTab === 'Withdrawal' && <th>Select</th>}
                    <th>Order ID</th>
                    <th>My Earnings</th>
                    <th>Charges</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => {
                    const eligible = checkEligibility(item.date);
                    return (
                      <tr
                        key={item.id}
                        className={!eligible && activeTab === 'Withdrawal' ? 'row-locked' : ''}
                      >
                        {activeTab === 'Withdrawal' && (
                          <td>
                            <input
                              type="checkbox"
                              disabled={!eligible}
                              checked={selectedRows.has(item.id)}
                              onChange={() => toggleRow(item.id)}
                            />
                          </td>
                        )}
                        <td className="vp-order-id">{item.id}</td>
                        <td>&#8377;{item.earnings.toLocaleString()}</td>
                        <td>&#8377;{item.charges.toLocaleString()}</td>
                        <td className="vp-bold">&#8377;{item.payment.toLocaleString()}</td>
                        <td>
                          {item.date}
                          {!eligible && (
                            <span className="vp-lock-tag">
                              <IconLock />
                              Locked (90 Days)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <p className="vp-empty">No records found matching your search.</p>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'Withdrawal' && (
              <div className="vp-footer">
                <p className="vp-note">
                  ** Withdrawal charges will be re-calculated depending upon total amount.
                </p>
                <button
                  className="vp-request-btn"
                  disabled={selectedRows.size === 0}
                  onClick={handleAdminRequest}
                >
                  REQUEST
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