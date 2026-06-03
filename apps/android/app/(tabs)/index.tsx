import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import MirrorCamera from '../../src/components/MirrorCamera';
import ComplimentCard from '../../src/components/ComplimentCard';
import { useCompliment } from '../../src/hooks/useCompliment';
import { useColorAdvice } from '../../src/hooks/useColorAdvice';

const { width, height } = Dimensions.get('window');

export default function MirrorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { compliment, loading: complimentLoading } = useCompliment();
  const { color: colorAdvice, loading: colorLoading } = useColorAdvice();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  // Dissolve transition on load
  useEffect(() => {
    if (permission?.granted) {
      setTimeout(() => {
        setShowContent(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 300);
    }
  }, [permission?.granted, fadeAnim]);

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

  if (!showContent) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <MirrorCamera cameraRef={cameraRef} blurIntensity={15} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MirrorCamera cameraRef={cameraRef} blurIntensity={15} />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <ComplimentCard
          compliment={compliment}
          colorAdvice={colorAdvice}
          loading={complimentLoading || colorLoading}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
