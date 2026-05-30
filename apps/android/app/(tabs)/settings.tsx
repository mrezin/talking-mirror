import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { signOut } from '../../src/services/firebase';
import { useUserStore } from '../../src/store/userStore';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');
  const [notifTime, setNotifTime] = useState('8:00 AM');
  const { user, role, setUser } = useUserStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            setUser(null);
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#555', true: '#9b59b6' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#555', true: '#9b59b6' }}
              thumbColor="#fff"
            />
          </View>
          {notificationsEnabled && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row}>
                <Text style={styles.rowLabel}>Notification Time</Text>
                <Text style={styles.rowValue}>{notifTime} ›</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Language</Text>
            <Text style={styles.rowValue}>{language} ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          {user && !user.isAnonymous && (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Signed in as</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{user.email ?? 'Social account'}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          {user?.isAnonymous && (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Mode</Text>
                <Text style={styles.rowValue}>Guest</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Role</Text>
            <Text style={styles.rowValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Manage Subscription</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Restore Purchases</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={styles.rowLabel}>Sign Out</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>0.1.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, letterSpacing: 1 },
  section: { backgroundColor: '#2d2d4e', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { color: '#fff', fontSize: 16 },
  rowValue: { color: '#9b59b6', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#3d3d5e', marginLeft: 16 },
  deleteButton: { margin: 20, marginTop: 30, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e74c3c', alignItems: 'center' },
  deleteButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
});
