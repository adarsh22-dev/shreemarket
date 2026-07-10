import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, StyleSheet, Dimensions, TextInput, Modal, Share, Linking, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MEDIA_BASE_URL } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { useCompare } from '../../context/CompareContext';
import { productsApi } from '../../services/products';
import { cartApi } from '../../services/cart';
import { wishlistApi } from '../../services/wishlist';
import { Product, Review, Vendor } from '../../types';
import { getProductImageUrl, getDiscountPercent } from '../../utils/product';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
function getManufacturerMedia(product: Product) {
  return (product.media || []).filter(m => m.mediaType === 'manufacturer' && m.fileName);
}
function getVideoMedia(product: Product) {
  return (product.media || []).filter(m => (m.fileType === 'video' || m.fileType === 'video-url') && m.fileName);
}
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

// ═══════════════════════════════════════════
// Product Card with Wishlist, Compare, Share, Add to Cart
// ═══════════════════════════════════════════
function ProductCardFunctional({ item }: { item: Product }) {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { toggleCompare, isCompared } = useCompare();
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
      if (wishlisted) {
        await wishlistApi.remove(user.id, item.id);
        setWishlisted(false);
      } else {
        await wishlistApi.add(user.id, item.id);
        setWishlisted(true);
      }
    } catch {}
  };

  const handleAddToCart = async () => {
    if (!user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    setAdding(true);
    try {
      await cartApi.add(user.id, { productId: item.id, quantity: 1 });
    } catch {}
    finally { setAdding(false); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${item.name} on SreeMarket! ₹${displayPrice}`,
        url: imgUri,
      });
    } catch {}
  };

  return (
    <Pressable onPress={() => nav.navigate('ProductDetail', { id: item.id })} style={pc.card}>
      <View style={pc.imgWrap}>
        <Image source={{ uri: imgUri }} style={pc.img} />
        {discountPct > 0 && (
          <View style={pc.badge}><Text style={pc.badgeT}>-{discountPct}%</Text></View>
        )}
        {/* Action buttons */}
        <View style={pc.actions}>
          <Pressable onPress={toggleWishlist} style={pc.actionBtn}>
            <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={18} color={wishlisted ? '#FF5722' : '#666'} />
          </Pressable>
          <Pressable onPress={() => toggleCompare(item.id)} style={[pc.actionBtn, isCompared(item.id) && pc.actionBtnActive]}>
            <Ionicons name="git-compare-outline" size={18} color={isCompared(item.id) ? '#FF5722' : '#666'} />
          </Pressable>
          <Pressable onPress={handleShare} style={pc.actionBtn}>
            <Ionicons name="share-social-outline" size={18} color="#666" />
          </Pressable>
        </View>
      </View>
      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={2}>{item.name}</Text>
        <View style={pc.priceRow}>
          <Text style={pc.price}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
          {item.regularPrice && item.discountPrice && (
            <Text style={pc.oldPrice}>₹{parseFloat(String(item.regularPrice)).toFixed(2)}</Text>
          )}
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
            <>
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={pc.addCartBtnT}>Add to Cart</Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const pc = StyleSheet.create({
  card: { width: (SCREEN_W - 48) / 2, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  imgWrap: { position: 'relative', backgroundColor: '#ededed' },
  img: { width: (SCREEN_W - 48) / 2, height: (SCREEN_W - 48) / 2, backgroundColor: '#f5f5f5' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF5722', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeT: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actions: { position: 'absolute', top: 8, right: 8, gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  actionBtnActive: { backgroundColor: '#FFF0EB' },
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

function SectionTitle({ title }: { title: string }) {
  return <Text style={st.sectionTitle}>{title}</Text>;
}

// ═══════════════════════════════════════════
// Full-Screen Image Viewer Modal
// ═══════════════════════════════════════════
function ImageViewerModal({ visible, images, initialIndex, onClose }: {
  visible: boolean; images: string[]; initialIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false }), 100);
      setIdx(initialIndex);
    }
  }, [visible, initialIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={iv.modal}>
        <Pressable onPress={onClose} style={iv.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={iv.counter}>{idx + 1} / {images.length}</Text>
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIdx(newIndex);
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={iv.image} resizeMode="contain" />
          )}
        />
        {images.length > 1 && (
          <View style={iv.dots}>
            {images.map((_, i) => (
              <View key={i} style={[iv.dot, i === idx && iv.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const iv = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 16, zIndex: 10, padding: 8 },
  counter: { position: 'absolute', top: 55, left: 16, zIndex: 10, color: '#fff', fontSize: 14, fontWeight: '600' },
  image: { width: SCREEN_W, height: SCREEN_H },
  dots: { position: 'absolute', bottom: 40, flexDirection: 'row', alignSelf: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FF5722', width: 20 },
});

// ═══════════════════════════════════════════
// Video Player Modal
// ═══════════════════════════════════════════
function VideoPlayerModal({ visible, url, onClose }: { visible: boolean; url: string; onClose: () => void }) {
  const youtubeEmbed = getYouTubeEmbedUrl(url);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={vp.modal}>
        <Pressable onPress={onClose} style={vp.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <View style={vp.playerWrap}>
          {youtubeEmbed ? (
            <Pressable onPress={() => Linking.openURL(url)} style={vp.youtubePlaceholder}>
              <Image source={{ uri: getYouTubeThumbnail(url) || '' }} style={vp.youtubeThumb} />
              <View style={vp.playOverlay}>
                <View style={vp.playCircle}>
                  <Ionicons name="play" size={40} color="#fff" />
                </View>
                <Text style={vp.playText}>Play on YouTube</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={() => Linking.openURL(url)} style={vp.youtubePlaceholder}>
              <View style={[vp.playOverlay, { backgroundColor: '#000' }]}>
                <View style={vp.playCircle}>
                  <Ionicons name="play" size={40} color="#fff" />
                </View>
                <Text style={vp.playText}>Play Video</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const vp = StyleSheet.create({
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 16, zIndex: 10, padding: 8 },
  playerWrap: { width: SCREEN_W * 0.9, aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' },
  youtubePlaceholder: { flex: 1, backgroundColor: '#000' },
  youtubeThumb: { width: '100%', height: '100%', position: 'absolute' },
  playOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  playCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,87,34,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  playText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function ProductDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { compareIds, toggleCompare, isCompared } = useCompare();
  const productId = route.params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [adding, setAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
  const [crossSellProducts, setCrossSellProducts] = useState<Product[]>([]);
  const [sameCategoryProducts, setSameCategoryProducts] = useState<Product[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Modals
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    const loadProduct = async () => {
      setLoading(true);
      try {
        const p = await productsApi.getById(productId);
        if (cancelled || !p) return;
        setProduct(p);
        if (p.vendorId) productsApi.getVendorById(p.vendorId).then(v => { if (!cancelled) setVendor(v); }).catch(() => {});
        productsApi.getProductReviews(productId).then(r => { if (!cancelled) setReviews(r || []); }).catch(() => {});
        productsApi.fetchLinkedProducts(p, 'BOUGHT_TOGETHER').then(fbt => { if (!cancelled) setFbtProducts(fbt); }).catch(() => {});
        productsApi.fetchLinkedProducts(p, 'UPSELL').then(ups => { if (!cancelled) setUpsellProducts(ups); }).catch(() => {});
        productsApi.fetchLinkedProducts(p, 'CROSS_SELL').then(cs => { if (!cancelled) setCrossSellProducts(cs); }).catch(() => {});
        if (user?.id) {
          wishlistApi.check(user.id, p.id).then(r => { if (!cancelled) setWishlisted(!!r); }).catch(() => {});
        }
        if (p.category) {
          productsApi.getAll(p.category).then(all => {
            if (cancelled) return;
            const same = (all || []).filter(x => x.id !== p.id);
            setSameCategoryProducts(same);
            if (!p.linkedProducts?.some(lp => lp.linkedType === 'UPSELL')) {
              setUpsellProducts([...same].sort((a, b) => (a.discountPrice || a.regularPrice || 0) - (b.discountPrice || b.regularPrice || 0)).slice(0, 6));
            }
            if (!p.linkedProducts?.some(lp => lp.linkedType === 'CROSS_SELL')) {
              setCrossSellProducts([...same].sort((a, b) => (b.discountPrice || b.regularPrice || 0) - (a.discountPrice || a.regularPrice || 0)).slice(0, 6));
            }
          }).catch(() => {});
        }
      } catch { setProduct(null); }
      finally { if (!cancelled) setLoading(false); }
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [productId, user?.id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    setAdding(true);
    try { await cartApi.add(user.id, { productId: product.id, quantity: qty }); } catch {}
    finally { setAdding(false); }
  };

  const handleAddFbtToCart = async () => {
    if (!product || !user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    setAdding(true);
    try {
      await cartApi.add(user.id, { productId: product.id, quantity: 1 });
      for (const fbt of fbtProducts.slice(0, 2)) {
        await cartApi.add(user.id, { productId: fbt.id, quantity: 1 });
      }
    } catch {}
    finally { setAdding(false); }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    if (!user?.id) { nav.navigate('Auth', { screen: 'Login' }); return; }
    try {
      if (wishlisted) { await wishlistApi.remove(user.id, product.id); setWishlisted(false); }
      else { await wishlistApi.add(user.id, product.id); setWishlisted(true); }
    } catch {}
  };

  const handleCompare = () => {
    if (product) {
      toggleCompare(product.id);
    }
  };

  const handleNavigateToCompare = () => {
    if (compareIds.length >= 2) {
      nav.navigate('Compare', { productIds: compareIds });
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try { await Share.share({ message: `Check out ${product.name} on SreeMarket! ₹${product.discountPrice || product.regularPrice}` }); } catch {}
  };

  const handleSubmitReview = async () => {
    if (!product || !user?.id) return;
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('review', JSON.stringify({ rating: newReview.rating, title: newReview.title, text: newReview.text, product: { id: product.id }, reviewerName: user.fullName || 'Anonymous' }));
      const saved = await productsApi.submitProductReview(product.id, formData);
      setReviews(prev => [saved, ...prev]);
      setNewReview({ rating: 5, title: '', text: '' });
    } catch {}
    finally { setSubmittingReview(false); }
  };

  const openImageViewer = (index: number) => {
    const gallery = getGalleryMedia(product!);
    const urls = gallery.map(m => getMediaUrl(m.fileName));
    setViewerImages(urls);
    setViewerIdx(index);
    setImageViewerVisible(true);
  };

  const openVideo = (url: string) => {
    setVideoUrl(url);
    setVideoModalVisible(true);
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#FF5722" /></View>;
  if (!product) return <View style={st.center}><Text style={st.noT}>Product not found</Text></View>;

  const galleryMedia = getGalleryMedia(product);
  const mfrMedia = getManufacturerMedia(product);
  const videoMedia = getVideoMedia(product);
  const activeImg = galleryMedia[imgIdx];
  const hasDiscount = getDiscountPercent(product) > 0;
  const displayPrice = product.discountPrice || product.regularPrice || 0;
  const store = vendor?.stores?.[0];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : (product.averageRating || 0).toFixed(1);

  const faqs = [
    { q: 'What is the return policy?', a: 'We offer 14-day free returns for most items.' },
    { q: 'How long does shipping take?', a: 'Standard shipping takes 3-7 business days.' },
    { q: 'Is this product authentic?', a: 'Yes, all products are 100% authentic.' },
    { q: 'Do you offer international shipping?', a: 'Yes, we ship worldwide.' },
    { q: 'How can I track my order?', a: 'You will receive a tracking number via email.' },
  ];

  return (
    <View style={st.root}>
      <ScrollView>
        {/* ═══ IMAGE GALLERY ═══ */}
        <View style={st.imgSection}>
          <Pressable onPress={() => nav.goBack()} style={st.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </Pressable>
          <View style={st.galleryActions}>
            <Pressable onPress={toggleWishlist} style={st.galleryActionBtn}>
              <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={20} color={wishlisted ? '#FF5722' : '#fff'} />
            </Pressable>
            <Pressable onPress={handleCompare} style={[st.galleryActionBtn, isCompared(product.id) && { backgroundColor: '#FF5722' }]}>
              <Ionicons name="git-compare-outline" size={20} color={isCompared(product.id) ? '#fff' : '#fff'} />
            </Pressable>
            <Pressable onPress={handleShare} style={st.galleryActionBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </Pressable>
          </View>
          <Pressable onPress={() => openImageViewer(imgIdx)}>
            <Image
              source={{ uri: activeImg ? getMediaUrl(activeImg.fileName) : getProductImageUrl(product, 400) }}
              style={st.mainImg}
            />
          </Pressable>
          {galleryMedia.length > 1 && (
            <ScrollView horizontal contentContainerStyle={st.thumbRow} showsHorizontalScrollIndicator={false}>
              {galleryMedia.map((img, i) => (
                <Pressable key={img.id} onPress={() => setImgIdx(i)} style={[st.thumb, i === imgIdx && st.thumbOn]}>
                  <Image source={{ uri: getMediaUrl(img.fileName) }} style={st.thumbImg} />
                </Pressable>
              ))}
            </ScrollView>
          )}
          {galleryMedia.length > 1 && (
            <View style={st.imgCounter}>
              <Text style={st.imgCounterT}>{imgIdx + 1} / {galleryMedia.length}</Text>
            </View>
          )}
        </View>


        {/* ═══ PRODUCT INFO ═══ */}
        <View style={st.info}>
          <View style={st.tagRow}><Text style={st.tagText}>{product.category?.toUpperCase()} | {product.status?.toUpperCase() || 'AVAILABLE'}</Text></View>
          <Text style={st.brand}>{product.brand || product.category}</Text>
          <Text style={st.name}>{product.name}</Text>
          <View style={st.priceRow}>
            <Text style={st.price}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
            {hasDiscount && <Text style={st.old}>₹{parseFloat(String(product.regularPrice)).toFixed(2)}</Text>}
            {hasDiscount && <View style={st.discountBadge}><Text style={st.discountT}>{getDiscountPercent(product)}% OFF</Text></View>}
          </View>
          <View style={st.ratingRow}>
            <View style={st.stars}>{[1, 2, 3, 4, 5].map(i => (<Ionicons key={i} name="star" size={14} color={i <= Math.round(Number(averageRating)) ? '#FFB800' : '#E0E0E0'} />))}</View>
            <Text style={st.ratingT}>{averageRating}</Text>
            <Text style={st.reviewT}>({reviews.length || product.reviewCount || 0} reviews)</Text>
          </View>
          {product.shortDescription ? (
            <View style={st.descWrap}>
              <Text style={st.desc} numberOfLines={showFullDesc ? undefined : 3}>{product.shortDescription}</Text>
              {product.shortDescription.length > 100 && (
                <Pressable onPress={() => setShowFullDesc(!showFullDesc)}>
                  <Text style={st.readMore}>{showFullDesc ? 'Read Less' : 'Read More'}</Text>
                </Pressable>
              )}
            </View>
          ) : null}
          {store && (
            <View style={st.vendorBox}>
              <View style={st.vendorRow}>
                <View style={st.vendorAvatar}>
                  {store.storeLogo ? <Image source={{ uri: getMediaUrl(store.storeLogo) }} style={st.vendorAvatarImg} /> : <Text style={st.vendorAvatarText}>{store.storeName?.charAt(0)?.toUpperCase() || 'S'}</Text>}
                </View>
                <View style={st.vendorInfo}>
                  <Text style={st.vendorLabel}>Sold by</Text>
                  <Text style={st.vendorStoreName}>{store.storeName || vendor?.fullName}</Text>
                </View>
                <Pressable style={st.viewStoreBtn}><Text style={st.viewStoreBtnT}>View Store</Text></Pressable>
              </View>
            </View>
          )}
          <View style={st.specsInline}>
            {product.brand && <View style={st.specInlineItem}><Text style={st.specInlineLabel}>BRAND</Text><Text style={st.specInlineValue}>{product.brand}</Text></View>}
            {product.sku && <View style={st.specInlineItem}><Text style={st.specInlineLabel}>SKU</Text><Text style={st.specInlineValue}>{product.sku}</Text></View>}
          </View>
          <View style={st.qtyRow}>
            <Text style={st.qtyLabel}>Quantity</Text>
            <View style={st.qtyCtrl}>
              <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={st.qtyBtn}><Ionicons name="remove" size={18} color="#333" /></Pressable>
              <Text style={st.qtyVal}>{qty}</Text>
              <Pressable onPress={() => setQty(qty + 1)} style={st.qtyBtn}><Ionicons name="add" size={18} color="#333" /></Pressable>
            </View>
          </View>
        </View>

        <View style={st.guarantees}>
          <View style={st.guaranteeItem}><Ionicons name="globe-outline" size={16} color="#FF5722" /><Text style={st.guaranteeT}>Free Worldwide Shipping</Text></View>
          <View style={st.guaranteeItem}><Ionicons name="return-down-back-outline" size={16} color="#FF5722" /><Text style={st.guaranteeT}>14-Day Free Returns</Text></View>
        </View>

        {/* ═══ TABS ═══ */}
        <View style={st.tabs}>
          <Pressable onPress={() => setActiveTab('description')} style={[st.tab, activeTab === 'description' && st.tabActive]}><Text style={[st.tabT, activeTab === 'description' && st.tabTActive]}>Description</Text></Pressable>
          <Pressable onPress={() => setActiveTab('specs')} style={[st.tab, activeTab === 'specs' && st.tabActive]}><Text style={[st.tabT, activeTab === 'specs' && st.tabTActive]}>Specifications</Text></Pressable>
          <Pressable onPress={() => setActiveTab('reviews')} style={[st.tab, activeTab === 'reviews' && st.tabActive]}><Text style={[st.tabT, activeTab === 'reviews' && st.tabTActive]}>Reviews ({reviews.length})</Text></Pressable>
        </View>
        <View style={st.tabContent}>
          {activeTab === 'description' && (<View><SectionTitle title="Product Details" /><Text style={st.descriptionText}>{product.description || product.shortDescription || 'No description available.'}</Text></View>)}
          {activeTab === 'specs' && (
            <View>
              <SectionTitle title="Specifications" />
              <View style={st.specsTable}>
                {product.brand && <View style={st.specRow}><Text style={st.specLabel}>Brand</Text><Text style={st.specValue}>{product.brand}</Text></View>}
                {product.sku && <View style={st.specRow}><Text style={st.specLabel}>SKU</Text><Text style={st.specValue}>{product.sku}</Text></View>}
                {product.category && <View style={st.specRow}><Text style={st.specLabel}>Category</Text><Text style={st.specValue}>{product.category}</Text></View>}
                <View style={st.specRow}><Text style={st.specLabel}>Availability</Text><Text style={st.specValue}>{product.initialStock > 0 ? 'In Stock' : 'Out of Stock'}</Text></View>
                {product.weight > 0 && <View style={st.specRow}><Text style={st.specLabel}>Weight</Text><Text style={st.specValue}>{product.weight} kg</Text></View>}
                {(product.length > 0 || product.width > 0 || product.height > 0) && <View style={st.specRow}><Text style={st.specLabel}>Dimensions</Text><Text style={st.specValue}>{product.length || 0} x {product.width || 0} x {product.height || 0} cm</Text></View>}
                {product.attributes?.filter(a => a.visible).map(attr => <View key={attr.id} style={st.specRow}><Text style={st.specLabel}>{attr.name}</Text><Text style={st.specValue}>{attr.value}</Text></View>)}
                {product.tags && product.tags.length > 0 && (
                  <View style={st.specRow}><Text style={st.specLabel}>Tags</Text><View style={st.tagsRow}>{product.tags.map((tag, i) => <View key={tag.id || i} style={st.tagChip}><Text style={st.tagChipT}>{tag.name}</Text></View>)}</View></View>
                )}
              </View>
            </View>
          )}
          {activeTab === 'reviews' && (
            <View>
              <SectionTitle title="Customer Reviews" />
              <View style={st.ratingSummary}>
                <Text style={st.ratingBig}>{averageRating}</Text>
                <Text style={st.ratingBased}>Based on {reviews.length} reviews</Text>
                <View style={st.ratingBars}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (<View key={star} style={st.barRow}><Text style={st.barLabel}>{star} Star</Text><View style={st.barBg}><View style={[st.barFill, { width: `${pct}%` }]} /></View><Text style={st.barPct}>{Math.round(pct)}%</Text></View>);
                  })}
                </View>
              </View>
              {user?.id ? (
                <View style={st.writeReview}>
                  <Text style={st.writeReviewTitle}>Write a Review</Text>
                  <View style={st.starInput}>{[1, 2, 3, 4, 5].map(i => (<Pressable key={i} onPress={() => setNewReview(prev => ({ ...prev, rating: i }))}><Ionicons name={i <= newReview.rating ? 'star' : 'star-outline'} size={28} color={i <= newReview.rating ? '#FFB800' : '#E0E0E0'} /></Pressable>))}</View>
                  <TextInput style={st.input} placeholder="Review title" value={newReview.title} onChangeText={t => setNewReview(prev => ({ ...prev, title: t }))} />
                  <TextInput style={[st.input, st.textArea]} placeholder="Write your review..." value={newReview.text} onChangeText={t => setNewReview(prev => ({ ...prev, text: t }))} multiline numberOfLines={4} />
                  <Pressable onPress={handleSubmitReview} disabled={submittingReview || !newReview.title || !newReview.text} style={[st.submitBtn, (submittingReview || !newReview.title || !newReview.text) && st.submitBtnDisabled]}>
                    {submittingReview ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.submitBtnT}>Submit Review</Text>}
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => nav.navigate('Auth', { screen: 'Login' })} style={st.loginPrompt}><Text style={st.loginPromptT}>Login to Write a Review</Text></Pressable>
              )}
              {reviews.map(review => (
                <View key={review.id} style={st.reviewCard}>
                  <View style={st.reviewHeader}>
                    <View style={st.reviewStars}>{[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name="star" size={12} color={i <= review.rating ? '#FFB800' : '#E0E0E0'} />)}</View>
                    <Text style={st.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                  </View>
                  {review.title && <Text style={st.reviewTitle}>{review.title}</Text>}
                  <Text style={st.reviewText}>{review.text}</Text>
                  {review.verifiedBuyer && <View style={st.verifiedBadge}><Ionicons name="checkmark-circle" size={14} color="#4CAF50" /><Text style={st.verifiedT}>Verified Buyer</Text></View>}
                  {review.vendorReply && <View style={st.vendorReply}><Text style={st.vendorReplyLabel}>Vendor Reply:</Text><Text style={st.vendorReplyText}>{review.vendorReply}</Text></View>}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ═══ FREQUENTLY BOUGHT TOGETHER (above From the Manufacturer) ═══ */}
        {fbtProducts.length > 0 && (
          <View style={st.fbtSection}>
            <SectionTitle title="Frequently Bought Together" />
            <View style={st.fbtContainer}>
              <View style={st.fbtItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF5722" />
                <Pressable onPress={() => openImageViewer(0)}>
                  <Image source={{ uri: activeImg ? getMediaUrl(activeImg.fileName) : getProductImageUrl(product, 100) }} style={st.fbtImg} />
                </Pressable>
                <Text style={st.fbtName} numberOfLines={1}>{product.name}</Text>
                <Text style={st.fbtPrice}>₹{parseFloat(String(displayPrice)).toFixed(2)}</Text>
              </View>
              {fbtProducts.slice(0, 2).map((item) => {
                const fbtGallery = getGalleryMedia(item);
                const fbtImg = fbtGallery.length > 0 ? getMediaUrl(fbtGallery[0].fileName) : getProductImageUrl(item, 100);
                const fbtPrice = item.discountPrice || item.regularPrice || 0;
                return (
                  <React.Fragment key={item.id}>
                    <Text style={st.fbtPlus}>+</Text>
                    <Pressable style={st.fbtItem} onPress={() => nav.navigate('ProductDetail', { id: item.id })}>
                      <Image source={{ uri: fbtImg }} style={st.fbtImg} />
                      <Text style={st.fbtName} numberOfLines={1}>{item.name}</Text>
                      <Text style={st.fbtPrice}>₹{parseFloat(String(fbtPrice)).toFixed(2)}</Text>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
            <View style={st.fbtTotal}>
              <View>
                <Text style={st.fbtTotalLabel}>Total price:</Text>
                <Text style={st.fbtTotalPrice}>
                  ₹{(displayPrice + fbtProducts.slice(0, 2).reduce((sum, item) => sum + (item.discountPrice || item.regularPrice || 0), 0)).toFixed(2)}
                </Text>
              </View>
              <Pressable onPress={handleAddFbtToCart} style={st.fbtAddBtn} disabled={adding}>
                {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.fbtAddBtnT}>Add selected to cart</Text>}
              </Pressable>
            </View>
          </View>
        )}

        {/* ═══ FROM THE MANUFACTURER ═══ */}
        {mfrMedia.length > 0 && (
          <View style={st.mfrSection}>
            <SectionTitle title="From the Manufacturer" />
            <View style={st.mfrGrid}>
              {mfrMedia.map((med, idx) => (
                <Pressable key={med.id || idx} onPress={() => { const urls = mfrMedia.map(m => getMediaUrl(m.fileName)); setViewerImages(urls); setViewerIdx(idx); setImageViewerVisible(true); }}>
                  <Image source={{ uri: getMediaUrl(med.fileName) }} style={st.mfrImg} resizeMode="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ═══ VIDEOS ═══ */}
        {videoMedia.length > 0 && (
          <View style={st.videoSection}>
            <SectionTitle title="Videos" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.videoList}>
              {videoMedia.map((v, i) => {
                const vUrl = v.fileType === 'video-url' ? v.fileName : getMediaUrl(v.fileName);
                const thumb = getYouTubeThumbnail(vUrl);
                return (
                  <Pressable key={v.id || i} style={st.videoThumb} onPress={() => openVideo(vUrl)}>
                    {thumb ? <Image source={{ uri: thumb }} style={st.videoThumbImg} /> : <View style={st.videoThumbPlaceholder}><Ionicons name="play-circle" size={32} color="#FF5722" /></View>}
                    <View style={st.playBtn}><Ionicons name="play" size={16} color="#fff" /></View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ═══ MEET THE ARTISAN ═══ */}
        {store && (
          <View style={st.artisanSection}>
            <SectionTitle title="Meet the Artisan" />
            <View style={st.artisanCard}>
              <View style={st.artisanImageWrap}>
                {store.storeLogo ? <Image source={{ uri: getMediaUrl(store.storeLogo) }} style={st.artisanImage} resizeMode="cover" /> : <View style={st.artisanImagePlaceholder}><Ionicons name="storefront-outline" size={48} color="#FF5722" /></View>}
                <View style={st.locationBadge}>
                  <Text style={st.locationLabel}>LOCATION</Text>
                  <Text style={st.locationCity}>{store.city || store.country || 'Global'} 🌏</Text>
                </View>
              </View>
              <View style={st.artisanInfo}>
                <Text style={st.artisanName}>{store.storeName || vendor?.fullName}</Text>
                <Text style={st.artisanStory}>{store.storeDescription || 'A dedicated creator committed to the highest standards of quality and traditional craftsmanship.'}</Text>
                <Pressable style={st.viewCollectionBtn}><Text style={st.viewCollectionT}>View Store Collection &gt;</Text></Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ═══ WHY IT MATTERS ═══ */}
        <View style={st.whySection}>
          <SectionTitle title="Why It Matters" />
          <Text style={st.whySubtitle}>Your purchase supports sustainable practices and empowers artisan communities worldwide.</Text>
          <View style={st.mattersGrid}>
            <View style={st.matterCard}><View style={st.matterIcon}><Ionicons name="heart-outline" size={24} color="#FF5722" /></View><View style={st.matterTextWrap}><Text style={st.matterTitle}>Fair Wages</Text><Text style={st.matterDesc}>Artisans set their own prices, ensuring they earn a living wage that supports their families and communities.</Text></View></View>
            <View style={st.matterCard}><View style={st.matterIcon}><Ionicons name="shield-checkmark-outline" size={24} color="#FF5722" /></View><View style={st.matterTextWrap}><Text style={st.matterTitle}>Cultural Preservation</Text><Text style={st.matterDesc}>By prioritizing traditional techniques, we help keep centuries-old crafting traditions alive for future generations.</Text></View></View>
            <View style={st.matterCard}><View style={st.matterIcon}><Ionicons name="leaf-outline" size={24} color="#FF5722" /></View><View style={st.matterTextWrap}><Text style={st.matterTitle}>100% Organic</Text><Text style={st.matterDesc}>We use only locally sourced natural dyes and sustainable materials that are kind to both the maker and the earth.</Text></View></View>
          </View>
        </View>

        {/* ═══ FAQ ═══ */}
        <View style={st.faqSection}>
          <SectionTitle title="Frequently Asked Questions" />
          {faqs.map((faq, idx) => (
            <View key={idx} style={st.faqItem}>
              <Pressable onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)} style={st.faqQ}>
                <Text style={st.faqQT}>{faq.q}</Text>
                <Ionicons name={expandedFaq === idx ? 'remove' : 'add'} size={20} color="#FF5722" />
              </Pressable>
              {expandedFaq === idx && <Text style={st.faqA}>{faq.a}</Text>}
            </View>
          ))}
        </View>

        {/* ═══ CUSTOMERS ALSO VIEWED ═══ */}
        {sameCategoryProducts.length > 0 && (
          <View style={st.relatedSection}>
            <SectionTitle title="Customers who viewed this item also viewed" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.horizontalScroll}>
              {sameCategoryProducts.slice(0, 6).map(p => <ProductCardFunctional key={p.id} item={p} />)}
            </ScrollView>
          </View>
        )}

        {/* ═══ TOP PICKS ═══ */}
        {upsellProducts.length > 0 && (
          <View style={st.relatedSection}>
            <SectionTitle title="Top Picks" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.horizontalScroll}>
              {upsellProducts.map(p => <ProductCardFunctional key={p.id} item={p} />)}
            </ScrollView>
          </View>
        )}

        {/* ═══ YOU MAY ALSO LIKE ═══ */}
        {crossSellProducts.length > 0 && (
          <View style={st.relatedSection}>
            <SectionTitle title="You May Also Like" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.horizontalScroll}>
              {crossSellProducts.map(p => <ProductCardFunctional key={p.id} item={p} />)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ═══ BOTTOM BAR ═══ */}
      <View style={st.bottom}>
        <View>
          <Text style={st.totalLabel}>Total</Text>
          <Text style={st.totalAmt}>₹{(parseFloat(String(displayPrice)) * qty).toFixed(2)}</Text>
        </View>
        <View style={st.bottomActions}>
          <Pressable onPress={toggleWishlist} style={st.bottomIconBtn}>
            <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={22} color={wishlisted ? '#FF5722' : '#666'} />
          </Pressable>
          <Pressable onPress={handleCompare} style={st.bottomIconBtn}>
            <Ionicons name="git-compare-outline" size={22} color={isCompared(product.id) ? '#FF5722' : '#666'} />
          </Pressable>
          <Pressable onPress={handleShare} style={st.bottomIconBtn}>
            <Ionicons name="share-outline" size={22} color="#666" />
          </Pressable>
          <Pressable onPress={handleAddToCart} disabled={adding} style={st.addBtn}>
            {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.addBtnT}>Add to Cart</Text>}
          </Pressable>
        </View>
      </View>

      {/* ═══ COMPARE FLOATING BUTTON ═══ */}
      {compareIds.length >= 2 && (
        <Pressable onPress={handleNavigateToCompare} style={st.compareFloatingBtn}>
          <Ionicons name="git-compare" size={20} color="#fff" />
          <Text style={st.compareFloatingBtnT}>Compare ({compareIds.length})</Text>
        </Pressable>
      )}

      {/* ═══ MODALS ═══ */}
      <ImageViewerModal visible={imageViewerVisible} images={viewerImages} initialIndex={viewerIdx} onClose={() => setImageViewerVisible(false)} />
      <VideoPlayerModal visible={videoModalVisible} url={videoUrl} onClose={() => setVideoModalVisible(false)} />
    </View>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noT: { fontSize: 16, color: '#888' },
  imgSection: { backgroundColor: '#fff' },
  backBtn: { position: 'absolute', top: 12, left: 12, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  galleryActions: { position: 'absolute', top: 12, right: 12, zIndex: 10, gap: 8 },
  galleryActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  mainImg: { width: SCREEN_W, height: SCREEN_W, backgroundColor: '#f5f5f5' },
  thumbRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  thumb: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: '#FF5722' },
  thumbImg: { width: 52, height: 52, backgroundColor: '#f5f5f5' },
  imgCounter: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  imgCounterT: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fbtSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  fbtContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  fbtItem: { alignItems: 'center', width: 100, gap: 4 },
  fbtImg: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f5f5f5' },
  fbtName: { fontSize: 11, color: '#333', textAlign: 'center' },
  fbtPrice: { fontSize: 12, fontWeight: '700', color: '#FF5722' },
  fbtPlus: { fontSize: 20, fontWeight: '700', color: '#888' },
  fbtTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  fbtTotalLabel: { fontSize: 13, color: '#888' },
  fbtTotalPrice: { fontSize: 18, fontWeight: '700', color: '#111' },
  fbtAddBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  fbtAddBtnT: { fontSize: 13, fontWeight: '600', color: '#fff' },
  info: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  tagRow: { marginBottom: 8 },
  tagText: { fontSize: 11, color: '#888', letterSpacing: 0.5 },
  brand: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700', color: '#111', lineHeight: 26, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  price: { fontSize: 24, fontWeight: '700', color: '#111' },
  old: { fontSize: 16, color: '#b0b0b0', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#FFF0EB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  discountT: { fontSize: 12, fontWeight: '700', color: '#FF5722' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingT: { fontSize: 14, fontWeight: '600', color: '#333' },
  reviewT: { fontSize: 13, color: '#888' },
  descWrap: { marginBottom: 16 },
  desc: { fontSize: 14, lineHeight: 22, color: '#555' },
  readMore: { fontSize: 14, fontWeight: '600', color: '#FF5722', marginTop: 4 },
  vendorBox: { backgroundColor: '#FFFBF8', borderRadius: 12, borderWidth: 1, borderColor: '#E8DDD4', padding: 14, marginBottom: 16 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5EDE6', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  vendorAvatarImg: { width: 44, height: 44 },
  vendorAvatarText: { fontSize: 18, fontWeight: '700', color: '#C9A87C' },
  vendorInfo: { flex: 1 },
  vendorLabel: { fontSize: 11, color: '#A0978E', fontWeight: '600', textTransform: 'uppercase' },
  vendorStoreName: { fontSize: 15, fontWeight: '600', color: '#2C2C2C', marginTop: 2 },
  viewStoreBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#C9A87C' },
  viewStoreBtnT: { fontSize: 13, fontWeight: '600', color: '#C9A87C' },
  specsInline: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  specInlineItem: { flex: 1 },
  specInlineLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  specInlineValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f9f9f9' },
  qtyVal: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, fontWeight: '600', minWidth: 40, textAlign: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e0e0e0' },
  guarantees: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: '#fff', marginTop: 8 },
  guaranteeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guaranteeT: { fontSize: 12, color: '#555', fontWeight: '500' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF5722' },
  tabT: { fontSize: 14, fontWeight: '500', color: '#888' },
  tabTActive: { color: '#FF5722', fontWeight: '600' },
  tabContent: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 12 },
  descriptionText: { fontSize: 14, lineHeight: 22, color: '#555' },
  specsTable: { marginTop: 8 },
  specRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  specLabel: { width: 120, fontSize: 14, color: '#888', fontWeight: '500' },
  specValue: { flex: 1, fontSize: 14, color: '#333' },
  tagsRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { backgroundColor: '#F5EDE6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  tagChipT: { fontSize: 12, color: '#8A7F75', fontWeight: '500' },
  ratingSummary: { alignItems: 'center', paddingVertical: 16, backgroundColor: '#FAFAFA', borderRadius: 12, marginBottom: 16 },
  ratingBig: { fontSize: 48, fontWeight: '700', color: '#111' },
  ratingBased: { fontSize: 13, color: '#888', marginTop: 4 },
  ratingBars: { width: '100%', marginTop: 16, paddingHorizontal: 20 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { width: 50, fontSize: 12, color: '#666' },
  barBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FFB800', borderRadius: 4 },
  barPct: { width: 40, fontSize: 12, color: '#666', textAlign: 'right' },
  writeReview: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 16 },
  writeReviewTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  starInput: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#ccc' },
  submitBtnT: { fontSize: 15, fontWeight: '600', color: '#fff' },
  loginPrompt: { backgroundColor: '#FFF0EB', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  loginPromptT: { fontSize: 15, fontWeight: '600', color: '#FF5722' },
  reviewCard: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12, color: '#888' },
  reviewTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  reviewText: { fontSize: 14, lineHeight: 20, color: '#555', marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedT: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  vendorReply: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#FF5722' },
  vendorReplyLabel: { fontSize: 12, fontWeight: '600', color: '#FF5722', marginBottom: 4 },
  vendorReplyText: { fontSize: 13, lineHeight: 18, color: '#555' },
  mfrSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  mfrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  mfrImg: { width: (SCREEN_W - 40) / 2, height: 180, borderRadius: 8 },
  videoSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  videoList: { gap: 12 },
  videoThumb: { width: 200, height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' },
  videoThumbImg: { width: 200, height: 120 },
  videoThumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  playBtn: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,87,34,0.9)', justifyContent: 'center', alignItems: 'center' },
  artisanSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  artisanCard: { backgroundColor: '#FAFAFA', borderRadius: 12, overflow: 'hidden' },
  artisanImageWrap: { position: 'relative', height: 200, backgroundColor: '#f0f0f0' },
  artisanImage: { width: '100%', height: 200 },
  artisanImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  locationBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  locationLabel: { fontSize: 10, color: '#ccc', fontWeight: '600' },
  locationCity: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },
  artisanInfo: { padding: 16 },
  artisanName: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  artisanStory: { fontSize: 14, lineHeight: 22, color: '#555', marginBottom: 12 },
  viewCollectionBtn: { paddingVertical: 8 },
  viewCollectionT: { fontSize: 14, fontWeight: '600', color: '#C9A87C' },
  whySection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  whySubtitle: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 16 },
  mattersGrid: { gap: 16 },
  matterCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14 },
  matterIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0EB', justifyContent: 'center', alignItems: 'center' },
  matterTextWrap: { flex: 1 },
  matterTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 4 },
  matterDesc: { fontSize: 12, lineHeight: 18, color: '#666' },
  faqSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  faqQ: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  faqQT: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1 },
  faqA: { fontSize: 13, lineHeight: 20, color: '#666', paddingBottom: 14 },
  relatedSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  horizontalScroll: { gap: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontSize: 13, color: '#888' },
  totalAmt: { fontSize: 22, fontWeight: '700', color: '#111' },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  addBtnT: { fontSize: 16, fontWeight: '700', color: '#fff' },
  compareFloatingBtn: { position: 'absolute', bottom: 90, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF5722', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  compareFloatingBtnT: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
