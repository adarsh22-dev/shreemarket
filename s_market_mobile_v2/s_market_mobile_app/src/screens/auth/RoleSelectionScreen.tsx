import React from 'react';
import {
  View, Text, SafeAreaView, StatusBar, StyleSheet, Pressable, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';

const roles = [
  { key: 'consumer' as const, title: 'Consumer', sub: 'Shop for unique handcrafted products', icon: 'person-outline' as const, color: colors.secondary, bg: '#F3EEFF' },
  { key: 'vendor' as const, title: 'Vendor', sub: 'Sell your products on SreeMarket', icon: 'storefront-outline' as const, color: colors.primary, bg: '#FFF0EB' },
  { key: 'wholesaler' as const, title: 'Wholesaler', sub: 'Bulk purchase at wholesale prices', icon: 'business-outline' as const, color: colors.wholesaler, bg: '#EBFFF0' },
];

const cardShadow = Platform.OS === 'web'
  ? { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
  : { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 };

export default function RoleSelectionScreen() {
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={st.header}>
        <View style={st.logo}>
          <Ionicons name="storefront" size={28} color="#fff" />
        </View>
        <Text style={st.wel}>Welcome to</Text>
        <Text style={st.title}>SreeMarket</Text>
        <Text style={st.sub}>Select your role to get started</Text>
      </View>
      <View style={st.cards}>
        {roles.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => {
              if (r.key === 'vendor') nav.navigate('VendorRegister');
              else if (r.key === 'wholesaler') nav.navigate('WholesalerRegister');
              else nav.navigate('Register', { role: r.key });
            }}
            style={({ pressed }) => [st.card, cardShadow, pressed && { opacity: 0.88 }]}
          >
            <View style={[st.iconW, { backgroundColor: r.bg }]}>
              <Ionicons name={r.icon} size={26} color={r.color} />
            </View>
            <View style={st.cardB}>
              <Text style={st.cardT}>{r.title}</Text>
              <Text style={st.cardS}>{r.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </Pressable>
        ))}
      </View>
      <View style={st.sign}>
        <Text style={st.signT}>Already have an account? </Text>
        <Pressable onPress={() => nav.navigate('Login')} hitSlop={8}>
          <Text style={st.signL}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 32, paddingHorizontal: 24 },
  logo: { backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  wel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, letterSpacing: 0.3 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  cards: { paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.cardBorder, minHeight: 72 },
  iconW: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  cardB: { flex: 1, marginLeft: 16 },
  cardT: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardS: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  sign: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  signT: { fontSize: 14, color: '#6B7280' },
  signL: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
