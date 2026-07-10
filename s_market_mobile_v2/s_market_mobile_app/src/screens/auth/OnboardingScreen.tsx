import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StatusBar, StyleSheet,
  Pressable, Animated, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth';
import { colors, spacing, typography, radius } from '../../theme';

const slides = [
  { icon: 'storefront-outline' as const, title: 'Welcome to SreeMarket', sub: 'Your one-stop marketplace for authentic Indian handicrafts, handlooms, and traditional products.', color: colors.primary },
  { icon: 'people-outline' as const, title: 'Shop from Artisans', sub: 'Connect directly with skilled artisans and craftspeople from across India.', color: colors.secondary },
  { icon: 'cart-outline' as const, title: 'Wholesale & Retail', sub: 'Whether you are a consumer or a business, find the perfect products at the best prices.', color: colors.wholesaler },
  { icon: 'shield-checkmark-outline' as const, title: 'Secure & Easy Payments', sub: 'Enjoy a seamless shopping experience with secure payment options.', color: colors.info },
];

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function OnboardingScreen() {
  const { width: winW } = useWindowDimensions();
  const [i, setI] = useState(0);
  const nav = useNavigation<any>();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const animating = useRef(false);

  const isSmall = winW < 360;
  const circleSize = isSmall ? 100 : 136;
  const iconSize = isSmall ? 48 : 68;

  const animateToSlide = useCallback((nextIdx: number) => {
    if (animating.current) return;
    animating.current = true;
    opacity.setValue(1);
    translateX.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateX, { toValue: -60, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start(() => {
      setI(nextIdx);
      translateX.setValue(60);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start(() => { animating.current = false; });
    });
  }, [opacity, translateX]);

  const handleNext = () => {
    if (i === slides.length - 1) nav.navigate('RoleSelection');
    else animateToSlide(i + 1);
  };

  const handleSkip = () => {
    useAuthStore.getState().skipOnboarding();
  };

  const s = slides[i];
  const last = i === slides.length - 1;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={st.center}>
        {!last && (
          <View style={st.skipWrap}>
            <Pressable onPress={handleSkip} style={st.skip} hitSlop={8}>
              <Text style={st.skipT}>Skip</Text>
            </Pressable>
          </View>
        )}

        <Animated.View style={[st.hero, { opacity, transform: [{ translateX }] }]}>
          <View style={[st.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: s.color }]}>
            <Ionicons name={s.icon} size={iconSize} color="#fff" />
          </View>
          <Text style={st.title}>{s.title}</Text>
          <Text style={st.sub}>{s.sub}</Text>
        </Animated.View>

        <View style={st.pagination}>
          {slides.map((_, idx) => (
            <View key={idx} style={[st.dot, idx === i && st.dotOn]} />
          ))}
        </View>

        <View style={st.footer}>
          <Pressable onPress={handleNext} style={st.btn}>
            <Text style={st.btnT}>{last ? 'Get Started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  skipWrap: { position: 'absolute', top: 60, right: 16, zIndex: 10 },
  skip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,87,34,0.08)', minHeight: 48, justifyContent: 'center' },
  skipT: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  hero: { alignItems: 'center', maxWidth: 400, paddingHorizontal: 32 },
  circle: { justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  pagination: { position: 'absolute', bottom: 96, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot, marginHorizontal: 5 },
  dotOn: { width: 28, backgroundColor: colors.dotActive, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.lg, minHeight: 56 },
  btnT: { fontSize: 17, fontWeight: '700', color: '#fff', marginRight: 8 },
});
