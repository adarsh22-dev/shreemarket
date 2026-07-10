import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StatusBar, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { authApi } from '../../services/auth';

export default function VerifyEmailScreen() {
  const nav = useNavigation<any>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code) { setError('Enter verification code'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.verifyEmail(code);
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Verification failed');
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
        <Text style={st.h1}>Verify Email</Text>
        <Text style={st.sub}>Enter the verification code sent to your email</Text>
        {error ? <Text style={st.err}>{error}</Text> : null}
        {!done ? (
          <>
            <TextInput style={st.input} placeholder="Verification Code" placeholderTextColor={colors.textLight} value={code} onChangeText={setCode} keyboardType="number-pad" />
            <Pressable onPress={handleVerify} disabled={loading} style={st.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Verify</Text>}
            </Pressable>
          </>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 24 }}>Email Verified!</Text>
            <Pressable onPress={() => nav.navigate('Login')} style={st.btn}>
              <Text style={st.btnT}>Continue to Sign In</Text>
            </Pressable>
          </View>
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
