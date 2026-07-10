import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { cartApi } from '../../services/cart';
import { Cart, CartItem } from '../../types';
import { getProductImageUrl, getProductPrice, getDiscountPercent } from '../../utils/product';

function CartItemRow({ item, userId, onUpdate }: { item: CartItem; userId: number; onUpdate: () => void }) {
  const price = getProductPrice(item.product);

  const updateQty = async (qty: number) => {
    if (qty < 1) return;
    try {
      await cartApi.updateQuantity(userId, item.id, qty);
      onUpdate();
    } catch {}
  };

  const removeItem = async () => {
    try {
      await cartApi.remove(userId, item.id);
      onUpdate();
    } catch {}
  };

  const toggleSave = async () => {
    try {
      if (item.isSaved) await cartApi.moveToCart(userId, item.id);
      else await cartApi.saveForLater(userId, item.id);
      onUpdate();
    } catch {}
  };

  return (
    <View style={cir.card}>
      <Image source={{ uri: getProductImageUrl(item.product, 120) }} style={cir.img} />
      <View style={cir.info}>
        <Text style={cir.name} numberOfLines={2}>{item.product?.name || `Product #${item.productId}`}</Text>
        {item.product?.brand ? <Text style={cir.brand}>{item.product.brand}</Text> : null}
        <Text style={cir.price}>₹{parseFloat(String(price)).toFixed(2)}</Text>
        <View style={cir.actions}>
          <View style={cir.qtyRow}>
            <Pressable onPress={() => updateQty(item.quantity - 1)} style={cir.qtyBtn} disabled={item.quantity <= 1}>
              <Ionicons name="remove" size={16} color={item.quantity <= 1 ? '#ccc' : '#333'} />
            </Pressable>
            <Text style={cir.qty}>{item.quantity}</Text>
            <Pressable onPress={() => updateQty(item.quantity + 1)} style={cir.qtyBtn}>
              <Ionicons name="add" size={16} color="#333" />
            </Pressable>
          </View>
          <Pressable onPress={removeItem}>
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const cir = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  img: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#f5f5f5' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600', color: '#111', lineHeight: 19 },
  brand: { fontSize: 12, color: '#888', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#FF5722', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  qty: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 14, fontWeight: '600', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e0e0e0', minWidth: 30, textAlign: 'center' },
});

export default function CartScreen() {
  const nav = useNavigation<any>();
  const { user, isGuest } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const userId = user?.id;

  const fetchCart = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await cartApi.get(userId);
      setCart(data);
    } catch { setCart(null); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchCart(); }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  const cartItems = cart?.items?.filter(i => !i.isSaved) || [];
  const savedItems = cart?.items?.filter(i => i.isSaved) || [];
  const subtotal = cartItems.reduce((s, i) => s + getProductPrice(i.product) * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  if (!userId && !loading) {
    return (
      <View style={st.center}>
        <Ionicons name="cart-outline" size={72} color="#ccc" />
        <Text style={st.emptyT}>Your cart is empty</Text>
        <Text style={st.emptySub}>Sign in to view your cart items</Text>
        <Pressable onPress={() => nav.getParent()?.navigate('Auth', { screen: 'Login' })} style={st.loginBtn}>
          <Text style={st.loginBtnT}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;

  if (cartItems.length === 0 && savedItems.length === 0) {
    return (
      <View style={st.center}>
        <Ionicons name="cart-outline" size={72} color="#ccc" />
        <Text style={st.emptyT}>Your cart is empty</Text>
        <Pressable onPress={() => nav.navigate('Shop')} style={st.shopBtn}>
          <Text style={st.shopBtnT}>Start Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>Cart ({cartItems.length})</Text>
        {cartItems.length > 0 && (
          <Pressable onPress={() => { Alert.alert('Clear Cart', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Clear', onPress: async () => { try { await cartApi.clear(userId!); fetchCart(); } catch {} } }]); }}>
            <Text style={st.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={st.flex} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}>
        {cartItems.map((item) => <CartItemRow key={item.id} item={item} userId={userId!} onUpdate={fetchCart} />)}

        {/* Promo Code */}
        <View style={st.promoSec}>
          <TextInput style={st.promoInp} placeholder="Enter promo code" placeholderTextColor="#999" value={promoCode} onChangeText={setPromoCode} />
          <Pressable style={st.promoBtn}><Text style={st.promoBtnT}>Apply</Text></Pressable>
        </View>

        {/* Price Summary */}
        <View style={st.summary}>
          <PriceRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
          <PriceRow label="Shipping" value={shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`} />
          <View style={st.divider} />
          <PriceRow label="Total" value={`₹${total.toFixed(2)}`} bold />
          {shipping > 0 && <Text style={st.freeMsg}>Add ₹{(500 - subtotal).toFixed(2)} more for free shipping</Text>}
        </View>

        {savedItems.length > 0 && (
          <>
            <Text style={st.secTitle}>Saved for Later ({savedItems.length})</Text>
            {savedItems.map((item) => (
              <View key={item.id} style={cir.card}>
                <Image source={{ uri: getProductImageUrl(item.product, 120) }} style={cir.img} />
                <View style={cir.info}>
                  <Text style={cir.name} numberOfLines={2}>{item.product?.name || `Product #${item.productId}`}</Text>
                  <Text style={cir.price}>₹{parseFloat(String(getProductPrice(item.product))).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      {cartItems.length > 0 && (
        <View style={st.bottom}>
          <View>
            <Text style={st.totalLabel}>Total</Text>
            <Text style={st.totalAmt}>₹{total.toFixed(2)}</Text>
          </View>
          <Pressable onPress={() => nav.navigate('Checkout', { cart })} style={st.checkoutBtn}>
            <Text style={st.checkoutBtnT}>Checkout</Text>
          </Pressable>
        </View>
      )}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, color: '#333' },
  bold: { fontWeight: '700', fontSize: 16, color: '#111' },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  clear: { fontSize: 14, color: '#D32F2F', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  loginBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  loginBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
  shopBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  shopBtnT: { fontSize: 14, fontWeight: '600', color: '#FF5722' },
  promoSec: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, gap: 8 },
  promoInp: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#e0e0e0' },
  promoBtn: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  promoBtnT: { color: '#fff', fontSize: 14, fontWeight: '600' },
  summary: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },
  freeMsg: { fontSize: 12, color: '#4CAF50', marginTop: 8, fontWeight: '500' },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#111', paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontSize: 13, color: '#888' },
  totalAmt: { fontSize: 20, fontWeight: '700', color: '#111' },
  checkoutBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32 },
  checkoutBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
