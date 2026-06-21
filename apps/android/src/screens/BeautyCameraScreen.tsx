import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useCameraPermission } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-worklets-core';
import BeautyCameraView from '../components/BeautyCameraView';

// 75% defaults — shared value + slider UI agree
const DEFAULT_SMOOTH = 0.75;
const DEFAULT_GLOW = 1.3;

export default function BeautyCameraScreen() {
  const blurIntensity = useSharedValue(DEFAULT_SMOOTH);
  const brightness = useSharedValue(DEFAULT_GLOW);
  const { hasPermission } = useCameraPermission();

  // Slider UI state — drives displayed thumb position.
  // Without this, the Slider's static `value` prop makes the thumb
  // snap back after every drag (React Native community slider quirk).
  const [smoothVal, setSmoothVal] = useState(DEFAULT_SMOOTH);
  const [glowVal, setGlowVal] = useState(DEFAULT_GLOW);

  // Toggle slider panel visibility
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <View style={styles.container}>
      <BeautyCameraView
        blurIntensity={blurIntensity}
        brightness={brightness}
      />

      {/* Toggle icon — always visible when camera is active */}
      {hasPermission && !panelOpen && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setPanelOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleIcon}>⚙️</Text>
        </TouchableOpacity>
      )}

      {/* Slider panel — hidden by default, revealed via toggle */}
      {hasPermission && panelOpen && (
        <View style={styles.panel}>
          {/* Close toggle at top of panel */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
