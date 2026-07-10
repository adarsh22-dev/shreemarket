import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { addressesApi } from '../../services/addresses';
import { Address } from '../../types';

export default function AddressBookScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const userId = user?.id;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await addressesApi.getUserAddresses(userId);
      setAddresses(data || []);
    } catch { setAddresses([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchAddresses(); }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  }, [fetchAddresses]);

  const handleDelete = (addr: Address) => {
    Alert.alert('Delete Address', `Delete ${addr.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await addressesApi.delete(addr.id, userId!); fetchAddresses(); } catch {}
      }},
    ]);
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Pressable onPress={() => nav.goBack()}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <Text style={st.title}>Address Book</Text>
        <Pressable onPress={() => nav.navigate('AddAddress')}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <View style={st.center}>
          <Ionicons name="location-outline" size={48} color={colors.textLight} />
          <Text style={st.emptyT}>No addresses saved</Text>
        </View>
      ) : (
        <ScrollView style={st.flex} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
          {addresses.map((addr) => (
            <View key={addr.id} style={st.card}>
              <View style={st.cardTop}>
                <View style={st.titleRow}>
                  <Text style={st.addrTitle}>{addr.title}</Text>
                  {addr.defaultAddress && <View style={st.defaultBadge}><Text style={st.defaultT}>Default</Text></View>}
                </View>
                <View style={st.actions}>
                  <Pressable onPress={() => {}}><Ionicons name="create-outline" size={18} color={colors.textSecondary} /></Pressable>
                  <Pressable onPress={() => handleDelete(addr)}><Ionicons name="trash-outline" size={18} color={colors.error} /></Pressable>
                </View>
              </View>
              <Text style={st.name}>{addr.fullName} | {addr.phoneNumber}</Text>
              <Text style={st.address}>{addr.streetAddress}, {addr.city}, {addr.state} - {addr.zipCode}</Text>
              {!addr.defaultAddress && (
                <Pressable onPress={async () => { try { await addressesApi.setDefault(addr.id, userId!); fetchAddresses(); } catch {} }} style={st.setDefault}>
                  <Text style={st.setDefaultT}>Set as Default</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addrTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  defaultBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultT: { fontSize: 11, fontWeight: '600', color: colors.success },
  actions: { flexDirection: 'row', gap: 12 },
  name: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  address: { fontSize: 14, color: colors.text, lineHeight: 20 },
  setDefault: { marginTop: 12 },
  setDefaultT: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
