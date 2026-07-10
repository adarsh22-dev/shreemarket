import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet, Dimensions, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { cartApi } from '../services/cart';
import { wishlistApi } from '../services/wishlist';
import { Product } from '../types';
import { getProductImageUrl, getDiscountPercent } from '../utils/product';
import { MEDIA_BASE_URL } from '../constants';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

function getMediaUrl(fileName: string): string {
  if (!fileName || fileName === 'null' || fileName === 'undefined') return '';
  if (fileName.startsWith('http')) return fileName;
  if (fileName.startsWith('/')) return `${MEDIA_BASE_URL}${fileName}`;
  return `${MEDIA_BASE_URL}/uploads/products/${fileName}`;
}

function getGalleryMedia(product: Product) {
  return (product.media || []).filter(
    m => m.mediaType !== 'manufacturer' && m.fileType !== 'video-url' && m.fileType !== 'instagram-url' && m.fileName
  );
}

interface ProductCardProps {
  item: Product;
  showNewBadge?: boolean;
  onCompare?: (product: Product) => void;
  isCompared?: boolean;
}

export default function ProductCard({ item, showNewBadge, onCompare, isCompared }: ProductCardProps) {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const discountPct = getDiscountPercent(item);
  const displayPrice = item.discountPrice || item.regularPrice || 0;
  const gallery = getGalleryMedia(item);
  const imgUri = gallery.length > 0
    ? getMediaUrl(gallery.find(m => m.isPrimary)?.fileName || gallery[0].fileName)
    : getProductImageUrl(item, 300);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user?.id) {
      wishlistApi.check(user.id, item.id).then(r => setWishlisted(!!r)).catch(() => {});
    }
  }, [user?.id, item.id]);

  const toggleWishlist = async () => {
    if (!user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    try {
      if (wishlisted) { await wishlistApi.remove(user.id, item.id); setWishlisted(false); }
      else { await wishlistApi.add(user.id, item.id); setWishlisted(true); }
    } catch {}
  };

  const handleAddToCart = async () => {
    if (!user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    setAdding(true);
    try { await cartApi.add(user.id, { productId: item.id, quantity: 1 }); } catch {}
    finally { setAdding(false); }
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Check out ${item.name} on SreeMarket! ₹${displayPrice}` }); } catch {}
  };

  return (
    <Pressable onPress={() => nav.navigate('ProductDetail', { id: item.id })} style={pc.card}>
      <View style={pc.imgWrap}>
        <Image source={{ uri: imgUri }} style={pc.img} />
        {discountPct > 0 && <View style={pc.badge}><Text style={pc.badgeT}>-{discountPct}%</Text></View>}
        {showNewBadge && !discountPct && <View style={pc.newBadge}><Text style={pc.badgeT}>NEW</Text></View>}
        <View style={pc.actions}>
          <Pressable onPress={toggleWishlist} style={pc.actionBtn}>
            <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={16} color={wishlisted ? '#FF5722' : '#666'} />
          </Pressable>
          {onCompare && (
            <Pressable onPress={() => onCompare(item)} style={[pc.actionBtn, isCompared && pc.actionBtnActive]}>
              <Ionicons name="git-compare-outline" size={16} color={isCompared ? '#FF5722' : '#666'} />
            </Pressable>
          )}
          <Pressable onPress={handleShare} style={pc.actionBtn}>
            <Ionicons name="share-social-outline" size={16} color="#666" />
          </Pressable>
        </View>
        <View style={pc.ratingBadge}>
          <Text style={pc.ratingT}>{(item.averageRating || 0).toFixed(1)} ★</Text>
        </View>
      </View>
      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={2}>{item.name}</Text>
        <Text style={pc.subtitle} numberOfLines={1}>{item.brand || 'SreeMarket'}</Text>
        <View style={pc.priceRow}>
          <Text style={pc.price}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
          {item.regularPrice && item.discountPrice && <Text style={pc.old}>₹{parseFloat(String(item.regularPrice)).toFixed(2)}</Text>}
        </View>
        <Pressable onPress={handleAddToCart} style={pc.addCartBtn} disabled={adding}>
          {adding ? <ActivityIndicator size="small" color="#fff" /> : (
            <><Ionicons name="cart-outline" size={14} color="#fff" /><Text style={pc.addCartBtnT}>Add to Cart</Text></>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const pc = StyleSheet.create({
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, boxShadow: '0 1 3 rgba(0,0,0,0.1)' },
  imgWrap: { position: 'relative', backgroundColor: '#F4F5F0' },
  img: { width: CARD_W, height: CARD_W, backgroundColor: '#f5f5f5' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF5722', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  newBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeT: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actions: { position: 'absolute', top: 8, right: 8, gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  actionBtnActive: { backgroundColor: '#FFF0EB' },
  ratingBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  ratingT: { color: '#fff', fontSize: 11, fontWeight: '600' },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 17, marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#999', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  price: { fontSize: 15, fontWeight: '700', color: '#FF5722' },
  old: { fontSize: 12, color: '#b0b0b0', textDecorationLine: 'line-through' },
  addCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 8 },
  addCartBtnT: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
