import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
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
  blurIntensity: number;
  brightness: number;
}

export default function BeautyCameraView({
  blurIntensity,
  brightness,
}: BeautyCameraViewProps) {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const device = useCameraDevice('front');
  const allDevices = useCameraDevices();
  const cameraRef = useRef<CameraRef>(null);
  const [framePath, setFramePath] = useState<string | null>(null);
  const lastCaptureRef = useRef<number>(0);
  const capturingRef = useRef<boolean>(false);

  // Periodic frame capture (~5 fps)
  const captureFrame = useCallback(async () => {
    const now = Date.now();
    if (now - lastCaptureRef.current < 180) return;
    if (capturingRef.current) return;
    capturingRef.current = true;
    lastCaptureRef.current = now;

    try {
      const ref = cameraRef.current;
      if (!ref) return;
      const image = await ref.takeSnapshot();
      if (!image) return;
      const path = await image.saveToTemporaryFileAsync('jpg', 25);
      if (path) {
        setFramePath(`file://${path}`);
      }
    } catch {
      // Silently skip failed captures
    } finally {
      capturingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!device) return;
    const interval = setInterval(captureFrame, 200);
    return () => clearInterval(interval);
  }, [device, captureFrame]);

  const skiaImage = useImage(framePath);
  const shader = React.useMemo(
    () => Skia.RuntimeEffect.Make(BEAUTY_SHADER_SRC),
    [],
  );

  // Permission handling
  const handleRequestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          'android.permission.CAMERA',
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          Linking.openSettings();
          return;
        }
      }
      await requestPermission();
    } catch (error) {
      console.warn('Camera permission request failed:', error);
      Linking.openSettings();
    }
  }, [requestPermission]);

  if (!hasPermission && canRequestPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Camera access is required</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestPermission}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>
          Camera permission was denied.{'\n'}
          Grant it in Settings to continue.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device && allDevices.length > 0) {
    return (
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={allDevices[0]}
          isActive
        />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>No camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live camera preview underneath */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
      />

      {/* Skia Canvas overlay — renders the beauty-filtered frame */}
      <View style={styles.canvasOverlay} pointerEvents="none">
        <Canvas style={styles.canvas}>
          {skiaImage && shader && (
            <Fill>
              <Shader
                source={shader}
                uniforms={{ blurRadius: blurIntensity, brightness }}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFill,
  },
  canvas: {
    flex: 1,
  },
});
