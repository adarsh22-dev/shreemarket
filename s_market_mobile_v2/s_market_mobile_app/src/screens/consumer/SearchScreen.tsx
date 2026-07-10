import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, ActivityIndicator, StyleSheet, Dimensions, ScrollView, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productsApi } from '../../services/products';
import { cartApi } from '../../services/cart';
import { wishlistApi } from '../../services/wishlist';
import { useAuth } from '../../hooks/useAuth';
import { Product } from '../../types';
import { getProductImageUrl, getDiscountPercent } from '../../utils/product';
import { MEDIA_BASE_URL } from '../../constants';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

function getMediaUrl(fileName: string): string {
  if (!fileName || fileName === 'null' || fileName === 'undefined') return '';
  if (fileName.startsWith('http')) return fileName;
  if (fileName.startsWith('/')) return `${MEDIA_BASE_URL}${fileName}`;
  return `${MEDIA_BASE_URL}/uploads/products/${fileName}`;
}

function getGalleryMedia(product: Product) {
  return (product.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'video-url' && m.fileType !== 'instagram-url' && m.fileName);
}

function ProductCard({ item }: { item: Product }) {
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
        <View style={pc.actions}>
          <Pressable onPress={toggleWishlist} style={pc.actionBtn}>
            <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={16} color={wishlisted ? '#FF5722' : '#666'} />
          </Pressable>
          <Pressable onPress={handleShare} style={pc.actionBtn}>
            <Ionicons name="share-social-outline" size={16} color="#666" />
          </Pressable>
        </View>
      </View>
      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={2}>{item.name}</Text>
        <View style={pc.priceRow}>
          <Text style={pc.price}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
          {item.regularPrice && item.discountPrice && <Text style={pc.oldPrice}>₹{parseFloat(String(item.regularPrice)).toFixed(2)}</Text>}
        </View>
        <View style={pc.ratingRow}>
          <View style={pc.stars}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name="star" size={10} color={i <= Math.round(item.averageRating || 0) ? '#FFB800' : '#E0E0E0'} />
            ))}
          </View>
          <Text style={pc.ratingT}>({item.reviewCount || 0})</Text>
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
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  imgWrap: { position: 'relative', backgroundColor: '#ededed' },
  img: { width: CARD_W, height: CARD_W, backgroundColor: '#f5f5f5' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF5722', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeT: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actions: { position: 'absolute', top: 8, right: 8, gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 17, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '700', color: '#FF5722' },
  oldPrice: { fontSize: 12, color: '#b0b0b0', textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 1 },
  ratingT: { fontSize: 11, color: '#888' },
  addCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 8 },
  addCartBtnT: { fontSize: 12, fontWeight: '600', color: '#fff' },
});

export default function SearchScreen() {
  const nav = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['wireless headphones', 'smart watch', 'phone case']);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const popularCategories = [
    { name: 'Electronics', icon: 'laptop-outline' },
    { name: 'Fashion', icon: 'shirt-outline' },
    { name: 'Home & Garden', icon: 'home-outline' },
    { name: 'Sports', icon: 'football-outline' },
  ];

  const handleSearch = (text: string) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const data = await productsApi.search(text.trim());
        setResults(data || []);
        if (text.trim().length > 2) {
          setRecentSearches(prev => [text.trim(), ...prev.filter(s => s !== text.trim())].slice(0, 5));
        }
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleRecentSearch = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  return (
    <View style={st.root}>
      <View style={st.searchWrap}>
        <Pressable onPress={() => nav.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <View style={st.searchInputWrap}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput style={st.input} placeholder="Search products..." placeholderTextColor="#999" value={query} onChangeText={handleSearch} autoFocus returnKeyType="search" />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          ) : null}
        </View>
      </View>
      {!searched && !loading && (
        <ScrollView style={st.suggestionsContainer}>
          {recentSearches.length > 0 && (
            <View style={st.section}>
              <Text style={st.sectionTitle}>Recent Searches</Text>
              {recentSearches.map((term, idx) => (
                <Pressable key={idx} onPress={() => handleRecentSearch(term)} style={st.recentItem}>
                  <Ionicons name="time-outline" size={18} color="#888" />
                  <Text style={st.recentText}>{term}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ccc" />
                </Pressable>
              ))}
            </View>
          )}
          <View style={st.section}>
            <Text style={st.sectionTitle}>Popular Categories</Text>
            <View style={st.categoriesGrid}>
              {popularCategories.map((cat, idx) => (
                <Pressable key={idx} style={st.categoryItem} onPress={() => { setQuery(cat.name); handleSearch(cat.name); }}>
                  <View style={st.categoryIcon}><Ionicons name={cat.icon as any} size={24} color="#FF5722" /></View>
                  <Text style={st.categoryName}>{cat.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /><Text style={st.loadingText}>Searching...</Text></View>
      ) : searched && results.length === 0 ? (
        <View style={st.center}>
          <Ionicons name="search-outline" size={64} color="#E0E0E0" />
          <Text style={st.noResTitle}>No results found</Text>
          <Text style={st.noResText}>Try different keywords or check spelling</Text>
        </View>
      ) : results.length > 0 ? (
        <View style={st.resultsContainer}>
          <Text style={st.resultsCount}>{results.length} products found</Text>
          <FlatList data={results} renderItem={({ item }) => <ProductCard item={item} />} keyExtractor={(item) => String(item.id)} numColumns={2} columnWrapperStyle={{ gap: 8, paddingHorizontal: 12 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} />
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', gap: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { padding: 8 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 12 },
  noResTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  noResText: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  suggestionsContainer: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  recentText: { flex: 1, fontSize: 14, color: '#333' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryItem: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  categoryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF0EB', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: '500', color: '#333' },
  resultsContainer: { flex: 1 },
  resultsCount: { fontSize: 14, color: '#888', paddingHorizontal: 16, paddingVertical: 12 },
});
