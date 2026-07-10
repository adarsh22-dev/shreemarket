import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { productsApi } from '../../services/products';
import { Product, Category } from '../../types';
import { getProductImageUrl } from '../../utils/product';
import ProductCard from '../../components/ProductCard';
import { useCompare } from '../../context/CompareContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { toggleCompare, isCompared } = useCompare();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  const fetchData = useCallback(async () => {
    const [cats, feat, deals, trend, arrivals, allProds] = await Promise.all([
      productsApi.getCategories().catch(() => [] as Category[]),
      productsApi.featured().catch(() => [] as Product[]),
      productsApi.topDeals().catch(() => [] as Product[]),
      productsApi.trending().catch(() => [] as Product[]),
      productsApi.newArrivals().catch(() => [] as Product[]),
      productsApi.getAll().catch(() => [] as Product[]),
    ]);
    const fallback = allProds || [];
    setCategories(cats?.length ? cats : []);
    setFeatured(feat?.length ? feat : fallback.filter(p => p.isFeatured || p.discountPrice).slice(0, 8));
    setTopDeals(deals?.length ? deals : fallback.filter(p => p.discountPrice != null && p.discountPrice < p.regularPrice).slice(0, 5));
    setTrending(trend?.length ? trend : fallback.filter(p => p.averageRating > 0 || p.bookingCount > 0).slice(0, 8));
    setNewArrivals(arrivals?.length ? arrivals : fallback.slice(0, 8));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <ScrollView style={st.root} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.greet}>Welcome to</Text>
          <Text style={st.logo}>SreeMarket</Text>
        </View>
        <View style={st.headerRight}>
          <Pressable onPress={() => nav.navigate('Search')} style={st.iconBtn}>
            <Ionicons name="search-outline" size={22} color="#333" />
          </Pressable>
          <Pressable onPress={() => nav.navigate('Notifications')} style={st.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
          </Pressable>
        </View>
      </View>

      {/* Hero Grid */}
      <View style={st.heroGrid}>
        <Pressable style={st.heroMain} onPress={() => nav.navigate('Shop')}>
          <Image source={{ uri: 'https://placehold.co/800x600/FF5722/fff?text=Indian+Handmade' }} style={st.heroMainImg} />
          <View style={st.heroOverlay}>
            <Text style={st.heroTitle}>online experiences for indian handmade goods</Text>
            <Text style={st.heroBtn}>EXPLORE</Text>
          </View>
        </Pressable>
        <View style={st.heroSide}>
          <Pressable style={st.heroSideItem} onPress={() => nav.navigate('Shop')}>
            <Image source={{ uri: 'https://placehold.co/400x300/6B3FA0/fff?text=Timeless+Traditions' }} style={st.heroSideImg} />
            <View style={st.heroSideOverlay}>
              <Text style={st.heroSideTitle}>Timeless Traditions</Text>
              <Text style={st.heroSideLink}>Shop now →</Text>
            </View>
          </Pressable>
          <Pressable style={st.heroSideItem} onPress={() => nav.navigate('Shop')}>
            <Image source={{ uri: 'https://placehold.co/400x300/2E7D32/fff?text=Premium+Quality' }} style={st.heroSideImg} />
            <View style={st.heroSideOverlay}>
              <Text style={st.heroSideTitle}>Premium Quality</Text>
              <Text style={st.heroSideLink}>Shop now →</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <View style={st.catSection}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>FEATURED CATEGORIES</Text>
            <Pressable onPress={() => nav.navigate('Shop')}>
              <Text style={st.seeAll}>See All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {categories.map((cat) => (
              <Pressable key={cat.id} onPress={() => nav.navigate('Shop', { category: cat.name })} style={st.catCard}>
                <Image
                  source={{ uri: cat.image || `https://placehold.co/200x200/f0f0f0/999?text=${cat.name.charAt(0)}` }}
                  style={st.catImg}
                />
                <View style={st.catOverlay} />
                <Text style={st.catName}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trust Banners */}
      <View style={st.trustSection}>
        <View style={st.trustRow}>
          <View style={st.trustItem}>
            <Ionicons name="card-outline" size={32} color="#FF5722" />
            <View><Text style={st.trustTitle}>Easy Payment</Text><Text style={st.trustSub}>100% Protected</Text></View>
          </View>
          <View style={st.trustItem}>
            <Ionicons name="return-down-back-outline" size={32} color="#4CAF50" />
            <View><Text style={st.trustTitle}>Easy Returns</Text><Text style={st.trustSub}>7 Day Return Policy</Text></View>
          </View>
        </View>
        <View style={st.trustRow}>
          <View style={st.trustItem}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#2196F3" />
            <View><Text style={st.trustTitle}>Verified Artisans</Text><Text style={st.trustSub}>Certified & Authenticated</Text></View>
          </View>
          <View style={st.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#FF9800" />
            <View><Text style={st.trustTitle}>Genuine Products</Text><Text style={st.trustSub}>Directly Sourced</Text></View>
          </View>
        </View>
      </View>

      {/* Top Deals */}
      {topDeals.length > 0 && (
        <View style={st.sectionOuter}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>TOP DEALS</Text>
            <Pressable onPress={() => nav.navigate('Shop')}>
              <Text style={st.seeAll}>View All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {topDeals.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onCompare={() => toggleCompare(item.id)}
                isCompared={isCompared(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <View style={st.sectionOuter}>
          <View style={st.sectionHeader}>
            <View style={st.titleRow}>
              <View style={st.newDot} />
              <Text style={st.sectionTitle}>NEW ARRIVALS</Text>
            </View>
            <Pressable onPress={() => nav.navigate('Shop')}>
              <Text style={st.seeAll}>View All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {newArrivals.slice(0, 8).map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                showNewBadge
                onCompare={() => toggleCompare(item.id)}
                isCompared={isCompared(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <View style={st.sectionOuter}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>TRENDING PRODUCTS</Text>
            <Pressable onPress={() => nav.navigate('Shop')}>
              <Text style={st.seeAll}>View All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {trending.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onCompare={() => toggleCompare(item.id)}
                isCompared={isCompared(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <View style={st.sectionOuter}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>FEATURED PRODUCTS</Text>
            <Pressable onPress={() => nav.navigate('Shop')}>
              <Text style={st.seeAll}>View All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {featured.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onCompare={() => toggleCompare(item.id)}
                isCompared={isCompared(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Values/Mission */}
      <View style={st.valuesSection}>
        <View style={st.valuesContent}>
          <Text style={st.logoText}>SreeMarket</Text>
          <Text style={st.valuesTitle}>We believe a home should reflect your values.</Text>
          <Text style={st.valuesDesc}>Founded on the belief that luxury and social responsibility are not mutually exclusive, SreeMarket works directly with over 45 artisan co-ops across 12 countries.</Text>
          <View style={st.statsRow}>
            <View style={st.statItem}>
              <Text style={st.statNum}>45+</Text>
              <Text style={st.statLabel}>PARTNER CO-OPS</Text>
            </View>
            <View style={st.statItem}>
              <Text style={st.statNum}>₹2.4M</Text>
              <Text style={st.statLabel}>DIRECT ARTISAN INCOME</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  greet: { fontSize: 13, color: '#888' },
  logo: { fontSize: 22, fontWeight: '800', color: '#FF5722' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, boxShadow: '0 1 2 rgba(0,0,0,0.05)' },
  heroGrid: { marginHorizontal: 16, marginBottom: 20, gap: 12 },
  heroMain: { height: 200, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  heroMainImg: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, lineHeight: 22 },
  heroBtn: { color: '#fff', fontSize: 13, fontWeight: '600', borderWidth: 2, borderColor: '#fff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 4, alignSelf: 'flex-start', overflow: 'hidden' },
  heroSide: { flexDirection: 'row', gap: 12 },
  heroSideItem: { flex: 1, height: 120, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  heroSideImg: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  heroSideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  heroSideTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  heroSideLink: { color: '#fff', fontSize: 11, fontWeight: '500' },
  catSection: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', letterSpacing: 0.3 },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#111' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  catCard: { width: 120, height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  catImg: { width: 120, height: 140, backgroundColor: '#f0f0f0' },
  catOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  catName: { position: 'absolute', bottom: 10, left: 8, right: 8, color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center', textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  trustSection: { backgroundColor: '#EFF5F5', paddingVertical: 20, paddingHorizontal: 16, marginBottom: 8 },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  trustTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  trustSub: { fontSize: 11, color: '#777', marginTop: 1 },
  sectionOuter: { marginBottom: 8 },
  promoSection: { paddingHorizontal: 16, marginBottom: 8 },
  promoCard: { backgroundColor: '#FFF9F0', borderRadius: 8, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingLeft: 16 },
  promoContent: { flex: 1.5, paddingVertical: 16 },
  promoTitle: { color: '#E64A19', fontSize: 14, fontWeight: '800', marginBottom: 4, lineHeight: 18 },
  promoDesc: { color: '#889DAB', fontSize: 11, fontWeight: '500', lineHeight: 15 },
  valuesSection: { backgroundColor: '#F5E5D6', paddingVertical: 32, paddingHorizontal: 16 },
  valuesContent: {},
  logoText: { fontSize: 20, fontWeight: '800', color: '#FF5722', marginBottom: 16 },
  valuesTitle: { fontSize: 22, fontWeight: '700', color: '#111', lineHeight: 28, marginBottom: 16 },
  valuesDesc: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 32 },
  statItem: {},
  statNum: { fontSize: 20, fontWeight: '800', color: '#FF5722' },
  statLabel: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 0.5, marginTop: 4 },
});
