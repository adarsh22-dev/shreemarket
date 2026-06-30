import React, { useState } from 'react';
import { getSalesReport, getAdminProductsReport, getVendorReport, downloadReportCsv } from '../../api/api';
import { BarChart3, Download, Package, Store } from 'lucide-react';

export default function AdminReportBuilder() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      let result;
      if (reportType === 'sales') result = await getSalesReport(startDate, endDate);
      else if (reportType === 'products') result = await getAdminProductsReport('', '');
      else result = await getVendorReport('revenue', 'desc');
      setData(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportReport = async () => {
    if (data) await downloadReportCsv(data);
  };

  const dailyBk = data?.dailyBreakdown || [];

  return (
    <div className="nl">
      <div className="nl-hdr">
        <div>
          <h2 className="nl-hdr__title">Advanced Report Builder</h2>
          <p className="nl-hdr__sub">Custom date-range sales, products, and vendor performance reports</p>
        </div>
      </div>

      <div className="nl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="ad-select" value={reportType} onChange={e => setReportType(e.target.value)}>
            <option value="sales">Sales Report</option>
            <option value="products">Products Report</option>
            <option value="vendors">Vendor Performance</option>
          </select>
          {reportType === 'sales' && (
            <>
              <input type="date" className="ad-search-input" style={{ width: 150 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span style={{ color: '#94a3b8' }}>to</span>
              <input type="date" className="ad-search-input" style={{ width: 150 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </>
          )}
          <button className="vm-btn vm-btn--primary" onClick={generateReport}>
            <BarChart3 size={13} color="#fff" /> Generate
          </button>
          {data && (
            <button className="vm-btn vm-btn--outline" onClick={exportReport}>
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && <div className="ad-state"><div className="ad-spinner" />Generating report...</div>}

      {data && !loading && (
        <div className="nl-card">
          <div className="nl-card__hdr">
            <div>
              <div className="nl-card__title">{data.reportType}</div>
              <div className="nl-card__sub">Generated: {data.generatedAt}</div>
            </div>
          </div>

          {/* KPIs */}
          <div className="analytics-kpi-row" style={{ marginBottom: 20 }}>
            {data.totalRevenue !== undefined && (
              <div className="kpi-card">
                <div className="kpi-value">₹{(data.totalRevenue || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}</div>
                <div className="kpi-label">Total Revenue</div>
              </div>
            )}
            {data.totalOrders !== undefined && (
              <div className="kpi-card">
                <div className="kpi-value">{data.totalOrders}</div>
                <div className="kpi-label">Total Orders</div>
              </div>
            )}
            {data.totalProducts !== undefined && (
              <div className="kpi-card">
                <div className="kpi-value">{data.totalProducts}</div>
                <div className="kpi-label">Total Products</div>
              </div>
            )}
            {data.totalVendors !== undefined && (
              <div className="kpi-card">
                <div className="kpi-value">{data.totalVendors}</div>
                <div className="kpi-label">Total Vendors</div>
              </div>
            )}
          </div>

          {/* Daily Breakdown (Sales) */}
          {dailyBk.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 8 }}>Daily Breakdown</h4>
              <div className="nl-tw">
                <table className="nl-tbl">
                  <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Tax</th></tr></thead>
                  <tbody>
                    {dailyBk.map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td className="nl-bold">{d.orders}</td>
                        <td>₹{(d.revenue || 0).toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                        <td>₹{(d.tax || 0).toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products List */}
          {data.products && data.products.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 8 }}>Product Details ({data.products.length})</h4>
              <div className="nl-tw">
                <table className="nl-tbl">
                  <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.products.slice(0, 50).map((p, i) => (
                      <tr key={i}>
                        <td className="nl-bold">{p.name}</td>
                        <td>{p.sku}</td>
                        <td>{p.category}</td>
                        <td>₹{(p.discountPrice || p.regularPrice || 0).toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                        <td>{p.stock}</td>
                        <td><span className={`mk-badge`} style={{background: p.status === 'in' ? '#dcfce7' : '#fee2e2', color: p.status === 'in' ? '#16a34a' : '#dc2626'}}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vendors List */}
          {data.vendors && data.vendors.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 8 }}>Vendor Performance ({data.vendors.length})</h4>
              <div className="nl-tw">
                <table className="nl-tbl">
                  <thead><tr><th>Name</th><th>Status</th><th>Revenue</th><th>Orders</th><th>Products</th><th>Tier</th></tr></thead>
                  <tbody>
                    {data.vendors.map((v, i) => (
                      <tr key={i}>
                        <td className="nl-bold">{v.name}</td>
                        <td><span className="mk-badge" style={{background: v.status === 'Active' ? '#dcfce7' : '#fee2e2', color: v.status === 'Active' ? '#16a34a' : '#dc2626'}}>{v.status}</span></td>
                        <td>₹{(v.revenue || 0).toLocaleString('en-IN', {maximumFractionDigits:2})}</td>
                        <td>{v.orders}</td>
                        <td>{v.products}</td>
                        <td>{v.tier || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
