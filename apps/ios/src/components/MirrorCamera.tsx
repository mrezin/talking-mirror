import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { CameraView } from 'expo-camera';

const { width, height } = Dimensions.get('window');

interface MirrorCameraProps {
  cameraRef: React.RefObject<any>;
  blurIntensity?: number; // kept for backwards compat
}

export default function MirrorCamera({ cameraRef }: MirrorCameraProps) {
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />
      {/* Warmth tint overlay for a subtle glow effect */}
      <View style={styles.warmthOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  camera: {
    width,
    height,
  },
  warmthOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 200, 150, 0.08)',
  },
});
