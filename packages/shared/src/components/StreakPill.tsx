import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import type { StreakState } from '../types/index';
import { getGraceMessage } from '../utils/streak';

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface StreakPillProps {
  streak: StreakState;
  graceMessage: string;
}

// ─────────────────────────────────────────────────────────
// Pill Component
// ─────────────────────────────────────────────────────────

/**
 * Floating pill showing current streak count.
 * Top-right corner, semi-transparent, tappable for details.
 */
export default function StreakPill({ streak, graceMessage }: StreakPillProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { currentStreak, isGraceDay, graceDaysUsed } = streak;

  const isActive = currentStreak > 0 && !isGraceDay;

  return (
    <>
      {/* Pill */}
      <TouchableOpacity
        style={[styles.pill, isGraceDay && styles.pillGrace]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.pillEmoji}>
          {isGraceDay ? '🕊️' : '🔥'}
        </Text>
        <Text style={[styles.pillText, isGraceDay && styles.pillTextGrace]}>
          {currentStreak}
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <Text style={styles.modalTitle}>
              {isGraceDay ? '🕊️ Grace Day' : '🔥 Your Streak'}
            </Text>

            {/* Streak count — large */}
            <Text style={styles.bigCount}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </Text>

            {/* Grace message */}
            {isGraceDay && graceMessage ? (
              <Text style={styles.graceMessage}>{graceMessage}</Text>
            ) : null}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏆 Longest streak</Text>
              <Text style={styles.detailValue}>{streak.longestStreak} days</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🛡️ Grace days available</Text>
              <Text style={styles.detailValue}>
                {Math.max(0, 2 - graceDaysUsed)}/2
              </Text>
            </View>

            {/* Active vs grace context */}
            {isActive ? (
              <Text style={styles.activeMessage}>
                🔥 Keep it going — every day counts.
              </Text>
            ) : isGraceDay ? (
              <Text style={styles.activeMessage}>
                🕊️ Your {currentStreak}-day streak is safe. See you tomorrow.
              </Text>
            ) : (
              <Text style={styles.activeMessage}>
                🌱 Day 1. Every streak starts here.
              </Text>
            )}

            {/* Close */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    zIndex: 100,
  },
  pillGrace: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextGrace: {
    color: 'rgba(255,255,255,0.85)',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 300,
    backgroundColor: '#1e1e36',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bigCount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  graceMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeMessage: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'rgba(155, 89, 182, 0.35)',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
