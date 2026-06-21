import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
import { useRunOnJS } from 'react-native-worklets-core';
import { createBeautyEffect } from '@talking-mirror/shared';

interface BeautyCameraViewProps {
  blurIntensity: ISharedValue<number>; // 0.0 – 1.0
  brightness: ISharedValue<number>; // 1.0 – 1.4
}

// ─── Camera renderer (only mounted when a device is available) ───

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

  // React state holding the processed Skia image.
  // Updated from the VisionCamera worklet via useRunOnJS(), which
  // hops back to the JS thread to call setState. React re-renders
  // the Canvas children, causing the Skia reconciler to pick up
  // the new image. SharedValues don't work here — they're written
  // from a different JS runtime than the Skia reconciler runs on.
  const [processedFrame, setProcessedFrame] = useState<SkImage | null>(null);
  const setFrameOnJS = useRunOnJS((image: SkImage | null) => {
    setProcessedFrame(image);
  }, []);

  const frameOutput = useFrameOutput({
    // Keep 'native' — we use frame.getNativeBuffer() which is a
    // GPU-side handle (AHardwareBuffer on Android, CVPixelBufferRef
    // on iOS). Skia.Image.MakeImageFromNativeBuffer() consumes it
    // directly without any CPU-side pixel copy.
    pixelFormat: 'native',
    onFrame: (frame) => {
      'worklet';
      try {
        // 1. Verify the frame has a GPU native buffer before proceeding.
        //     Some pixel formats / frame states don't provide one.
        if (!frame.hasNativeBuffer) {
          return;
        }
        const nativeBuffer = frame.getNativeBuffer();
        const sourceImage = Skia.Image.MakeImageFromNativeBuffer(
          nativeBuffer,
        );
        if (!sourceImage) {
          return;
        }

        // 2. Build and apply the beauty runtime shader
        const builder = Skia.RuntimeShaderBuilder(effect);
        builder.setUniform('blurRadius', [blurIntensity.value]);
        builder.setUniform('brightness', [brightness.value]);
        const paint = Skia.Paint();
        paint.setImageFilter(
          Skia.ImageFilter.MakeRuntimeShader(builder, null, null),
        );

        // 3. Render through the shader filter via an offscreen surface.
        //     All operations stay GPU-side via JSI.
        const surface = Skia.Surface.MakeOffscreen(
          frame.width,
          frame.height,
        );
        if (!surface) {
          sourceImage.dispose();
          return;
        }
        const canvas = surface.getCanvas();
        canvas.drawImage(sourceImage, 0, 0, paint);
        // Hop to JS thread → React setState → Canvas re-renders
        setFrameOnJS(surface.makeImageSnapshot());

        // 4. Free GPU resources immediately — don't wait for GC
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
      {/* Skia Canvas overlay — re-renders whenever React
          state changes (triggered from worklet via useRunOnJS) */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Image
          image={processedFrame}
          x={0}
          y={0}
          width={winWidth}
          height={winHeight}
          fit="cover"
        />
      </Canvas>
    </View>
  );
}

// ─── Main view — handles permission + device discovery ───

export default function BeautyCameraView({
  blurIntensity,
  brightness,
}: BeautyCameraViewProps) {
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const allDevices = useCameraDevices();
  const [showLoading, setShowLoading] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const retryCount = useRef(0);
  // Tracks whether Android has permanently denied —
  // VisionCamera may still report canRequestPermission=true
  const [forceOpenSettings, setForceOpenSettings] = useState(false);

  // When permission is granted but no front camera yet, retry with delay.
  // Camera device enumeration on Android may take a moment after permission grant.
  useEffect(() => {
    if (hasPermission && !device && allDevices.length === 0) {
      setShowLoading(true);
      retryCount.current = 0;
      const interval = setInterval(() => {
        retryCount.current++;
        // Force SyncExternalStore to refresh device list
        setShowLoading(prev => true);
        if (retryCount.current >= 10) {
          clearInterval(interval);
          setShowLoading(false);
        }
      }, 500);
      return () => clearInterval(interval);
    }
    setShowLoading(false);
  }, [hasPermission, device, allDevices.length, retryTrigger]);

  // Fallback: if 'front' is unavailable, try ANY camera on devices with a single camera
  const fallbackDevice = useMemo(() => {
    if (device) return device;
    return allDevices.length > 0 ? allDevices[0] : undefined;
  }, [device, allDevices]);

  // Request camera permission.
  // On Android we use PermissionsAndroid — it reliably shows the native
  // system dialog. VisionCamera's v5 Nitro-based requestPermission() does
  // not trigger the dialog in Expo-managed Android workflows and is used
  // ONLY to sync the hook's internal state after a grant.
  const handleRequestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          'android.permission.CAMERA',
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          // Dialog showed, user granted — sync VisionCamera hook state
          await requestPermission();
          return;
        }
        // DENIED or NEVER_ASK_AGAIN — either way the dialog is done.
        // VisionCamera's requestPermission() won't show a dialog either,
        // so surface the Settings fallback immediately.
        setForceOpenSettings(true);
        return;
      }
      // iOS path — VisionCamera's requestPermission() handles the dialog
      const granted = await requestPermission();
      if (!granted) {
        setForceOpenSettings(true);
      }
    } catch (error) {
      console.warn('Camera permission request failed:', error);
      setForceOpenSettings(true);
    }
  }, [requestPermission]);

  // Permission prompt
  if (!hasPermission) {
    const showSettings = forceOpenSettings || !canRequestPermission;
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {showSettings
            ? 'Camera permission was denied.\nGrant it in Settings to continue.'
            : 'Camera access is required'}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={showSettings ? () => Linking.openSettings() : handleRequestPermission}
          activeOpacity={showSettings ? 1 : 0.7}
        >
          <Text style={styles.permissionButtonText}>
            {showSettings ? 'Open Settings' : 'Grant Permission'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No device — show status, loop retry until one appears (or gives up)
  if (!fallbackDevice) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {showLoading ? 'Searching for camera...' : 'No camera found'}
        </Text>
        {!showLoading && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              setRetryTrigger(c => c + 1);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Device available — mount camera renderer (hooks only run when device exists)
  return (
    <CameraRenderer
      blurIntensity={blurIntensity}
      brightness={brightness}
      device={fallbackDevice}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
