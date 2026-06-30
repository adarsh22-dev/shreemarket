import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Store, FileText, ShieldCheck, DollarSign,
  Award, Wallet, BarChart2, Search, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Check, X, Eye, EyeOff, Edit2, Trash2,
  Plus, Download, Star, TrendingUp, Clock, AlertCircle,
  CheckCircle, XCircle, Upload, Mail, Phone, MapPin,
  Package, Users, Percent, CreditCard, UserPlus, ArrowRight,
  Smartphone, Globe, Building2, Save, RefreshCw, AlertTriangle,
} from 'lucide-react';
import {
  getVendors, updateVendorStatus, deleteVendor, updateVendor,
  getCommissionCategories, saveCommissionCategory, updateCommissionCategory, deleteCommissionCategory,
  getTiers, updateTier,
  getPayouts, updatePayout,
  getVendorPerformance, updateVendorPerformance,
  getVendorKyc, updateVendorKyc,
  registerVendor,
} from '../../api/api';
import './Vendormanagement.css';
import { exportCSV } from './VendorShared';

/* ─── INITIAL DATA (empty — fetched from backend) ──────────────── */
const INIT_VENDORS = [];
const INIT_APPLICATIONS = [];
const INIT_PAYOUTS = [];
const INIT_TIERS = [];
const INIT_PERF = [];
const INIT_CAT_RATES = [];

const PAGE = 6;
const CATEGORIES = ['Electronics','Home & Kitchen','Fashion','Grocery','Sports','Others','Home'];
const CITIES = ['Mumbai','Delhi','Surat','Pune','Bangalore','Hyderabad','Jaipur','Chennai','Nashik'];
const TIERS_LIST = ['Basic','Premium','Enterprise'];
const STATUS_LIST = ['Active','Suspended'];
const KYC_STATUS = ['Verified','Pending','Rejected'];

/* ─── TOAST ─────────────────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position:'fixed', bottom:24, right:24, zIndex:99999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12,
        background: t.type==='success' ? '#16a34a' : t.type==='error' ? '#dc2626' : '#0f172a',
        color:'#fff', fontSize:'0.83rem', fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.22)',
        animation:'slideInToast 0.3s ease', pointerEvents:'auto', minWidth:220,
      }}>
        {t.type==='success' ? <CheckCircle size={15}/> : t.type==='error' ? <XCircle size={15}/> : <AlertCircle size={15}/>}
        {t.message}
      </div>
    ))}
    <style>{`@keyframes slideInToast { from { transform:translateX(120%); opacity:0 } to { transform:translateX(0); opacity:1 } }`}</style>
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
};

/* ─── CONFIRM DIALOG ──────────────────────────────────────────── */
const ConfirmDialog = ({ msg, onConfirm, onCancel, type='danger', password, setPassword }) => (
  <div onClick={e => e.target===e.currentTarget && onCancel()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:380, width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div style={{ width:42, height:42, borderRadius:11, background: type==='danger' ? '#fee2e2' : '#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <AlertTriangle size={20} color={type==='danger'?'#dc2626':'#d97706'}/>
        </div>
        <div>
          <p style={{ fontWeight:800, color:'#111', margin:'0 0 4px', fontSize:'0.95rem' }}>Confirm Action</p>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.83rem', lineHeight:1.5 }}>{msg}</p>
          {password !== undefined && setPassword && (
            <input type="password" placeholder="Enter admin password" value={password} autoFocus
              onChange={e => setPassword(e.target.value)}
              style={{ marginTop:10, width:'100%', padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', outline:'none', boxSizing:'border-box' }}
              onClick={e => e.stopPropagation()} />
          )}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:8, border:'none', background: type==='danger'?'#dc2626':'#d97706', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>Confirm</button>
      </div>
    </div>
  </div>
);

/* ─── VIEW/EDIT VENDOR MODAL ──────────────────────────────────── */
const VendorModal = ({ vendor, mode, onClose, onSave, toast }) => {
  const [form, setForm] = useState({ ...vendor });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow=''; };
  }, [onClose]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast('Name and email required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        status: form.status,
        rating: parseFloat(form.rating) || 0,
        tier: form.tier,
        kycStatus: form.kyc,
        commissionRate: parseFloat(form.commission) || 0,
        paymentMethod: form.paymentMethod || null,
        paymentEmail: form.paymentEmail || null,
        pan: form.pan || null,
        gst: form.gst || null,
        agreeTerms: form.agreeTerms ?? null,
        agreePolicies: form.agreePolicies ?? null,
        agreeRules: form.agreeRules ?? null,
        agreePrivacy: form.agreePrivacy ?? null,
        newsletter: form.newsletter ?? null,
      };
      await updateVendor(vendor.id, payload);
      onSave(form);
      toast('Vendor updated successfully');
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to update vendor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, field, type='text', options }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>{label}</label>
      {options ? (
        <select value={form[field]||''} disabled={mode==='view'} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
          style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background: mode==='view'?'#f8fafc':'#fff', color:'#111', outline:'none', cursor: mode==='view'?'default':'pointer' }}>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]||''} readOnly={mode==='view'}
          onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
          style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background: mode==='view'?'#f8fafc':'#fff', color:'#111', outline:'none', transition:'all 0.15s' }}
          onFocus={e=>{ if(mode!=='view') e.target.style.borderColor='#E03E1A'; }}
          onBlur={e=>e.target.style.borderColor='#e5e5e5'} />
      )}
    </div>
  );

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:700, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background: mode==='view'?'#dbeafe':'#fff5f3', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {mode==='view' ? <Eye size={18} color="#2563eb"/> : <Edit2 size={18} color="#E03E1A"/>}
            </div>
            <div>
              <h3 style={{ fontSize:'1rem', fontWeight:800, margin:'0 0 2px' }}>{mode==='view'?'Vendor Details':'Edit Vendor'}</h3>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{vendor.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>

        <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <F label="Full Name"    field="name"       />
          <F label="Email"        field="email"  type="email" />
          <F label="Phone"        field="phone"      />
          <F label="City"         field="city"   options={CITIES} />
          <F label="Category"     field="category" options={CATEGORIES} />
          <F label="Status"       field="status" options={STATUS_LIST} />
          <F label="Tier"         field="tier"   options={TIERS_LIST} />
          <F label="KYC Status"   field="kyc"    options={KYC_STATUS} />
          <F label="Rating (0-5)" field="rating" type="number" />
          <F label="Commission %" field="commission" type="number" />
          <F label="PAN"          field="pan" />
          <F label="GST"          field="gst" />
          <F label="Payment Method" field="paymentMethod" />
          <F label="Payment Email"  field="paymentEmail" type="email" />
        </div>

        {mode==='edit' && (
          <>
            <div style={{ padding:'0 24px', borderTop:'1px solid #f1f5f9', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingTop:16 }}>
              <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', gridColumn:'1/-1', marginBottom:4 }}>Agreements & Consent</label>
              {[
                { label:'Agreed to Terms & Conditions', field:'agreeTerms' },
                { label:'Agreed to Marketplace Policies', field:'agreePolicies' },
                { label:'Agreed to Vendor Rules', field:'agreeRules' },
                { label:'Agreed to Privacy Policy', field:'agreePrivacy' },
                { label:'Subscribed to Newsletter', field:'newsletter' },
              ].map(({label,field}) => (
                <div key={field} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                  <input type="checkbox" checked={!!form[field]} disabled={mode==='view'}
                    onChange={e => setForm(p => ({...p, [field]: e.target.checked}))}
                    style={{ width:16, height:16, accentColor:'#E03E1A', cursor: mode==='view'?'default':'pointer' }} />
                  <span style={{ fontSize:'0.82rem', color:'#475569' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none', background: saving?'#aaa':'#E03E1A', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor: saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {saving ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'vmSpin 0.6s linear infinite', display:'inline-block' }}/> Saving…</> : <><Save size={13}/>Save Changes</>}
            </button>
          </div>
          </>
        )}
      </div>
      <style>{`@keyframes vmSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
};

/* ─── ADD VENDOR MODAL ─────────────────────────────────────────── */
const IcoUser  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoPhone = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoMail  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IcoLock  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

const AddVendorModal = ({ onClose, onAdd }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ fullName:'', phone:'', email:'', password:'', confirmPassword:'', storeName:'', storeDesc:'', address:'', city:'', category:'', gst:'', pan:'', aadhaar:'', bankAccount:'', kycFiles:[], paymentMethod:'Bank Transfer', beneficiaryName:'', bankAccountNumber:'', confirmBankAccountNumber:'', ifscCode:'', accountType:'Savings', remittanceEmail:'', upiId:'', verifiedUpiBankName:'', panNumberUpi:'', remittanceEmailUpi:'', paypalEmail:'', confirmPaypalEmail:'', paypalLegalName:'', panNumberPaypal:'', purposeCode:'Goods' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ifscBranch, setIfscBranch] = useState('');
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false);

  useEffect(() => {
    if (formData.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
      setIfscLookupLoading(true);
      fetch('https://ifsc.razorpay.com/' + formData.ifscCode.toUpperCase())
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.BRANCH) setIfscBranch(data.BANK + ' - ' + data.BRANCH);
          else setIfscBranch('Not found');
        })
        .catch(() => setIfscBranch('Lookup failed'))
        .finally(() => setIfscLookupLoading(false));
    } else {
      setIfscBranch('');
    }
  }, [formData.ifscCode]);

  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow=''; };
  }, [onClose]);

  const handleChange = e => {
    const { id, value } = e.target;
    setFormData(p => ({ ...p, [id]: value }));
    if (errors[id]) setErrors(p => ({ ...p, [id]:'' }));
  };

  const handleFile = e => {
    const files = Array.from(e.target.files || []);
    setFormData(p => ({ ...p, kycFiles: files }));
    if (errors.kycFiles) setErrors(p => ({ ...p, kycFiles:'' }));
  };

  const validators = {
    0: () => {
      const e = {};
      if (!formData.fullName.trim()) e.fullName = 'Full name required';
      if (!formData.email.trim()) e.email = 'Email required';
      if (!/^\d{10}$/.test(formData.phone.replace(/\D/g,''))) e.phone = 'Enter 10 digit phone';
      if (formData.password.length < 8) e.password = 'Min 8 chars';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords must match';
      return e;
    },
    1: () => {
      const e = {};
      if (!formData.storeName.trim()) e.storeName = 'Store name required';
      if (!formData.address.trim()) e.address = 'Address required';
      if (!formData.city.trim()) e.city = 'City required';
      if (!formData.category.trim()) e.category = 'Category required';
      return e;
    },
    2: () => {
      const e = {};
      if (!formData.pan.trim()) e.pan = 'PAN required';
      if (!formData.gst.trim()) e.gst = 'GST required';
      if (!formData.aadhaar.trim()) e.aadhaar = 'Aadhaar required';
      if (formData.aadhaar.trim() && !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g,''))) e.aadhaar = 'Enter valid 12-digit Aadhaar';
      return e;
    },
    3: () => {
      const e = {};
      if (!formData.pan.trim()) e.pan = 'PAN required';
      if (!formData.aadhaar.trim()) e.aadhaar = 'Aadhaar required';
      if (formData.aadhaar.trim() && !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g,''))) e.aadhaar = 'Enter valid 12-digit Aadhaar';
      if (formData.paymentMethod === 'Bank Transfer') {
        if (!formData.beneficiaryName.trim()) e.beneficiaryName = 'Beneficiary name required';
        if (!formData.bankAccountNumber.trim()) e.bankAccountNumber = 'Account number required';
        if (formData.bankAccountNumber !== formData.confirmBankAccountNumber) e.confirmBankAccountNumber = 'Account numbers must match';
        if (!formData.ifscCode.trim()) e.ifscCode = 'IFSC code required';
        if (formData.ifscCode.length < 11) e.ifscCode = 'IFSC must be 11 characters';
        if (!formData.accountType.trim()) e.accountType = 'Account type required';
        if (!formData.remittanceEmail.trim()) e.remittanceEmail = 'Remittance email required';
      } else if (formData.paymentMethod === 'UPI') {
        if (!formData.upiId.trim()) e.upiId = 'UPI ID required';
        if (!formData.panNumberUpi.trim()) e.panNumberUpi = 'PAN required for TDS tracking';
        if (!formData.remittanceEmailUpi.trim()) e.remittanceEmailUpi = 'Remittance email required';
      } else if (formData.paymentMethod === 'PayPal') {
        if (!formData.paypalEmail.trim()) e.paypalEmail = 'PayPal email required';
        if (formData.paypalEmail !== formData.confirmPaypalEmail) e.confirmPaypalEmail = 'Emails must match';
        if (!formData.paypalLegalName.trim()) e.paypalLegalName = 'Legal name required';
        if (!formData.panNumberPaypal.trim()) e.panNumberPaypal = 'PAN required for compliance';
        if (!formData.purposeCode.trim()) e.purposeCode = 'Purpose code required';
      }
      return e;
    },
  };

  const validateStep = () => {
    const e = validators[step] ? validators[step]() : {};
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(4, s+1)); };
  const back = () => setStep(s => Math.max(0, s-1));

  const submitAll = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        roleId: 3,
        status: "Active",
        stores: [{
          storeName: formData.storeName,
          description: formData.storeDesc,
          fullAddress: formData.address,
          city: formData.city,
        }],
      };
      const result = await registerVendor(payload);
      // Create KYC record with PAN, GST, and bank details
      try {
        const pm = formData.paymentMethod;
        const pmCode = pm === 'Bank Transfer' ? 'bank' : pm === 'UPI' ? 'upi' : pm === 'PayPal' ? 'paypal' : pm;
        let bankDetails = 'Pending||' + pmCode + '||';
        if (pmCode === 'bank') {
          bankDetails += formData.beneficiaryName+'||'+formData.bankAccountNumber+'||'+formData.accountType+'||'+formData.ifscCode+'||'+formData.remittanceEmail+'||';
        } else if (pmCode === 'upi') {
          bankDetails += formData.upiId+'||'+formData.verifiedUpiBankName+'||'+formData.panNumberUpi+'||'+formData.remittanceEmailUpi+'||-||';
        } else if (pmCode === 'paypal') {
          bankDetails += formData.paypalEmail+'||'+formData.paypalLegalName+'||'+formData.panNumberPaypal+'||'+formData.purposeCode+'||-||';
        } else {
          bankDetails += '-||-||-||-||-||';
        }
        await updateVendorKyc({
          vendorId: result.vendorId,
          vendorName: formData.fullName,
          pan: formData.pan.trim() || 'Not Started',
          gst: formData.gst.trim() || 'Not Started',
          aadhaar: formData.aadhaar.trim() || 'Not Started',
          bank: bankDetails,
          address: 'Not Started',
          selfie: 'Not Started',
          overall: 'Pending',
          updated: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
        });
      } catch (kycErr) { console.warn('KYC auto-create failed:', kycErr); }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onAdd({ id: result.vendorId, name: formData.fullName, email: formData.email, phone: formData.phone, city: formData.city, storeName: formData.storeName, status: 'Active', tier: 'Basic', kyc: 'Pending', commission: 0, rating: 0, orders: 0, revenue: '₹0', paymentMethod: formData.paymentMethod, createdAt: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) });
        onClose();
      }, 1200);
    } catch (err) {
      setLoading(false);
      setErrors({ submit: err.message || 'Vendor registration failed' });
    }
  };

  const Field = ({ id, label, type='text', placeholder, IcoComp, maxLength, rightSlot }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }} htmlFor={id}>{label}</label>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <span style={{ position:'absolute', left:10, display:'flex', alignItems:'center', color:'#94a3b8', pointerEvents:'none', zIndex:1 }}><IcoComp /></span>
        <input id={id} type={type} placeholder={placeholder} value={formData[id]||''} onChange={handleChange} maxLength={maxLength}
          style={{ width:'100%', height:40, padding:'0 12px 0 34px', borderRadius:9, border:`1px solid ${errors[id]?'#dc2626':'#e5e5e5'}`, background:'#f8fafc', fontSize:'0.84rem', color:'#111', outline:'none', boxSizing:'border-box' }}
          onFocus={e=>{ e.target.style.borderColor=errors[id]?'#dc2626':'#E03E1A'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(224,62,26,0.1)'; }}
          onBlur={e=>{ e.target.style.borderColor=errors[id]?'#dc2626':'#e5e5e5'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
          autoComplete="off" />
        {rightSlot}
      </div>
      {errors[id] && <p style={{ fontSize:'0.71rem', color:'#dc2626', margin:0, fontWeight:500 }}>{errors[id]}</p>}
    </div>
  );

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:900, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 16px', borderBottom:'1px solid #f3f3f3' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#fff5f3', border:'1px solid #fde8e3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <UserPlus size={18} color="#E03E1A" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#111', margin:'0 0 2px' }}>Add New Vendor</h3>
              <p style={{ fontSize:'0.76rem', color:'#bbb', margin:0 }}>Vendor profile with store, KYC & status</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:'1px solid #efefef', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#888' }}><X size={16}/></button>
        </div>

        {/* Step Indicator */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 24px', background:'#fafafa', borderBottom:'1px solid #f3f3f3', gap:0 }}>
          {['Vendor Details','Store Setup','KYC Docs','Payment Details','Review'].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', fontSize:'0.7rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', background: i<=step?'#E03E1A':'#efefef', color:'#fff', boxShadow: i===step?'0 3px 10px rgba(224,62,26,0.25)':'none' }}>
                {i<step ? <Check size={14}/> : i+1}
              </div>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color: i===step?'#E03E1A':i<step?'#16a34a':'#ccc', whiteSpace:'nowrap' }}>{s}</span>
              {i<4 && <div style={{ width:28, height:1, background: i<step?'#16a34a':'#e5e5e5', margin:'0 6px' }}/>}
            </div>
          ))}
        </div>

        <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 260px', gap:20, minHeight:380 }}>
          <div>
            {success ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'60px 24px', textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle size={36} color="#16a34a"/>
                </div>
                <p style={{ fontSize:'1.1rem', fontWeight:800, color:'#111', margin:0 }}>Vendor Created!</p>
                <p style={{ fontSize:'0.8rem', color:'#aaa', margin:0 }}>Closing…</p>
              </div>
            ) : (
              <>
                {step===0 && (
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#111', marginBottom:16 }}>Vendor Details</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <Field id="fullName" label="Full Name" placeholder="John Doe" IcoComp={IcoUser}/>
                      <Field id="phone" label="Phone" placeholder="9876543210" IcoComp={IcoPhone} maxLength={10}/>
                    </div>
                    <Field id="email" label="Email" type="email" placeholder="vendor@example.com" IcoComp={IcoMail}/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                      <Field id="password" label="Password" type={showPwd?'text':'password'} placeholder="••••••••" IcoComp={IcoLock}
                        rightSlot={<button type="button" onClick={()=>setShowPwd(p=>!p)} tabIndex={-1} style={{ position:'absolute', right:10, background:'none', border:'none', cursor:'pointer', color:'#bbb', padding:0, display:'flex', alignItems:'center' }}>
                          <Eye size={14}/>
                        </button>}/>
                      <Field id="confirmPassword" label="Confirm Password" type={showPwd?'text':'password'} placeholder="••••••••" IcoComp={IcoLock}/>
                    </div>
                  </div>
                )}
                {step===1 && (
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#111', marginBottom:16 }}>Store Setup</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <Field id="storeName" label="Store Name" placeholder="My Electronics Store" IcoComp={Package}/>
                      <Field id="city" label="City" placeholder="Mumbai" IcoComp={MapPin}/>
                    </div>
                    <Field id="category" label="Category" placeholder="Electronics" IcoComp={Package}/>
                    <div style={{ marginTop:12 }}>
                      <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', display:'block', marginBottom:5 }}>Store Description</label>
                      <textarea id="storeDesc" rows={3} value={formData.storeDesc||''} onChange={handleChange} placeholder="Brief description…" style={{ width:'100%', padding:'10px 12px', borderRadius:9, border:'1px solid #e5e5e5', background:'#f8fafc', fontSize:'0.84rem', color:'#111', outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
                    </div>
                    <div style={{ marginTop:12 }}>
                      <Field id="address" label="Business Address" placeholder="123 Main St" IcoComp={MapPin}/>
                    </div>
                  </div>
                )}
                {step===2 && (
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#111', marginBottom:16 }}>KYC Documents</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <Field id="pan" label="PAN Number" placeholder="ABCDE1234F" IcoComp={UserPlus}/>
                      <Field id="gst" label="GST Number" placeholder="22AAAAA0000A1Z5" IcoComp={Percent}/>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <Field id="aadhaar" label="Aadhaar Number" placeholder="1234 5678 9012" IcoComp={UserPlus} maxLength={14}/>
                    </div>
                    <div style={{ position:'relative', border:'2px dashed #ddd', borderRadius:10, padding:20, textAlign:'center', cursor:'pointer', background:'#fafafa' }}>
                      <input type="file" multiple onChange={handleFile} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} accept=".pdf,.jpg,.jpeg,.png"/>
                      <Upload size={28} color="#bbb" style={{ margin:'0 auto 8px' }}/>
                      <p style={{ margin:'8px 0 4px', color:'#666', fontWeight:600, fontSize:'0.84rem' }}>Click to upload KYC docs</p>
                      <p style={{ margin:0, fontSize:'0.73rem', color:'#aaa' }}>PDF, JPG, PNG up to 5MB</p>
                    </div>
                    {(formData.kycFiles||[]).map((f,i)=>(
                      <div key={i} style={{ padding:'8px 12px', background:'#f3f4f6', borderRadius:6, marginTop:8, fontSize:'0.8rem', color:'#475569', display:'flex', alignItems:'center', gap:8 }}>
                        <Check size={13} color="#16a34a"/>{f.name}
                      </div>
                    ))}
                  </div>
                )}
                                {step===3 && (
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#111', marginBottom:16 }}>Payment Details</p>
                    <p style={{ fontSize:'0.78rem', color:'#64748b', marginBottom:14 }}>Select your preferred payout method and enter required details</p>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                      <Field id="pan" label="PAN Number *" placeholder="ABCDE1234F" IcoComp={UserPlus} maxLength={10}/>
                      <Field id="aadhaar" label="Aadhaar Number *" placeholder="1234 5678 9012" IcoComp={UserPlus} maxLength={14}/>
                    </div>
                    
                    <div style={{ marginBottom:16 }}>
                      <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', display:'block', marginBottom:5 }}>Payment Method</label>
                      <select id="paymentMethod" value={formData.paymentMethod||'Bank Transfer'} onChange={handleChange}
                        style={{ width:'100%', height:40, padding:'0 12px', borderRadius:9, border:`1px solid ${errors.paymentMethod?'#dc2626':'#e5e5e5'}`, background:'#f8fafc', fontSize:'0.84rem', color:'#111', outline:'none', cursor:'pointer' }}
                        onFocus={e=>{ e.target.style.borderColor=errors.paymentMethod?'#dc2626':'#E03E1A'; e.target.style.background='#fff'; }}
                        onBlur={e=>{ e.target.style.borderColor=errors.paymentMethod?'#dc2626':'#e5e5e5'; e.target.style.background='#f8fafc'; }}>
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI">UPI / GPay</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>

                    {/* Bank Transfer */}
                    {formData.paymentMethod === 'Bank Transfer' && (
                      <div style={{ background:'#f8faff', borderRadius:10, padding:16, border:'1px solid #e0e7ff' }}>
                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#4338ca', margin:'0 0 12px' }}>
                          <Building2 size={14} style={{marginRight:6}}/>Bank Transfer Details
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="beneficiaryName" label="Legal Business / Beneficiary Name" placeholder="Enter legal business name" IcoComp={UserPlus}/>
                          <Field id="bankAccountNumber" label="Bank Account Number" placeholder="Enter account number" IcoComp={CreditCard} maxLength={20}/>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="confirmBankAccountNumber" label="Re-enter Bank Account Number" placeholder="Re-enter account number" IcoComp={CreditCard} maxLength={20}/>
                          <Field id="ifscCode" label="IFSC Code (11 digits)" placeholder="E.g. HDFC0001234" IcoComp={MapPin} maxLength={11}
                rightSlot={formData.ifscCode?.length===11?<span style={{position:'absolute',right:10,fontSize:'0.65rem',color:'#16a34a',fontWeight:600}}>✓</span>:null}/>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>Account Type</label>
                            <select id="accountType" value={formData.accountType||'Savings'} onChange={handleChange}
                              style={{ width:'100%', height:40, padding:'0 12px', borderRadius:9, border:'1px solid #e5e5e5', background:'#f8fafc', fontSize:'0.84rem', color:'#111', outline:'none', cursor:'pointer' }}>
                              <option value="Savings">Savings</option>
                              <option value="Current">Current</option>
                            </select>
                          </div>
                          <Field id="remittanceEmail" label="Vendor Email for Remittance Advice" placeholder="finance@vendor.com" IcoComp={Mail} type="email"/>
                        </div>
                        {ifscLookupLoading && <p style={{fontSize:'0.7rem',color:'#6366f1',margin:'6px 0 0'}}>Looking up IFSC...</p>}
                      {ifscBranch && !ifscLookupLoading && <p style={{fontSize:'0.7rem',color:ifscBranch==='Not found'||ifscBranch==='Lookup failed'?'#dc2626':'#16a34a',margin:'6px 0 0'}}><Check size={11} style={{marginRight:4}}/>{ifscBranch}</p>}
                      <p style={{ fontSize:'0.7rem', color:'#6366f1', margin:'6px 0 0' }}>These details will be verified and used for KYC &amp; payout processing.</p>
                      </div>
                    )}

                    {/* UPI / GPay */}
                    {formData.paymentMethod === 'UPI' && (
                      <div style={{ background:'#f0fdf4', borderRadius:10, padding:16, border:'1px solid #bbf7d0' }}>
                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#16a34a', margin:'0 0 12px' }}>
                          <Smartphone size={14} style={{marginRight:6}}/>UPI / GPay Details
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="upiId" label="Vendor UPI ID / VPA" placeholder="name@okaxis or mobile@upi" IcoComp={Smartphone}/>

                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="verifiedUpiBankName" label="Bank Name" placeholder="Enter bank name" IcoComp={Store} />
                          <Field id="panNumberUpi" label="PAN Number (for TDS)" placeholder="ABCDE1234F" IcoComp={UserPlus} maxLength={10}/>
                        </div>
                        <Field id="remittanceEmailUpi" label="Remittance Email Address" placeholder="finance@vendor.com" IcoComp={Mail} type="email"/>
                      </div>
                    )}

                    {/* PayPal */}
                    {formData.paymentMethod === 'PayPal' && (
                      <div style={{ background:'#fff7ed', borderRadius:10, padding:16, border:'1px solid #fed7aa' }}>
                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#d97706', margin:'0 0 12px' }}>
                          <Globe size={14} style={{marginRight:6}}/>PayPal Details
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="paypalEmail" label="PayPal Email Address" placeholder="paypal@vendor.com" IcoComp={Mail} type="email"/>
                          <Field id="confirmPaypalEmail" label="Re-enter PayPal Email" placeholder="Re-enter PayPal email" IcoComp={Mail} type="email"/>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                          <Field id="paypalLegalName" label="Registered Legal Name" placeholder="Must match PayPal account" IcoComp={UserPlus}/>
                          <Field id="panNumberPaypal" label="PAN Number (RBI Compliance)" placeholder="ABCDE1234F" IcoComp={UserPlus} maxLength={10}/>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>Purpose Code (RBI for cross-border)</label>
                          <select id="purposeCode" value={formData.purposeCode||'Goods'} onChange={handleChange}
                            style={{ width:'100%', height:40, padding:'0 12px', borderRadius:9, border:'1px solid #e5e5e5', background:'#f8fafc', fontSize:'0.84rem', color:'#111', outline:'none', cursor:'pointer' }}>
                            <option value="Goods">Goods (P0101)</option>
                            <option value="Software Services">Software Services (P0102)</option>
                            <option value="Consultancy">Consultancy (P0103)</option>
                            <option value="Freelance">Freelance (P0104)</option>
                            <option value="E-Commerce">E-Commerce (P0105)</option>
                            <option value="Other">Other (P0199)</option>
                          </select>
            </div>
          </div>
        )}
          </div>
                )}
{step===4 && (
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#111', marginBottom:16 }}>Review Details</p>
                    <div style={{ background:'#fafafa', padding:16, borderRadius:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      {[['Full Name',formData.fullName],['Email',formData.email],['Phone',formData.phone],['Store',formData.storeName],['Category',formData.category],['City',formData.city],['PAN',formData.pan],['Aadhaar',formData.aadhaar?formData.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/,'$1 $2 $3'):'—'],['GST',formData.gst],['Method',formData.paymentMethod],['Beneficiary/UPI/PayPal',formData.paymentMethod==='Bank Transfer'?formData.beneficiaryName:formData.paymentMethod==='UPI'?formData.upiId:formData.paypalEmail]].map(([label,val])=>(
                        <div key={label}>
                          <p style={{ fontSize:'0.73rem', color:'#666', fontWeight:600, margin:'0 0 3px' }}>{label}</p>
                          <p style={{ fontSize:'0.92rem', color:'#111', fontWeight:600, margin:0 }}>{val||'—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ background:'#fafafa', borderRadius:10, padding:16, height:'fit-content' }}>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#111', marginBottom:10 }}>PROGRESS</p>
            <div style={{ height:8, background:'#e5e5e5', borderRadius:8, overflow:'hidden', marginBottom:10 }}>
              <div style={{ width:`${((step+1)/5)*100}%`, height:'100%', background:'linear-gradient(90deg,#E03E1A,#ff7a5c)', transition:'width 0.3s' }}/>
            </div>
            <p style={{ fontSize:'0.74rem', color:'#666', margin:'0 0 14px' }}>Step {step+1} of 5</p>
            <hr style={{ margin:'0 0 14px', border:'none', borderTop:'1px solid #e5e5e5' }}/>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#111', marginBottom:8 }}>Tips</p>
            <ul style={{ fontSize:'0.73rem', color:'#666', margin:0, paddingLeft:16, lineHeight:1.6 }}>
              <li>Use a strong password</li><li>Upload clear KYC docs</li><li>Fill all required fields</li><li>Review before submitting</li>
            </ul>
          </div>
        </div>

        <div style={{ padding:'16px 24px', borderTop:'1px solid #f3f3f3', display:'flex', gap:10, justifyContent:'flex-end', background:'#fafafa' }}>
          {step>0 && <button onClick={back} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Back</button>}
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
          {step<4 ? (
            <button onClick={next} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 24px', borderRadius:8, border:'none', background:'#E03E1A', fontWeight:700, fontSize:'0.82rem', color:'#fff', cursor:'pointer' }}>Next <ArrowRight size={13}/></button>
          ) : (
            <button onClick={submitAll} disabled={loading} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 24px', borderRadius:8, border:'none', background: loading?'#aaa':'#16a34a', fontWeight:700, fontSize:'0.82rem', color:'#fff', cursor: loading?'not-allowed':'pointer' }}>
              {loading ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'vmSpin 0.6s linear infinite', display:'inline-block' }}/>Creating…</> : 'Create Vendor'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes vmSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
};

/* ─── PAYOUT MODAL ────────────────────────────────────────────── */
const PayoutModal = ({ payout, onClose, onSave, toast }) => {
  const [form, setForm] = useState({ ...payout });

  const approvePayout = () => {
    const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    onSave({ ...form, status:'Paid', date: today });
    toast('Payout approved successfully');
    onClose();
  };

  const retryPayout = () => {
    onSave({ ...form, status:'Pending', date:'—' });
    toast('Payout queued for retry');
    onClose();
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wallet size={18} color="#16a34a"/>
            </div>
            <div>
              <h3 style={{ fontSize:'0.95rem', fontWeight:800, margin:'0 0 2px' }}>Payout Details</h3>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{payout.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>
        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:12 }}>
          {[['Vendor',payout.vendor],['Amount',payout.amount],['Period',payout.period],['Method',payout.method],['Orders',payout.orders],['Date',payout.date],['Status',payout.status]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#fafafa', borderRadius:8 }}>
              <span style={{ fontSize:'0.8rem', color:'#64748b', fontWeight:600 }}>{k}</span>
              <span style={{ fontSize:'0.85rem', color:'#111', fontWeight:700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Close</button>
          {payout.status==='Pending' && <button onClick={approvePayout} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Check size={13}/>Approve Payout</button>}
          {payout.status==='Failed' && <button onClick={retryPayout} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#d97706', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><RefreshCw size={13}/>Retry Payout</button>}
        </div>
      </div>
    </div>
  );
};

/* ─── TIER EDIT MODAL ─────────────────────────────────────────── */
const TierModal = ({ tier, onClose, onSave, toast }) => {
  const [form, setForm] = useState({ ...tier, benefitsText: tier.benefits.join('\n') });

  const save = () => {
    const updated = { ...form, benefits: form.benefitsText.split('\n').filter(b=>b.trim()) };
    onSave(updated);
    toast('Tier updated');
    onClose();
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background: tier.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Award size={18} color={tier.color}/>
            </div>
            <h3 style={{ fontSize:'0.95rem', fontWeight:800, margin:0 }}>Edit {tier.name} Tier</h3>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>
        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          {[['Commission Rate', 'commission'],['Min Revenue', 'minRev'],['Max Revenue', 'maxRev']].map(([label, field])=>(
            <div key={field} style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>{label}</label>
              <input value={form[field]||''} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
                style={{ padding:'8px 12px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', color:'#111', outline:'none', background:'#f8fafc' }}
                onFocus={e=>{ e.target.style.borderColor=tier.color; e.target.style.background='#fff'; }}
                onBlur={e=>{ e.target.style.borderColor='#e5e5e5'; e.target.style.background='#f8fafc'; }}/>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Benefits (one per line)</label>
            <textarea rows={5} value={form.benefitsText||''} onChange={e=>setForm(p=>({...p,benefitsText:e.target.value}))}
              style={{ padding:'8px 12px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.83rem', color:'#111', outline:'none', background:'#f8fafc', resize:'vertical' }}
              onFocus={e=>{ e.target.style.borderColor=tier.color; e.target.style.background='#fff'; }}
              onBlur={e=>{ e.target.style.borderColor='#e5e5e5'; e.target.style.background='#f8fafc'; }}/>
          </div>
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
          <button onClick={save} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:tier.color, color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Save size={13}/>Save</button>
        </div>
      </div>
    </div>
  );
};

/* ─── CAT RATE EDIT MODAL ─────────────────────────────────────── */
const CatRateModal = ({ record, isNew, onClose, onSave, toast }) => {
  const [form, setForm] = useState(record ? { ...record } : { cat:'', rate:8, sales:'₹0' });

  const save = () => {
    if (!form.cat.trim()) { toast('Category name required', 'error'); return; }
    onSave(form);
    toast(isNew ? 'Category added' : 'Rate updated');
    onClose();
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:400, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Percent size={18} color="#16a34a"/>
            </div>
            <h3 style={{ fontSize:'0.95rem', fontWeight:800, margin:0 }}>{isNew?'Add Category':'Edit Commission Rate'}</h3>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>
        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          {[['Category Name','cat','text'],['Commission Rate (%)','rate','number'],['Total Sales','sales','text']].map(([label,field,type])=>(
            <div key={field} style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>{label}</label>
              <input type={type} value={form[field]||''} onChange={e=>setForm(p=>({...p,[field]:type==='number'?Number(e.target.value):e.target.value}))} readOnly={!isNew && field==='cat'}
                style={{ padding:'8px 12px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', color:'#111', outline:'none', background: !isNew&&field==='cat'?'#f1f5f9':'#f8fafc' }}
                onFocus={e=>{ if(!(!isNew&&field==='cat')) { e.target.style.borderColor='#16a34a'; e.target.style.background='#fff'; } }}
                onBlur={e=>{ e.target.style.borderColor='#e5e5e5'; e.target.style.background=!isNew&&field==='cat'?'#f1f5f9':'#f8fafc'; }}/>
            </div>
          ))}
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
          <button onClick={save} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Save size={13}/>{isNew?'Add':'Save'}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── REUSABLE UI ──────────────────────────────────────────────── */
const KpiCard = ({ label, value, trend, up, Icon, color, bg }) => (
  <div className="vm-kpi">
    <div className="vm-kpi__top">
      <div className="vm-kpi__icon" style={{ background:bg }}><Icon size={18} color={color} strokeWidth={2.1}/></div>
      <span className={`vm-kpi__trend vm-kpi__trend--${up?'up':'down'}`}>
        {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{trend}
      </span>
    </div>
    <div>
      <div className="vm-kpi__value">{value}</div>
      <div className="vm-kpi__label">{label}</div>
    </div>
  </div>
);

const Badge = ({ label }) => {
  const cls = (label||'').toLowerCase().replace(/\s+/g,'-');
  return <span className={`vm-badge vm-badge--${cls}`}>{label}</span>;
};

const Avatar = ({ name, size='default', variant='' }) => (
  <div className={`vm-avatar vm-avatar--${size}${variant?` vm-avatar--${variant}`:''}`}>{name?.charAt(0)}</div>
);

const Btn = ({ children, variant='outline', sm, icon:Icon, onClick, disabled }) => (
  <button className={`vm-btn vm-btn--${variant}${sm?' vm-btn--sm':''}`} onClick={onClick} disabled={disabled}>
    {Icon && <Icon size={13}/>}{children}
  </button>
);

const IconBtn = ({ icon:Icon, variant='view', title, onClick }) => (
  <button className={`vm-icon-btn vm-icon-btn--${variant}`} title={title} onClick={onClick}><Icon size={13}/></button>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div className="vm-search">
    <span className="vm-search__icon"><Search size={14}/></span>
    <input className="vm-search__input" placeholder={placeholder||'Search...'} value={value||''} onChange={e=>onChange&&onChange(e.target.value)}/>
  </div>
);

const FilterPills = ({ options, active, onChange }) => (
  <div className="vm-filters">
    {options.map(o=>(
      <button key={o} className={`vm-filter${active===o?' is-active':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total/PAGE);
  return (
    <div className="vm-pag">
      <span className="vm-pag__info">{page*PAGE+1}–{Math.min((page+1)*PAGE,total)} of {total}</span>
      <div className="vm-pag__ctrl">
        <button className="vm-pag__btn" onClick={onPrev} disabled={page===0}><ChevronLeft size={13}/></button>
        <span className="vm-pag__label">{page+1} / {pages}</span>
        <button className="vm-pag__btn" onClick={onNext} disabled={(page+1)*PAGE>=total}><ChevronRight size={13}/></button>
      </div>
    </div>
  );
};

const SectionHead = ({ title, sub, children }) => (
  <div className="vm-section-head">
    <div className="vm-section-head__left">
      <p className="vm-section-head__title">{title}</p>
      <p className="vm-section-head__sub">{sub}</p>
    </div>
    {children && <div className="vm-section-head__right">{children}</div>}
  </div>
);

const ProgressBar = ({ value, color, size='md' }) => (
  <div className={`vm-bar vm-bar--${size}`}>
    <div className="vm-bar__fill" style={{ width:`${value}%`, background:color }}/>
  </div>
);

/* ─── helper: map backend vendor → UI vendor shape ────────────── */
const mapBackendVendor = (v) => {
  const store = v.stores?.[0] || {};
  return {
    id: v.id,
    name: v.name || '—',
    email: v.email || '—',
    phone: v.phone || '—',
    city: store.city || store.address?.split(',')[0]?.trim() || '—',
    storeName: store.storeName || '—',
    storeLogoUrl: store.storeLogo || null,
    // Account Details
    fullName: v.name || '—',
    emailAddress: v.email || '—',
    phoneNumber: v.phone || '—',
    // Store Details
    storeDesc: store.storeDescription || '—',
    storePhone: store.storePhone || '—',
    storeEmail: store.storeEmail || '—',
    storeAddress: store.address || '—',
    storeCity: store.city || '—',
    storeState: store.state || '—',
    storeCountry: store.country || '—',
    storePincode: store.pincode || '—',
    storeLatitude: store.latitude ?? '—',
    storeLongitude: store.longitude ?? '—',
    // Existing fields
    category: '—',
    status: v.status || '—',
    rating: v.rating || 0,
    orders: v.orderCount || 0,
    revenue: v.totalRevenue ? `₹${(v.totalRevenue).toLocaleString('en-IN')}` : '₹0',
    tier: v.tier || '—',
    kyc: v.kycStatus || '—',
    commission: v.commissionRate || 0,
    paymentMethod: v.paymentMethod || '—',
    paymentEmail: v.paymentEmail || '',
    pan: v.pan || '',
    gst: v.gst || '',
    agreeTerms: v.agreeTerms ?? false,
    agreePolicies: v.agreePolicies ?? false,
    agreeRules: v.agreeRules ?? false,
    agreePrivacy: v.agreePrivacy ?? false,
    newsletter: v.newsletter ?? false,
    createdAt: v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  };
};

const parseAmount = (amt) => typeof amt === 'number' ? amt : (Number(String(amt||'0').replace(/[₹,\s]/g, '')) || 0);
const fmtINR = (num) => `₹${num.toLocaleString('en-IN')}`;
const totalPaidSum = (list) => list.filter(p=>p.status==='Paid').reduce((s,p)=>s+parseAmount(p.amount), 0);
const pendingSum = (list) => list.filter(p=>p.status==='Pending').reduce((s,p)=>s+parseAmount(p.amount), 0);

/* ─── 1. ALL VENDORS ───────────────────────────────────────────── */
const AllVendors = ({ onAddVendor, toast }) => {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modal, setModal] = useState(null); // { type:'view'|'edit'|'delete', vendor }
  const [confirm, setConfirm] = useState(null);

  // API-driven state
  const [vendors, setVendors] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // vendorId currently being acted on
  const searchTimerRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  // Fetch vendors from API
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVendors(debouncedSearch, page, PAGE, 'createdAt', 'desc');
      if (data) {
        const mapped = (data.content || []).map(mapBackendVendor);
        setVendors(mapped);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setError(err.message || 'Failed to fetch vendors');
      toast(err.message || 'Failed to fetch vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Filter client-side by status (backend may not support status filter)
  const displayVendors = filter === 'All' ? vendors : vendors.filter(v => v.status === filter);

  const [deletePassword, setDeletePassword] = useState('');

  const handleDelete = (v) => setConfirm({
    msg: `Delete "${v.name}"? This action cannot be undone. Enter your admin password to confirm.`,
    onConfirm: async () => {
      if (!deletePassword) { toast('Password required', 'error'); return; }
      setActionLoading(v.id);
      try {
        await deleteVendor(v.id, deletePassword);
        setDeletePassword('');
        toast(`${v.name} deleted`, 'error');
        fetchVendors();
      } catch (err) {
        toast(err.message || 'Failed to delete vendor', 'error');
      } finally {
        setActionLoading(null);
        setConfirm(null);
      }
    }
  });

  const handleToggleStatus = async (v) => {
    const newStatus = v.status === 'Active' ? 'Suspended' : 'Active';
    setActionLoading(v.id);
    try {
      await updateVendorStatus(v.id, newStatus);
      toast(`${v.name} ${newStatus.toLowerCase()}`);
      // Update locally for instant feedback
      setVendors(p => p.map(x => x.id === v.id ? { ...x, status: newStatus } : x));
    } catch (err) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveVendor = (updated) => {
    setVendors(p => p.map(x => x.id === updated.id ? updated : x));
  };

  const activeCount = vendors.filter(v => v.status === 'Active').length;
  const suspendedCount = vendors.filter(v => v.status === 'Suspended').length;

  return (
    <div className="vm-subpage">
      {confirm && <ConfirmDialog {...confirm} password={deletePassword} setPassword={setDeletePassword} onCancel={() => { setDeletePassword(''); setConfirm(null); }} />}
      {modal && modal.type !== 'delete' && (
        <VendorModal vendor={modal.vendor} mode={modal.type} onClose={() => setModal(null)} onSave={handleSaveVendor} toast={toast} />
      )}

      <div className="vm-kpi-grid">
        <KpiCard label="Total Vendors" value={totalElements} trend="+8.7%" up Icon={Store} color="#7c3aed" bg="#ede9fe" />
        <KpiCard label="Active" value={activeCount} trend="+5.2%" up Icon={CheckCircle} color="#16a34a" bg="#dcfce7" />
        <KpiCard label="Suspended" value={suspendedCount} trend="+2" up={false} Icon={XCircle} color="#dc2626" bg="#fee2e2" />
        <KpiCard label="On This Page" value={vendors.length} trend="" up Icon={Star} color="#d97706" bg="#fef3c7" />
      </div>

      <div className="vm-card">
        <SectionHead title="All Vendors" sub="Manage and monitor all registered vendors">
          <SearchBar placeholder="Search vendors…" value={search} onChange={v => { setSearch(v); }} />
          <FilterPills options={['All', 'Active', 'Suspended']} active={filter} onChange={v => { setFilter(v); }} />
          <Btn variant="primary" icon={Plus} onClick={onAddVendor}>Add Vendor</Btn>
          <Btn variant="outline" icon={RefreshCw} sm onClick={fetchVendors} disabled={loading}>Refresh</Btn>
        </SectionHead>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
            <span style={{ width: 18, height: 18, border: '2.5px solid #e5e5e5', borderTopColor: '#E03E1A', borderRadius: '50%', animation: 'vmSpin 0.6s linear infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Loading vendors...</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>{error}</span>
            <Btn sm onClick={fetchVendors}>Retry</Btn>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="vm-table-wrap">
              <table className="vm-table">
                <thead>
                  <tr>
                    <th>Vendor</th><th className="vm-col-hide-sm">Store</th><th className="vm-col-hide-md">Contact</th>
                    <th className="vm-col-hide-md">Payment</th><th className="vm-col-hide-md">Joined</th>
                    <th>Status</th><th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayVendors.map(v => (
                    <tr key={v.id} style={{ opacity: actionLoading === v.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <td><div className="vm-vcell"><Avatar name={v.name} /><div><div className="vm-vcell__name">{v.name}</div><div className="vm-vcell__email">{v.email}</div></div></div></td>
                      <td className="vm-col-hide-sm">
                        <div style={{fontSize:'.8rem', fontWeight:600, color:'#0f172a'}}>{v.storeName || '—'}</div>
                        {v.storeDescription && <div style={{fontSize:'.72rem', color:'#94a3b8', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={v.storeDescription}>{v.storeDescription}</div>}
                      </td>
                      <td className="td-muted vm-col-hide-md" style={{fontSize:'.78rem'}}>
                        <div>{v.phone || '—'}</div>
                        <div style={{color:'#94a3b8', fontSize:'.72rem'}}>{v.city || ''}</div>
                      </td>
                      <td className="td-muted vm-col-hide-md" style={{fontSize:'.78rem'}}>{v.paymentMethod || '—'}</td>
                      <td className="td-muted vm-col-hide-md" style={{fontSize:'.78rem'}}>{v.createdAt}</td>
                      <td>
                        <span onClick={() => !actionLoading && handleToggleStatus(v)} style={{ cursor: actionLoading ? 'not-allowed' : 'pointer' }} title="Click to toggle status">
                          <Badge label={v.status} />
                        </span>
                      </td>
                      <td className="td-right">
                        <div className="vm-tbl-actions">
                          <IconBtn icon={Eye} variant="view" title="View" onClick={() => setModal({ type: 'view', vendor: v })} />
                          <IconBtn icon={Edit2} variant="edit" title="Edit" onClick={() => setModal({ type: 'edit', vendor: v })} />
                          <IconBtn icon={Trash2} variant="delete" title="Delete" onClick={() => handleDelete(v)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayVendors.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>No vendors found</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="vm-pag">
              <span className="vm-pag__info">
                {totalElements === 0 ? '0 vendors' : `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, totalElements)} of ${totalElements}`}
              </span>
              <div className="vm-pag__ctrl">
                <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={13} /></button>
                <span className="vm-pag__label">{page + 1} / {totalPages || 1}</span>
                <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}><ChevronRight size={13} /></button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes vmSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
};

/* ─── APPLICATION DETAIL MODAL ────────────────────────────────── */
const ApplicationDetailModal = ({ app, onClose }) => {
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow=''; };
  }, [onClose]);

  const Row = ({ label, value }) => (
    <tr>
      <td style={{padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontSize:'.78rem', fontWeight:700, color:'#64748b', whiteSpace:'nowrap', width:'40%'}}>{label}</td>
      <td style={{padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontSize:'.84rem', color:'#0f172a', fontWeight:600}}>{value || '—'}</td>
    </tr>
  );

  const Section = ({ title, rows }) => (
    <>
      <tr><td colSpan={2} style={{padding:'10px 12px 4px', fontSize:'.72rem', fontWeight:800, color:'#4338ca', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #e2e8f0'}}>{title}</td></tr>
      {rows.map((r, i) => <Row key={i} label={r.label} value={r.value}/>)}
    </>
  );

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:640, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Eye size={18} color="#2563eb"/>
            </div>
            <div>
              <h3 style={{ fontSize:'1rem', fontWeight:800, margin:'0 0 2px' }}>Application Details</h3>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{app.name} — {app.id}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>
        <div style={{ padding:6 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              <Section title="Account Details" rows={[
                {label:'Full Name', value:app.fullName},
                {label:'Phone Number', value:app.phoneNumber},
                {label:'Email Address', value:app.emailAddress},
              ]}/>
              <Section title="Store Info" rows={[
                {label:'Store Name', value:app.storeName},
                {label:'Description', value:app.storeDesc},
                {label:'Phone', value:app.storePhone},
                {label:'Email', value:app.storeEmail},
                {label:'Address', value:app.storeAddress},
                {label:'GST', value:app.gst},
              ]}/>
              <Section title="Location" rows={[
                {label:'City', value:app.storeCity || app.city},
                {label:'State', value:app.storeState},
                {label:'Country', value:app.storeCountry},
                {label:'Pincode', value:app.storePincode},
                {label:'Latitude', value:app.storeLatitude},
                {label:'Longitude', value:app.storeLongitude},
              ]}/>
              <Section title="Status" rows={[
                {label:'Status', value:app.status},
                {label:'Applied', value:app.applied},
                {label:'Docs Submitted', value:app.docs || 0},
                {label:'Category', value:app.category},
              ]}/>
            </tbody>
          </table>
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ─── 2. APPLICATIONS ──────────────────────────────────────────── */
const Applications = ({ applications, setApplications, toast }) => {
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);

  const list = applications.filter(a=>(tab==='All'||a.status===tab) && (a.name.toLowerCase().includes(search.toLowerCase())));

  const updateStatus = (id, status) => {
    setApplications(p=>p.map(a=>a.id===id?{...a,status}:a));
    toast(`Application ${status.toLowerCase()}`);
  };

  const counts = { total:applications.length, pending:applications.filter(a=>a.status==='Pending').length, approved:applications.filter(a=>a.status==='Approved').length, rejected:applications.filter(a=>a.status==='Rejected').length };

  return (
    <div className="vm-subpage">
      {viewModal && <ApplicationDetailModal app={viewModal} onClose={() => setViewModal(null)}/>}
      <div className="vm-kpi-grid">
        <KpiCard label="Total Applications" value={counts.total} trend="+6" up Icon={FileText} color="#2563eb" bg="#dbeafe"/>
        <KpiCard label="Pending Review" value={counts.pending} trend="+3" up={false} Icon={Clock} color="#d97706" bg="#fef3c7"/>
        <KpiCard label="Approved" value={counts.approved} trend="+4" up Icon={CheckCircle} color="#16a34a" bg="#dcfce7"/>
        <KpiCard label="Rejected" value={counts.rejected} trend="-1" up Icon={XCircle} color="#dc2626" bg="#fee2e2"/>
      </div>

      <div className="vm-card">
        <SectionHead title="Vendor Applications" sub="Review and process incoming vendor applications">
          <SearchBar placeholder="Search applications…" value={search} onChange={setSearch}/>
          <FilterPills options={['All','Pending','Reviewing','Approved','Rejected']} active={tab} onChange={setTab}/>
        </SectionHead>

        <div className="vm-table-wrap">
          <table className="vm-table">
            <thead>
              <tr>
                <th style={{width:30}}></th>
                <th>Vendor</th>
                <th className="vm-col-hide-md">Store / Category</th>
                <th>Status</th>
                <th className="vm-col-hide-sm">Applied</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(app=>(
                <React.Fragment key={app.id}>
                  <tr>
                    <td style={{textAlign:'center'}}>
                      <Eye size={13} style={{color:'#94a3b8', cursor:'pointer'}} onClick={() => setViewModal(app)}/>
                    </td>
                    <td>
                      <div className="vm-vcell">
                        <Avatar name={app.name} size="sm" variant="indigo"/>
                        <div>
                          <div className="vm-vcell__name">{app.name}</div>
                          <div className="vm-vcell__email">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vm-col-hide-md">
                      <div className="td-muted" style={{fontSize:'.78rem'}}>
                        {app.storeName ? <div><strong>Store:</strong> {app.storeName}</div> : null}
                        <div><strong>Cat:</strong> {app.category || '—'}</div>
                      </div>
                    </td>
                    <td><Badge label={app.status} variant={app.status==='Approved'?'success':app.status==='Rejected'?'danger':app.status==='Pending'?'warning':'info'}/></td>
                    <td className="td-muted vm-col-hide-sm" style={{fontSize:'.78rem'}}>
                      <div className="vm-row vm-gap-4"><Clock size={11}/>{app.applied}</div>
                    </td>
                    <td className="td-right" onClick={e=>e.stopPropagation()}>
                      <div className="vm-tbl-actions" style={{flexWrap:'wrap', gap:4}}>
                        <Btn sm variant="outline" icon={Eye} onClick={() => setViewModal(app)}>View</Btn>
                        {(app.status==='Pending'||app.status==='Reviewing') && (
                          <>
                            <Btn sm variant="approve" icon={Check} onClick={()=>updateStatus(app.id,'Approved')}>Approve</Btn>
                            <Btn sm variant="reject" icon={X} onClick={()=>updateStatus(app.id,'Rejected')}>Reject</Btn>
                          </>
                        )}
                        {app.status==='Pending' && (
                          <Btn sm variant="primary" icon={ArrowRight} onClick={()=>updateStatus(app.id,'Reviewing')}>Review</Btn>
                        )}
                        {app.status==='Rejected' && (
                          <Btn sm variant="outline" icon={RefreshCw} onClick={()=>updateStatus(app.id,'Pending')}>Reconsider</Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                  {}
                </React.Fragment>
              ))}
              {list.length===0 && (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'40px 20px', color:'#94a3b8', fontSize:'0.85rem'}}>No applications found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─── 3. KYC VERIFICATION ──────────────────────────────────────── */
const KYCModal = ({ record, onClose, onSave, toast }) => {
  const [form, setForm] = useState(() => {
    // Parse bank field: 'Status||PayMethod||Detail1||Detail2||Detail3||Detail4||Detail5||'
    // BT: Status||Bank Transfer||Beneficiary||AcctNumber||AcctType||IFSC||RemitEmail||
    // UPI: Status||UPI||UPI_ID||BankName||PAN||RemitEmail||-||
    // PP:  Status||PayPal||Email||LegalName||PAN||PurposeCode||-||
    const parts = (record.bank || '').split('||');
    const rawMethod = (parts[1] || '').toLowerCase();
    const payMethod = rawMethod === 'bank transfer' ? 'bank' : rawMethod === 'upi' ? 'upi' : rawMethod === 'paypal' ? 'paypal' : rawMethod;
    // Preserve actual document values separately so they're never overwritten by status dropdowns
    const origPan = record.pan && record.pan !== 'Pending' ? record.pan : 'Not Started';
    const origGst = record.gst && record.gst !== 'Pending' ? record.gst : 'Not Started';
    const origAadhaar = record.aadhaar || 'Not Started';
    return {
      ...record,
      _originalPan: origPan,
      _originalGst: origGst,
      _originalAadhaar: origAadhaar,
      _bankStatus: parts[0] || 'Not Started',
      _payMethod: payMethod,
      _detail1: parts[2] || '',
      _detail2: parts[3] || '',
      _detail3: parts[4] || '',
      _detail4: parts[5] || '',
      _detail5: parts[6] || '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [revealAcct, setRevealAcct] = useState(false);

  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow=''; };
  }, [onClose]);

  const save = async () => {
    if (!form.vendorName?.trim()) { toast('Vendor name required', 'error'); return; }
    setSaving(true);
    try {
      const bankVal = form._bankStatus+'||'+form._payMethod+'||'+form._detail1+'||'+form._detail2+'||'+form._detail3+'||'+form._detail4+'||'+form._detail5+'||';
      const payload = {
        id: form.id || null,
        vendorId: form.vendorId,
        vendorName: form.vendorName,
        // Preserve actual document values, don't overwrite with status strings
        pan: form._originalPan,
        gst: form._originalGst,
        aadhaar: form._originalAadhaar,
        bank: bankVal,
        address: form.address || 'Not Started',
        selfie: form.selfie || 'Not Started',
        overall: form.overall || 'Not Started',
        updated: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
      };
      const res = await updateVendorKyc(payload);
      onSave(res || payload);
      toast('KYC updated successfully');
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to update KYC', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShieldCheck size={18} color="#2563eb"/>
            </div>
            <div>
              <h3 style={{ fontSize:'0.95rem', fontWeight:800, margin:'0 0 2px' }}>KYC Details — {form.vendorName}</h3>
              <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>Update KYC document verification status</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
        </div>

        <div style={{ padding:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {/* Document Values - Read Only */}
          <div style={{ gridColumn:'1/-1', fontSize:'0.75rem', fontWeight:700, color:'#4338ca', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Submitted Documents</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>PAN Card</label>
            <p style={{ fontSize:'0.84rem', color:'#111', fontWeight:600, margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._originalPan && form._originalPan !== 'Not Started' && form._originalPan !== 'Pending' ? form._originalPan : 'Not Provided'}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>GST Number</label>
            <p style={{ fontSize:'0.84rem', color:'#111', fontWeight:600, margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._originalGst && form._originalGst !== 'Not Started' && form._originalGst !== 'Pending' ? form._originalGst : 'Not Provided'}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Aadhaar Number</label>
            <p style={{ fontSize:'0.84rem', color:'#111', fontWeight:600, margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._originalAadhaar && form._originalAadhaar !== 'Not Started' ? form._originalAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : 'Not Provided'}</p>
          </div>

          {/* Verification Status */}
          <div style={{ gridColumn:'1/-1', fontSize:'0.75rem', fontWeight:700, color:'#4338ca', textTransform:'uppercase', letterSpacing:0.5, marginTop:8, marginBottom:4 }}>Verification Status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Address Proof</label>
            <select value={form.address||'Not Started'} onChange={e=>setForm(p=>({...p,address:e.target.value}))}
              style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background:'#fff', color:'#111', outline:'none', cursor:'pointer' }}>
              {['Not Started','Verified','Pending','Rejected'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Selfie</label>
            <select value={form.selfie||'Not Started'} onChange={e=>setForm(p=>({...p,selfie:e.target.value}))}
              style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background:'#fff', color:'#111', outline:'none', cursor:'pointer' }}>
              {['Not Started','Verified','Pending','Rejected'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Overall KYC</label>
            <select value={form.overall||'Not Started'} onChange={e=>setForm(p=>({...p,overall:e.target.value}))}
              style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background:'#fff', color:'#111', outline:'none', cursor:'pointer' }}>
              {['Not Started','Verified','Pending','Rejected'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Bank / Payment Details */}
          <div style={{ gridColumn:'1/-1', fontSize:'0.75rem', fontWeight:700, color:'#4338ca', textTransform:'uppercase', letterSpacing:0.5, marginTop:8, marginBottom:4 }}>Payment Details</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', textTransform:'capitalize' }}>Bank Status</label>
            <select value={form._bankStatus||'Not Started'} onChange={e=>{
              const st = e.target.value;
              setForm(p=>({...p, _bankStatus: st, bank: st+'||'+p._payMethod+'||'+p._detail1+'||'+p._detail2+'||'+p._detail3+'||'+p._detail4+'||'+p._detail5+'||'}));
            }}
              style={{ padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', background:'#fff', color:'#111', outline:'none', cursor:'pointer' }}>
              {['Not Started','Verified','Pending','Rejected'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Payment Method</label>
            <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._payMethod === 'bank' ? 'Bank Transfer' : form._payMethod === 'upi' ? 'UPI' : form._payMethod === 'paypal' ? 'PayPal' : form._payMethod || '—'}</p>
          </div>
          {/* Bank Transfer fields */}
          {form._payMethod === 'bank' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Beneficiary Name</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail1 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Account Number</label>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5', fontFamily:'monospace', flex:1 }}>{form._detail2 ? (revealAcct ? form._detail2 : 'XXXX'+form._detail2.slice(-4)) : '—'}</p>
                  {form._detail2 && (
                    <button onClick={() => setRevealAcct(p => !p)} style={{ background:'none', border:'1px solid #e5e5e5', borderRadius:8, cursor:'pointer', padding:'8px 10px', display:'flex', alignItems:'center', color:'#64748b' }} title={revealAcct ? 'Hide account number' : 'Show account number'}>
                      {revealAcct ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Account Type</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail3 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>IFSC Code</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail4 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Remittance Email</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail5 || '—'}</p>
              </div>
            </>
          )}
          {/* UPI fields */}
          {form._payMethod === 'upi' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>UPI ID / VPA</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail1 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Bank Name (Verified)</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail2 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>PAN (TDS)</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail3 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Remittance Email</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail4 || '—'}</p>
              </div>
            </>
          )}
          {/* PayPal fields */}
          {form._payMethod === 'paypal' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>PayPal Email</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail1 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Legal Name</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail2 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>PAN (Compliance)</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail3 || '—'}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>Purpose Code</label>
                <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form._detail4 || '—'}</p>
              </div>
            </>
          )}<div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>Last Updated</label>
            <p style={{ fontSize:'0.84rem', color:'#475569', margin:0, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e5e5' }}>{form.updated || '—'}</p>
          </div>
        </div>

        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none', background: saving?'#aaa':'#2563eb', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor: saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {saving ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'vmSpin 0.6s linear infinite', display:'inline-block' }}/> Saving…</> : <><Save size={13}/>Save KYC</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const KYCVerification = ({ onAddVendor, toast }) => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kycModal, setKycModal] = useState(null); // vendor record being KYC-edited
  const [vendorModal, setVendorModal] = useState(null); // { type: 'view'|'edit', vendor }
  const [confirm, setConfirm] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [combined, setCombined] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch vendors and KYC records in parallel
      const [vendorData, kycData] = await Promise.all([
        getVendors(debouncedSearch, page, PAGE, 'createdAt', 'desc'),
        getVendorKyc().catch(() => []),
      ]);

      const vendors = (vendorData?.content || []).map(mapBackendVendor);
      const kycArr = Array.isArray(kycData) ? kycData : (kycData?.content || []);
      const kycRecords = kycArr.map(k => ({
        vendorId: k.vendorId,
        vendorName: k.vendorName,
        pan: k.pan || 'Not Started',
        gst: k.gst || 'Not Started',
        aadhaar: k.aadhaar || 'Not Started',
        bank: k.bank || 'Not Started',
        address: k.address || 'Not Started',
        selfie: k.selfie || 'Not Started',
        overall: k.overall || 'Not Started',
        updated: k.updated || '—',
        id: k.id,
      }));

      // Build a map: vendorId -> KYC record
      const kycMap = {};
      kycRecords.forEach(k => { kycMap[k.vendorId] = k; });

      // Merge: vendors with KYC → show KYC details; others → Not Started defaults
      const merged = vendors.map(v => ({
        vendor: v,
        kyc: kycMap[v.id] || {
          vendorId: v.id,
          vendorName: v.name,
          pan: 'Not Started',
          gst: 'Not Started',
          aadhaar: 'Not Started',
          bank: 'Not Started',
          address: 'Not Started',
          selfie: 'Not Started',
          overall: 'Not Started',
          updated: '—',
          id: null,
        },
      }));

      setCombined(merged);
      setTotalElements(vendorData?.totalElements || 0);
      setTotalPages(vendorData?.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch KYC data:', err);
      setError(err.message || 'Failed to fetch data');
      toast(err.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = (v) => setConfirm({
    msg: `Delete "${v.name}"? This action cannot be undone. Enter admin password.`,
    onConfirm: async () => {
      if (!deletePassword) { toast('Password required', 'error'); return; }
      setActionLoading(v.id);
      try {
        await deleteVendor(v.id, deletePassword);
        setDeletePassword('');
        toast(`${v.name} deleted`, 'error');
        fetchData();
      } catch (err) {
        toast(err.message || 'Failed to delete vendor', 'error');
      } finally {
        setActionLoading(null);
        setConfirm(null);
      }
    }
  });

  const handleKycSave = (updated) => {
    setCombined(p => p.map(c => {
      if (c.vendor.id === (updated.vendorId || c.vendor.id)) {
        return { ...c, kyc: updated };
      }
      return c;
    }));
  };

  const handleSaveVendor = (updated) => {
    setCombined(p => p.map(c =>
      c.vendor.id === updated.id
        ? { ...c, vendor: updated }
        : c
    ));
  };

  const verified = combined.filter(c => c.kyc.overall === 'Verified').length;
  const pendingKyc = combined.filter(c => c.kyc.overall === 'Pending').length;
  const notStarted = combined.filter(c => c.kyc.overall === 'Not Started').length;

  return (
    <div className="vm-subpage">
      {confirm && <ConfirmDialog {...confirm} password={deletePassword} setPassword={setDeletePassword} onCancel={() => { setDeletePassword(''); setConfirm(null); }} />}
      {kycModal && <KYCModal record={kycModal} onClose={() => setKycModal(null)} onSave={handleKycSave} toast={toast} />}
      {vendorModal && (
        <VendorModal vendor={vendorModal.vendor} mode={vendorModal.type} onClose={() => setVendorModal(null)} onSave={handleSaveVendor} toast={toast} />
      )}

      <div className="vm-kpi-grid">
        <KpiCard label="Total Vendors" value={totalElements} trend="" up Icon={Store} color="#7c3aed" bg="#ede9fe"/>
        <KpiCard label="KYC Verified" value={verified} trend="" up Icon={ShieldCheck} color="#16a34a" bg="#dcfce7"/>
        <KpiCard label="Pending" value={pendingKyc} trend="" up={false} Icon={Clock} color="#d97706" bg="#fef3c7"/>
        <KpiCard label="Not Started" value={notStarted} trend="" up={false} Icon={AlertCircle} color="#94a3b8" bg="#f1f5f9"/>
      </div>

      <div className="vm-card">
        <SectionHead title="KYC Verification" sub="View and manage vendor KYC document verification status">
          <SearchBar placeholder="Search vendors…" value={search} onChange={setSearch} />
          <Btn variant="primary" icon={Plus} onClick={onAddVendor}>Add Vendor</Btn>
          <Btn variant="outline" icon={RefreshCw} sm onClick={fetchData} disabled={loading}>Refresh</Btn>
        </SectionHead>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
            <span style={{ width: 18, height: 18, border: '2.5px solid #e5e5e5', borderTopColor: '#E03E1A', borderRadius: '50%', animation: 'vmSpin 0.6s linear infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Loading KYC data...</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>{error}</span>
            <Btn sm onClick={fetchData}>Retry</Btn>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="vm-table-wrap">
              <table className="vm-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>PAN</th>
                    <th className="vm-col-hide-sm">GST</th>
                    <th className="vm-col-hide-md">Aadhaar</th>
                    <th className="vm-col-hide-md">Payment</th>
                    <th>Status</th>
                    <th className="vm-col-hide-sm">Updated</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {combined.map(c => {
                    const v = c.vendor;
                    const k = c.kyc;
                    const bankParts = (k.bank||'').split('||');
                    const bankStatus = bankParts[0] || 'Not Started';
                    const rawPayMethod = (bankParts[1] || '').toLowerCase();
                    const payMethod = rawPayMethod === 'bank transfer' ? 'bank' : rawPayMethod === 'upi' ? 'upi' : rawPayMethod === 'paypal' ? 'paypal' : rawPayMethod;
                    const payMethodLabel = payMethod === 'bank' ? 'Bank Transfer' : payMethod === 'upi' ? 'UPI' : payMethod === 'paypal' ? 'PayPal' : payMethod;
                    const payDetail1 = bankParts[2] || '';
                    const payDetailLabel = payMethod === 'bank' || payMethod === 'upi' || payMethod === 'paypal' ? payDetail1 : '';
                    const sColor = k.overall === 'Verified' ? '#16a34a' : k.overall === 'Pending' ? '#d97706' : k.overall === 'Rejected' ? '#dc2626' : '#94a3b8';
                    return (
                      <tr key={v.id} style={{ opacity: actionLoading === v.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        <td>
                          <div className="vm-vcell">
                            <Avatar name={v.name} />
                            <div>
                              <div className="vm-vcell__name">{v.name}</div>
                              <div className="vm-vcell__email">{v.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{fontSize:'.78rem', fontWeight: k.pan && k.pan !== 'Not Started' ? 600 : 400}}>
                          {k.pan && k.pan !== 'Not Started' ? k.pan : <span style={{color:'#94a3b8'}}>—</span>}
                        </td>
                        <td className="vm-col-hide-sm" style={{fontSize:'.78rem', fontWeight: k.gst && k.gst !== 'Not Started' ? 600 : 400}}>
                          {k.gst && k.gst !== 'Not Started' ? k.gst : <span style={{color:'#94a3b8'}}>—</span>}
                        </td>
                        <td className="vm-col-hide-md" style={{fontSize:'.78rem', fontWeight: k.aadhaar && k.aadhaar !== 'Not Started' ? 600 : 400}}>
                          {k.aadhaar && k.aadhaar !== 'Not Started' ? k.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : <span style={{color:'#94a3b8'}}>—</span>}
                        </td>
                        <td className="vm-col-hide-md" style={{fontSize:'.78rem'}}>
                          {payMethod ? <><span style={{fontWeight:600, color:'#7c3aed'}}>{payMethodLabel}</span><br/>{payDetailLabel ? <span style={{color:'#475569', fontSize:'.72rem'}}>{payDetailLabel}</span> : null}</> : <span style={{color:'#94a3b8'}}>—</span>}
                        </td>
                        <td>
                          <span style={{
                            display:'inline-flex', alignItems:'center', gap:5,
                            padding:'3px 10px', borderRadius:999, fontSize:'.72rem', fontWeight:700,
                            background: k.overall === 'Verified' ? '#dcfce7' : k.overall === 'Pending' ? '#fef3c7' : k.overall === 'Rejected' ? '#fee2e2' : '#f1f5f9',
                            color: sColor
                          }}>
                            {k.overall === 'Verified' && <CheckCircle size={11} />}
                            {k.overall === 'Pending' && <Clock size={11} />}
                            {k.overall === 'Rejected' && <XCircle size={11} />}
                            {k.overall || 'Not Started'}
                          </span>
                        </td>
                        <td className="td-muted vm-col-hide-sm" style={{ fontSize:'0.78rem' }}>{k.updated}</td>
                        <td className="td-right">
                          <div className="vm-tbl-actions">
                            <IconBtn icon={Eye} variant="view" title="View Vendor" onClick={() => setVendorModal({ type: 'view', vendor: v })} />
                            <IconBtn icon={ShieldCheck} variant="view" title="Edit KYC" onClick={() => setKycModal({ ...k, vendorId: v.id, vendorName: v.name })} />
                            <IconBtn icon={Trash2} variant="delete" title="Delete Vendor" onClick={() => handleDelete(v)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {combined.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>No vendors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="vm-pag">
              <span className="vm-pag__info">
                {totalElements === 0 ? '0 vendors' : `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, totalElements)} of ${totalElements}`}
              </span>
              <div className="vm-pag__ctrl">
                <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={13} /></button>
                <span className="vm-pag__label">{page + 1} / {totalPages || 1}</span>
                <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}><ChevronRight size={13} /></button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes vmSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
};

/* ─── 4. COMMISSION SETTINGS ───────────────────────────────────── */
const CommissionSettings = ({ vendors, setVendors, catRates, setCatRates, payouts, toast }) => {
  const [catModal, setCatModal] = useState(null); // { record, isNew }
  const [commissions, setCommissions] = useState(vendors.reduce((acc,v)=>({...acc,[v.id]:v.commission}),{}));

  const saveCommission = (vendorId) => {
    const val = parseFloat(commissions[vendorId]);
    if (isNaN(val) || val < 0 || val > 100) { toast('Enter a valid commission rate (0–100)', 'error'); return; }
    setVendors(p=>p.map(v=>v.id===vendorId?{...v,commission:val}:v));
    toast('Commission rate saved');
  };

  const handleCatSave = async (record) => {
    try {
      let saved;
      if (record.id) {
        saved = await updateCommissionCategory(record.id, record);
      } else {
        saved = await saveCommissionCategory(record);
      }
      const result = saved || record;
      setCatRates(p => {
        const exists = p.find(c => c.cat === result.cat);
        return exists ? p.map(c => c.cat === result.cat ? result : c) : [...p, result];
      });
    } catch (e) { toast(e.message || 'Commission save failed', 'error'); }
  };

  const deleteCat = async (cat) => {
    setCatRates(p=>p.filter(c=>c.cat!==cat));
    toast(`${cat} removed`, 'error');
    const found = catRates.find(c=>c.cat===cat);
    if (found?.id) { try { await deleteCommissionCategory(found.id); } catch (e) { toast(e.message || 'Commission delete failed', 'error'); } }
  };

  const avgComm = vendors.length ? (vendors.reduce((s,v)=>s+v.commission,0)/vendors.length).toFixed(1) : '0';

  return (
    <div className="vm-subpage">
      {catModal && <CatRateModal record={catModal.record} isNew={catModal.isNew} onClose={()=>setCatModal(null)} onSave={handleCatSave} toast={toast}/>}

      <div className="vm-kpi-grid">
        <KpiCard label="Avg Commission" value={`${avgComm}%`} trend="+0.3%" up Icon={Percent} color="#16a34a" bg="#dcfce7"/>
        <KpiCard label="Earned" value={fmtINR(totalPaidSum(payouts))} trend="+18.4%" up Icon={DollarSign} color="#7c3aed" bg="#ede9fe"/>
        <KpiCard label="Pending" value={fmtINR(pendingSum(payouts))} trend="-5.2%" up Icon={Clock} color="#d97706" bg="#fef3c7"/>
        <KpiCard label="Total Paid" value={fmtINR(totalPaidSum(payouts))} trend="+22.1%" up Icon={CreditCard} color="#2563eb" bg="#dbeafe"/>
      </div>

      <div className="vm-two-col">
        <div className="vm-card">
          <SectionHead title="Commission by Category" sub="Default rates for new vendors">
            <Btn variant="primary" icon={Plus} sm onClick={()=>setCatModal({record:null,isNew:true})}>Add Category</Btn>
          </SectionHead>
          <div className="vm-stack-8">
            {catRates.map((c,i)=>(
              <div key={i} className="vm-comm-row">
                <div className="vm-f1">
                  <div className="vm-comm-name">{c.cat}</div>
                  <div className="vm-comm-sub">Sales: {c.sales}</div>
                </div>
                <div className="vm-comm-rate"><Percent size={12} color="#475569"/><span className="vm-comm-rate__num">{c.rate}</span></div>
                <IconBtn icon={Edit2} variant="edit" title="Edit rate" onClick={()=>setCatModal({record:c,isNew:false})}/>
                <IconBtn icon={Trash2} variant="delete" title="Remove" onClick={()=>deleteCat(c.cat)}/>
              </div>
            ))}
          </div>
        </div>

        <div className="vm-card">
          <SectionHead title="Vendor Overrides" sub="Custom rates per vendor — edit inline & save"/>
          <div className="vm-comm-scroll vm-stack-8">
            {vendors.map((v)=>(
              <div key={v.id} className="vm-comm-row">
                <Avatar name={v.name} size="sm"/>
                <div className="vm-f1">
                  <div className="vm-comm-name vm-trunc">{v.name}</div>
                  <div className="vm-comm-sub">{v.category}</div>
                </div>
                <input
                  type="number" min="0" max="100"
                  value={commissions[v.id]??v.commission}
                  onChange={e=>setCommissions(p=>({...p,[v.id]:e.target.value}))}
                  style={{ width:60, padding:'4px 8px', borderRadius:7, border:'1px solid #e5e5e5', fontSize:'0.85rem', fontWeight:700, textAlign:'center', outline:'none', background:'#f8fafc' }}
                  onFocus={e=>{ e.target.style.borderColor='#E03E1A'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(224,62,26,0.1)'; }}
                  onBlur={e=>{ e.target.style.borderColor='#e5e5e5'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
                />
                <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>%</span>
                <IconBtn icon={Save} variant="edit" title="Save commission" onClick={()=>saveCommission(v.id)}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── 6. TIER SYSTEM ───────────────────────────────────────────── */
const TierSystem = ({ vendors, setVendors, tiers, setTiers, toast }) => {
  const [tierModal, setTierModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const handleUpgrade = (v) => {
    const next = v.tier==='Basic'?'Premium':v.tier==='Premium'?'Enterprise':null;
    if (!next) return;
    setVendors(p=>p.map(x=>x.id===v.id?{...x,tier:next}:x));
    toast(`${v.name} upgraded to ${next}`);
  };

  const handleDowngrade = (v) => {
    const prev = v.tier==='Enterprise'?'Premium':v.tier==='Premium'?'Basic':null;
    if (!prev) return;
    setVendors(p=>p.map(x=>x.id===v.id?{...x,tier:prev}:x));
    toast(`${v.name} downgraded to ${prev}`,'error');
  };

  return (
    <div className="vm-subpage">
      {confirm && <ConfirmDialog {...confirm} onCancel={()=>setConfirm(null)} type="warning"/>}
      {tierModal && <TierModal tier={tierModal} onClose={()=>setTierModal(null)} onSave={async (t)=>{ const saved = { ...t, benefits: Array.isArray(t.benefits) ? t.benefits.join('\n') : t.benefits }; setTiers(p=>p.map(x=>x.name===t.name?t:x)); try { await updateTier(saved); } catch(e) { toast(e.message||'Tier save failed','error'); } }} toast={toast}/>}

      <div className="vm-kpi-grid">
        <KpiCard label="Basic"      value={vendors.filter(v=>v.tier==='Basic').length}      trend="+12" up Icon={Store}      color="#64748b" bg="#f1f5f9"/>
        <KpiCard label="Premium"    value={vendors.filter(v=>v.tier==='Premium').length}    trend="+8"  up Icon={Star}       color="#7c3aed" bg="#ede9fe"/>
        <KpiCard label="Enterprise" value={vendors.filter(v=>v.tier==='Enterprise').length} trend="+3"  up Icon={Award}      color="#2563eb" bg="#dbeafe"/>
        <KpiCard label="Upgrades"   value="7"  trend="+3" up Icon={TrendingUp} color="#16a34a" bg="#dcfce7"/>
      </div>

      <div className="vm-tier-cards">
        {tiers.map((t,i)=>(
          <div key={i} className="vm-tier-card" style={{ borderTopColor:t.color }}>
            <div className="vm-tier-card__head">
              <div className="vm-tier-card__icon-wrap">
                <div className="vm-tier-card__icon" style={{ background:t.bg }}><Award size={20} color={t.color} strokeWidth={2}/></div>
                <div>
                  <p className="vm-tier-card__name">{t.name}</p>
                  <span className="vm-tier-card__count">{vendors.filter(v=>v.tier===t.name).length} vendors</span>
                </div>
              </div>
              <IconBtn icon={Edit2} variant="edit" title="Edit tier" onClick={()=>setTierModal(t)}/>
            </div>
            <div className="vm-tier-meta">
              <div className="vm-tier-meta-row">
                <span className="vm-tier-meta-row__label">Revenue Range</span>
                <span className="vm-tier-meta-row__value">{t.minRev} – {t.maxRev}</span>
              </div>
              <div className="vm-tier-meta-row">
                <span className="vm-tier-meta-row__label">Commission Rate</span>
                <span className="vm-tier-meta-row__value" style={{ color:t.color }}>{t.commission}</span>
              </div>
            </div>
            <p className="vm-tier-benefits-label">Benefits</p>
            <div className="vm-tier-benefits">
              {t.benefits.map((b,j)=>(
                <div key={j} className="vm-tier-benefit">
                  <div className="vm-tier-benefit__icon" style={{ background:t.bg }}><Check size={10} color={t.color} strokeWidth={3}/></div>
                  <span className="vm-tier-benefit__text">{b}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="vm-card">
        <SectionHead title="Vendor Tier Distribution" sub="Manage vendor tier assignments">
          <Btn icon={Download} onClick={() => exportCSV([['Name','Email','City','Tier','Status','Rating','Commission'],...vendors.map(v=>[v.name,v.email,v.city,v.tier,v.status,v.rating,v.commission])], 'vendor-tier-distribution.csv')}>Export</Btn>
        </SectionHead>
        <div className="vm-table-wrap">
          <table className="vm-table">
            <thead>
              <tr><th>Vendor</th><th>Current Tier</th><th>Revenue</th><th className="vm-col-hide-md">Orders</th><th className="vm-col-hide-md">Rating</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {vendors.map((v,i)=>{
                const next = v.tier==='Basic'?'Premium':v.tier==='Premium'?'Enterprise':null;
                const prev = v.tier==='Enterprise'?'Premium':v.tier==='Premium'?'Basic':null;
                return (
                  <tr key={i}>
                    <td><div className="vm-vcell"><Avatar name={v.name} size="sm"/><span className="vm-vcell__name">{v.name}</span></div></td>
                    <td><Badge label={v.tier}/></td>
                    <td className="td-bold">{v.revenue}</td>
                    <td className="td-muted vm-col-hide-md">{v.orders}</td>
                    <td className="vm-col-hide-md"><div className="vm-stars"><Star size={12} fill="#f59e0b" color="#f59e0b"/>{v.rating}</div></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {next && <Btn sm onClick={()=>handleUpgrade(v)}>↑ Upgrade to {next}</Btn>}
                        {prev && <Btn sm onClick={()=>setConfirm({ msg:`Downgrade "${v.name}" to ${prev}?`, onConfirm:()=>{ handleDowngrade(v); setConfirm(null); }, type:'warning' })}>↓ Downgrade</Btn>}
                        {!next && <span className="vm-txt-xs vm-c3">Max tier</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─── 7. PAYOUT HISTORY ────────────────────────────────────────── */
const PayoutHistory = ({ payouts, setPayouts, toast }) => {
  if (!payouts.length) return null;
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const list = payouts.filter(p=>(filter==='All'||p.status===filter) && (p.vendor||'').toLowerCase().includes(search.toLowerCase()));
  const slice = list.slice(page*PAGE,(page+1)*PAGE);

  const handleSave = async (updated) => {
    setPayouts(p=>p.map(x=>x.id===updated.id?updated:x));
    try { await updatePayout({ ...updated, vendorName: updated.vendor, payoutId: updated.id }); } catch (e) { toast(e.message || 'Payout save failed', 'error'); }
  };

  const paid = payouts.filter(p=>p.status==='Paid').length;
  const pending = payouts.filter(p=>p.status==='Pending').length;
  const failed = payouts.filter(p=>p.status==='Failed').length;
  const totalPaidAmt = totalPaidSum(payouts);
  const now = new Date();
  const thisMonthStr = now.toLocaleString('en-US',{month:'short',year:'numeric'});
  const thisMonthAmt = payouts.filter(p =>
    p.period===thisMonthStr || (p.date && p.date.includes(now.toLocaleString('en-US',{month:'short'})) && p.date.includes(now.getFullYear()))
  ).reduce((s,p) => s + parseAmount(p.amount), 0);

  return (
    <div className="vm-subpage">
      {modal && <PayoutModal payout={modal} onClose={()=>setModal(null)} onSave={handleSave} toast={toast}/>}

      <div className="vm-kpi-grid">
        <KpiCard label="Total Paid" value={fmtINR(totalPaidAmt)} trend="+22.1%" up Icon={CreditCard} color="#16a34a" bg="#dcfce7"/>
        <KpiCard label="This Month" value={fmtINR(thisMonthAmt)} trend="+8.4%" up Icon={DollarSign} color="#2563eb" bg="#dbeafe"/>
        <KpiCard label="Pending" value={pending} trend="-3" up Icon={Clock} color="#d97706" bg="#fef3c7"/>
        <KpiCard label="Failed" value={failed} trend="-2" up Icon={AlertCircle} color="#dc2626" bg="#fee2e2"/>
      </div>

      <div className="vm-card">
        <SectionHead title="Payout History" sub="Approve pending & retry failed payouts">
          <SearchBar placeholder="Search vendor…" value={search} onChange={v=>{setSearch(v);setPage(0);}}/>
          <FilterPills options={['All','Paid','Pending','Failed']} active={filter} onChange={v=>{setFilter(v);setPage(0);}}/>
          <Btn icon={Download} onClick={() => exportCSV([['Vendor','Amount','Period','Method','Status','Date'],...payouts.map(p=>[p.vendor,p.amount,p.period,p.method,p.status,p.date])], 'payout-history.csv')}>Export</Btn>
        </SectionHead>
        <div className="vm-table-wrap">
          <table className="vm-table">
            <thead>
              <tr>
                <th className="vm-col-hide-md">Payout ID</th><th>Vendor</th><th>Amount</th>
                <th className="vm-col-hide-md">Period</th><th className="vm-col-hide-sm">Orders</th>
                <th className="vm-col-hide-sm">Method</th><th className="vm-col-hide-md">Date</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(p=>(
                <tr key={p.id}>
                  <td className="td-mono vm-col-hide-md">{p.id}</td>
                  <td><div className="vm-vcell"><Avatar name={p.vendor} size="sm"/><span className="vm-vcell__name">{p.vendor}</span></div></td>
                  <td className="td-bold">{p.amount}</td>
                  <td className="td-muted vm-col-hide-md">{p.period}</td>
                  <td className="td-muted vm-col-hide-sm">{p.orders}</td>
                  <td className="td-muted vm-col-hide-sm">{p.method}</td>
                  <td className="td-xs vm-col-hide-md">{p.date}</td>
                  <td><Badge label={p.status}/></td>
                  <td>
                    <div className="vm-tbl-actions">
                      <IconBtn icon={Eye} variant="view" title="View details" onClick={()=>setModal(p)}/>
                      {p.status==='Pending' && <IconBtn icon={Check} variant="edit" title="Approve" onClick={()=>{ const today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); handleSave({...p,status:'Paid',date:today}); toast('Payout approved'); }}/>}
                      {p.status==='Failed' && <IconBtn icon={RefreshCw} variant="retry" title="Retry" onClick={()=>{ handleSave({...p,status:'Pending',date:'—'}); toast('Payout queued for retry'); }}/>}
                    </div>
                  </td>
                </tr>
              ))}
              {slice.length===0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8', fontSize:'0.85rem' }}>No payouts found</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={list.length} onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>
    </div>
  );
};

/* ─── 8. PERFORMANCE METRICS ───────────────────────────────────── */
const PerformanceMetrics = ({ perf, setPerf, toast }) => {
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  if (!perf.length) {
    return (
      <div className="vm-subpage">
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <BarChart2 size={48} color="#d1d5db" style={{marginBottom:16}}/>
          <h3 style={{fontSize:'1.1rem', fontWeight:700, color:'#64748b', marginBottom:8}}>No Performance Data</h3>
          <p style={{fontSize:'0.85rem', color:'#94a3b8', maxWidth:400, margin:'0 auto', lineHeight:1.6}}>
            Performance metrics will appear here once vendors start receiving orders. Data is computed from order history, ratings, fulfillment rates, and vendor activity.
          </p>
        </div>
      </div>
    );
  }

  const scoreColor = s => s>=90?'#16a34a':s>=80?'#d97706':'#dc2626';

  const startEdit = (m) => { setEditing(m.vendor); setEditForm({...m}); };
  const saveEdit = async () => {
    const score = Math.round(
      (editForm.fulfillment*0.4) + ((100-editForm.returns*5)*0.2) + (editForm.rating*10*0.2) + ((10-editForm.response)*5*0.1) + ((20-editForm.complaints)*0.1)
    );
    const updated = { ...editForm, score: Math.min(100,Math.max(0,score)) };
    setPerf(p=>p.map(m=>m.vendor===updated.vendor?updated:m));
    setEditing(null);
    toast('Performance updated');
    try { await updateVendorPerformance({ ...updated, vendorName: updated.vendor }); } catch (e) { toast(e.message || 'Performance save failed', 'error'); }
  };

  return (
    <div className="vm-subpage">
      {editing && (
        <div onClick={e=>e.target===e.currentTarget&&setEditing(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:11, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}><BarChart2 size={18} color="#2563eb"/></div>
                <div>
                  <h3 style={{ fontSize:'0.95rem', fontWeight:800, margin:'0 0 2px' }}>Edit Performance</h3>
                  <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:0 }}>{editing}</p>
                </div>
              </div>
              <button onClick={()=>setEditing(null)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#888' }}><X size={15}/></button>
            </div>
            <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[['Fulfillment %','fulfillment'],['Return Rate %','returns'],['Rating (0-5)','rating'],['Response Time (h)','response'],['Complaints','complaints']].map(([label,field])=>(
                <div key={field} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b' }}>{label}</label>
                  <input type="number" value={editForm[field]||0} onChange={e=>setEditForm(p=>({...p,[field]:parseFloat(e.target.value)||0}))}
                    style={{ padding:'8px 12px', border:'1px solid #e5e5e5', borderRadius:8, fontSize:'0.84rem', color:'#111', outline:'none', background:'#f8fafc' }}
                    onFocus={e=>{ e.target.style.borderColor='#2563eb'; e.target.style.background='#fff'; }}
                    onBlur={e=>{ e.target.style.borderColor='#e5e5e5'; e.target.style.background='#f8fafc'; }}/>
                </div>
              ))}
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa' }}>
              <button onClick={()=>setEditing(null)} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #e5e5e5', background:'#fff', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#2563eb', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Save size={13}/>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="vm-kpi-grid">
        <KpiCard label="Avg Fulfillment" value={`${(perf.reduce((s,m)=>s+m.fulfillment,0)/perf.length||0).toFixed(1)}%`} trend="" up Icon={Package} color="#16a34a" bg="#dcfce7"/>
        <KpiCard label="Avg Return Rate" value={`${(perf.reduce((s,m)=>s+m.returns,0)/perf.length||0).toFixed(1)}%`} trend="" up Icon={TrendingUp} color="#d97706" bg="#fef3c7"/>
        <KpiCard label="Avg Response" value={`${(perf.reduce((s,m)=>s+m.response,0)/perf.length||0).toFixed(1)}h`} trend="" up Icon={Clock} color="#2563eb" bg="#dbeafe"/>
        <KpiCard label="Avg Rating" value={(perf.reduce((s,m)=>s+m.rating,0)/perf.length||0).toFixed(2)} trend="" up Icon={Star} color="#7c3aed" bg="#ede9fe"/>
      </div>

      <div className="vm-card">
        <SectionHead title="Performance Scorecard" sub="Edit metrics — scores auto-calculate">
          <Btn icon={Download} onClick={() => exportCSV([['Vendor','Orders','Revenue','Rating','Growth','Tier'],...perf.map(p=>[p.vendor,p.orders,p.revenue,p.rating,p.growth,p.tier])], 'performance-scorecard.csv')}>Export</Btn>
        </SectionHead>
        <div className="vm-table-wrap">
          <table className="vm-table">
            <thead>
              <tr><th>Vendor</th><th style={{ minWidth:130 }}>Fulfillment</th><th>Returns</th><th className="vm-col-hide-md">Rating</th><th className="vm-col-hide-md">Response</th><th className="vm-col-hide-sm">Complaints</th><th>Score</th><th></th></tr>
            </thead>
            <tbody>
              {perf.map((m,i)=>{
                const sc=scoreColor(m.score);
                return (
                  <tr key={i}>
                    <td><div className="vm-vcell"><Avatar name={m.vendor} size="sm"/><span className="vm-vcell__name">{m.vendor}</span></div></td>
                    <td>
                      <div className="vm-scorebar">
                        <div className="vm-scorebar__track"><div className="vm-scorebar__fill" style={{ width:`${m.fulfillment}%`, background:'#16a34a' }}/></div>
                        <span className="vm-scorebar__num">{m.fulfillment}%</span>
                      </div>
                    </td>
                    <td style={{ color: m.returns>5?'#dc2626':'#16a34a', fontWeight:700 }}>{m.returns}%</td>
                    <td className="vm-col-hide-md"><div className="vm-stars"><Star size={12} fill="#f59e0b" color="#f59e0b"/>{m.rating}</div></td>
                    <td className="vm-col-hide-md" style={{ color: m.response>3?'#d97706':'#16a34a', fontWeight:600 }}>{m.response}h</td>
                    <td className="td-muted vm-col-hide-sm">{m.complaints}</td>
                    <td>
                      <div className="vm-scorebar">
                        <span style={{ fontSize:'1rem', fontWeight:800, color:sc, marginRight:4 }}>{m.score}</span>
                        <div className="vm-scorebar__track"><div className="vm-scorebar__fill" style={{ width:`${m.score}%`, background:sc }}/></div>
                      </div>
                    </td>
                    <td><IconBtn icon={Edit2} variant="edit" title="Edit metrics" onClick={()=>startEdit(m)}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vm-perf-cards">
        {perf.map((m,i)=>{
          const sc=scoreColor(m.score);
          return (
            <div key={i} className="vm-perf-card">
              <div className="vm-perf-card__head">
                <div className="vm-row vm-gap-10"><Avatar name={m.vendor} size="sm"/><span className="vm-perf-card__name">{m.vendor}</span></div>
                <div className="vm-tr">
                  <div className="vm-perf-score-val" style={{ color:sc }}>{m.score}</div>
                  <div className="vm-perf-score-lbl">Score</div>
                </div>
              </div>
              <ProgressBar value={m.score} color={sc} size="sm"/>
              <div className="vm-perf-stats">
                {[{label:'Fulfillment',value:`${m.fulfillment}%`,good:m.fulfillment>=90},{label:'Returns',value:`${m.returns}%`,good:m.returns<=4},{label:'Rating',value:`${m.rating} ★`,good:m.rating>=4.5},{label:'Response',value:`${m.response}h`,good:m.response<=3}].map((s,j)=>(
                  <div key={j} className={`vm-perf-stat vm-perf-stat--${s.good?'good':'bad'}`}>
                    <div className="vm-perf-stat__label">{s.label}</div>
                    <div className="vm-perf-stat__value">{s.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={()=>startEdit(m)} style={{ marginTop:10, width:'100%', padding:'7px 14px', borderRadius:8, border:'1px solid #e5e5e5', background:'#f8fafc', fontSize:'0.78rem', fontWeight:600, color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Edit2 size={11}/>Edit Metrics
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VendorManagement = () => {
  const { tab } = useParams();
  const [active, setActive] = useState(tab || 'all');
  const [vendorModal, setVendorModal] = useState(false);

  // Shared state — flows through all tabs
  const [vendors, setVendors] = useState(INIT_VENDORS);
  const [applications, setApplications] = useState(INIT_APPLICATIONS);
  const [payouts, setPayouts] = useState(INIT_PAYOUTS);
  const [tiers, setTiers] = useState(INIT_TIERS);
  const [catRates, setCatRates] = useState(INIT_CAT_RATES);
  const [perf, setPerf] = useState(INIT_PERF);
  // Perf / tiers / payouts fetched from API stored separately

  // Sync active tab from URL param
  useEffect(() => {
    setActive(tab || 'all');
  }, [tab]);

  const { toasts, show: toast } = useToast();

  const handleAddVendor = (newVendor) => {
    setVendors(p => [...p, newVendor]);
    toast(`${newVendor.name} added successfully!`);
  };

  // Fetch real data from backend on mount for each tab
  useEffect(() => {
    getCommissionCategories().then(data => { if (data) setCatRates(data); }).catch(() => {});
    getTiers().then(data => {
      if (data) setTiers(data.map(t => ({ ...t, benefits: typeof t.benefits === 'string' ? t.benefits.split('\n') : t.benefits })));
    }).catch(() => {});
    getPayouts().then(data => {
      if (data) setPayouts(data.map(p => ({ ...p, vendor: p.vendorName || p.vendor, id: p.payoutId || p.id })));
    }).catch(() => {});
    getVendorPerformance().then(data => {
      if (data) setPerf(data.map(m => ({ ...m, vendor: m.vendorName || m.vendor })));
    }).catch(() => {});
    // Fetch vendors for Commission Settings, etc.
    const loadVendors = async () => {
      try {
        const vendorData = await getVendors('', 0, 200, 'createdAt', 'desc');
        const allVendors = ((vendorData?.content) || []).map(mapBackendVendor);
        setVendors(allVendors);

        // Populate applications from Pending/Reviewing vendors
        const pendingApps = allVendors
          .filter(v => v.status === 'Pending' || v.status === 'Reviewing')
          .map(v => ({ ...v, docs: 0, applied: v.createdAt }));
        if (pendingApps.length) setApplications(pendingApps);
      } catch (e) { console.warn('Failed to fetch vendors:', e); }
    };
    loadVendors();
  }, []);

  return (
    <div className="vm">
      <Toast toasts={toasts} removeToast={()=>{}}/>

      {vendorModal && <AddVendorModal onClose={()=>setVendorModal(false)} onAdd={handleAddVendor}/>}

      <div className="vm-header">
        <div>
          <h2 className="vm-header__title">Vendor Management</h2>
          <p className="vm-header__sub">Manage vendors, applications, KYC, commissions, tiers, payouts and performance.</p>
        </div>
        <div className="vm-header__actions">
          <Btn icon={Download} onClick={() => exportCSV([['Name','Email','Phone','City','Status','Tier','KYC','Commission','Rating','Orders','Revenue'],...vendors.map(v=>[v.name,v.email,v.phone,v.city,v.status,v.tier,v.kyc,v.commission,v.rating,v.orders,v.revenue])], 'vendor-management.csv')}>Export</Btn>
          <Btn variant="primary" icon={Plus} onClick={()=>setVendorModal(true)}>Add Vendor</Btn>
        </div>
      </div>

      {active==='all'        && <AllVendors onAddVendor={()=>setVendorModal(true)} toast={toast}/>}
      {active==='apps'       && <Applications applications={applications} setApplications={setApplications} toast={toast}/>}
      {active==='kyc'        && <KYCVerification onAddVendor={()=>setVendorModal(true)} toast={toast}/>}
      {active==='commission' && <CommissionSettings vendors={vendors} setVendors={setVendors} catRates={catRates} setCatRates={setCatRates} payouts={payouts} toast={toast}/>}
      {active==='tiers'      && <TierSystem vendors={vendors} setVendors={setVendors} tiers={tiers} setTiers={setTiers} toast={toast}/>}
      {active==='payouts'    && <PayoutHistory payouts={payouts} setPayouts={setPayouts} toast={toast}/>}
      {active==='performance'&& <PerformanceMetrics perf={perf} setPerf={setPerf} toast={toast}/>}
    </div>
  );
};

export default VendorManagement;