import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StatusBar, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { authApi } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Pressable onPress={() => nav.goBack()} style={st.back}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <View style={st.body}>
        <Text style={st.h1}>Forgot Password</Text>
        <Text style={st.sub}>{sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}</Text>
        {error ? <Text style={st.err}>{error}</Text> : null}
        {!sent ? (
          <>
            <TextInput style={st.input} placeholder="Email" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Pressable onPress={handleSend} disabled={loading} style={st.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Send Reset Link</Text>}
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => nav.navigate('Login')} style={st.btn}>
            <Text style={st.btnT}>Back to Sign In</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  back: { padding: 16, alignSelf: 'flex-start' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  err: { color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: colors.background },
  btn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginBottom: 20, marginTop: 8 },
  btnT: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
