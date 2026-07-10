import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Dimensions, FlatList, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productsApi } from '../../services/products';
import { Product, Category } from '../../types';
import { getDiscountPercent } from '../../utils/product';
import ProductCard from '../../components/ProductCard';
import { useCompare } from '../../context/CompareContext';
import { MEDIA_BASE_URL } from '../../constants';

const { width } = Dimensions.get('window');

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
];

export default function ShopScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { toggleCompare, isCompared, compareIds, MAX_COMPARE } = useCompare();
  const initialCategory = route.params?.category || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const MOCK_CATEGORIES = [
    { name: 'Handicrafts', count: 10 },
    { name: 'Textiles', count: 8 },
    { name: 'Pottery', count: 6 },
    { name: 'Jewelry', count: 5 },
    { name: 'Home Decor', count: 12 },
    { name: 'Accessories', count: 7 },
  ];

  const applyFilters = useCallback((items: Product[], cat: string, q: string, sort: string, min: string, max: string) => {
    let r = [...items];
    if (cat) r = r.filter(p => p.category === cat);
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(lower) || p.brand?.toLowerCase().includes(lower));
    }
    const mn = parseFloat(min);
    const mx = parseFloat(max);
    if (!isNaN(mn)) r = r.filter(p => (p.discountPrice || p.regularPrice || 0) >= mn);
    if (!isNaN(mx)) r = r.filter(p => (p.discountPrice || p.regularPrice || 0) <= mx);
    switch (sort) {
      case 'newest': r.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      case 'price-low': r.sort((a, b) => (a.discountPrice || a.regularPrice || 0) - (b.discountPrice || b.regularPrice || 0)); break;
      case 'price-high': r.sort((a, b) => (b.discountPrice || b.regularPrice || 0) - (a.discountPrice || a.regularPrice || 0)); break;
    }
    return r;
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [all, cats] = await Promise.all([
        productsApi.getAll().catch(() => [] as Product[]),
        productsApi.getCategories().catch(() => [] as Category[]),
      ]);
      setProducts(all || []);
      const catCount: Record<string, number> = {};
      (all || []).forEach(p => { if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1; });
      const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
      setCategories(sorted);
      return all;
    } catch { return []; }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().then(all => {
      setFiltered(applyFilters(all || products, selectedCat, search, sortBy, minPrice, maxPrice));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setPage(1);
    setFiltered(applyFilters(products, selectedCat, search, sortBy, minPrice, maxPrice));
  }, [selectedCat, sortBy, minPrice, maxPrice]);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setFiltered(applyFilters(products, selectedCat, text, sortBy, minPrice, maxPrice));
    }, 300);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const all = await fetchAll();
    setFiltered(applyFilters(all || products, selectedCat, search, sortBy, minPrice, maxPrice));
    setRefreshing(false);
  }, [selectedCat, search, sortBy, minPrice, maxPrice]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Shop</Text>
        <View style={st.headerRight}>
          {compareIds.length >= 2 && (
            <Pressable onPress={() => nav.navigate('Compare', { productIds: compareIds })} style={st.compareBar}>
              <Ionicons name="git-compare" size={16} color="#fff" />
              <Text style={st.compareBarT}>Compare ({compareIds.length})</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setShowFilters(true)} style={st.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#333" />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={st.searchWrap}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={st.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => { setSearch(''); setFiltered(applyFilters(products, selectedCat, '', sortBy, minPrice, maxPrice)); }}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </Pressable>
        ) : null}
      </View>

      {/* Sort & Count Row */}
      <View style={st.topBar}>
        <Text style={st.countT}>Showing {paginated.length} of {filtered.length} products</Text>
        <Pressable onPress={() => setShowSort(true)} style={st.sortBtn}>
          <Text style={st.sortBtnT}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Featured'}</Text>
          <Ionicons name="chevron-down" size={14} color="#888" />
        </Pressable>
      </View>

      {/* Categories Chips */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
          <Pressable onPress={() => setSelectedCat('')} style={[st.chip, !selectedCat && st.chipOn]}>
            <Text style={[st.chipT, !selectedCat && st.chipTOn]}>All</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable key={cat.name} onPress={() => setSelectedCat(cat.name)} style={[st.chip, selectedCat === cat.name && st.chipOn]}>
              <Text style={[st.chipT, selectedCat === cat.name && st.chipTOn]}>{cat.name} ({cat.count})</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Product Grid */}
      {loading ? (
        <View style={st.centered}><ActivityIndicator size="large" color="#FF5722" /></View>
      ) : paginated.length === 0 ? (
        <View style={st.centered}>
          <Ionicons name="storefront-outline" size={48} color="#ccc" />
          <Text style={st.emptyT}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={paginated}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onCompare={() => toggleCompare(item.id)}
              isCompared={isCompared(item.id)}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={st.row}
          contentContainerStyle={st.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}
          onEndReached={() => { if (hasMore) setPage(p => p + 1); }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore ? <ActivityIndicator color="#FF5722" style={{ padding: 16 }} /> : null}
        />
      )}

      {/* Sort Modal */}
      <Modal visible={showSort} transparent animationType="slide">
        <Pressable style={st.modalOverlay} onPress={() => setShowSort(false)}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map(opt => (
              <Pressable key={opt.value} style={[st.sortOpt, sortBy === opt.value && st.sortOptOn]} onPress={() => { setSortBy(opt.value); setShowSort(false); }}>
                <Text style={[st.sortOptT, sortBy === opt.value && st.sortOptTOn]}>{opt.label}</Text>
                {sortBy === opt.value && <Ionicons name="checkmark" size={20} color="#FF5722" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <Pressable style={st.modalOverlay} onPress={() => setShowFilters(false)}>
          <View style={[st.modalContent, { maxHeight: '60%' }]}>
            <View style={st.filterHeader}>
              <Text style={st.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}><Ionicons name="close" size={22} color="#333" /></Pressable>
            </View>
            <ScrollView>
              <Text style={st.filterLabel}>Price Range</Text>
              <View style={st.priceRow}>
                <TextInput style={st.priceInp} placeholder="Min ₹" placeholderTextColor="#999" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
                <Text style={{ color: '#ccc' }}>—</Text>
                <TextInput style={st.priceInp} placeholder="Max ₹" placeholderTextColor="#999" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
              </View>
              <Pressable style={st.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={st.applyBtnT}>Apply Filters</Text>
              </Pressable>
              <Pressable style={st.clearBtn} onPress={() => { setMinPrice(''); setMaxPrice(''); setSelectedCat(''); setSearch(''); }}>
                <Text style={st.clearBtnT}>Clear All</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  compareBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF5722', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  compareBarT: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#eaeaea' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  countT: { fontSize: 13, color: '#888' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f4f4f4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  sortBtnT: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipRow: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea' },
  chipOn: { backgroundColor: '#FF5722', borderColor: '#FF5722' },
  chipT: { fontSize: 12, fontWeight: '500', color: '#888' },
  chipTOn: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { gap: 8, justifyContent: 'flex-start' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 16, color: '#888', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  sortOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  sortOptOn: {},
  sortOptT: { fontSize: 15, color: '#555' },
  sortOptTOn: { color: '#FF5722', fontWeight: '600' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  priceInp: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333' },
  applyBtn: { backgroundColor: '#FF5722', borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  applyBtnT: { color: '#fff', fontSize: 15, fontWeight: '600' },
  clearBtn: { alignItems: 'center', paddingVertical: 10 },
  clearBtnT: { color: '#FF5722', fontSize: 14, fontWeight: '500' },
});
