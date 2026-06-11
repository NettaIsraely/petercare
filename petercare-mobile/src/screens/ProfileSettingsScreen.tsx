import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileSettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      <Text style={styles.subtitle}>Full settings form coming in Step 7</Text>

      <View style={styles.infoCard}>
        <Text style={[styles.label, styles.firstLabel]}>Name</Text>
        <Text style={styles.value}>{user?.name ?? '—'}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role ?? '—'}</Text>

        <Text style={styles.label}>User ID</Text>
        <Text style={styles.valueSmall}>{user?.userId ?? '—'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  firstLabel: {
    marginTop: 0,
  },
  value: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 14,
    color: '#2C3E50',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
