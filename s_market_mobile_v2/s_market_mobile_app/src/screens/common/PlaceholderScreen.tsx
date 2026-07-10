import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function PlaceholderScreen({ title, icon = 'construct-outline' }: Props) {
  return (
    <View style={st.root}>
      <Ionicons name={icon} size={48} color={colors.textLight} />
      <Text style={st.text}>{title}</Text>
      <Text style={st.sub}>Coming soon</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  text: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 16, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
