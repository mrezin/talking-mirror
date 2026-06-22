import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import BeautyCameraView from '../components/BeautyCameraView';

/**
 * Beauty camera screen for iOS — Expo CameraView + Skia beauty filter.
 * Two sliders: Smooth (blur radius 0–1) and Glow (brightness 1.0–1.4).
 */
export default function BeautyCameraScreen() {
  const [smooth, setSmooth] = useState(0.5);
  const [glow, setGlow] = useState(1.15);

  return (
    <View style={styles.container}>
      <BeautyCameraView smooth={smooth} glow={glow} />

      {/* Bottom control panel */}
      <View style={styles.panel}>
        <View style={styles.sliderRow}>
          <Text style={styles.label}>Smooth</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={smooth}
            onValueChange={(v: number) => setSmooth(v)}
            minimumTrackTintColor="#9b59b6"
            maximumTrackTintColor="#3d3d5e"
            thumbTintColor="#9b59b6"
          />
          <Text style={styles.value}>{smooth.toFixed(2)}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.label}>Glow</Text>
          <Slider
            style={styles.slider}
            minimumValue={1.0}
            maximumValue={1.4}
            step={0.01}
            value={glow}
            onValueChange={(v: number) => setGlow(v)}
            minimumTrackTintColor="#9b59b6"
            maximumTrackTintColor="#3d3d5e"
            thumbTintColor="#9b59b6"
          />
          <Text style={styles.value}>{glow.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  value: {
    color: '#F8F8FF',
    fontSize: 14,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
