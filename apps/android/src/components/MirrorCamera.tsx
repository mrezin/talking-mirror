import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { CameraView } from 'expo-camera';

const { width, height } = Dimensions.get('window');

interface MirrorCameraProps {
  cameraRef: React.RefObject<any>;
  blurIntensity?: number; // kept for backwards compat, no longer used
}

// On web, expo-camera renders a <div> wrapper with a <video> child.
// We inject a style rule scoped to our container's nativeID so only this
// camera video gets the enhancement filter.
//   contrast(1.08)  — slight punch
//   saturate(1.12)  — more vibrant
//   brightness(1.05) — lift exposure
//   sepia(0.02)     — warmth without blur
const CONTAINER_ID = '__mirror-camera-web';
const WEB_FILTER_RULE = `#${CONTAINER_ID} video { filter: contrast(1.08) saturate(1.12) brightness(1.05) sepia(0.02) !important; }`;

function useBeautyStyle() {
  const injected = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || injected.current) return;
    injected.current = true;

    const style = document.createElement('style');
    style.textContent = WEB_FILTER_RULE;
    document.head.appendChild(style);

    return () => { style.remove(); };
  }, []);
}

export default function MirrorCamera({ cameraRef }: MirrorCameraProps) {
  useBeautyStyle();

  return (
    <View nativeID={CONTAINER_ID} style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />
      {/* Warmth overlay only on native; web handles tone via CSS filters */}
      {Platform.OS !== 'web' && <View style={styles.warmthOverlay} />}
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
