import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function MirrorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [compliment, setCompliment] = useState<string>('');
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          TalkingMirror needs camera access to show your selfie mirror.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />
      {compliment ? (
        <View style={styles.complimentCard}>
          <Text style={styles.complimentText}>{compliment}</Text>
        </View>
      ) : null}
      <SafeAreaView style={styles.controls}>
        <TouchableOpacity
          style={styles.mirrorButton}
          onPress={() => setCompliment('You are radiant today! ✨')}
        >
          <Text style={styles.mirrorButtonText}>Get Your Daily Compliment</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width,
    height,
    position: 'absolute',
  },
  complimentCard: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(155, 89, 182, 0.85)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  complimentText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  mirrorButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  mirrorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
