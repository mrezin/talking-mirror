import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface MirrorCameraProps {
  cameraRef: React.RefObject<any>;
  blurIntensity?: number; // iOS ~20, Android ~15
}

export default function MirrorCamera({ cameraRef, blurIntensity = 20 }: MirrorCameraProps) {
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />
      {/* Beauty filter overlay: subtle blur + warmth tint */}
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={styles.blurOverlay}
      />
      <View style={styles.warmthOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  camera: {
    width,
    height,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  warmthOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 200, 150, 0.08)', // subtle warmth
  },
});
