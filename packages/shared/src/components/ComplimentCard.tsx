import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';

interface ColorAdvice {
  hexCode: string;
  meaning: string;
}

interface ComplimentCardProps {
  compliment: { text: string } | null;
  colorAdvice: ColorAdvice | null;
  loading: boolean;
}

export default function ComplimentCard({
  compliment,
  colorAdvice,
  loading,
}: ComplimentCardProps) {
  const { height } = useWindowDimensions();
  const cardHeight = height * 0.22;

  if (loading) {
    return (
      <View style={[styles.container, { height: cardHeight }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: cardHeight }]}>
      {compliment && (
        <Text style={styles.complimentText}>{compliment.text}</Text>
      )}
      {colorAdvice && (
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: colorAdvice.hexCode }]} />
          <Text style={styles.colorMeaning}>{colorAdvice.meaning}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complimentText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorMeaning: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '400',
    flexShrink: 1,
  },
});
