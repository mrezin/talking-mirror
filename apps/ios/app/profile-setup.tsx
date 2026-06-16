import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileSetupView } from '@talking-mirror/shared';
import type { ZodiacSign, DailyFocus } from '@talking-mirror/shared';
import { saveUserProfile } from '../src/services/firebase';
import { useUserStore } from '@talking-mirror/shared';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [saving, setSaving] = useState(false);

  const handleSave = async (zodiacSign: ZodiacSign, dailyFocus: DailyFocus) => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await saveUserProfile(user.uid, zodiacSign, dailyFocus);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return <ProfileSetupView onSave={handleSave} saving={saving} />;
}
