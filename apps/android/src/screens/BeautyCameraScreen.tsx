import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useCameraPermission } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-worklets-core';
import BeautyCameraView from '../components/BeautyCameraView';

export default function BeautyCameraScreen() {
  const blurIntensity = useSharedValue(0.5);
  const brightness = useSharedValue(1.15);
  const { hasPermission } = useCameraPermission();

  return (
    <View style={styles.container}>
      <BeautyCameraView
        blurIntensity={blurIntensity}
        brightness={brightness}
      />

      {/* Bottom control panel — only show when camera is active */}
      {hasPermission && (
      <View style={styles.panel}>
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
