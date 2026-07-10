import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StatusBar, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks';

const tabs = [
  { key: 'consumer' as const, label: 'Customer', isVendorLogin: false },
  { key: 'vendor' as const, label: 'Vendor', isVendorLogin: true },
  { key: 'wholesaler' as const, label: 'Wholesaler', isVendorLogin: false },
];

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'consumer' | 'vendor' | 'wholesaler'>('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const tab = tabs.find(t => t.key === role)!;
      await login({ email, password, isVendorLogin: tab.isVendorLogin });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.flex}>
        <Pressable onPress={() => nav.goBack()} style={st.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={st.body}>
          <Text style={st.h1}>Sign In</Text>
          <Text style={st.sub}>Welcome back to SreeMarket</Text>

          <View style={st.tabs}>
            {tabs.map((t) => (
              <Pressable key={t.key} onPress={() => { setRole(t.key); setError(''); }} style={[st.tab, role === t.key && st.tabOn]}>
                <Text style={[st.tabT, role === t.key && st.tabTOn]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={st.err}>{error}</Text> : null}

          <TextInput style={st.input} placeholder="Email" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={st.input} placeholder="Password" placeholderTextColor={colors.textLight} value={password} onChangeText={setPassword} secureTextEntry />

          <Pressable onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
            <Text style={st.fp}>Forgot Password?</Text>
          </Pressable>

          <Pressable onPress={handleLogin} disabled={loading} style={st.btn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Sign In</Text>}
          </Pressable>

          <View style={st.row}>
            <Text style={st.noAcc}>Don't have an account? </Text>
            <Pressable onPress={() => {
              if (role === 'vendor') nav.navigate('VendorRegister');
              else if (role === 'wholesaler') nav.navigate('WholesalerRegister');
              else nav.navigate('Register');
            }}>
              <Text style={st.signUp}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  back: { padding: 16, alignSelf: 'flex-start' },
  body: { flex: 1, paddingHorizontal: 24 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabOn: { backgroundColor: '#fff' },
  tabT: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTOn: { color: colors.primary },
  err: { color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: colors.background },
  fp: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginBottom: 20 },
  btnT: { fontSize: 17, fontWeight: '700', color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  noAcc: { fontSize: 14, color: colors.textSecondary },
  signUp: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
