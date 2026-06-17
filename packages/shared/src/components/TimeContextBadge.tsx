import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TimeContext } from '../types/index';
import { getContextMeta } from '../utils/streak';

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface TimeContextBadgeProps {
  timeContext: TimeContext;
  greeting: string;
}

// ─────────────────────────────────────────────────────────
// Badge Component
// ─────────────────────────────────────────────────────────

/**
 * Small time-of-day indicator — shows the current context mode
 * (morning / day / evening) with an emoji and greeting snippet.
 */
export default function TimeContextBadge({ timeContext, greeting }: TimeContextBadgeProps) {
  const meta = getContextMeta(timeContext);

  return (
    <View style={styles.badge}>
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <Text style={styles.greeting} numberOfLines={1}>
        {greeting}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    zIndex: 100,
  },
  emoji: {
    fontSize: 14,
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 200,
  },
});
