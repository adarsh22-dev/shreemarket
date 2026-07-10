import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StatusBar, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { api } from '../../api/client';

type BusinessType = 'retailer' | 'distributor' | 'reseller';

export default function WholesalerRegisterScreen() {
  const nav = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    businessName: '', gstNumber: '', businessAddress: '', businessPhone: '',
    businessType: 'retailer' as BusinessType,
    agreeTerms: false, agreePolicies: false,
  });

  const set = (f: string, v: any) => {
    setForm(prev => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors(prev => ({ ...prev, [f]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(form.phone)) e.phone = 'Invalid phone';
    if (!form.password.trim()) e.password = 'Required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.businessName.trim()) e.businessName = 'Required';
    if (!form.gstNumber.trim()) e.gstNumber = 'Required';
    else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.toUpperCase())) e.gstNumber = 'Invalid GST format';
    if (!form.businessAddress.trim()) e.businessAddress = 'Required';
    if (!form.businessPhone.trim()) e.businessPhone = 'Required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(form.businessPhone)) e.businessPhone = 'Invalid phone';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (!form.agreeTerms || !form.agreePolicies) {
      setError('Please agree to Terms and Policies');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      await api.post('/register/wholesaler', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      nav.navigate('Login');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Pressable onPress={() => nav.goBack()} style={s.back}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <ScrollView style={s.flex} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Create Account</Text>
        <Text style={s.sub}>Register your business for wholesale access</Text>

        {error ? <Text style={s.err}>{error}</Text> : null}

        <Text style={s.section}>PERSONAL INFORMATION</Text>
        <View style={s.row}>
          <View style={s.half}><FInput placeholder="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} /></View>
          <View style={s.half}><FInput placeholder="Email" value={form.email} onChange={v => set('email', v)} error={errors.email} keyboardType="email-address" /></View>
        </View>
        <View style={s.row}>
          <View style={s.half}><FInput placeholder="Phone" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} keyboardType="phone-pad" /></View>
          <View style={s.half}>
            <View style={[s.inputWrap, errors.password && { borderColor: colors.error }]}>
              <TextInput style={s.input} placeholder="Password" placeholderTextColor={colors.textLight} value={form.password} onChangeText={v => set('password', v)} secureTextEntry={!showPw} />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            {errors.password ? <Text style={s.errT}>{errors.password}</Text> : null}
          </View>
        </View>

        <Text style={s.section}>BUSINESS DETAILS</Text>
        <View style={s.row}>
          <View style={s.half}><FInput placeholder="Business Name" value={form.businessName} onChange={v => set('businessName', v)} error={errors.businessName} /></View>
          <View style={s.half}><FInput placeholder="Business Phone" value={form.businessPhone} onChange={v => set('businessPhone', v)} error={errors.businessPhone} keyboardType="phone-pad" /></View>
        </View>
        <FInput placeholder="GST Number" value={form.gstNumber} onChange={v => set('gstNumber', v.toUpperCase())} error={errors.gstNumber} />
        <Text style={s.label}>Business Type</Text>
        <View style={s.typeRow}>
          {(['retailer', 'distributor', 'reseller'] as const).map(t => (
            <Pressable key={t} onPress={() => set('businessType', t)} style={[s.typeBtn, form.businessType === t && s.typeBtnOn]}>
              <Text style={[s.typeBtnT, form.businessType === t && s.typeBtnTOn]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[s.inputWrap, errors.businessAddress && { borderColor: colors.error }]}>
          <TextInput style={[s.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Business Address" placeholderTextColor={colors.textLight} value={form.businessAddress} onChangeText={v => set('businessAddress', v)} multiline />
        </View>
        {errors.businessAddress ? <Text style={s.errT}>{errors.businessAddress}</Text> : null}

        <Text style={s.section}>DOCUMENT VERIFICATION</Text>
        <Text style={s.uploadDesc}>Upload documents for KYC verification (optional in this version)</Text>

        <View style={s.cbCol}>
          <CBox label="I agree to the Terms and Conditions" checked={form.agreeTerms} onToggle={v => set('agreeTerms', v)} />
          <CBox label="I agree to the Marketplace Policies" checked={form.agreePolicies} onToggle={v => set('agreePolicies', v)} />
        </View>

        <Pressable onPress={submit} disabled={loading} style={s.btn}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Register as Wholesaler</Text>}
        </Pressable>

        <View style={s.signRow}>
          <Text style={s.noAcc}>Already registered? </Text>
          <Pressable onPress={() => nav.navigate('Login')}>
            <Text style={s.signIn}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FInput({ placeholder, value, onChange, error, keyboardType, secureTextEntry }: {
  placeholder: string; value: string; onChange: (v: string) => void; error?: string; keyboardType?: any; secureTextEntry?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={[s.inputWrap, error && { borderColor: colors.error }]}>
        <TextInput style={s.input} placeholder={placeholder} placeholderTextColor={colors.textLight} value={value} onChangeText={onChange} secureTextEntry={secureTextEntry && !show} keyboardType={keyboardType} autoCapitalize="none" />
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

function CBox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onToggle(!checked)} style={s.cbRow}>
      <View style={[s.cb, checked && s.cbOn]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={s.cbLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  back: { padding: 16, alignSelf: 'flex-start' },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  err: { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  section: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 1, marginBottom: 12, marginTop: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.background },
  input: { flex: 1, fontSize: 15, color: colors.text },
  errT: { fontSize: 11, color: colors.error, marginTop: 2 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  typeBtnOn: { borderColor: colors.primary, backgroundColor: '#FFF0EB' },
  typeBtnT: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeBtnTOn: { color: colors.primary },
  uploadDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  cbCol: { marginBottom: 20 },
  cbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cb: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cbOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  cbLabel: { flex: 1, fontSize: 14, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginBottom: 16 },
  btnT: { fontSize: 17, fontWeight: '700', color: '#fff' },
  signRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  noAcc: { fontSize: 14, color: colors.textSecondary },
  signIn: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
