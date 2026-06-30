import React, { useState, useEffect } from 'react';
import './AdminGiftCards.css';
import { getGiftCards, createGiftCard } from '../../api/api';
import { Gift, Plus, Copy, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminGiftCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    initialBalance: 100, recipientEmail: '', recipientName: '', senderName: '', message: '', vendorId: null
  });

  useEffect(() => { loadCards(); }, []);

  const loadCards = async () => {
    try { const data = await getGiftCards(); setCards(data || []); }
    catch { /* maybe not admin */ }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await createGiftCard(form);
      toast.success('Gift card created');
      setShowModal(false);
      loadCards();
    } catch { toast.error('Failed to create'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Code copied!');
  };

  const stats = {
    total: cards.length,
    active: cards.filter(c => c.status === 'ACTIVE').length,
    redeemed: cards.filter(c => c.status === 'REDEEMED').length,
    totalValue: cards.reduce((s, c) => s + (c.initialBalance || 0), 0),
  };

  if (loading) return <div className="gc"><div className="gc-empty"><div className="gc-empty__txt">Loading...</div></div></div>;

  return (
    <div className="gc">
      <div className="gc-hdr">
        <div>
          <h1 className="gc-hdr__t"><Gift size={20} style={{ color: '#E03E1A' }} /> Gift Cards</h1>
          <p className="gc-hdr__s">Manage gift card creation and redemptions</p>
        </div>
        <button className="gc-btn gc-btn--pri" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Create Gift Card
        </button>
      </div>

      <div className="gc-kpis">
        {[
          { icon: Gift, val: stats.total, lbl: 'Total Cards', bg: '#f0f9ff', c: '#2563eb' },
          { icon: Gift, val: stats.active, lbl: 'Active', bg: '#f0fdf4', c: '#16a34a' },
          { icon: Gift, val: stats.redeemed, lbl: 'Redeemed', bg: '#f1f5f9', c: '#64748b' },
          { icon: Gift, val: `₹${stats.totalValue}`, lbl: 'Total Value', bg: '#fef9ec', c: '#d97706' },
        ].map((k, i) => (
          <div key={i} className="gc-kpi">
            <div className="gc-kpi__icon" style={{ background: k.bg }}><k.icon size={18} color={k.c} /></div>
            <div><div className="gc-kpi__val">{k.val}</div><div className="gc-kpi__lbl">{k.lbl}</div></div>
          </div>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="gc-card">
          <div className="gc-empty">
            <Gift size={48} className="gc-empty__icon" />
            <p className="gc-empty__txt">No gift cards yet</p>
          </div>
        </div>
      ) : (
        <div className="gc-card">
          <div className="gc-tw">
            <table className="gc-tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Recipient</th>
                  <th>Initial</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.id}>
                    <td><span className="gc-code">{card.code}</span></td>
                    <td>{card.recipientName || card.recipientEmail || '-'}</td>
                    <td><span className="gc-amt">₹{card.initialBalance}</span></td>
                    <td><span className={`gc-amt ${card.currentBalance <= 0 ? 'gc-amt--spent' : ''}`}>₹{card.currentBalance}</span></td>
                    <td>
                      <span className={`gc-bdg gc-bdg--${(card.status || '').toLowerCase()}`}>{card.status}</span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '.78rem' }}>
                      {new Date(card.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="gc-ib" onClick={() => copyCode(card.code)} title="Copy code">
                        {copied === card.code ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="gc-overlay" onClick={() => setShowModal(false)}>
          <div className="gc-modal" onClick={e => e.stopPropagation()}>
            <div className="gc-modal__hdr">
              <h2>Create Gift Card</h2>
              <button className="gc-modal__close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="gc-modal__body">
              <div className="gc-field">
                <label>Amount (₹)</label>
                <input className="gc-inp" type="number" min={1} value={form.initialBalance}
                  onChange={e => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="gc-field">
                <label>Recipient Email</label>
                <input className="gc-inp" value={form.recipientEmail}
                  onChange={e => setForm({ ...form, recipientEmail: e.target.value })} />
              </div>
              <div className="gc-field">
                <label>Recipient Name</label>
                <input className="gc-inp" value={form.recipientName}
                  onChange={e => setForm({ ...form, recipientName: e.target.value })} />
              </div>
              <div className="gc-field">
                <label>Sender Name</label>
                <input className="gc-inp" value={form.senderName}
                  onChange={e => setForm({ ...form, senderName: e.target.value })} />
              </div>
              <div className="gc-field">
                <label>Message (optional)</label>
                <textarea className="gc-inp gc-textarea" rows={3} value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
            </div>
            <div className="gc-modal__ftr">
              <button className="gc-btn gc-btn--out" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="gc-btn gc-btn--pri" onClick={handleCreate}>Create Gift Card</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGiftCards;
