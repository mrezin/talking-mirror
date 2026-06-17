import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { useSharedValue } from 'react-native-worklets-core';
import BeautyCameraView from '../../src/components/BeautyCameraView';
import { ComplimentCard, useCompliment, useColorAdvice, useStreak, StreakPill, TimeContextBadge } from '@talking-mirror/shared';

export default function MirrorScreen() {
  const { compliment, loading: complimentLoading } = useCompliment();
  const { color: colorAdvice, loading: colorLoading } = useColorAdvice();
  const { streak, graceMessage, contextMeta } = useStreak();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  // Beauty filter shared values (worklet-backed for Skia shader)
  const blurIntensity = useSharedValue(0.5);
  const brightness = useSharedValue(1.15);

  // Dissolve transition on load
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

      {/* Beauty camera with Skia shader — handles its own VisionCamera permission */}
      <BeautyCameraView
        blurIntensity={blurIntensity}
        brightness={brightness}
      />

      {showContent && (
        <>
          {/* Time-of-day badge */}
          <TimeContextBadge
            timeContext={streak.timeContext}
            greeting={contextMeta.greeting}
          />

          {/* Streak pill */}
          <StreakPill streak={streak} graceMessage={graceMessage} />

          {/* Compliment card overlay */}
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <ComplimentCard
              compliment={compliment}
              colorAdvice={colorAdvice}
              loading={complimentLoading || colorLoading}
              timeContext={streak.timeContext}
              graceMessage={graceMessage}
            />
          </Animated.View>

          {/* Bottom slider panel */}
          <Animated.View style={[styles.panel, { opacity: fadeAnim }]}>
            <View style={styles.sliderRow}>
              <Text style={styles.label}>Smooth</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={0.5}
                onValueChange={(v: number) => {
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
                value={1.15}
                onValueChange={(v: number) => {
                  brightness.value = v;
                }}
                minimumTrackTintColor="#9b59b6"
                maximumTrackTintColor="#3d3d5e"
                thumbTintColor="#9b59b6"
              />
            </View>
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
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
