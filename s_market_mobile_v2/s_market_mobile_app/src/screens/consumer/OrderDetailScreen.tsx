import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { ordersApi } from '../../services/orders';
import { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#FFA000', Confirmed: '#1565C0', Shipped: '#6B3FA0', Delivered: '#2E7D32', Cancelled: '#D32F2F', Returned: '#E65100',
};
const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value}</Text>
    </View>
  );
}

const ir = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, fontWeight: '600', color: '#111' },
});

export default function OrderDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    ordersApi.trackOrder(`ORD-${orderId}`)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;
  if (!order) return <View style={st.center}><Text style={st.noT}>Order not found</Text></View>;

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const date = new Date(order.datePlaced).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const itemCount = Object.values(order.productQuantities || {}).reduce((s, q) => s + q, 0);

  return (
    <ScrollView style={st.root}>
      <View style={st.header}>
        <Pressable onPress={() => nav.goBack()}><Ionicons name="arrow-back" size={22} color="#333" /></Pressable>
        <Text style={st.title}>Order Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={st.statusCard}>
        <View style={[st.badge, { backgroundColor: (STATUS_COLORS[order.status] || '#888') + '18' }]}>
          <Text style={[st.badgeT, { color: STATUS_COLORS[order.status] || '#888' }]}>{order.status}</Text>
        </View>
        <Text style={st.orderNum}>{order.orderNumber}</Text>
        <Text style={st.date}>Placed on {date}</Text>
      </View>

      <View style={st.stepper}>
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentStepIdx;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <View key={step} style={st.stepRow}>
              <View style={st.stepCol}>
                <View style={[st.dot, done ? st.dotDone : st.dotEmpty]}>
                  {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                {!isLast && <View style={[st.line, done ? st.lineDone : st.lineEmpty]} />}
              </View>
              <Text style={[st.stepLabel, done && st.stepDone]}>{step}</Text>
            </View>
          );
        })}
      </View>

      <View style={st.section}>
        <Text style={st.secTitle}>Order Information</Text>
        <InfoRow label="Items" value={`${itemCount} item${itemCount !== 1 ? 's' : ''}`} />
        <InfoRow label="Total Amount" value={`₹${order.totalAmount?.toFixed(2)}`} />
        <InfoRow label="Payment" value={order.paymentMethod?.toUpperCase() || 'N/A'} />
        <InfoRow label="Delivery" value={order.estimatedDelivery || 'N/A'} />
        <InfoRow label="Location" value={order.deliveryLocation || 'N/A'} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noT: { fontSize: 16, color: '#888' },
  statusCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 12, alignItems: 'center' },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  badgeT: { fontSize: 14, fontWeight: '700' },
  orderNum: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  date: { fontSize: 14, color: '#888' },
  stepper: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 20, borderRadius: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  stepCol: { alignItems: 'center', width: 24 },
  dot: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: '#2E7D32' },
  dotEmpty: { backgroundColor: '#e0e0e0' },
  line: { width: 2, flex: 1, marginVertical: 4 },
  lineDone: { backgroundColor: '#2E7D32' },
  lineEmpty: { backgroundColor: '#e0e0e0' },
  stepLabel: { marginLeft: 12, fontSize: 14, color: '#888', paddingTop: 1 },
  stepDone: { color: '#111', fontWeight: '600' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
});
