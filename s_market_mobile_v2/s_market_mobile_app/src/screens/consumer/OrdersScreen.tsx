import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../services/orders';
import { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#FFA000', Confirmed: '#1565C0', Shipped: '#6B3FA0', Delivered: '#2E7D32', Cancelled: '#D32F2F', Returned: '#E65100',
};

function OrderCard({ item }: { item: Order }) {
  const nav = useNavigation<any>();
  const date = new Date(item.datePlaced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const itemCount = Object.values(item.productQuantities || {}).reduce((s, q) => s + q, 0);

  return (
    <Pressable onPress={() => nav.navigate('OrderDetail', { orderId: item.id })} style={oc.card}>
      <View style={oc.top}>
        <View style={oc.topLeft}>
          <Text style={oc.orderNum}>{item.orderNumber}</Text>
          <Text style={oc.date}>{date}</Text>
        </View>
        <View style={[oc.badge, { backgroundColor: (STATUS_COLORS[item.status] || '#888') + '18' }]}>
          <Text style={[oc.badgeT, { color: STATUS_COLORS[item.status] || '#888' }]}>{item.status}</Text>
        </View>
      </View>
      <View style={oc.divider} />
      <View style={oc.bottom}>
        <View style={oc.infoRow}>
          <Ionicons name="cube-outline" size={14} color="#888" />
          <Text style={oc.infoT}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={oc.amount}>₹{item.totalAmount?.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const oc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: {},
  orderNum: { fontSize: 15, fontWeight: '600', color: '#111' },
  date: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeT: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoT: { fontSize: 13, color: '#888' },
  amount: { fontSize: 16, fontWeight: '700', color: '#111' },
});

export default function OrdersScreen() {
  const nav = useNavigation<any>();
  const { user, isGuest } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = user?.id;

  const fetchOrders = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await ordersApi.getUserOrders(userId);
      setOrders(data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchOrders(); }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  if (!userId && !loading) {
    return (
      <View style={st.center}>
        <Ionicons name="bag-handle-outline" size={72} color="#ccc" />
        <Text style={st.emptyT}>No orders yet</Text>
        <Pressable onPress={() => nav.getParent()?.navigate('Auth', { screen: 'Login' })} style={st.loginBtn}>
          <Text style={st.loginBtnT}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>My Orders</Text>
      </View>
      {orders.length === 0 ? (
        <View style={st.center}>
          <Ionicons name="bag-handle-outline" size={72} color="#ccc" />
          <Text style={st.emptyT}>No orders yet</Text>
          <Pressable onPress={() => nav.navigate('Shop')} style={st.shopBtn}>
            <Text style={st.shopBtnT}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}>
          {orders.map((order) => <OrderCard key={order.id} item={order} />)}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 16, marginBottom: 24 },
  loginBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
  shopBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  shopBtnT: { fontSize: 14, fontWeight: '600', color: '#FF5722' },
});
