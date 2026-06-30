import React, { useState, useEffect } from 'react';
import { getTaxReportDashboard, getGSTR1, getGSTR3B, downloadTaxReportCsv } from '../../api/api';
import { BarChart3, Download, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function AdminTaxReports() {
  const [dashboard, setDashboard] = useState(null);
  const [reportType, setReportType] = useState('dashboard');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(today.toISOString().split('T')[0]);
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getTaxReportDashboard();
      setDashboard(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const fn = reportType === 'gstr1' ? getGSTR1 : getGSTR3B;
      const data = await fn(periodStart, periodEnd);
      setReportData(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleExport = () => {
    downloadTaxReportCsv(reportType.toUpperCase(), periodStart, periodEnd);
  };

  const summary = dashboard || {};
  const cur = summary.currentMonthData?.summary || {};
  const prev = summary.previousMonthData?.summary || {};

  return (
    <div className="nl">
      <div className="nl-hdr">
        <div>
          <h2 className="nl-hdr__title">Tax & Fiscal Reports</h2>
          <p className="nl-hdr__sub">GSTR-1, GSTR-3B reports with period filtering and CSV export</p>
        </div>
      </div>

      {/* Dashboard KPI Cards */}
      {dashboard && (
        <div className="nl-kpis" style={{ marginBottom: 20 }}>
          <div className="nl-kpi">
            <div className="nl-kpi__icon" style={{ background: '#fff0ed' }}><DollarSign size={18} color="#E03E1A" /></div>
            <div>
              <div className="nl-kpi__val">₹{(cur.outwardSupplies || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}</div>
              <div className="nl-kpi__lbl">Current Period Revenue</div>
            </div>
          </div>
          <div className="nl-kpi">
            <div className="nl-kpi__icon" style={{ background: '#f0fdf4' }}>
              {summary.taxGrowth > 0 ? <TrendingUp size={18} color="#16a34a" /> : <TrendingDown size={18} color="#dc2626" />}
            </div>
            <div>
              <div className="nl-kpi__val">{summary.taxGrowth || 0}%</div>
              <div className="nl-kpi__lbl">Tax Growth vs Prev Month</div>
            </div>
          </div>
          <div className="nl-kpi">
            <div className="nl-kpi__icon" style={{ background: '#eff6ff' }}><BarChart3 size={18} color="#2563eb" /></div>
            <div>
              <div className="nl-kpi__val">₹{(summary.ytdTaxPayable || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}</div>
              <div className="nl-kpi__lbl">YTD Tax Payable</div>
            </div>
          </div>
          <div className="nl-kpi">
            <div className="nl-kpi__icon" style={{ background: '#fef9ec' }}><AlertCircle size={18} color="#d97706" /></div>
            <div>
              <div className="nl-kpi__val">₹{(cur.totalTaxPayable || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}</div>
              <div className="nl-kpi__lbl">Current Tax Payable</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Controls */}
      <div className="nl-card" style={{ marginBottom: 16 }}>
        <div className="nl-hdr" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="ad-select" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="dashboard">Dashboard Overview</option>
              <option value="gstr1">GSTR-1 (Outward Supplies)</option>
              <option value="gstr3b">GSTR-3B (Summary Return)</option>
            </select>
            <input type="date" className="ad-search-input" style={{ width: 150 }} value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input type="date" className="ad-search-input" style={{ width: 150 }} value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            <button className="vm-btn vm-btn--primary" onClick={reportType === 'dashboard' ? loadDashboard : loadReport}>
              <BarChart3 size={13} color="#fff" /> Generate
            </button>
            {reportType !== 'dashboard' && (
              <button className="vm-btn vm-btn--outline" onClick={handleExport}>
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading && <div className="ad-state"><div className="ad-spinner" />Loading report...</div>}

      {reportData && !loading && (
        <div className="nl-card">
          <div className="nl-card__hdr">
            <div>
              <div className="nl-card__title">{reportData.reportType}</div>
              <div className="nl-card__sub">Period: {reportData.period}</div>
            </div>
          </div>

          {/* Summary */}
          {reportData.summary && (
            <div className="analytics-kpi-row" style={{ marginBottom: 20 }}>
              {Object.entries(reportData.summary).map(([key, val]) => (
                <div key={key} className="kpi-card">
                  <div className="kpi-value" style={{ fontSize: '1rem' }}>{typeof val === 'number' ? `₹${val.toLocaleString('en-IN', {maximumFractionDigits:2})}` : val}</div>
                  <div className="kpi-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
                </div>
              ))}
            </div>
          )}

          {/* Rate Wise Summary */}
          {reportData.rateWiseSummary && reportData.rateWiseSummary.length > 0 && (
            <div className="nl-tw">
              <table className="nl-tbl">
                <thead>
                  <tr><th>Tax Rate</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>CESS</th><th>Total Tax</th></tr>
                </thead>
                <tbody>
                  {reportData.rateWiseSummary.map((row, i) => (
                    <tr key={i}>
                      <td className="nl-bold">{row.rate}%</td>
                      <td>₹{row.taxableValue.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      <td>₹{row.cgst.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      <td>₹{row.sgst.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      <td>₹{row.igst.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      <td>₹{row.cess.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      <td className="nl-bold">₹{row.totalTax.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* B2B / B2C Invoices */}
          {reportData.b2bInvoices && reportData.b2bInvoices.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 8 }}>B2B Invoices ({reportData.b2bInvoices.length})</h4>
              <div className="nl-tw">
                <table className="nl-tbl">
                  <thead>
                    <tr><th>Order</th><th>Date</th><th>Customer</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th></tr>
                  </thead>
                  <tbody>
                    {reportData.b2bInvoices.map((inv, i) => (
                      <tr key={i}>
                        <td className="nl-bold">{inv.orderNumber}</td>
                        <td>{inv.date}</td>
                        <td>{inv.customerName}</td>
                        <td>₹{inv.taxableValue.toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                        <td>₹{inv.cgst.toFixed(2)}</td>
                        <td>₹{inv.sgst.toFixed(2)}</td>
                        <td>₹{inv.igst.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!dashboard && !reportData && !loading && (
        <div className="ad-state">
          <BarChart3 size={48} /> Select a report type and click Generate to view data.
        </div>
      )}
    </div>
  );
}
