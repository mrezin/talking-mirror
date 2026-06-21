import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  type CameraDevice,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
  useFrameRenderer,
  NativeFrameRendererView,
} from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';
import type { ISharedValue } from 'react-native-worklets-core';
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
  const frameRenderer = useFrameRenderer();

  const frameOutput = useFrameOutput({
    pixelFormat: 'unknown', // avoid 'yuv' crashes on devices without YUV support
    onFrame: (frame) => {
      'worklet';
      const builder = Skia.RuntimeShaderBuilder(effect);
      builder.setUniform('blurRadius', [blurIntensity.value]);
      builder.setUniform('brightness', [brightness.value]);
      const paint = Skia.Paint();
      paint.setImageFilter(
        Skia.ImageFilter.MakeRuntimeShader(builder, null, null),
      );
      frameRenderer.renderFrame(frame);
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
      <NativeFrameRendererView
        style={StyleSheet.absoluteFill}
        renderer={frameRenderer}
      />
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
  // On Android we use PermissionsAndroid first — it reliably shows the
  // native system dialog. VisionCamera's v5 Nitro-based requestPermission()
  // may not trigger the dialog in all Expo/android configurations.
  // The hook is still used for status tracking (hasPermission/canRequestPermission).
  const handleRequestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request('android.permission.CAMERA');
      }
      // Also call VisionCamera's API to update the hook's internal state
      await requestPermission();
    } catch (error) {
      console.warn('Camera permission request failed:', error);
    }
  }, [requestPermission]);

  // Permission prompt
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {canRequestPermission
            ? 'Camera access is required'
            : 'Camera permission was denied.\nGrant it in Settings to continue.'}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={canRequestPermission ? handleRequestPermission : () => Linking.openSettings()}
          activeOpacity={canRequestPermission ? 0.7 : 1}
        >
          <Text style={styles.permissionButtonText}>
            {canRequestPermission ? 'Grant Permission' : 'Open Settings'}
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
