import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Camera,
  type CameraDevice,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { Canvas, Image, Skia, type SkImage } from '@shopify/react-native-skia';
import type { ISharedValue } from 'react-native-worklets-core';
import { useSharedValue } from 'react-native-worklets-core';
import { createBeautyEffect } from '@talking-mirror/shared';

interface BeautyCameraViewProps {
  blurIntensity: ISharedValue<number>;
  brightness: ISharedValue<number>;
}

// ─── Camera renderer — beauty shader + Skia Canvas overlay ───

interface CameraRendererProps {
  blurIntensity: ISharedValue<number>;
  brightness: ISharedValue<number>;
  device: CameraDevice;
}

function CameraRenderer({
  blurIntensity,
  brightness,
  device,
}: CameraRendererProps) {
  const effect = useMemo(() => createBeautyEffect(), []);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  // SharedValue for writing from VisionCamera worklet
  const processedFrame = useSharedValue<SkImage | null>(null);

  // React state for display — RAF loop polls the SV and calls setState.
  // React re-render → Skia reconciler processes new <Image> → Canvas redraws.
  const [displayFrame, setDisplayFrame] = useState<SkImage | null>(null);

  // ── RAF poll: read shared value from JS thread, set React state ──
  const lastFrameRef = useRef<SkImage | null>(null);
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const current = processedFrame.value;
      if (current !== lastFrameRef.current) {
        lastFrameRef.current = current;
        setDisplayFrame(current);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }, [processedFrame]);

  // ── GPU pipeline: runs in VisionCamera's worklet thread ──
  const frameOutput = useFrameOutput({
    pixelFormat: 'native',
    onFrame: (frame) => {
      'worklet';
      try {
        if (!frame.hasNativeBuffer) {
          return;
        }
        const sourceImage = Skia.Image.MakeImageFromNativeBuffer(
          frame.getNativeBuffer(),
        );
        if (!sourceImage) {
          return;
        }

        // Apply beauty shader
        const builder = Skia.RuntimeShaderBuilder(effect);
        builder.setUniform('blurRadius', [blurIntensity.value]);
        builder.setUniform('brightness', [brightness.value]);
        const paint = Skia.Paint();
        paint.setImageFilter(
          Skia.ImageFilter.MakeRuntimeShader(builder, null, null),
        );

        const surface = Skia.Surface.MakeOffscreen(
          frame.width,
          frame.height,
        );
        if (!surface) {
          sourceImage.dispose();
          return;
        }
        surface.getCanvas().drawImage(sourceImage, 0, 0, paint);
        processedFrame.value = surface.makeImageSnapshot();

        surface.dispose();
        sourceImage.dispose();
      } finally {
        frame.dispose();
      }
    },
  });

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        outputs={[frameOutput]}
      />
      <Canvas style={StyleSheet.absoluteFill}>
        {displayFrame && (
          <Image
            image={displayFrame}
            x={0}
            y={0}
            width={winWidth}
            height={winHeight}
            fit="cover"
          />
        )}
      </Canvas>
    </View>
  );
}

// ─── Main view — handles permission + device discovery ───

export default function BeautyCameraView({
  blurIntensity,
  brightness,
}: BeautyCameraViewProps) {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const device = useCameraDevice('front');
  const allDevices = useCameraDevices();

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
    <CameraRenderer
      blurIntensity={blurIntensity}
      brightness={brightness}
      device={device}
    />
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
});
