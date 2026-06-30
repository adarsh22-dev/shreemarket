import React, { useState, useCallback, useEffect } from 'react';
import { Save, Bot, Palette, Bell, Shield, Plug, Clock, X, Check, AlertTriangle, ExternalLink, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWooAISettings, saveWooAISettings, resetWooAISettings } from '@/api/api';
import './Settings.css';

/* ── Defaults ── */
const DEFAULTS = {
  bot: {
    name:        'WooAI Assistant',
    tagline:     'Powered by WooAI Assistant',
    welcomeMsg:  'Hello! Welcome to SreeMarket. How can I help you today?',
    fallbackMsg: "I'm not sure about that. Let me connect you to a team member.",
    model:       'claude-sonnet-4-6',
    maxTurns:    5,
  },
  toggles: {
    autoReply:true, typingIndicator:true, quickChips:true, autoEscalation:true,
    offlineMode:false, chatHistory:true, emailTranscript:false, proactiveGreeting:true,
  },
  appearance: { primaryColor:'#6d28d9', position:'bottom-right', theme:'light', avatarStyle:'initials' },
  notif: { escalationAlert:true, highVolumeAlert:true, missedCallback:true, dailySummary:false, email:'admin@sreemarket.com' },
  hours: { enabled:true, start:'09:00', end:'21:00', timezone:'Asia/Kolkata', offlineMsg:"We are currently offline. Leave a message and we'll get back to you!" },
};

const INIT_INTG = [
  { id:'rzp',     name:'Razorpay',    desc:'Payment status lookups',         connected:true,  apiKey:'rzp_live_xxxxx', website:'https://razorpay.com'     },
  { id:'ship',    name:'Shiprocket',  desc:'Real-time shipment tracking',    connected:false, apiKey:'',               website:'https://shiprocket.in'    },
  { id:'fresh',   name:'Freshdesk',   desc:'Push escalated tickets to CRM',  connected:false, apiKey:'',               website:'https://freshdesk.com'    },
];

/* ── Sub-components ── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="st-section">
    <div className="st-section-header">
      <div className="st-section-icon"><Icon size={16} color="#6d28d9"/></div>
      <span className="st-section-title">{title}</span>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div className="st-toggle-row">
    <div className="st-toggle-info">
      <h4>{label}</h4>
      {desc && <p>{desc}</p>}
    </div>
    <button className={`st-toggle ${value?'on':''}`} onClick={onChange}
      title={value?`Disable ${label}`:`Enable ${label}`}/>
  </div>
);

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const t=setTimeout(onDone,2600); return ()=>clearTimeout(t); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#ede9fe','#6d28d9','#c4b5fd','ℹ'],
    warn:   ['#fef3c7','#d97706','#fde68a','⚠'],
  };
  const [bg,fg,bd,ico] = cfg[type]||cfg.success;
  return (
    <div className="st-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>
      {ico} {msg}
    </div>
  );
};

/* ── Modal shell ── */
const Modal = ({ title, onClose, children, footer }) => (
  <div className="st-overlay" onClick={onClose}>
    <div className="st-modal" onClick={e=>e.stopPropagation()}>
      <div className="st-modal__hdr">
        <span className="st-modal__title">{title}</span>
        <button className="st-modal__close" onClick={onClose}><X size={15}/></button>
      </div>
      <div className="st-modal__body">{children}</div>
      {footer && <div className="st-modal__ftr">{footer}</div>}
    </div>
  </div>
);

export default function Settings() {
  const [bot,        setBot]        = useState({...DEFAULTS.bot});
  const [toggles,    setToggles]    = useState({...DEFAULTS.toggles});
  const [appearance, setAppearance] = useState({...DEFAULTS.appearance});
  const [notif,      setNotif]      = useState({...DEFAULTS.notif});
  const [hours,      setHours]      = useState({...DEFAULTS.hours});
  const [intgs,      setIntgs]      = useState(INIT_INTG);
  const [toast,      setToast]      = useState(null);
  const [dirty,      setDirty]      = useState(false);

  /* Modals */
  const [resetModal,   setResetModal]   = useState(false);
  const [connectModal, setConnectModal] = useState(null); // intg object
  const [manageModal,  setManageModal]  = useState(null); // intg object
  const [apiKeyInput,  setApiKeyInput]  = useState('');
  const [disconnectModal, setDisconnectModal] = useState(null);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const markDirty = useCallback(() => setDirty(true), []);

  /* ── Setters that mark dirty ── */
  const updBot  = patch => { setBot(b=>({...b,...patch}));        markDirty(); };
  const updApp  = patch => { setAppearance(a=>({...a,...patch})); markDirty(); };
  const updNotif= patch => { setNotif(n=>({...n,...patch}));      markDirty(); };
  const updHours= patch => { setHours(h=>({...h,...patch}));      markDirty(); };
  const tog     = key   => { setToggles(t=>({...t,[key]:!t[key]})); markDirty(); };
  const togNotif= key   => { setNotif(n=>({...n,[key]:!n[key]}));   markDirty(); };

  /* ── Fetch settings from API ── */
  const fetchSettings = useCallback(async () => {
    try {
      const data = await getWooAISettings();
      if (data) {
        setBot({
          name:       data.botName        ?? DEFAULTS.bot.name,
          tagline:    data.tagline        ?? DEFAULTS.bot.tagline,
          welcomeMsg: data.welcomeMessage ?? DEFAULTS.bot.welcomeMsg,
          fallbackMsg:data.fallbackMessage ?? DEFAULTS.bot.fallbackMsg,
          model:      data.aiModel        ?? DEFAULTS.bot.model,
          maxTurns:   data.maxTurns       ?? DEFAULTS.bot.maxTurns,
        });
        setToggles({
          autoReply:         data.autoReply         ?? DEFAULTS.toggles.autoReply,
          typingIndicator:   data.typingIndicator   ?? DEFAULTS.toggles.typingIndicator,
          quickChips:        data.quickChips        ?? DEFAULTS.toggles.quickChips,
          autoEscalation:    data.autoEscalation    ?? DEFAULTS.toggles.autoEscalation,
          offlineMode:       data.offlineMode       ?? DEFAULTS.toggles.offlineMode,
          chatHistory:       data.chatHistory       ?? DEFAULTS.toggles.chatHistory,
          emailTranscript:   data.emailTranscript   ?? DEFAULTS.toggles.emailTranscript,
          proactiveGreeting: data.proactiveGreeting ?? DEFAULTS.toggles.proactiveGreeting,
        });
        setAppearance({
          primaryColor: data.primaryColor || DEFAULTS.appearance.primaryColor,
          position:     data.position     || DEFAULTS.appearance.position,
          theme:        data.theme        || DEFAULTS.appearance.theme,
          avatarStyle:  data.avatarStyle  || DEFAULTS.appearance.avatarStyle,
        });
        setNotif({
          escalationAlert: data.escalationAlert ?? DEFAULTS.notif.escalationAlert,
          highVolumeAlert: data.highVolumeAlert ?? DEFAULTS.notif.highVolumeAlert,
          missedCallback:  data.missedCallback  ?? DEFAULTS.notif.missedCallback,
          dailySummary:    data.dailySummary    ?? DEFAULTS.notif.dailySummary,
          email:           data.email           || DEFAULTS.notif.email,
        });
        setHours({
          enabled:    data.hoursEnabled   ?? DEFAULTS.hours.enabled,
          start:      data.hoursStart     || DEFAULTS.hours.start,
          end:        data.hoursEnd       || DEFAULTS.hours.end,
          timezone:   data.timezone       || DEFAULTS.hours.timezone,
          offlineMsg: data.offlineMessage || DEFAULTS.hours.offlineMsg,
        });
      }
    } catch {
      /* fallback to defaults already set by useState */
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* ── Save ── */
  const handleSave = async () => {
    try {
      const payload = {
        botName: bot.name,
        tagline: bot.tagline,
        welcomeMessage: bot.welcomeMsg,
        fallbackMessage: bot.fallbackMsg,
        aiModel: bot.model,
        maxTurns: bot.maxTurns,
        ...toggles,
        ...appearance,
        escalationAlert: notif.escalationAlert,
        highVolumeAlert: notif.highVolumeAlert,
        missedCallback: notif.missedCallback,
        dailySummary: notif.dailySummary,
        email: notif.email,
        hoursEnabled: hours.enabled,
        hoursStart: hours.start,
        hoursEnd: hours.end,
        timezone: hours.timezone,
        offlineMessage: hours.offlineMsg,
      };
      await saveWooAISettings(payload);
      showToast('All settings saved successfully','success');
      setDirty(false);
    } catch {
      showToast('Failed to save settings','error');
    }
  };

  /* ── Reset to defaults ── */
  const confirmReset = async () => {
    try {
      await resetWooAISettings();
      await fetchSettings();
      setResetModal(false);
      setDirty(false);
      showToast('Settings reset to defaults','warn');
    } catch {
      showToast('Failed to reset settings','error');
    }
  };

  /* ── Connect integration ── */
  const handleConnect = () => {
    if (!apiKeyInput.trim()) return;
    setIntgs(prev=>prev.map(i=>i.id===connectModal.id?{...i,connected:true,apiKey:apiKeyInput}:i));
    showToast(`${connectModal.name} connected successfully`,'success');
    setConnectModal(null); setApiKeyInput('');
    markDirty();
  };

  /* ── Disconnect integration ── */
  const handleDisconnect = () => {
    setIntgs(prev=>prev.map(i=>i.id===disconnectModal.id?{...i,connected:false,apiKey:''}:i));
    showToast(`${disconnectModal.name} disconnected`,'warn');
    setDisconnectModal(null); setManageModal(null);
    markDirty();
  };

  return (
    <div className="st-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Reset confirm */}
      {resetModal && (
        <Modal title="Reset to Defaults" onClose={()=>setResetModal(false)}
          footer={<>
            <button className="st-btn-outline" onClick={()=>setResetModal(false)}>Cancel</button>
            <button className="st-btn-danger" onClick={confirmReset}><RefreshCw size={13}/>Reset Everything</button>
          </>}>
          <div className="st-modal__warn">
            <AlertTriangle size={16}/>
            This will reset all bot config, toggles, appearance, notifications, and hours to their default values. This cannot be undone.
          </div>
        </Modal>
      )}

      {/* Connect modal */}
      {connectModal && (
        <Modal title={`Connect ${connectModal.name}`} onClose={()=>{setConnectModal(null);setApiKeyInput('');}}>
          <div style={{fontSize:13,color:'#6b7280',marginBottom:12,lineHeight:1.5}}>
            {connectModal.desc}. Enter your API key below to connect.
          </div>
          <label className="st-label">API Key</label>
          <input className="st-input" autoFocus placeholder={`Paste your ${connectModal.name} API key…`}
            value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleConnect()}/>
          <a href={connectModal.website} target="_blank" rel="noopener noreferrer"
            className="st-modal__link"><ExternalLink size={12}/> Get your API key from {connectModal.name}</a>
          <div className="st-modal__ftr" style={{marginTop:16,paddingTop:14,borderTop:'1px solid #f3f4f6',display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="st-btn-outline" onClick={()=>{setConnectModal(null);setApiKeyInput('');}}>Cancel</button>
            <button className="st-btn-primary" disabled={!apiKeyInput.trim()} onClick={handleConnect}>
              <Check size={13} color="#fff"/>Connect
            </button>
          </div>
        </Modal>
      )}

      {/* Manage modal */}
      {manageModal && !disconnectModal && (
        <Modal title={`Manage ${manageModal.name}`} onClose={()=>setManageModal(null)}>
          <div className="st-modal__info-row"><span>Status</span><span className="st-badge green">Connected</span></div>
          <div className="st-modal__info-row"><span>API Key</span><span style={{fontFamily:'monospace',fontSize:12,color:'#6b7280'}}>{manageModal.apiKey||'••••••••••••'}</span></div>
          <div className="st-modal__info-row" style={{borderBottom:'none'}}>
            <span>Integration</span>
            <a href={manageModal.website} target="_blank" rel="noopener noreferrer" className="st-modal__link">
              <ExternalLink size={11}/> Open dashboard
            </a>
          </div>
          <div className="st-modal__ftr" style={{marginTop:16,paddingTop:14,borderTop:'1px solid #f3f4f6',display:'flex',gap:8,justifyContent:'space-between'}}>
            <button className="st-btn-danger-sm" onClick={()=>setDisconnectModal(manageModal)}>
              <Trash2 size={12}/>Disconnect
            </button>
            <button className="st-btn-outline" onClick={()=>setManageModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Disconnect confirm */}
      {disconnectModal && (
        <Modal title={`Disconnect ${disconnectModal.name}`} onClose={()=>{setDisconnectModal(null);}}>
          <div className="st-modal__warn">
            <AlertTriangle size={16}/>
            Disconnect <strong>{disconnectModal.name}</strong>? This will remove the API key and disable the integration.
          </div>
          <div className="st-modal__ftr" style={{marginTop:16,paddingTop:14,borderTop:'1px solid #f3f4f6',display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="st-btn-outline" onClick={()=>setDisconnectModal(null)}>Cancel</button>
            <button className="st-btn-danger" onClick={handleDisconnect}><Trash2 size={13}/>Disconnect</button>
          </div>
        </Modal>
      )}

      {/* ── Header ── */}
      <div className="st-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="st-header-row">
          <div>
            <h1>Settings</h1>
            <p>Configure WooAI bot behaviour, appearance, and integrations</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {dirty && <span className="st-unsaved-dot" title="Unsaved changes"/>}
            <button className="st-btn-primary" onClick={handleSave}>
              <Save size={14}/> Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="st-body">
        <div className="st-grid-2">

          {/* ── LEFT COLUMN ── */}
          <div>

            {/* Bot Configuration */}
            <Section icon={Bot} title="Bot Configuration">
              <div className="st-form-group">
                <label className="st-label">Bot Display Name</label>
                <input className="st-input" value={bot.name} onChange={e=>updBot({name:e.target.value})}/>
              </div>
              <div className="st-form-group">
                <label className="st-label">Tagline</label>
                <input className="st-input" value={bot.tagline} onChange={e=>updBot({tagline:e.target.value})}/>
              </div>
              <div className="st-form-group">
                <label className="st-label">Welcome Message</label>
                <textarea className="st-textarea" value={bot.welcomeMsg} onChange={e=>updBot({welcomeMsg:e.target.value})}/>
              </div>
              <div className="st-form-group">
                <label className="st-label">Fallback / Handoff Message</label>
                <textarea className="st-textarea" value={bot.fallbackMsg} onChange={e=>updBot({fallbackMsg:e.target.value})}/>
              </div>
              <div className="st-grid-2-inner" style={{marginBottom:0}}>
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">AI Model</label>
                  <select className="st-select" value={bot.model} onChange={e=>updBot({model:e.target.value})}>
                    <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                    <option value="claude-haiku">Claude Haiku</option>
                    <option value="claude-opus">Claude Opus</option>
                  </select>
                </div>
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">Max Turns Before Escalation</label>
                  <input className="st-input" type="number" min={1} max={20}
                    value={bot.maxTurns} onChange={e=>updBot({maxTurns:e.target.value})}/>
                </div>
              </div>
            </Section>

            {/* Appearance */}
            <Section icon={Palette} title="Appearance">
              <div className="st-grid-2-inner">
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">Brand Color</label>
                  <div className="st-color-row">
                    <input type="color" className="st-color-input"
                      value={appearance.primaryColor}
                      onChange={e=>updApp({primaryColor:e.target.value})}/>
                    <input className="st-input" value={appearance.primaryColor}
                      style={{fontFamily:'monospace',fontSize:12}}
                      onChange={e=>updApp({primaryColor:e.target.value})}/>
                  </div>
                </div>
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">Widget Position</label>
                  <select className="st-select" value={appearance.position}
                    onChange={e=>updApp({position:e.target.value})}>
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="inline">Inline embed</option>
                  </select>
                </div>
              </div>
              <div className="st-grid-2-inner" style={{marginBottom:0}}>
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">Theme</label>
                  <select className="st-select" value={appearance.theme}
                    onChange={e=>updApp({theme:e.target.value})}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div className="st-form-group" style={{marginBottom:0}}>
                  <label className="st-label">Avatar Style</label>
                  <select className="st-select" value={appearance.avatarStyle}
                    onChange={e=>updApp({avatarStyle:e.target.value})}>
                    <option value="initials">Initials</option>
                    <option value="icon">Bot Icon</option>
                    <option value="custom">Custom Image</option>
                  </select>
                </div>
              </div>
              {/* Live colour preview swatch */}
              <div className="st-color-preview" style={{marginTop:14}}>
                <div className="st-color-preview__btn" style={{background:appearance.primaryColor}}>
                  Chat with us
                </div>
                <span style={{fontSize:11,color:'#9ca3af'}}>Widget button preview</span>
              </div>
            </Section>

            {/* Operating Hours */}
            <Section icon={Clock} title="Operating Hours">
              <Toggle
                label="Enable Operating Hours"
                desc="Show offline message outside defined hours"
                value={hours.enabled}
                onChange={()=>updHours({enabled:!hours.enabled})}
              />
              {hours.enabled && (
                <>
                  <div className="st-grid-2-inner" style={{marginTop:14}}>
                    <div className="st-form-group" style={{marginBottom:0}}>
                      <label className="st-label">Start Time</label>
                      <input className="st-input" type="time" value={hours.start}
                        onChange={e=>updHours({start:e.target.value})}/>
                    </div>
                    <div className="st-form-group" style={{marginBottom:0}}>
                      <label className="st-label">End Time</label>
                      <input className="st-input" type="time" value={hours.end}
                        onChange={e=>updHours({end:e.target.value})}/>
                    </div>
                  </div>
                  <div className="st-form-group">
                    <label className="st-label">Timezone</label>
                    <select className="st-select" value={hours.timezone}
                      onChange={e=>updHours({timezone:e.target.value})}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                  <div className="st-form-group" style={{marginBottom:0}}>
                    <label className="st-label">Offline Message</label>
                    <textarea className="st-textarea" style={{minHeight:60}} value={hours.offlineMsg}
                      onChange={e=>updHours({offlineMsg:e.target.value})}/>
                  </div>
                </>
              )}
            </Section>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div>

            {/* Bot Features */}
            <Section icon={Shield} title="Bot Features">
              <Toggle label="AI Auto-Reply"       desc="Let WooAI respond automatically"                  value={toggles.autoReply}         onChange={()=>tog('autoReply')}/>
              <Toggle label="Typing Indicator"    desc="Show typing animation while AI composes reply"    value={toggles.typingIndicator}   onChange={()=>tog('typingIndicator')}/>
              <Toggle label="Quick Chips"         desc="Display shortcut buttons below the input box"     value={toggles.quickChips}        onChange={()=>tog('quickChips')}/>
              <Toggle label="Auto Escalation"     desc="Transfer to agent when AI cannot resolve issue"   value={toggles.autoEscalation}    onChange={()=>tog('autoEscalation')}/>
              <Toggle label="Offline Mode"        desc="Show offline message outside operating hours"     value={toggles.offlineMode}       onChange={()=>tog('offlineMode')}/>
              <Toggle label="Save Chat History"   desc="Store chat transcripts for review and analytics"  value={toggles.chatHistory}       onChange={()=>tog('chatHistory')}/>
              <Toggle label="Email Transcript"    desc="Send chat transcript to customer after session"   value={toggles.emailTranscript}   onChange={()=>tog('emailTranscript')}/>
              <Toggle label="Proactive Greeting"  desc="Send greeting after 5s if user is idle on page"   value={toggles.proactiveGreeting} onChange={()=>tog('proactiveGreeting')}/>
            </Section>

            {/* Notifications */}
            <Section icon={Bell} title="Admin Notifications">
              <Toggle label="Escalation Alert"    desc="Notify when a chat is escalated to an agent"   value={notif.escalationAlert} onChange={()=>togNotif('escalationAlert')}/>
              <Toggle label="High Volume Alert"   desc="Alert when concurrent chats exceed threshold"  value={notif.highVolumeAlert} onChange={()=>togNotif('highVolumeAlert')}/>
              <Toggle label="Missed Callback"     desc="Notify when a callback request is not handled" value={notif.missedCallback}  onChange={()=>togNotif('missedCallback')}/>
              <Toggle label="Daily Summary Email" desc="Receive daily digest of chat performance"      value={notif.dailySummary}    onChange={()=>togNotif('dailySummary')}/>
              <div style={{paddingTop:14}}>
                <label className="st-label">Notification Email</label>
                <input className="st-input" type="email" value={notif.email}
                  onChange={e=>updNotif({email:e.target.value})}/>
              </div>
            </Section>

            {/* Integrations */}
            <Section icon={Plug} title="Integrations">
              {intgs.map((intg,i)=>(
                <div key={i} className="st-intg-row">
                  <div style={{minWidth:0}}>
                    <div className="st-intg-name">{intg.name}</div>
                    <div className="st-intg-desc">{intg.desc}</div>
                  </div>
                  <div className="st-intg-right">
                    <span className={`st-badge ${intg.connected?'green':'gray'}`}>
                      {intg.connected?'Connected':'Disconnected'}
                    </span>
                    <button className="st-btn-sm"
                      onClick={()=>{ if(intg.connected){ setManageModal(intg); } else { setConnectModal(intg); setApiKeyInput(''); } }}>
                      {intg.connected?'Manage':'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </Section>

          </div>
        </div>

        {/* ── Save footer ── */}
        <div className="st-save-footer">
          <button className="st-btn-outline" onClick={()=>setResetModal(true)}>
            <RefreshCw size={13}/> Reset to Defaults
          </button>
          <button className="st-btn-primary" onClick={handleSave}>
            <Save size={14}/> Save All Settings
          </button>
        </div>

      </div>
    </div>
  );
}