import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
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

export default function BeautyCameraView({
  blurIntensity,
  brightness,
}: BeautyCameraViewProps) {
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const allDevices = useCameraDevices();
  // Track whether we're still waiting for camera enumeration after permission grant
  const [showLoading, setShowLoading] = useState(false);
  const retryCount = useRef(0);

  // Compile Skia shader once — never inside worklet
  const effect = useMemo(() => createBeautyEffect(), []);

  // Frame renderer that renders processed frames to the view
  const frameRenderer = useFrameRenderer();

  // Frame output — receives camera frames on a worklet thread,
  // applies Skia runtime shader, and renders via frameRenderer.
  // pixelFormat: 'yuv' avoids unnecessary RGB conversion on Android.
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame: (frame) => {
      'worklet';

      // Build Skia runtime shader from the compiled effect
      const builder = Skia.RuntimeShaderBuilder(effect);
      builder.setUniform('blurRadius', [blurIntensity.value]);
      builder.setUniform('brightness', [brightness.value]);

      // Create paint with the runtime shader image filter
      const paint = Skia.Paint();
      paint.setImageFilter(
        Skia.ImageFilter.MakeRuntimeShader(builder, null, null),
      );

      // Render frame through the Skia-enhanced pipeline
      frameRenderer.renderFrame(frame);

      // The frame is automatically released by the pipeline after the
      // onFrame callback returns. No explicit dispose needed in v5.
    },
  });

  // When permission is granted but no front camera yet, retry with delay.
  // Camera device enumeration on Android may take a moment after permission grant.
  useEffect(() => {
    if (hasPermission && !device && allDevices.length === 0) {
      setShowLoading(true);
      retryCount.current = 0;
      const interval = setInterval(() => {
        retryCount.current++;
        // Force re-render by bumping state — useCameraDevices will refresh via syncExternalStore
        setShowLoading(prev => prev);
        if (retryCount.current >= 10) {
          clearInterval(interval);
          setShowLoading(false);
        }
      }, 500);
      return () => clearInterval(interval);
    }
    setShowLoading(false);
  }, [hasPermission, device, allDevices.length]);

  // Fallback: if 'front' is unavailable, try ANY camera on devices with a single camera
  const fallbackDevice = useMemo(() => {
    if (device) return device;
    // If we have devices but no front-facing one, fall back to first available
    return allDevices.length > 0 ? allDevices[0] : undefined;
  }, [device, allDevices]);

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
          onPress={canRequestPermission ? requestPermission : () => Linking.openSettings()}
          activeOpacity={canRequestPermission ? 0.7 : 1}
        >
          <Text style={styles.permissionButtonText}>
            {canRequestPermission ? 'Grant Permission' : 'Open Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!fallbackDevice) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{showLoading ? 'Searching for camera...' : 'No camera found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview — drives the frame output pipeline */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={fallbackDevice}
        isActive
        outputs={[frameOutput]}
      />

      {/* Native frame renderer — displays Skia-processed frames */}
      <NativeFrameRendererView
        style={StyleSheet.absoluteFill}
        renderer={frameRenderer}
      />
    </View>
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
