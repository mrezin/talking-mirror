import React, { useCallback } from 'react';
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
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { ISharedValue } from 'react-native-worklets-core';

interface BeautyCameraViewProps {
  blurIntensity: ISharedValue<number>;
  brightness: ISharedValue<number>;
}

export default function BeautyCameraView({
  blurIntensity: _blurIntensity,
  brightness: _brightness,
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
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
      />
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
});
