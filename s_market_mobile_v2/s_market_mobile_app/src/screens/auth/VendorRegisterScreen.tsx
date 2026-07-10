import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StatusBar, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { authApi } from '../../services/auth';

const STEPS = ['Account', 'Store', 'Payment', 'Policies'];

type PaymentMethod = '' | 'bank' | 'upi' | 'paypal';

export default function VendorRegisterScreen() {
  const nav = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '',
    stores: [{
      storeName: '', storePhone: '', storeEmail: '', storeDescription: '',
      address: '', city: '', state: '', country: 'India', pincode: '',
      latitude: '0.00', longitude: '0.00',
    }],
    gst: '',
    pan: '', aadhaar: '',
    paymentMethod: '' as PaymentMethod,
    beneficiaryName: '', bankAccountNumber: '', confirmBankAccountNumber: '',
    ifscCode: '', accountType: 'Savings', remittanceEmail: '',
    upiId: '', verifiedUpiBankName: '', panNumberUpi: '', remittanceEmailUpi: '',
    paypalEmail: '', confirmPaypalEmail: '', paypalLegalName: '',
    panNumberPaypal: '', purposeCode: 'Goods',
    agreeTerms: false, agreePolicies: false, agreeRules: false, agreePrivacy: false,
  });

  const set = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const setStoreField = (idx: number, field: string, value: string) => {
    const stores = [...form.stores];
    stores[idx] = { ...stores[idx], [field]: value };
    setForm(prev => ({ ...prev, stores }));
    const key = `store_${idx}_${field}`;
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const addBranch = () => {
    setForm(prev => ({
      ...prev,
      stores: [...prev.stores, { storeName: '', storePhone: '', storeEmail: '', storeDescription: '', address: '', city: '', state: '', country: 'India', pincode: '', latitude: '0.00', longitude: '0.00' }],
    }));
  };

  const removeBranch = (idx: number) => {
    if (form.stores.length <= 1) return;
    setForm(prev => ({ ...prev, stores: prev.stores.filter((_, i) => i !== idx) }));
  };

  const v1 = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Must be 10 digits';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords must match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const v2 = () => {
    const e: Record<string, string> = {};
    form.stores.forEach((s, i) => {
      if (!s.storeName.trim()) e[`store_${i}_storeName`] = 'Required';
      if (!s.address.trim()) e[`store_${i}_address`] = 'Required';
      if (!s.city.trim()) e[`store_${i}_city`] = 'Required';
      if (!s.pincode.trim()) e[`store_${i}_pincode`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const v3 = () => {
    const e: Record<string, string> = {};
    if (!form.pan.trim()) e.pan = 'Required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase())) e.pan = 'Invalid PAN (e.g. ABCDE1234F)';
    if (!form.aadhaar.trim()) e.aadhaar = 'Required';
    else if (!/^\d{12}$/.test(form.aadhaar.replace(/\s/g, ''))) e.aadhaar = 'Must be 12 digits';
    if (!form.paymentMethod) e.paymentMethod = 'Select a payment method';
    if (form.paymentMethod === 'bank') {
      if (!form.beneficiaryName.trim()) e.beneficiaryName = 'Required';
      if (!form.bankAccountNumber.trim()) e.bankAccountNumber = 'Required';
      if (form.bankAccountNumber !== form.confirmBankAccountNumber) e.confirmBankAccountNumber = 'Must match';
      if (!form.ifscCode.trim()) e.ifscCode = 'Required';
      if (!form.remittanceEmail.trim()) e.remittanceEmail = 'Required';
    } else if (form.paymentMethod === 'upi') {
      if (!form.upiId.trim()) e.upiId = 'Required';
      if (!form.remittanceEmailUpi.trim()) e.remittanceEmailUpi = 'Required';
    } else if (form.paymentMethod === 'paypal') {
      if (!form.paypalEmail.trim()) e.paypalEmail = 'Required';
      if (form.paypalEmail !== form.confirmPaypalEmail) e.confirmPaypalEmail = 'Must match';
      if (!form.paypalLegalName.trim()) e.paypalLegalName = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const v4 = () => {
    const e: Record<string, string> = {};
    if (!form.agreeTerms) e.agreeTerms = 'Required';
    if (!form.agreePolicies) e.agreePolicies = 'Required';
    if (!form.agreeRules) e.agreeRules = 'Required';
    if (!form.agreePrivacy) e.agreePrivacy = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    let ok = false;
    if (step === 1) ok = v1();
    else if (step === 2) ok = v2();
    else if (step === 3) ok = v3();
    if (ok) setStep(s => s + 1);
  };

  const submit = async () => {
    if (!v4()) return;
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, confirmBankAccountNumber, confirmPaypalEmail, fullName, ...clean } = form;
      const payload = { ...clean, name: fullName, stores: form.stores, roleId: 3 };
      await authApi.registerVendor(payload);
      nav.navigate('Login');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <View>
          <Text style={s.h2}>Account Details</Text>
          <Text style={s.sub}>Create your vendor account</Text>
          <Input placeholder="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} icon="person-outline" />
          <Input placeholder="Email" value={form.email} onChange={v => set('email', v)} error={errors.email} icon="mail-outline" keyboardType="email-address" />
          <Input placeholder="Phone (10 digits)" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} icon="call-outline" keyboardType="phone-pad" maxLength={10} />
          <Input placeholder="Password (min 8 chars)" value={form.password} onChange={v => set('password', v)} error={errors.password} icon="lock-closed-outline" secureTextEntry />
          <Input placeholder="Confirm Password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} error={errors.confirmPassword} icon="lock-closed-outline" secureTextEntry />
          <Btn title="Next" onPress={next} />
        </View>
      );
      case 2: return (
        <View>
          <Text style={s.h2}>Store Details</Text>
          <Text style={s.sub}>Set up your business profile</Text>
          {form.stores.map((store, i) => (
            <View key={i} style={s.branchCard}>
              <View style={s.branchHeader}>
                <Text style={s.branchTitle}>Branch #{i + 1}{i === 0 ? ' (Main)' : ''}</Text>
                {i > 0 && (
                  <Pressable onPress={() => removeBranch(i)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </Pressable>
                )}
              </View>
              <Input placeholder="Store Name" value={store.storeName} onChange={v => setStoreField(i, 'storeName', v)} error={errors[`store_${i}_storeName`]} />
              <Input placeholder="Store Phone" value={store.storePhone} onChange={v => setStoreField(i, 'storePhone', v)} keyboardType="phone-pad" />
              <Input placeholder="Store Email" value={store.storeEmail} onChange={v => setStoreField(i, 'storeEmail', v)} keyboardType="email-address" />
              <Input placeholder="Description" value={store.storeDescription} onChange={v => setStoreField(i, 'storeDescription', v)} multiline />
              <Input placeholder="Full Address" value={store.address} onChange={v => setStoreField(i, 'address', v)} error={errors[`store_${i}_address`]} />
              <View style={s.row}>
                <View style={s.half}><Input placeholder="City" value={store.city} onChange={v => setStoreField(i, 'city', v)} error={errors[`store_${i}_city`]} /></View>
                <View style={s.half}><Input placeholder="State" value={store.state} onChange={v => setStoreField(i, 'state', v)} /></View>
              </View>
              <View style={s.row}>
                <View style={s.half}><Input placeholder="Pincode" value={store.pincode} onChange={v => setStoreField(i, 'pincode', v)} error={errors[`store_${i}_pincode`]} keyboardType="number-pad" /></View>
                <View style={s.half}><Input placeholder="Country" value={store.country} onChange={v => setStoreField(i, 'country', v)} /></View>
              </View>
            </View>
          ))}
          <Pressable onPress={addBranch} style={s.addBranch}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={s.addBranchT}>Add Another Branch</Text>
          </Pressable>
          <Text style={[s.sub, { marginTop: 12 }]}>Business KYC</Text>
          <Input placeholder="GST Number (optional)" value={form.gst} onChange={v => set('gst', v)} />
          <View style={s.row}>
            <Btn title="Back" onPress={() => setStep(1)} outline style={{ flex: 1, marginRight: 8 }} />
            <Btn title="Next" onPress={next} style={{ flex: 1 }} />
          </View>
        </View>
      );
      case 3: return (
        <View>
          <Text style={s.h2}>Payment Details</Text>
          <Text style={s.sub}>Set up your payout method</Text>
          <Input placeholder="PAN Number * (e.g. ABCDE1234F)" value={form.pan} onChange={v => set('pan', v.toUpperCase())} error={errors.pan} maxLength={10} />
          <Input placeholder="Aadhaar Number * (12 digits)" value={form.aadhaar} onChange={v => set('aadhaar', v)} error={errors.aadhaar} keyboardType="number-pad" />

          <Text style={[s.sub, { marginTop: 12 }]}>Payment Method</Text>
          <View style={s.pmRow}>
            {(['bank', 'upi', 'paypal'] as const).map(pm => (
              <Pressable key={pm} onPress={() => set('paymentMethod', pm)} style={[s.pmBtn, form.paymentMethod === pm && s.pmBtnOn]}>
                <Text style={[s.pmBtnT, form.paymentMethod === pm && s.pmBtnTOn]}>{pm === 'bank' ? 'Bank' : pm === 'upi' ? 'UPI' : 'PayPal'}</Text>
              </Pressable>
            ))}
          </View>
          {errors.paymentMethod && <Text style={s.errT}>{errors.paymentMethod}</Text>}

          {form.paymentMethod === 'bank' && (
            <View style={s.pmSection}>
              <Input placeholder="Beneficiary Name" value={form.beneficiaryName} onChange={v => set('beneficiaryName', v)} error={errors.beneficiaryName} />
              <Input placeholder="Account Number" value={form.bankAccountNumber} onChange={v => set('bankAccountNumber', v)} error={errors.bankAccountNumber} keyboardType="number-pad" maxLength={20} />
              <Input placeholder="Re-enter Account Number" value={form.confirmBankAccountNumber} onChange={v => set('confirmBankAccountNumber', v)} error={errors.confirmBankAccountNumber} keyboardType="number-pad" maxLength={20} />
              <Input placeholder="IFSC Code" value={form.ifscCode} onChange={v => set('ifscCode', v.toUpperCase())} error={errors.ifscCode} maxLength={11} />
              <View style={s.row}>
                <Pressable onPress={() => set('accountType', 'Savings')} style={[s.atBtn, form.accountType === 'Savings' && s.atBtnOn]}><Text style={[s.atBtnT, form.accountType === 'Savings' && s.atBtnTOn]}>Savings</Text></Pressable>
                <Pressable onPress={() => set('accountType', 'Current')} style={[s.atBtn, form.accountType === 'Current' && s.atBtnOn]}><Text style={[s.atBtnT, form.accountType === 'Current' && s.atBtnTOn]}>Current</Text></Pressable>
              </View>
              <Input placeholder="Remittance Email" value={form.remittanceEmail} onChange={v => set('remittanceEmail', v)} error={errors.remittanceEmail} keyboardType="email-address" />
            </View>
          )}

          {form.paymentMethod === 'upi' && (
            <View style={s.pmSection}>
              <Input placeholder="UPI ID / VPA (e.g. name@upi)" value={form.upiId} onChange={v => set('upiId', v)} error={errors.upiId} />
              <Input placeholder="Bank Name" value={form.verifiedUpiBankName} onChange={v => set('verifiedUpiBankName', v)} />
              <Input placeholder="PAN Number (for TDS)" value={form.panNumberUpi} onChange={v => set('panNumberUpi', v.toUpperCase())} maxLength={10} />
              <Input placeholder="Remittance Email" value={form.remittanceEmailUpi} onChange={v => set('remittanceEmailUpi', v)} error={errors.remittanceEmailUpi} keyboardType="email-address" />
            </View>
          )}

          {form.paymentMethod === 'paypal' && (
            <View style={s.pmSection}>
              <Input placeholder="PayPal Email" value={form.paypalEmail} onChange={v => set('paypalEmail', v)} error={errors.paypalEmail} keyboardType="email-address" />
              <Input placeholder="Re-enter PayPal Email" value={form.confirmPaypalEmail} onChange={v => set('confirmPaypalEmail', v)} error={errors.confirmPaypalEmail} keyboardType="email-address" />
              <Input placeholder="Legal Name (must match PayPal)" value={form.paypalLegalName} onChange={v => set('paypalLegalName', v)} error={errors.paypalLegalName} />
              <Input placeholder="PAN Number" value={form.panNumberPaypal} onChange={v => set('panNumberPaypal', v.toUpperCase())} maxLength={10} />
              <Picker options={['Goods', 'Software Services', 'Consultancy', 'Freelance', 'E-Commerce', 'Other']} selected={form.purposeCode} onSelect={v => set('purposeCode', v)} label="Purpose Code" />
            </View>
          )}
          <View style={s.row}>
            <Btn title="Back" onPress={() => setStep(2)} outline style={{ flex: 1, marginRight: 8 }} />
            <Btn title="Next" onPress={next} style={{ flex: 1 }} />
          </View>
        </View>
      );
      case 4: return (
        <View>
          <Text style={s.h2}>Agreements & Policies</Text>
          <Text style={s.sub}>Review and accept to finalize</Text>
          <CheckboxRow label='I agree to the Terms & Conditions' checked={form.agreeTerms} onToggle={v => set('agreeTerms', v)} error={errors.agreeTerms} />
          <CheckboxRow label='I agree to the Marketplace Policies' checked={form.agreePolicies} onToggle={v => set('agreePolicies', v)} error={errors.agreePolicies} />
          <CheckboxRow label='I have read the Vendor Rules' checked={form.agreeRules} onToggle={v => set('agreeRules', v)} error={errors.agreeRules} />
          <CheckboxRow label='I agree to the Privacy Policy' checked={form.agreePrivacy} onToggle={v => set('agreePrivacy', v)} error={errors.agreePrivacy} />
          {error ? <Text style={s.errT}>{error}</Text> : null}
          <View style={s.row}>
            <Btn title="Back" onPress={() => setStep(3)} outline style={{ flex: 1, marginRight: 8 }} />
            <Btn title="Create Account" onPress={submit} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={s.stepDots}>
          {STEPS.map((label, idx) => (
            <View key={idx} style={s.stepDotItem}>
              <View style={[s.stepDot, step > idx + 1 && s.stepDotDone, step === idx + 1 && s.stepDotActive]}>
                {step > idx + 1 ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[s.stepDotT, step === idx + 1 && s.stepDotTOn]}>{idx + 1}</Text>}
              </View>
              <Text style={[s.stepLabel, step === idx + 1 && s.stepLabelOn]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <ScrollView style={s.flex} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ placeholder, value, onChange, error, icon, secureTextEntry, keyboardType, maxLength, multiline }: {
  placeholder?: string; value: string; onChange: (v: string) => void; error?: string;
  icon?: keyof typeof Ionicons.glyphMap; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad'; maxLength?: number; multiline?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[s.inputWrap, multiline && { minHeight: 80 }, error && { borderColor: colors.error }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />}
        <TextInput
          style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShow(!show)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={s.errT}>{error}</Text> : null}
    </View>
  );
}

function Btn({ title, onPress, outline, style, loading }: { title: string; onPress: () => void; outline?: boolean; style?: ViewStyle; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={[s.btn, outline && s.btnOutline, style]}>
      {loading ? <ActivityIndicator color={outline ? colors.primary : '#fff'} /> : <Text style={[s.btnT, outline && s.btnTOutline]}>{title}</Text>}
    </Pressable>
  );
}

function CheckboxRow({ label, checked, onToggle, error }: { label: string; checked: boolean; onToggle: (v: boolean) => void; error?: string }) {
  return (
    <Pressable onPress={() => onToggle(!checked)} style={s.cbRow}>
      <View style={[s.cb, checked && s.cbOn]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={s.cbLabel}>{label}</Text>
      {error ? <Text style={s.errT}>{error}</Text> : null}
    </Pressable>
  );
}

function Picker({ options, selected, onSelect, label }: { options: string[]; selected: string; onSelect: (v: string) => void; label?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={s.pickerLabel}>{label}</Text> : null}
      <View style={s.pickerRow}>
        {options.map((o: string) => (
          <Pressable key={o} onPress={() => onSelect(o)} style={[s.pickerBtn, selected === o && s.pickerBtnOn]}>
            <Text style={[s.pickerBtnT, selected === o && s.pickerBtnTOn]}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  stepDotItem: { alignItems: 'center', marginHorizontal: 8 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotDone: { backgroundColor: colors.success },
  stepDotT: { fontSize: 12, fontWeight: '600', color: '#fff' },
  stepDotTOn: { color: '#fff' },
  stepLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  stepLabelOn: { color: colors.primary, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 2 },
  sub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.background },
  input: { flex: 1, fontSize: 15, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  half: { flex: 1 },
  errT: { fontSize: 12, color: colors.error, marginTop: 2 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: 8, marginBottom: 8 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  btnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnTOutline: { color: colors.primary },
  branchCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  branchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  branchTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  addBranch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed', marginBottom: 8 },
  addBranchT: { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
  pmRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  pmBtnOn: { borderColor: colors.primary, backgroundColor: '#FFF0EB' },
  pmBtnT: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pmBtnTOn: { color: colors.primary },
  pmSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 8 },
  atBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginHorizontal: 4 },
  atBtnOn: { borderColor: colors.primary, backgroundColor: '#FFF0EB' },
  atBtnT: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  atBtnTOn: { color: colors.primary },
  cbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cb: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cbOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  cbLabel: { flex: 1, fontSize: 14, color: colors.text },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  pickerBtnOn: { borderColor: colors.primary, backgroundColor: '#FFF0EB' },
  pickerBtnT: { fontSize: 12, color: colors.textSecondary },
  pickerBtnTOn: { color: colors.primary, fontWeight: '600' },
});
