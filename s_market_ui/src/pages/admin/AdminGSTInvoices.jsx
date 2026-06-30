import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import './AdminGSTInvoices.css';
import { Icon, initials, avatarBg, fmt } from './VendorShared';
import {
  getGSTInvoices, createGSTInvoice, updateGSTInvoice,
  updateGSTInvoiceStatus, deleteGSTInvoice
} from '../../api/api';

const FILTERS = ['All', 'issued', 'pending', 'paid', 'overdue', 'cancelled'];
const PER = 8;

const recalc = (f) => {
  const gross = Number(f.gross) || 0;
  const commission = Number(f.commission) || 0;
  const gstOnComm = f.type === 'tax' ? Math.round(commission * 0.18) : 0;
  const netComm = commission + gstOnComm;
  const tds = Math.round(gross * 0.01);
  const netPayout = gross - netComm - tds;
  return { ...f, gstOnComm, netComm, tds, netPayout };
};

export default function GSTInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [exp, setExp] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  /* ── Load ── */
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getGSTInvoices();
      setInvoices(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  /* ── Derived data ── */
  const list = useMemo(() => invoices.filter(i =>
    (filter === 'All' || i.status === filter) &&
    (!search ||
      i.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      i.vendor.toLowerCase().includes(search.toLowerCase()) ||
      (i.gstin || '').toLowerCase().includes(search.toLowerCase()))
  ), [invoices, filter, search]);

  const pages = Math.ceil(list.length / PER) || 1;
  const slice = list.slice(page * PER, (page + 1) * PER);

  const totals = useMemo(() => {
    const active = invoices.filter(i => i.status !== 'cancelled');
    return {
      totalGST: active.reduce((s, i) => s + (i.gstOnComm || 0), 0),
      totalTDS: active.reduce((s, i) => s + (i.tds || 0), 0),
      totalComm: active.reduce((s, i) => s + (i.netComm || 0), 0),
      overdue: invoices.filter(i => i.status === 'overdue').length,
    };
  }, [invoices]);

  /* ── Monthly GST chart ── */
  const monthlyGST = useMemo(() => {
    const map = {};
    invoices.filter(i => i.status !== 'cancelled').forEach(i => {
      const m = i.period || 'Unknown';
      map[m] = (map[m] || 0) + (i.gstOnComm || 0);
    });
    return Object.entries(map).slice(-6).map(([m, v]) => ({ m, v }));
  }, [invoices]);

  const maxG = Math.max(...monthlyGST.map(x => x.v), 1);

  /* ── Edit handlers ── */
  const openEdit = inv => {
    setEditModal(inv);
    setForm({ ...inv });
  };

  const handleChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (['gross', 'commission', 'type'].includes(field)) return recalc(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const payload = recalc(form);
      await updateGSTInvoice(editModal.id, payload);
      setInvoices(prev => prev.map(i => i.id === editModal.id ? { ...i, ...payload } : i));
      toast.success(`Invoice ${editModal.invoiceId} updated`);
      setEditModal(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update invoice');
    }
  };

  /* ── Status update ── */
  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await updateGSTInvoiceStatus(id, status);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: updated.status } : i));
      toast.success(`Status updated to "${status}"`);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  /* ── Generate new invoice ── */
  const handleGenerate = async () => {
    const now = new Date();
    const due = new Date(now.getTime() + 10 * 86400000);
    const fmtDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    try {
      const created = await createGSTInvoice(recalc({
        invoiceId: `INV-${now.getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
        vendor: 'New Vendor', gstin: '', period: now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        gross: 10000, commission: 700, gstOnComm: 0, netComm: 700, tds: 100, netPayout: 9200,
        type: 'simple', status: 'pending', issued: fmtDate(now), due: fmtDate(due),
      }));
      setInvoices(prev => [created, ...prev]);
      toast.success(`${created.invoiceId} created`);
      setFilter('All');
      setPage(0);
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice');
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGSTInvoice(deleteId);
      setInvoices(prev => prev.filter(i => i.id !== deleteId));
      toast.success('Invoice deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  };

  /* ── Download All ── */
  const handleDownloadAll = () => {
    const rows = [
      ['Invoice ID', 'Vendor', 'GSTIN', 'Period', 'Gross', 'Commission', 'GST', 'TDS', 'Net Payout', 'Type', 'Status', 'Issued', 'Due'],
      ...invoices.map(i => [i.invoiceId, i.vendor, i.gstin || '', i.period || '', i.gross, i.commission, i.gstOnComm, i.tds, i.netPayout, i.type, i.status, i.issued, i.due])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gst_invoices.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  /* ── PDF download ── */
  const handlePDF = inv => {
    const content = `INVOICE: ${inv.invoiceId}\nVendor: ${inv.vendor}\nGSTIN: ${inv.gstin || 'N/A'}\nPeriod: ${inv.period}\nGross: Rs.${inv.gross}\nCommission: Rs.${inv.commission}\nGST: Rs.${inv.gstOnComm}\nTDS: Rs.${inv.tds}\nNet Payout: Rs.${inv.netPayout}\nStatus: ${inv.status}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.invoiceId}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${inv.invoiceId} downloaded`);
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">GST &amp; Invoices</h2>
          <p className="vm-hdr__sub">Manage tax invoices, GST deductions, TDS and compliance across all vendors</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleDownloadAll}>
            <Icon name="Download" size={13} color="#475569" />Download All
          </button>
          <button className="vm-btn vm-btn--primary" onClick={handleGenerate}>
            <Icon name="FileText" size={13} color="#fff" />Generate Invoice
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="gi-info-row">
        <div className="gi-info-card gi-info-card--blue">
          <div className="gi-info-card__icon"><Icon name="Percent" size={16} color="#2563eb" /></div>
          <div><div className="gi-info-card__val">18% GST</div><div className="gi-info-card__lbl">Applied on commission for GST-registered vendors</div></div>
        </div>
        <div className="gi-info-card gi-info-card--amber">
          <div className="gi-info-card__icon"><Icon name="Shield" size={16} color="#d97706" /></div>
          <div><div className="gi-info-card__val">1% TDS</div><div className="gi-info-card__lbl">Tax Deducted at Source on gross vendor sales</div></div>
        </div>
        <div className="gi-info-card gi-info-card--green">
          <div className="gi-info-card__icon"><Icon name="FileText" size={16} color="#16a34a" /></div>
          <div><div className="gi-info-card__val">Tax Invoice</div><div className="gi-info-card__lbl">Issued to GST-registered vendors; simple invoice otherwise</div></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label: 'GST Collected', value: fmt(totals.totalGST), sub: 'from commission', icon: 'Percent', c: '#2563eb', bg: '#dbeafe' },
          { label: 'TDS Deducted', value: fmt(totals.totalTDS), sub: 'at 1% on gross', icon: 'Shield', c: '#d97706', bg: '#fef3c7' },
          { label: 'Total Comm + Tax', value: fmt(totals.totalComm), sub: 'net deducted', icon: 'DollarSign', c: '#16a34a', bg: '#dcfce7' },
          { label: 'Overdue Invoices', value: totals.overdue, sub: 'action required', icon: 'AlertCircle', c: '#dc2626', bg: '#fee2e2' },
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{ background: k.bg }}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1} />
              </div>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
              <div className="vm-kpi__sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Invoice Register</p>
            <p className="vm-sh__sub">{list.length} invoices found</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8" /></span>
              <input className="vm-search__input" placeholder="Search invoice, vendor, GSTIN…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <div className="vm-pills">
              {FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Vendor / GSTIN</th>
                <th>Period</th>
                <th>Gross Sales</th>
                <th>Commission</th>
                <th>GST (18%)</th>
                <th>TDS (1%)</th>
                <th>Net Payout</th>
                <th>Type</th>
                <th>Due</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading invoices...</td></tr>
              ) : slice.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No invoices found</td></tr>
              ) : slice.map(inv => (
                <React.Fragment key={inv.id}>
                  <tr className={exp === inv.id ? 'gi-row--exp' : ''}>
                    <td className="vm-mn">{inv.invoiceId}</td>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{ background: avatarBg(inv.vendor) }}>{initials(inv.vendor)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{inv.vendor}</div>
                          <div style={{ fontSize: '.67rem', color: '#94a3b8', fontFamily: 'monospace' }}>{inv.gstin || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vm-mu">{inv.period}</td>
                    <td className="vm-bo">{fmt(inv.gross)}</td>
                    <td style={{ fontSize: '.81rem', color: '#E03E1A', fontWeight: 700 }}>-{fmt(inv.commission)}</td>
                    <td style={{ fontSize: '.81rem', color: inv.gstOnComm > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
                      {inv.gstOnComm > 0 ? `-${fmt(inv.gstOnComm)}` : '—'}
                    </td>
                    <td style={{ fontSize: '.81rem', color: '#d97706', fontWeight: 600 }}>-{fmt(inv.tds)}</td>
                    <td className="vm-bo" style={{ color: '#16a34a' }}>{fmt(inv.netPayout)}</td>
                    <td>
                      <span className={`gi-type gi-type--${inv.type}`}>
                        {inv.type === 'tax' ? 'Tax Invoice' : 'Simple Inv.'}
                      </span>
                    </td>
                    <td className="vm-mu" style={{ color: inv.status === 'overdue' ? '#dc2626' : 'inherit', fontWeight: inv.status === 'overdue' ? 700 : 400 }}>
                      {inv.due}
                    </td>
                    <td>
                      <span className={`vm-badge vm-badge--${inv.status}`}>
                        <span className="vm-badge__dot" />
                        {inv.status[0].toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="vm-td-r">
                      <div className="vm-acts">
                        <button className="vm-ib vm-ib--edit" title="Edit invoice" onClick={() => openEdit(inv)}>
                          <Icon name="Edit2" size={13} />
                        </button>
                        <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => handlePDF(inv)}>
                          <Icon name="Download" size={11} color="#475569" />PDF
                        </button>
                        <button className="vm-ib vm-ib--del" title="Delete" onClick={() => setDeleteId(inv.id)}>
                          <Icon name="Trash2" size={13} />
                        </button>
                        <button className={`vm-ib ${exp === inv.id ? 'vm-ib--active' : ''}`}
                          onClick={() => setExp(exp === inv.id ? null : inv.id)}>
                          <Icon name={exp === inv.id ? 'ChevronUp' : 'ChevronDown'} size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {exp === inv.id && (
                    <tr className="gi-detail-row">
                      <td colSpan={12}>
                        <div className="gi-detail">
                          <div className="gi-detail__cols">
                            <div>
                              <div className="gi-detail__sec">Deduction Breakdown</div>
                              {[
                                { l: 'Gross Sales', v: fmt(inv.gross), c: '#0f172a' },
                                { l: 'Commission Deducted', v: `-${fmt(inv.commission)}`, c: '#E03E1A' },
                                { l: 'GST on Commission (18%)', v: inv.gstOnComm > 0 ? `-${fmt(inv.gstOnComm)}` : 'N/A', c: inv.gstOnComm > 0 ? '#dc2626' : '#94a3b8' },
                                { l: 'TDS @ 1%', v: `-${fmt(inv.tds)}`, c: '#d97706' },
                                { l: 'Net Vendor Payout', v: fmt(inv.netPayout), c: '#16a34a' },
                              ].map((r, i) => (
                                <div key={i} className="gi-detail__row"
                                  style={{ borderTop: i === 4 ? '1px solid #e8ecf0' : 'none', paddingTop: i === 4 ? 8 : 0, marginTop: i === 4 ? 4 : 0 }}>
                                  <span className="gi-detail__lbl">{r.l}</span>
                                  <span className="gi-detail__val" style={{ color: r.c }}>{r.v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="gi-detail__sec">Invoice Details</div>
                              {[
                                { l: 'Invoice No.', v: inv.invoiceId },
                                { l: 'GSTIN', v: inv.gstin || 'N/A' },
                                { l: 'Invoice Type', v: inv.type === 'tax' ? 'Tax Invoice' : 'Simple Invoice' },
                                { l: 'Billing Period', v: inv.period },
                                { l: 'Issue Date', v: inv.issued },
                                { l: 'Due Date', v: inv.due },
                              ].map((r, i) => (
                                <div key={i} className="gi-detail__row">
                                  <span className="gi-detail__lbl">{r.l}</span>
                                  <span className="gi-detail__val" style={{ fontFamily: 'monospace' }}>{r.v}</span>
                                </div>
                              ))}
                              <div className="gi-detail__row" style={{ marginTop: 8 }}>
                                <span className="gi-detail__lbl">Quick Status</span>
                                <div className="gi-status-btns">
                                  {['pending', 'issued', 'paid', 'overdue', 'cancelled'].map(s => (
                                    <button key={s}
                                      className={`gi-status-btn gi-status-btn--${s}${inv.status === s ? ' gi-status-btn--on' : ''}`}
                                      onClick={() => handleUpdateStatus(inv.id, s)}>
                                      {s[0].toUpperCase() + s.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{page * PER + 1}–{Math.min((page + 1) * PER, list.length)} of {list.length}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12} />
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER >= list.length}>
              <Icon name="ChevRight" size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* GST Chart */}
      <div className="vm-card">
        <p className="vm-sh__title" style={{ marginBottom: 4 }}>Monthly GST Collected</p>
        <p className="vm-sh__sub" style={{ marginBottom: 16 }}>GST on platform commission</p>
        <div className="vm-bchart">
          {monthlyGST.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No invoice data yet</div>
          ) : monthlyGST.map((m, i) => {
            const isLast = i === monthlyGST.length - 1;
            const h = Math.max(12, Math.round((m.v / maxG) * 90));
            return (
              <div key={i} className="vm-bchart__col">
                <span className="vm-bchart__num">{m.v >= 1000 ? `${(m.v / 1000).toFixed(0)}K` : m.v}</span>
                <div className="vm-bchart__bar" style={{
                  height: h,
                  background: isLast ? '#E03E1A' : '#f1f5f9',
                  border: isLast ? 'none' : '1px solid #e8ecf0',
                  boxShadow: isLast ? '0 2px 10px rgba(224,62,26,.3)' : 'none',
                }} />
                <span className="vm-bchart__lbl">{m.m}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="vm-overlay" onClick={() => setEditModal(null)}>
          <div className="vm-modal gi-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Edit Invoice</p>
                <p className="vm-modal__sub">{editModal.invoiceId} · {editModal.vendor}</p>
              </div>
              <button className="vm-ib" onClick={() => setEditModal(null)}><Icon name="X" size={14} /></button>
            </div>
            <div className="gi-modal-body">
              <div className="gi-form-grid">
                <div className="gi-field gi-span-2">
                  <label className="gi-label">Vendor Name</label>
                  <input className="gi-input" type="text" value={form.vendor}
                    onChange={e => handleChange('vendor', e.target.value)} autoFocus />
                </div>
                <div className="gi-field">
                  <label className="gi-label">GSTIN</label>
                  <input className="gi-input" type="text" value={form.gstin || ''}
                    onChange={e => handleChange('gstin', e.target.value)} />
                </div>
                <div className="gi-field">
                  <label className="gi-label">Billing Period</label>
                  <input className="gi-input" type="text" value={form.period || ''}
                    onChange={e => handleChange('period', e.target.value)} />
                </div>
              </div>
              <div className="gi-form-grid">
                <div className="gi-field">
                  <label className="gi-label">Gross Sales (Rs.)</label>
                  <input className="gi-input" type="number" value={form.gross}
                    onChange={e => handleChange('gross', e.target.value)} min={0} />
                </div>
                <div className="gi-field">
                  <label className="gi-label">Commission (Rs.)</label>
                  <input className="gi-input" type="number" value={form.commission}
                    onChange={e => handleChange('commission', e.target.value)} min={0} />
                </div>
              </div>
              <div className="gi-form-grid">
                <div className="gi-field">
                  <label className="gi-label">Invoice Type</label>
                  <select className="gi-input gi-select" value={form.type}
                    onChange={e => handleChange('type', e.target.value)}>
                    <option value="tax">Tax Invoice (GST-registered)</option>
                    <option value="simple">Simple Invoice</option>
                  </select>
                </div>
                <div className="gi-field">
                  <label className="gi-label">Status</label>
                  <select className="gi-input gi-select" value={form.status}
                    onChange={e => handleChange('status', e.target.value)}>
                    <option value="issued">Issued</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="gi-form-grid">
                <div className="gi-field">
                  <label className="gi-label">Issue Date</label>
                  <input className="gi-input" type="text" value={form.issued || ''}
                    onChange={e => handleChange('issued', e.target.value)} />
                </div>
                <div className="gi-field">
                  <label className="gi-label">Due Date</label>
                  <input className="gi-input" type="text" value={form.due || ''}
                    onChange={e => handleChange('due', e.target.value)} />
                </div>
              </div>
              <div className="gi-calc-preview">
                <div className="gi-calc-preview__title">Auto-calculated values</div>
                <div className="gi-calc-preview__grid">
                  {[
                    { l: 'GST on Commission', v: fmt(recalc(form).gstOnComm) || '—', c: '#dc2626' },
                    { l: 'TDS (1%)', v: fmt(recalc(form).tds), c: '#d97706' },
                    { l: 'Net Commission', v: fmt(recalc(form).netComm), c: '#E03E1A' },
                    { l: 'Net Payout', v: fmt(recalc(form).netPayout), c: '#16a34a' },
                  ].map((r, i) => (
                    <div key={i} className="gi-calc-preview__item">
                      <span className="gi-calc-preview__lbl">{r.l}</span>
                      <span className="gi-calc-preview__val" style={{ color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="gi-modal-footer">
                <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
                <button className="vm-btn vm-btn--primary" style={{ flex: 1 }} onClick={handleSave}>
                  <Icon name="Check" size={13} color="#fff" />Save Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteId && (
        <div className="vm-overlay" onClick={() => setDeleteId(null)}>
          <div className="vm-modal gi-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <p className="vm-modal__title">Delete Invoice</p>
              <button className="vm-ib" onClick={() => setDeleteId(null)}><Icon name="X" size={14} /></button>
            </div>
            <div style={{ padding: '16px 20px', fontSize: 14, color: '#475569' }}>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </div>
            <div className="gi-modal-footer">
              <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="vm-btn vm-btn--danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
