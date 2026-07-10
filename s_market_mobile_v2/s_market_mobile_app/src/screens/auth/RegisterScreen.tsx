import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StatusBar, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks';

export default function RegisterScreen() {
  const nav = useNavigation<any>();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) { setError('Please fill in required fields'); return; }
    setLoading(true);
    setError('');
    try {
      await register({ fullName, email, password, phone: phone || undefined });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Registration failed');
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
        <ScrollView style={st.flex} contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          <Text style={st.h1}>Create Account</Text>
          <Text style={st.sub}>Join as Customer</Text>

          {error ? <Text style={st.err}>{error}</Text> : null}

          <TextInput style={st.input} placeholder="Full Name" placeholderTextColor={colors.textLight} value={fullName} onChangeText={setFullName} />
          <TextInput style={st.input} placeholder="Email" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={st.input} placeholder="Phone (optional)" placeholderTextColor={colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={st.input} placeholder="Password" placeholderTextColor={colors.textLight} value={password} onChangeText={setPassword} secureTextEntry />

          <Pressable onPress={handleRegister} disabled={loading} style={st.btn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Create Account</Text>}
          </Pressable>

          <View style={st.row}>
            <Text style={st.noAcc}>Already have an account? </Text>
            <Pressable onPress={() => nav.navigate('Login')}>
              <Text style={st.signIn}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  back: { padding: 16, alignSelf: 'flex-start' },
  body: { paddingHorizontal: 24, paddingBottom: 32 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  err: { color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: colors.background },
  btn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginBottom: 20, marginTop: 8 },
  btnT: { fontSize: 17, fontWeight: '700', color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  noAcc: { fontSize: 14, color: colors.textSecondary },
  signIn: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
