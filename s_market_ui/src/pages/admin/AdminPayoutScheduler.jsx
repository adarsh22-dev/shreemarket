import React, { useState, useEffect, useCallback } from 'react';
import './AdminPayoutScheduler.css';
import { Icon, initials, avatarBg, fmt } from './VendorShared';
import { getPayoutSchedules, createPayoutSchedule, updatePayoutSchedule, deletePayoutSchedule, runScheduleNow, executeScheduledPayouts } from '../../api/api';
import toast from 'react-hot-toast';

const freqColor = f => f==='weekly'?'#16a34a': f==='biweekly'?'#2563eb': f==='monthly'?'#d97706':'#94a3b8';
const freqBg    = f => f==='weekly'?'#dcfce7': f==='biweekly'?'#dbeafe': f==='monthly'?'#fef3c7':'#f1f5f9';

const DAY_OPTIONS = {
  weekly:     ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  biweekly:   ['1st & 15th','1st & 16th','2nd & 17th'],
  monthly:    ['1st','5th','10th','15th','20th','25th','Last day'],
  'on-request':['—'],
};

export default function PayoutScheduler() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayoutSchedules();
      const data = Array.isArray(res) ? res : (res.content || []);
      setRows(data);
    } catch (e) {
      toast.error('Failed to load payout schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const schedules = rows.map(r => ({
    id: r.scheduleId || r.id,
    vendor: r.vendorName,
    tier: r.tier,
    frequency: r.frequency,
    day: r.day,
    method: r.method,
    bank: r.bank,
    threshold: r.threshold,
    nextRun: r.nextRun,
    lastRun: r.lastRun,
    status: r.status,
    autoApprove: r.autoApprove,
    dbId: r.id,
  }));

  const active  = schedules.filter(r => r.status === 'active').length;
  const weekly  = schedules.filter(r => r.frequency === 'weekly').length;

  const upcoming = schedules
    .filter(r => r.nextRun && r.nextRun !== '—')
    .reduce((acc, r) => {
      const key = r.nextRun;
      const existing = acc.find(a => a.date === key);
      if (existing) {
        existing.count += 1;
        existing.total += Number(r.threshold) || 0;
      } else {
        acc.push({ date: key, count: 1, total: Number(r.threshold) || 0 });
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    });

  const nextAmt = upcoming.length > 0 ? upcoming[0].total : 0;

  const toggle = async id => {
    const row = schedules.find(r => r.id === id);
    if (!row) return;
    const newStatus = row.status === 'active' ? 'paused' : 'active';
    try {
      await updatePayoutSchedule(row.dbId, { ...row, status: newStatus });
      toast.success(`Schedule ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      fetchSchedules();
    } catch (e) {
      toast.error('Failed to update schedule');
    }
  };

  const openModal = r => {
    setModal(r);
    setForm({
      frequency:   r.frequency,
      day:         r.day,
      method:      r.method,
      bank:        r.bank,
      threshold:   r.threshold,
      autoApprove: r.autoApprove,
      nextRun:     r.nextRun,
    });
  };

  const handleChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === 'frequency') {
        updated.day = DAY_OPTIONS[value]?.[0] ?? '—';
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!modal) return;
    try {
      await updatePayoutSchedule(modal.dbId, {
        ...form,
        threshold: Number(form.threshold) || modal.threshold,
      });
      toast.success('Schedule updated');
      setModal(null);
      fetchSchedules();
    } catch (e) {
      toast.error('Failed to save schedule');
    }
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Payout Scheduler</h2>
          <p className="vm-hdr__sub">Configure automated payout schedules per vendor — weekly, bi-weekly or monthly</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => toast('Global settings — coming soon')}><Icon name="Settings" size={13} color="#475569"/>Global Settings</button>
          <button className="vm-btn vm-btn--primary" onClick={() => setModal({})}><Icon name="Plus" size={13} color="#fff"/>Add Schedule</button>
          <button className="vm-btn vm-btn--success" onClick={async () => {
            try {
              toast.loading('Running all due schedules...');
              const result = await executeScheduledPayouts('Admin', 1);
              toast.dismiss();
              toast.success(`Executed \${result.batchesProcessed || 0} schedule(s)`);
              fetchSchedules();
            } catch { toast.error('Failed to execute schedules'); }
          }}><Icon name="Zap" size={13} color="#fff"/>Run All Due</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Active Schedules',   value: active,                              sub:`${schedules.length - active} paused`,  icon:'Clock',       c:'#16a34a', bg:'#dcfce7' },
          { label:'Weekly Schedules',   value: weekly,                              sub:'run every Monday',                icon:'Calendar',    c:'#2563eb', bg:'#dbeafe' },
          { label:'Next Batch',         value: fmt(nextAmt),                        sub:`${upcoming.length > 0 ? upcoming[0].count : 0} vendors`,    icon:'Zap',         c:'#d97706', bg:'#fef3c7' },
          { label:'Auto-Approved',      value: schedules.filter(r=>r.autoApprove).length, sub:'no manual step',                icon:'CheckCircle', c:'#7c3aed', bg:'#ede9fe' },
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{ background: k.bg }}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
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

      {/* Upcoming */}
      <div className="vm-card">
        <p className="vm-sh__title" style={{ marginBottom: 4 }}>Upcoming Payout Runs</p>
        <p className="vm-sh__sub"   style={{ marginBottom: 16 }}>Next scheduled batches</p>
        {loading ? (
          <p className="vm-sh__sub">Loading...</p>
        ) : (
          <div className="ps-upcoming">
            {upcoming.length === 0 && <p className="vm-sh__sub">No upcoming runs</p>}
            {upcoming.map((u, i) => (
              <div key={i} className={`ps-upcoming__item ${i === 0 ? 'ps-upcoming__item--next' : ''}`}>
                <div className="ps-upcoming__date">{u.date}</div>
                <div className="ps-upcoming__count">{u.count} vendor{u.count > 1 ? 's' : ''}</div>
                <div className="ps-upcoming__amt">{fmt(u.total)}</div>
                {i === 0 && <span className="ps-upcoming__tag">Next</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Vendor Schedules</p>
            <p className="vm-sh__sub">Click toggle to pause/resume a schedule</p>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <p className="vm-sh__sub" style={{ padding: 16 }}>Loading schedules...</p>
          ) : (
            <table className="vm-tbl">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Tier</th>
                  <th>Frequency</th>
                  <th>Day / Cycle</th>
                  <th>Method</th>
                  <th>Min Threshold</th>
                  <th>Next Run</th>
                  <th>Last Run</th>
                  <th>Auto-Approve</th>
                  <th>Status</th>
                  <th className="vm-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(r => (
                  <tr key={r.id} style={{ opacity: r.status === 'paused' ? .55 : 1 }}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{ background: avatarBg(r.vendor) }}>{initials(r.vendor)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.83rem' }}>{r.vendor}</div>
                          <div style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`vm-badge vm-badge--${r.tier || 'default'}`}><span className="vm-badge__dot"/>{r.tier ? r.tier[0].toUpperCase() + r.tier.slice(1) : '—'}</span></td>
                    <td>
                      <span className="ps-freq" style={{ background: freqBg(r.frequency), color: freqColor(r.frequency) }}>
                        {r.frequency ? r.frequency[0].toUpperCase() + r.frequency.slice(1) : '—'}
                      </span>
                    </td>
                    <td className="vm-mu">{r.day}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{r.method}</div>
                        <div style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.bank}</div>
                      </div>
                    </td>
                    <td className="vm-bo">{fmt(r.threshold)}</td>
                    <td className="vm-mu" style={{ fontWeight: r.nextRun !== '—' ? 600 : 400 }}>{r.nextRun}</td>
                    <td className="vm-mu">{r.lastRun}</td>
                    <td>
                      <span className={`cr-bool ${r.autoApprove ? 'cr-bool--yes' : 'cr-bool--no'}`}>
                        {r.autoApprove ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <button className={`cr-toggle ${r.status === 'active' ? 'cr-toggle--on' : 'cr-toggle--off'}`}
                        onClick={() => toggle(r.id)}>
                        <span className="cr-toggle__knob"/>
                      </button>
                    </td>
                    <td className="vm-td-r">
                      <div className="vm-acts">
                        <button className="vm-ib vm-ib--edit" onClick={() => openModal(r)}><Icon name="Edit2" size={13}/></button>
                        <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={async () => {
                          try {
                            const result = await runScheduleNow(r.dbId, 'Admin', 1);
                            toast.success(`Payout run completed for ${r.vendor}! \${result.successCount || 0} paid, \${result.failedCount || 0} failed`);
                            fetchSchedules();
                          } catch { toast.error('Failed to trigger payout'); }
                        }}>
                          <Icon name="Zap" size={12} color="#475569"/>Run Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {modal && (
        <div className="vm-overlay" onClick={() => setModal(null)}>
          <div className="vm-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Edit Schedule</p>
                <p className="vm-modal__sub">{modal.vendor} · {modal.id}</p>
              </div>
              <button className="vm-ib vm-ib--view" onClick={() => setModal(null)}><Icon name="X" size={14}/></button>
            </div>

            {/* Form */}
            <div className="cr-form">

              {/* Row 1 — Frequency + Day */}
              <div className="cr-form-grid">
                <div className="cr-field">
                  <label className="cr-label">Frequency</label>
                  <select className="cr-input cr-select" value={form.frequency} onChange={e => handleChange('frequency', e.target.value)}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="on-request">On Request</option>
                  </select>
                </div>
                <div className="cr-field">
                  <label className="cr-label">Day / Cycle</label>
                  <select className="cr-input cr-select" value={form.day} onChange={e => handleChange('day', e.target.value)}>
                    {(DAY_OPTIONS[form.frequency] || ['—']).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2 — Method + Threshold */}
              <div className="cr-form-grid">
                <div className="cr-field">
                  <label className="cr-label">Payment Method</label>
                  <select className="cr-input cr-select" value={form.method} onChange={e => handleChange('method', e.target.value)}>
                    <option>NEFT</option>
                    <option>IMPS</option>
                    <option>UPI</option>
                    <option>RTGS</option>
                  </select>
                </div>
                <div className="cr-field">
                  <label className="cr-label">Min Threshold (Rs.)</label>
                  <input
                    type="number"
                    className="cr-input"
                    value={form.threshold}
                    onChange={e => handleChange('threshold', e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              {/* Row 3 — Bank (full width) */}
              <div className="cr-field">
                <label className="cr-label">Bank Account</label>
                <input
                  type="text"
                  className="cr-input"
                  value={form.bank}
                  onChange={e => handleChange('bank', e.target.value)}
                />
              </div>

              {/* Row 4 — Next Run (full width) */}
              <div className="cr-field">
                <label className="cr-label">Next Scheduled Run</label>
                <input
                  type="text"
                  className="cr-input"
                  value={form.nextRun}
                  onChange={e => handleChange('nextRun', e.target.value)}
                />
              </div>

              {/* Row 5 — Auto-Approve toggle */}
              <div className="cr-field cr-field--inline">
                <div>
                  <span className="cr-label">Auto-Approve Payouts</span>
                  <p className="cr-label-sub">Skip manual review for this vendor</p>
                </div>
                <button
                  className={`cr-toggle ${form.autoApprove ? 'cr-toggle--on' : 'cr-toggle--off'}`}
                  onClick={() => handleChange('autoApprove', !form.autoApprove)}
                  type="button"
                >
                  <span className="cr-toggle__knob"/>
                </button>
              </div>

              {/* Footer buttons */}
              <div className="vm-modal__acts">
                <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                <button className="vm-btn vm-btn--primary" style={{ flex: 1 }} onClick={handleSave}>
                  <Icon name="Check" size={13} color="#fff"/>Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
