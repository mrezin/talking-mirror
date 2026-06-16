import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import type { ZodiacSign, DailyFocus } from '../types/index';

const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const FOCUS_OPTIONS: { key: DailyFocus; label: string; emoji: string }[] = [
  { key: 'career', label: 'Career', emoji: '💼' },
  { key: 'love', label: 'Love', emoji: '❤️' },
  { key: 'balance', label: 'Balance', emoji: '🧘' },
];

interface ProfileSetupViewProps {
  onSave: (zodiacSign: ZodiacSign, dailyFocus: DailyFocus) => void;
  saving?: boolean;
}

export default function ProfileSetupView({ onSave, saving = false }: ProfileSetupViewProps) {
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<DailyFocus | null>(null);
  const { width } = useWindowDimensions();

  const colCount = 4;
  const gap = 10;
  const cellSize = Math.floor((width - 48 - gap * (colCount - 1)) / colCount);
  const canSave = selectedZodiac && selectedFocus;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>🪞</Text>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          We'll use this to give you a contextual morning impulse — honest, not flattery.
        </Text>

        {/* Zodiac Grid */}
        <Text style={styles.sectionTitle}>Choose your zodiac sign</Text>
        <View style={styles.grid}>
          {ZODIAC_SIGNS.map((sign) => {
            const selected = selectedZodiac === sign;
            return (
              <TouchableOpacity
                key={sign}
                style={[
                  styles.zodiacCell,
                  { width: cellSize, height: cellSize * 0.8 },
                  selected && styles.zodiacCellSelected,
                ]}
                onPress={() => setSelectedZodiac(sign)}
                activeOpacity={0.7}
              >
                <Text style={[styles.zodiacEmoji, selected && styles.zodiacEmojiSelected]}>
                  {getZodiacEmoji(sign)}
                </Text>
                <Text style={[styles.zodiacLabel, selected && styles.zodiacLabelSelected]}>
                  {sign.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Focus Picker */}
        <Text style={styles.sectionTitle}>What's your focus?</Text>
        <View style={styles.focusRow}>
          {FOCUS_OPTIONS.map(({ key, label, emoji }) => {
            const selected = selectedFocus === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.focusButton, selected && styles.focusButtonSelected]}
                onPress={() => setSelectedFocus(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.focusEmoji}>{emoji}</Text>
                <Text style={[styles.focusLabel, selected && styles.focusLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
          onPress={() => {
            if (canSave && !saving) {
              onSave(selectedZodiac, selectedFocus);
            }
          }}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can always change this in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getZodiacEmoji(sign: ZodiacSign): string {
  const map: Record<ZodiacSign, string> = {
    Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
    Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
    Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
  };
  return map[sign] ?? '⭐';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginTop: 40,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  sectionTitle: {
    color: '#9b59b6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 32,
  },
  zodiacCell: {
    backgroundColor: '#2d2d4e',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  zodiacCellSelected: {
    backgroundColor: '#3d2d5e',
    borderColor: '#9b59b6',
  },
  zodiacEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  zodiacEmojiSelected: {
    fontSize: 26,
  },
  zodiacLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  zodiacLabelSelected: {
    color: '#fff',
  },
  focusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  focusButton: {
    flex: 1,
    backgroundColor: '#2d2d4e',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  focusButtonSelected: {
    backgroundColor: '#3d2d5e',
    borderColor: '#9b59b6',
  },
  focusEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  focusLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  focusLabelSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#3d3d5e',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footerText: {
    color: '#666',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
});
