import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { useSharedValue } from 'react-native-worklets-core';
import BeautyCameraView from '../../src/components/BeautyCameraView';
import { ComplimentCard, useCompliment, useColorAdvice, useStreak, StreakPill, TimeContextBadge } from '@talking-mirror/shared';

const DEFAULT_SMOOTH = 0.75;
const DEFAULT_GLOW = 1.3;

export default function MirrorScreen() {
  const { compliment, loading: complimentLoading } = useCompliment();
  const { color: colorAdvice, loading: colorLoading } = useColorAdvice();
  const { streak, graceMessage, contextMeta } = useStreak();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  const blurIntensity = useSharedValue(DEFAULT_SMOOTH);
  const brightness = useSharedValue(DEFAULT_GLOW);

  // Slider UI state — prevents thumb snap-back
  const [smoothVal, setSmoothVal] = useState(DEFAULT_SMOOTH);
  const [glowVal, setGlowVal] = useState(DEFAULT_GLOW);

  // Toggle slider panel
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowContent(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 300);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BeautyCameraView
        blurIntensity={blurIntensity}
        brightness={brightness}
      />

      {/* Gear toggle — shows slider panel */}
      {showContent && !panelOpen && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setPanelOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleIcon}>⚙️</Text>
        </TouchableOpacity>
      )}

      {/* Slider panel — hidden by default */}
      {showContent && panelOpen && (
        <View style={styles.panel}>
          <TouchableOpacity
            style={styles.closeToggle}
            onPress={() => setPanelOpen(false)}
            activeOpacity={0.5}
          >
            <Text style={styles.closeIcon}>▼</Text>
          </TouchableOpacity>

          <View style={styles.sliderRow}>
            <Text style={styles.label}>Smooth</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={smoothVal}
              onValueChange={(v: number) => {
                setSmoothVal(v);
                blurIntensity.value = v;
              }}
              minimumTrackTintColor="#9b59b6"
              maximumTrackTintColor="#3d3d5e"
              thumbTintColor="#9b59b6"
            />
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.label}>Glow</Text>
            <Slider
              style={styles.slider}
              minimumValue={1.0}
              maximumValue={1.4}
              step={0.01}
              value={glowVal}
              onValueChange={(v: number) => {
                setGlowVal(v);
                brightness.value = v;
              }}
              minimumTrackTintColor="#9b59b6"
              maximumTrackTintColor="#3d3d5e"
              thumbTintColor="#9b59b6"
            />
          </View>
        </View>
      )}

      {showContent && (
        <>
          <TimeContextBadge
            timeContext={streak.timeContext}
            greeting={contextMeta.greeting}
          />
          <StreakPill streak={streak} graceMessage={graceMessage} />
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <ComplimentCard
              compliment={compliment}
              colorAdvice={colorAdvice}
              loading={complimentLoading || colorLoading}
              timeContext={streak.timeContext}
              graceMessage={graceMessage}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  toggleIcon: {
    fontSize: 22,
  },
  closeToggle: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  closeIcon: {
    color: '#9b59b6',
    fontSize: 18,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.92)',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
