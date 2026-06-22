import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import {
  Canvas,
  Fill,
  Shader,
  ImageShader,
  useImage,
  Skia,
} from '@shopify/react-native-skia';
import { BEAUTY_SHADER_SRC } from '@talking-mirror/shared';

interface BeautyCameraViewProps {
  smooth: number; // 0.0 – 1.0 (blur radius)
  glow: number; // 1.0 – 1.4 (brightness)
}

/**
 * iOS beauty camera using Expo CameraView + Skia Canvas overlay.
 *
 * MVP approach: periodic snapshots from CameraView are processed through
 * Skia RuntimeShader (same BEAUTY_SHADER_SRC as Android) and rendered
 * as a full-screen overlay that replaces the raw camera preview.
 */
export default function BeautyCameraView({
  smooth,
  glow,
}: BeautyCameraViewProps) {
  const cameraRef = useRef<CameraView>(null);
  const [base64Frame, setBase64Frame] = useState<string | null>(null);
  const lastCaptureRef = useRef<number>(0);

  // Periodic frame capture (~5 fps for MVP)
  const captureFrame = useCallback(async () => {
    const now = Date.now();
    // Throttle to avoid overwhelming the camera API
    if (now - lastCaptureRef.current < 180) return;
    lastCaptureRef.current = now;

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.25,
          skipProcessing: true,
        });
        if (photo?.base64) {
          setBase64Frame(`data:image/jpeg;base64,${photo.base64}`);
        }
      }
    } catch {
      // Silently skip failed captures (camera may be busy)
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(captureFrame, 200);
    return () => clearInterval(interval);
  }, [captureFrame]);

  // Load the captured frame as a Skia image
  const skiaImage = useImage(base64Frame);

  // Compile the shader once
  const shader = React.useMemo(
    () => Skia.RuntimeEffect.Make(BEAUTY_SHADER_SRC),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Live camera preview underneath */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />

      {/* Skia Canvas overlay — renders the beauty-filtered frame */}
      <View style={styles.canvasOverlay} pointerEvents="none">
        <Canvas style={styles.canvas}>
          {skiaImage && shader && (
            <Fill>
              <Shader
                source={shader}
                uniforms={{ blurRadius: smooth, brightness: glow, image: null } as any}
              >
                <ImageShader image={skiaImage} fit="fill" />
              </Shader>
            </Fill>
          )}
        </Canvas>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFill,
  },
  canvas: {
    flex: 1,
  },
});
