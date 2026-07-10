import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'review';
  read: boolean;
  createdAt: Date;
  data?: any;
}

export default function NotificationsScreen() {
  const nav = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Mock notifications for demo - in production, fetch from API
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Order Shipped!',
          message: 'Your order #SM-1234 has been shipped and is on its way to you.',
          type: 'order',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          data: { orderId: 'SM-1234' },
        },
        {
          id: '2',
          title: 'Flash Sale Alert',
          message: '50% off on Electronics! Limited time offer ending soon.',
          type: 'promo',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          id: '3',
          title: 'Review Response',
          message: 'The vendor replied to your review on "Wireless Headphones"',
          type: 'review',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          data: { productId: 1 },
        },
        {
          id: '4',
          title: 'Payment Confirmed',
          message: 'Your payment of ₹2,499.00 for order #SM-1233 has been confirmed.',
          type: 'order',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          data: { orderId: 'SM-1233' },
        },
        {
          id: '5',
          title: 'Welcome to SreeMarket!',
          message: 'Thank you for joining us. Start exploring our curated collections.',
          type: 'system',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
        },
      ];
      setNotifications(mockNotifications);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return { name: 'bag-check-outline', color: '#4CAF50' };
      case 'promo':
        return { name: 'pricetag-outline', color: '#FF5722' };
      case 'review':
        return { name: 'chatbubble-ellipses-outline', color: '#2196F3' };
      case 'system':
        return { name: 'information-circle-outline', color: '#9C27B0' };
      default:
        return { name: 'notifications-outline', color: '#666' };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <Pressable
        style={[st.notificationItem, !item.read && st.notificationUnread]}
        onPress={() => {
          markAsRead(item.id);
          if (item.data?.orderId) {
            // Navigate to order detail
          } else if (item.data?.productId) {
            nav.navigate('ProductDetail', { id: item.data.productId });
          }
        }}
      >
        <View style={[st.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={st.notificationContent}>
          <View style={st.notificationHeader}>
            <Text style={[st.notificationTitle, !item.read && st.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={st.notificationTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={st.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.read && <View style={st.unreadDot} />}
      </Pressable>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <View style={st.headerActions}>
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead} style={st.headerBtn}>
                <Text style={st.headerBtnText}>Mark all read</Text>
              </Pressable>
            )}
            <Pressable onPress={clearAll} style={st.headerBtn}>
              <Text style={[st.headerBtnText, st.clearBtn]}>Clear all</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Notification Badge */}
      {unreadCount > 0 && (
        <View style={st.badgeContainer}>
          <View style={st.badge}>
            <Text style={st.badgeText}>{unreadCount} unread</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={st.centerContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={st.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={st.centerContainer}>
          <View style={st.emptyIconContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
          </View>
          <Text style={st.emptyTitle}>No notifications</Text>
          <Text style={st.emptyText}>You're all caught up! New notifications will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={st.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
          ItemSeparatorComponent={() => <View style={st.separator} />}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerActions: { flexDirection: 'row', marginTop: 8, gap: 16 },
  headerBtn: { paddingVertical: 4 },
  headerBtnText: { fontSize: 14, color: '#FF5722', fontWeight: '500' },
  clearBtn: { color: '#888' },
  badgeContainer: { paddingHorizontal: 16, paddingTop: 12 },
  badge: { backgroundColor: '#FFF0EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#FF5722' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 12 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  listContent: { paddingTop: 8 },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16 },
  notificationUnread: { backgroundColor: '#FAFAFA' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  notificationContent: { flex: 1, marginLeft: 12 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notificationTitle: { fontSize: 15, fontWeight: '500', color: '#333', flex: 1 },
  titleUnread: { fontWeight: '600', color: '#111' },
  notificationTime: { fontSize: 12, color: '#888', marginLeft: 8 },
  notificationMessage: { fontSize: 14, color: '#666', lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5722', marginLeft: 8, marginTop: 6 },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 76 },
});
