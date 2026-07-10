import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const MENU_ITEMS = [
  { icon: 'bag-handle-outline' as const, label: 'My Orders', screen: 'Orders' },
  { icon: 'heart-outline' as const, label: 'Wishlist', screen: 'Wishlist' },
  { icon: 'location-outline' as const, label: 'Addresses', screen: 'AddressBook' },
  { icon: 'wallet-outline' as const, label: 'Wallet', screen: 'Wallet' },
  { icon: 'gift-outline' as const, label: 'Loyalty Points', screen: 'Loyalty' },
  { icon: 'settings-outline' as const, label: 'Settings', screen: 'Settings' },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', screen: 'Support' },
];

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, isGuest, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user || isGuest) {
    return (
      <View style={st.center}>
        <View style={st.avatarCircle}>
          <Ionicons name="person-outline" size={48} color="#ccc" />
        </View>
        <Text style={st.guestT}>Sign in to your account</Text>
        <Pressable onPress={() => nav.getParent()?.navigate('Auth', { screen: 'Login' })} style={st.loginBtn}>
          <Text style={st.loginBtnT}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => nav.getParent()?.navigate('Auth', { screen: 'Register' })} style={st.registerBtn}>
          <Text style={st.registerBtnT}>Create Account</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={st.root}>
      {/* Profile Card */}
      <View style={st.profileCard}>
        <View style={st.avatarLarge}>
          <Text style={st.avatarT}>{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <View style={st.profileInfo}>
          <Text style={st.name}>{user.fullName || 'User'}</Text>
          <Text style={st.email}>{user.email || ''}</Text>
          <View style={st.verified}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={st.verifiedT}>Verified Account</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={st.menu}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable key={i} style={st.menuItem} onPress={() => nav.navigate(item.screen)}>
            <Ionicons name={item.icon} size={20} color="#555" />
            <Text style={st.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable style={st.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
        <Text style={st.logoutT}>Sign Out</Text>
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  guestT: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 24 },
  loginBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 12 },
  loginBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
  registerBtn: { paddingVertical: 10, paddingHorizontal: 24 },
  registerBtnT: { fontSize: 14, fontWeight: '600', color: '#FF5722' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center' },
  avatarT: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#111' },
  email: { fontSize: 14, color: '#888', marginTop: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedT: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  menu: { backgroundColor: '#fff', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuLabel: { flex: 1, fontSize: 15, color: '#333', marginLeft: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#fff' },
  logoutT: { fontSize: 15, color: '#D32F2F', fontWeight: '600' },
});
