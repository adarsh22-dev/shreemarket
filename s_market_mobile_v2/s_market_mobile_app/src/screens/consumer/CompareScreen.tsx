import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MEDIA_BASE_URL } from '../../constants';
import { Product } from '../../types';
import { getProductImageUrl, getDiscountPercent } from '../../utils/product';
import { productsApi } from '../../services/products';

const { width: SCREEN_W } = Dimensions.get('window');

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

export default function CompareScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const productIds: number[] = route.params?.productIds || [];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const loaded: Product[] = [];
        for (const id of productIds.slice(0, 4)) {
          try {
            const p = await productsApi.getById(id);
            if (p) loaded.push(p);
          } catch {}
        }
        setProducts(loaded);
      } catch {}
      finally { setLoading(false); }
    };
    loadProducts();
  }, [productIds.join(',')]);

  const removeProduct = (id: number) => {
    const remaining = products.filter(p => p.id !== id);
    setProducts(remaining);
    if (remaining.length === 0) nav.goBack();
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;
  if (products.length === 0) return (
    <View style={st.center}>
      <Ionicons name="git-compare-outline" size={64} color="#E0E0E0" />
      <Text style={st.emptyT}>No products to compare</Text>
      <Pressable onPress={() => nav.goBack()} style={st.backBtn}><Text style={st.backBtnT}>Go Back</Text></Pressable>
    </View>
  );

  const COL_W = Math.min(160, (SCREEN_W - 32) / products.length);

  const specs = [
    { label: 'Price', getValue: (p: Product) => `₹${(p.discountPrice || p.regularPrice || 0).toFixed(2)}` },
    { label: 'Brand', getValue: (p: Product) => p.brand || 'N/A' },
    { label: 'Rating', getValue: (p: Product) => `${(p.averageRating || 0).toFixed(1)} (${p.reviewCount || 0})` },
    { label: 'Category', getValue: (p: Product) => p.category || 'N/A' },
    { label: 'SKU', getValue: (p: Product) => p.sku || 'N/A' },
    { label: 'Availability', getValue: (p: Product) => p.initialStock > 0 ? 'In Stock' : 'Out of Stock' },
    { label: 'Weight', getValue: (p: Product) => p.weight > 0 ? `${p.weight} kg` : 'N/A' },
    { label: 'Dimensions', getValue: (p: Product) => (p.length > 0 || p.width > 0 || p.height > 0) ? `${p.length || 0}x${p.width || 0}x${p.height || 0} cm` : 'N/A' },
  ];

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Pressable onPress={() => nav.goBack()} style={st.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={st.headerTitle}>Compare Products ({products.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={st.table}>
          {/* Product Images & Names */}
          <View style={st.row}>
            <View style={[st.labelCol, { width: 100 }]}>
              <Text style={st.labelText}></Text>
            </View>
            {products.map(p => {
              const gallery = getGalleryMedia(p);
              const imgUri = gallery.length > 0
                ? getMediaUrl(gallery.find(m => m.isPrimary)?.fileName || gallery[0].fileName)
                : getProductImageUrl(p, 200);
              const displayPrice = p.discountPrice || p.regularPrice || 0;
              const discountPct = getDiscountPercent(p);
              return (
                <View key={p.id} style={[st.productCol, { width: COL_W }]}>
                  <Pressable onPress={() => removeProduct(p.id)} style={st.removeBtn}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </Pressable>
                  <Pressable onPress={() => nav.navigate('ProductDetail', { id: p.id })}>
                    <Image source={{ uri: imgUri }} style={[st.productImg, { width: COL_W - 16, height: COL_W - 16 }]} />
                    {discountPct > 0 && (
                      <View style={st.discountBadge}><Text style={st.discountT}>-{discountPct}%</Text></View>
                    )}
                    <Text style={st.productName} numberOfLines={2}>{p.name}</Text>
                    <Text style={st.productPrice}>₹{displayPrice.toFixed(2)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => nav.navigate('ProductDetail', { id: p.id })}
                    style={st.viewBtn}
                  >
                    <Text style={st.viewBtnT}>View</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Spec Rows */}
          {specs.map((spec, idx) => (
            <View key={spec.label} style={[st.row, idx % 2 === 0 && st.rowAlt]}>
              <View style={[st.labelCol, { width: 100 }]}>
                <Text style={st.labelText}>{spec.label}</Text>
              </View>
              {products.map(p => (
                <View key={p.id} style={[st.specCell, { width: COL_W }]}>
                  <Text style={st.specValue}>{spec.getValue(p)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={st.bottom}>
        <Pressable
          onPress={() => {
            if (products.length > 0) {
              nav.navigate('ProductDetail', { id: products[0].id });
            }
          }}
          style={st.addBtn}
        >
          <Text style={st.addBtnT}>View Best Match</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyT: { fontSize: 16, color: '#888', marginTop: 12 },
  backBtn: { marginTop: 16, backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnT: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  table: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowAlt: { backgroundColor: '#FAFAFA' },
  labelCol: { justifyContent: 'center', paddingVertical: 12 },
  labelText: { fontSize: 13, fontWeight: '600', color: '#888' },
  productCol: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, position: 'relative' },
  removeBtn: { position: 'absolute', top: 4, right: 4, zIndex: 5 },
  productImg: { borderRadius: 8, backgroundColor: '#f5f5f5', marginBottom: 8 },
  discountBadge: { position: 'absolute', top: 60, left: 4, backgroundColor: '#FF5722', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountT: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productName: { fontSize: 12, fontWeight: '600', color: '#111', textAlign: 'center', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#FF5722', marginBottom: 8 },
  viewBtn: { backgroundColor: '#FFF0EB', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 16 },
  viewBtnT: { fontSize: 12, fontWeight: '600', color: '#FF5722' },
  specCell: { justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  specValue: { fontSize: 12, color: '#333', textAlign: 'center' },
  bottom: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  addBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  addBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
