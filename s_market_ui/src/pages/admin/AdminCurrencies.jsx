import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { getCurrencies, createCurrency, updateCurrency, toggleCurrencyStatus, deleteCurrency } from '../../api/api';
import './AdminCurrencies.css';

const Ico = ({ d, size = 14, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  edit:  ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash: ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  plus:  ['M12 5v14M5 12h14'],
  toggle:['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  money: ['M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  globe: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  star:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  swap:  ['M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16'],
};

const ListIcon = ({ d, bg }) => (
  <div className="cur-list-icon" style={{ background: bg || '#e0e7ff' }}>
    <Ico d={d} size={18} color={bg ? '#fff' : '#6366f1'}/>
  </div>
);

const CURRENCY_COLORS = ['#16a34a', '#2563eb', '#d97706', '#E03E1A', '#7c3aed', '#0891b2'];

const blankForm = () => ({
  code: '', name: '', symbol: '', exchangeRate: '', decimalPlaces: 2,
  description: '', isActive: true, isDefault: false,
});

export default function AdminCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(blankForm());
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCurrencies();
      setCurrencies(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const list = filter === 'All' ? currencies : currencies.filter(c => filter === 'Active' ? c.isActive : !c.isActive);

  const activeCurrencies = currencies.filter(c => c.isActive);
  const defaultCurrency = currencies.find(c => c.isDefault);

  const handleAddOpen = () => {
    setEditForm(blankForm());
    setEditModal('__new__');
  };

  const handleEditOpen = id => {
    const item = currencies.find(c => c.id === id);
    if (!item) return;
    setEditForm({
      code: item.code, name: item.name, symbol: item.symbol,
      exchangeRate: item.exchangeRate, decimalPlaces: item.decimalPlaces ?? 2,
      description: item.description || '', isActive: item.isActive, isDefault: item.isDefault,
    });
    setEditModal(id);
  };

  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const handleEditSave = async () => {
    if (!editForm.code.trim() || !editForm.name.trim() || !editForm.exchangeRate) {
      toast.error('Code, name, and exchange rate are required');
      return;
    }
    const payload = {
      ...editForm,
      code: editForm.code.toUpperCase().trim(),
      exchangeRate: parseFloat(editForm.exchangeRate),
      decimalPlaces: parseInt(editForm.decimalPlaces) || 2,
    };
    const isNew = editModal === '__new__';
    try {
      if (isNew) {
        const created = await createCurrency(payload);
        setCurrencies(prev => [...prev, created]);
        toast.success('Currency created');
      } else {
        const updated = await updateCurrency(editModal, payload);
        setCurrencies(prev => prev.map(c => c.id === editModal ? { ...c, ...updated } : c));
        toast.success('Currency updated');
      }
      setEditModal(null);
    } catch (err) {
      toast.error(err.message || `Failed to ${isNew ? 'create' : 'update'} currency`);
    }
  };

  const handleToggleStatus = async id => {
    try {
      const updated = await toggleCurrencyStatus(id);
      setCurrencies(prev => prev.map(c => c.id === id ? { ...c, isActive: updated.isActive } : c));
      toast.success(updated.isActive ? 'Activated' : 'Deactivated');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCurrency(deleteId);
      setCurrencies(prev => prev.filter(c => c.id !== deleteId));
      toast.success('Currency deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="cur-root">
      <div className="cur-header">
        <div>
          <h1 className="cur-title">Multi-Currency Management</h1>
          <p className="cur-sub">Manage currencies, exchange rates, and pricing display across the platform</p>
        </div>
        <button className="cur-add-btn" onClick={handleAddOpen}>
          <Ico d={ICONS.plus} size={16} color="#fff"/>
          Add Currency
        </button>
      </div>

      {/* Currency Overview Cards */}
      <div className="cur-overview">
        {currencies.slice(0, 6).map((c, i) => (
          <div key={c.id} className={`cur-card${c.isDefault ? ' cur-card--default' : ''}`}
            style={{ borderTop: `3px solid ${CURRENCY_COLORS[i % CURRENCY_COLORS.length]}` }}>
            <div className="cur-card-top">
              <span className="cur-card-symbol">{c.symbol}</span>
              {c.isDefault && <span className="cur-card-badge">BASE</span>}
            </div>
            <div className="cur-card-code">{c.code}</div>
            <div className="cur-card-name">{c.name}</div>
            <div className="cur-card-rate">1 {c.code} = ₹{c.exchangeRate.toFixed(2)} INR</div>
            <div className={`cur-card-status ${c.isActive ? 'cur-card-status--act' : 'cur-card-status--inact'}`}>
              {c.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="cur-stats">
        <div className="cur-stat-card">
          <ListIcon d={ICONS.globe} bg="#6366f1"/>
          <div>
            <div className="cur-stat-val">{currencies.length}</div>
            <div className="cur-stat-lbl">Total Currencies</div>
          </div>
        </div>
        <div className="cur-stat-card">
          <ListIcon d={ICONS.money} bg="#10b981"/>
          <div>
            <div className="cur-stat-val">{activeCurrencies.length}</div>
            <div className="cur-stat-lbl">Active Currencies</div>
          </div>
        </div>
        <div className="cur-stat-card">
          <ListIcon d={ICONS.star} bg="#d97706"/>
          <div>
            <div className="cur-stat-val">{defaultCurrency?.code || '—'}</div>
            <div className="cur-stat-lbl">Base Currency</div>
          </div>
        </div>
        <div className="cur-stat-card">
          <ListIcon d={ICONS.swap} bg="#7c3aed"/>
          <div>
            <div className="cur-stat-val">{activeCurrencies.length - 1}</div>
            <div className="cur-stat-lbl">Conversion Pairs</div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Reference */}
      <div className="cur-exchange-ref">
        <div className="cur-exchange-ref__title">Exchange Rate Reference (Base: {defaultCurrency?.code || 'INR'})</div>
        <div className="cur-exchange-ref__grid">
          {activeCurrencies.filter(c => !c.isDefault).map((c, i) => (
            <div key={c.id} className="cur-exchange-card" style={{ borderLeft: `3px solid ${CURRENCY_COLORS[i % CURRENCY_COLORS.length]}` }}>
              <div className="cur-exchange-pair">1 INR = {c.symbol}{(1 / c.exchangeRate).toFixed(4)} {c.code}</div>
              <div className="cur-exchange-rate">1 {c.code} = ₹{c.exchangeRate.toFixed(2)} INR</div>
              <div className="cur-exchange-recip">{c.description || c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="cur-toolbar">
        <div className="cur-tabs">
          {['All', 'Active', 'Inactive'].map(f => (
            <button key={f} className={`cur-tab${filter === f ? ' cur-tab--act' : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Currency Table */}
      <div className="cur-table-wrap">
        <table className="cur-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Code</th>
              <th>Symbol</th>
              <th>Exchange Rate</th>
              <th>Decimals</th>
              <th>Status</th>
              <th>Default</th>
              <th className="cur-th-r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="cur-loading">Loading currencies...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="8" className="cur-empty">No currencies found</td></tr>
            ) : list.map(c => (
              <tr key={c.id}>
                <td className="cur-name-cell">
                  <span className="cur-name">{c.name}</span>
                  {c.description && <span className="cur-desc">{c.description}</span>}
                </td>
                <td><span className="cur-code">{c.code}</span></td>
                <td><span className="cur-symbol">{c.symbol}</span></td>
                <td><span className="cur-rate">{c.exchangeRate.toFixed(4)}</span></td>
                <td>{c.decimalPlaces ?? 2}</td>
                <td>
                  <span className={`cur-bdg cur-bdg--${c.isActive ? 'act' : 'inact'}`}>
                    <span className="cur-bdg__dot"/>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{c.isDefault ? <span className="cur-default-star" title="Default currency">★</span> : '—'}</td>
                <td>
                  <div className="cur-actions">
                    <button className="cur-action-btn" onClick={() => handleToggleStatus(c.id)}
                      title={c.isActive ? 'Deactivate' : 'Activate'}>
                      <Ico d={ICONS.toggle} size={14}/>
                    </button>
                    <button className="cur-action-btn" onClick={() => handleEditOpen(c.id)} title="Edit">
                      <Ico d={ICONS.edit} size={14}/>
                    </button>
                    {!c.isDefault && (
                      <button className="cur-action-btn cur-action-btn--del" onClick={() => setDeleteId(c.id)} title="Delete">
                        <Ico d={ICONS.trash} size={14}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={editModal !== null} onClose={() => setEditModal(null)} title={editModal === '__new__' ? 'Add Currency' : 'Edit Currency'}>
        <div className="cur-modal-form">
          <div className="cur-fld-row">
            <label className="cur-fld">
              <span>Currency Code (ISO 4217) <span className="cur-req">*</span></span>
              <input value={editForm.code} onChange={e => handleEditChange('code', e.target.value.toUpperCase())}
                placeholder="e.g. USD" maxLength={3} disabled={editModal !== '__new__'}/>
              <span className="cur-fld-hint">3-letter ISO code (e.g. INR, USD, EUR)</span>
            </label>
            <label className="cur-fld">
              <span>Currency Name <span className="cur-req">*</span></span>
              <input value={editForm.name} onChange={e => handleEditChange('name', e.target.value)}
                placeholder="e.g. US Dollar"/>
            </label>
          </div>
          <div className="cur-fld-row">
            <label className="cur-fld">
              <span>Symbol <span className="cur-req">*</span></span>
              <input value={editForm.symbol} onChange={e => handleEditChange('symbol', e.target.value)}
                placeholder="e.g. $" maxLength={5}/>
            </label>
            <label className="cur-fld">
              <span>Exchange Rate (vs INR) <span className="cur-req">*</span></span>
              <input type="number" step="0.0001" min="0" value={editForm.exchangeRate}
                onChange={e => handleEditChange('exchangeRate', e.target.value)} placeholder="e.g. 83.50"/>
              <span className="cur-fld-hint">How many INR = 1 unit of this currency</span>
            </label>
          </div>
          <div className="cur-fld-row">
            <label className="cur-fld">
              <span>Decimal Places</span>
              <select value={editForm.decimalPlaces} onChange={e => handleEditChange('decimalPlaces', parseInt(e.target.value) || 2)}>
                <option value={0}>0 (e.g. JPY ¥1,234)</option>
                <option value={2}>2 (e.g. USD $12.34)</option>
                <option value={3}>3 (e.g. BHD 1.234)</option>
              </select>
            </label>
            <label className="cur-fld">
              <span>Description</span>
              <input value={editForm.description} onChange={e => handleEditChange('description', e.target.value)}
                placeholder="e.g. United States Dollar"/>
            </label>
          </div>
          <label className="cur-fld cur-fld--chk">
            <input type="checkbox" checked={editForm.isDefault}
              onChange={e => handleEditChange('isDefault', e.target.checked)}/>
            <span>Set as default/base currency (INR recommended for Indian platform)</span>
          </label>
          <div className="cur-modal-actions">
            <button className="cur-btn cur-btn--sec" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="cur-btn cur-btn--pri" onClick={handleEditSave}
              disabled={!editForm.code.trim() || !editForm.name.trim() || !editForm.exchangeRate}>
              {editModal === '__new__' ? 'Create Currency' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Currency">
        <p className="cur-del-msg">Are you sure you want to delete this currency? This action cannot be undone.</p>
        <div className="cur-modal-actions">
          <button className="cur-btn cur-btn--sec" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="cur-btn cur-btn--del" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
