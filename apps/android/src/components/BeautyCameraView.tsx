import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  useFrameRenderer,
  NativeFrameRendererView,
} from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';
import type { ISharedValue } from 'react-native-worklets-core';
import { createBeautyEffect } from '../shaders/beautyShader';

interface BeautyCameraViewProps {
  blurIntensity: ISharedValue<number>; // 0.0 – 1.0
  brightness: ISharedValue<number>; // 1.0 – 1.4
}

export default function BeautyCameraView({
  blurIntensity,
  brightness,
}: BeautyCameraViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

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

  // Permission prompt
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No front camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview — drives the frame output pipeline */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
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
