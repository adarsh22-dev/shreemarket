import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { wishlistApi } from '../../services/wishlist';
import { WishlistItem } from '../../types';
import { getProductImageUrl, getProductPrice, getDiscountPercent } from '../../utils/product';

const { width } = Dimensions.get('window');
const CARD_W = (width - 36) / 2;

function WishlistCard({ item, userId, onRemove }: { item: WishlistItem; userId: number; onRemove: (id: number) => void }) {
  const nav = useNavigation<any>();
  const p = item.product;
  const discountPct = getDiscountPercent(p);
  const displayPrice = p?.discountPrice || p?.regularPrice || 0;

  return (
    <View style={wc.card}>
      <Pressable onPress={() => nav.navigate('ProductDetail', { id: p?.id })} style={wc.imgWrap}>
        <Image source={{ uri: getProductImageUrl(p, 300) }} style={wc.img} />
        {discountPct > 0 && <View style={wc.badge}><Text style={wc.badgeT}>-{discountPct}%</Text></View>}
        <Pressable style={wc.rmBtn} onPress={async () => { try { await wishlistApi.remove(userId, p?.id); onRemove(p?.id); } catch {} }}>
          <Ionicons name="heart" size={18} color="#D32F2F" />
        </Pressable>
      </Pressable>
      <View style={wc.info}>
        <Text style={wc.name} numberOfLines={2}>{p?.name || ''}</Text>
        <Text style={wc.subtitle}>{p?.brand || ''}</Text>
        <Text style={wc.price}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
      </View>
    </View>
  );
}

const wc = StyleSheet.create({
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  imgWrap: { position: 'relative', backgroundColor: '#ededed' },
  img: { width: CARD_W, height: CARD_W, backgroundColor: '#f5f5f5' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeT: { color: '#4A6572', fontSize: 11, fontWeight: '700' },
  rmBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  info: { padding: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#111', lineHeight: 18, marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 6 },
  price: { fontSize: 16, fontWeight: '700', color: '#111' },
});

export default function WishlistScreen() {
  const nav = useNavigation<any>();
  const { user, isGuest } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await wishlistApi.get(userId);
      setItems(data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchWishlist(); }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  if (!userId && !loading) {
    return (
      <View style={st.center}>
        <Ionicons name="heart-outline" size={72} color="#ccc" />
        <Text style={st.emptyT}>Your wishlist is empty</Text>
        <Pressable onPress={() => nav.navigate('Shop')} style={st.shopBtn}>
          <Text style={st.shopBtnT}>Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>Wishlist</Text>
        {items.length > 0 && <Text style={st.count}>{items.length} items</Text>}
      </View>
      {items.length === 0 ? (
        <View style={st.center}>
          <Ionicons name="heart-outline" size={72} color="#ccc" />
          <Text style={st.emptyT}>Your wishlist is empty</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <WishlistCard item={item} userId={userId!} onRemove={(id) => setItems(prev => prev.filter(x => x.product?.id !== id))} />}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  count: { fontSize: 14, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 16, marginBottom: 24 },
  shopBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  shopBtnT: { fontSize: 14, fontWeight: '600', color: '#FF5722' },
});
