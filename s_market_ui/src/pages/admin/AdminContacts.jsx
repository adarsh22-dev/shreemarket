import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, Calendar, MessageSquare, Search, RefreshCw, Send, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { getContacts, getPlatformSettings, updatePlatformSettings } from '../../api/api';
import './AdminContacts.css';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState({});
  const [sidePanel, setSidePanel] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [contactRes, settings] = await Promise.all([
        getContacts(),
        getPlatformSettings(),
      ]);
      setContacts(Array.isArray(contactRes) ? contactRes : Array.isArray(contactRes.data) ? contactRes.data : []);
      if (settings?.contactReplies) setReplies(settings.contactReplies);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = contacts.filter(c =>
    !search || c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.message?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = c => {
    setSelected(c);
    setReplyText('');
    setSidePanel(true);
  };

  const handleBack = () => { setSidePanel(false); setSelected(null); };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    const id = String(selected.id || selected._id);
    const reply = { message: replyText.trim(), timestamp: new Date().toISOString(), type: 'admin' };
    const updated = { ...replies, [id]: [...(replies[id] || []), reply] };
    try {
      const settings = await getPlatformSettings();
      await updatePlatformSettings({ ...settings, contactReplies: updated });
      setReplies(updated);
      toast.success('Reply sent successfully');
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    }
    setSending(false);
  };

  const getRepliesFor = c => {
    const id = String(c.id || c._id);
    return replies[id] || [];
  };

  return (
    <div className="ac-page">
      <div className="ac-header">
        <div>
          <h1>Help Center</h1>
          <p>{contacts.length} total submissions · {Object.keys(replies).length} replied</p>
        </div>
        <button className="ac-refresh" onClick={loadAll}><RefreshCw size={15} /> Refresh</button>
      </div>

      <button className="ac-back-btn" onClick={handleBack} style={{ display: sidePanel ? 'flex' : 'none' }}>
        <ArrowLeft size={16} /> Back to list
      </button>

      <div className={`ac-split ${sidePanel ? 'ac-split--panel' : ''}`}>
        <div className="ac-list-col">
          <div className="ac-search-row">
            <div className="ac-search-wrap">
              <Search size={14} />
              <input placeholder="Search by name, email, or message..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="ac-loading">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="ac-empty">
              <MessageSquare size={28} color="#d1d5db" />
              <p>{search ? 'No submissions match your search.' : 'No contact submissions yet.'}</p>
            </div>
          ) : (
            <div className="ac-list">
              {filtered.map(c => {
                const rs = getRepliesFor(c);
                return (
                  <div key={c.id || c._id} className={`ac-card${selected?.id === c.id || selected?._id === c._id ? ' ac-card--selected' : ''}`}
                    onClick={() => handleSelect(c)}>
                    <div className="ac-card-top">
                      <div className="ac-avatar">{c.firstName?.[0]}{c.lastName?.[0]}</div>
                      <div className="ac-card-info">
                        <span className="ac-name">{c.firstName} {c.lastName}</span>
                        <span className="ac-service">{c.service || 'General'}</span>
                      </div>
                      <div className="ac-card-right">
                        {rs.length > 0 && <span className="ac-replied-badge"><CheckCircle size={11} />Replied</span>}
                        <span className="ac-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                    <div className="ac-card-details">
                      <div className="ac-detail"><Mail size={12} /> {c.email}</div>
                      {c.phone && <div className="ac-detail"><Phone size={12} /> {c.phone}</div>}
                      {c.createdAt && <div className="ac-detail"><Calendar size={12} /> {new Date(c.createdAt).toLocaleString()}</div>}
                    </div>
                    <p className="ac-message">{c.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ac-panel-col">
          {!selected ? (
            <div className="ac-panel-empty">
              <MessageSquare size={36} color="#d1d5db" />
              <p>Select a submission to view and reply</p>
            </div>
          ) : (
            <div className="ac-conversation">
              <div className="ac-conv-header">
                <div className="ac-avatar ac-avatar--lg">{selected.firstName?.[0]}{selected.lastName?.[0]}</div>
                <div>
                  <div className="ac-conv-name">{selected.firstName} {selected.lastName}</div>
                  <div className="ac-conv-meta">{selected.email} · {selected.service || 'General'}</div>
                </div>
              </div>

              <div className="ac-conv-body">
                <div className="ac-msg-bubble ac-msg-bubble--sender">
                  <p className="ac-msg-text">{selected.message}</p>
                  <span className="ac-msg-time">
                    <Calendar size={10} /> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                {getRepliesFor(selected).map((r, i) => (
                  <div key={i} className="ac-msg-bubble ac-msg-bubble--admin">
                    <p className="ac-msg-text">{r.message}</p>
                    <span className="ac-msg-time">
                      <Clock size={10} /> {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="ac-reply-box">
                <textarea className="ac-reply-input" rows={3} placeholder="Type your reply..."
                  value={replyText} onChange={e => setReplyText(e.target.value)} />
                <button className="ac-send-btn" onClick={handleReply} disabled={!replyText.trim() || sending}>
                  <Send size={14} color="#fff" /> {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
