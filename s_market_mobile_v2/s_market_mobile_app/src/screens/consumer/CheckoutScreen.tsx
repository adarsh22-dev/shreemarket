import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../services/orders';
import { Cart } from '../../types';
import { getProductPrice } from '../../utils/product';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline' as const },
  { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline' as const },
  { id: 'upi', label: 'UPI', icon: 'phone-portrait-outline' as const },
];

export default function CheckoutScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const cart: Cart | undefined = route.params?.cart;
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const cartItems = cart?.items?.filter(i => !i.isSaved) || [];
  const subtotal = cartItems.reduce((s, i) => s + getProductPrice(i.product) * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!address.trim()) { Alert.alert('Error', 'Please enter delivery address'); return; }
    if (!user?.id) { nav.navigate('Login'); return; }
    setLoading(true);
    try {
      const productQuantities: Record<string, number> = {};
      cartItems.forEach(i => { productQuantities[String(i.productId)] = i.quantity; });
      const vendorId = cartItems[0]?.product?.vendorId || 1;

      await ordersApi.create({
        totalAmount: total,
        taxAmount: 0,
        cgst: 0, sgst: 0, igst: 0, cess: 0, taxRate: 0, tcsAmount: 0,
        status: 'Pending',
        productQuantities,
        vendorId,
        customerName: user.fullName,
        deliveryLocation: address,
        estimatedDelivery: '3-5 business days',
        paymentMethod,
      });
      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => nav.navigate('Orders') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Pressable onPress={() => nav.goBack()}><Ionicons name="arrow-back" size={22} color="#333" /></Pressable>
        <Text style={st.title}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={st.flex} contentContainerStyle={{ padding: 16 }}>
        {/* Delivery Address */}
        <View style={st.section}>
          <Text style={st.secTitle}>Delivery Address</Text>
          <TextInput
            style={st.input}
            placeholder="Enter your delivery address"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {/* Payment Method */}
        <View style={st.section}>
          <Text style={st.secTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(m => (
            <Pressable key={m.id} style={[st.payItem, paymentMethod === m.id && st.payItemOn]} onPress={() => setPaymentMethod(m.id)}>
              <Ionicons name={m.icon} size={20} color={paymentMethod === m.id ? '#FF5722' : '#888'} />
              <Text style={[st.payLabel, paymentMethod === m.id && st.payLabelOn]}>{m.label}</Text>
              {paymentMethod === m.id && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
            </Pressable>
          ))}
        </View>

        {/* Items Summary */}
        <View style={st.section}>
          <Text style={st.secTitle}>Items ({cartItems.length})</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={st.itemRow}>
              <Text style={st.itemName} numberOfLines={1}>{item.product?.name || `Product #${item.productId}`}</Text>
              <Text style={st.itemQty}>x{item.quantity}</Text>
              <Text style={st.itemPrice}>₹{(getProductPrice(item.product) * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View style={st.section}>
          <PriceRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
          <PriceRow label="Shipping" value={shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`} />
          <View style={st.divider} />
          <PriceRow label="Total" value={`₹${total.toFixed(2)}`} bold />
        </View>
      </ScrollView>

      <View style={st.bottom}>
        <View>
          <Text style={st.totalLabel}>Total</Text>
          <Text style={st.totalAmt}>₹{total.toFixed(2)}</Text>
        </View>
        <Pressable onPress={handlePlaceOrder} disabled={loading} style={st.orderBtn}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.orderBtnT}>Place Order</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function PriceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={pr.row}>
      <Text style={[pr.label, bold && pr.bold]}>{label}</Text>
      <Text style={[pr.value, bold && pr.bold]}>{value}</Text>
    </View>
  );
}

const pr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, color: '#333' },
  bold: { fontWeight: '700', fontSize: 16, color: '#111' },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', flex: 1 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', minHeight: 80, textAlignVertical: 'top' },
  payItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  payItemOn: {},
  payLabel: { fontSize: 15, color: '#555', flex: 1 },
  payLabelOn: { color: '#111', fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemQty: { fontSize: 14, color: '#888', marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 6 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontSize: 13, color: '#888' },
  totalAmt: { fontSize: 20, fontWeight: '700', color: '#111' },
  orderBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, minWidth: 140, alignItems: 'center' },
  orderBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
