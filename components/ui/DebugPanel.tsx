import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useProfile } from '@/src/context/ProfileContext';
import { storage } from '@/src/utils/storage';
import { X, Bug, RefreshCw, Trash2, Database, LogOut } from 'lucide-react-native';

/**
 * Debug Panel Component
 * 
 * A developer tool for debugging profile and authentication issues.
 * This component provides visibility into the current state and actions to help troubleshoot.
 */
export function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [showStorage, setShowStorage] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    profile, 
    loading, 
    error, 
    needsProfileCreation, 
    profileExists,
    onboardingCompleted,
    refreshProfile,
    clearError
  } = useProfile();

  const togglePanel = () => {
    setVisible(!visible);
    if (!visible) {
      loadStorageData();
    }
  };

  const loadStorageData = async () => {
    const data = await storage.dumpStorage();
    setStorageData(data);
  };

  const clearStorage = async () => {
    if (confirm('This will clear ALL storage data. Continue?')) {
      await storage.clear();
      await loadStorageData();
    }
  };

  const handleRefreshProfile = async () => {
    await refreshProfile();
    await loadStorageData();
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      setVisible(false);
    }
  };

  // Only show the debug panel in development mode
  if (process.env.NODE_ENV !== 'development' && Platform.OS === 'web') {
    return null;
  }

  return (
    <>
      {/* Debug Button */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={togglePanel}
        activeOpacity={0.8}
      >
        <Bug size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Debug Panel Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>Debug Panel</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              {/* Auth State */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Authentication</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Authenticated:</Text>
                  <Text style={[
                    styles.value, 
                    { color: isAuthenticated ? '#10b981' : '#ef4444' }
                  ]}>
                    {isAuthenticated ? 'Yes' : 'No'}
                  </Text>
                </View>
                {user && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>User ID:</Text>
                      <Text style={styles.value}>{user.userId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Email:</Text>
                      <Text style={styles.value}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Username:</Text>
                      <Text style={styles.value}>{user.userName || 'N/A'}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Profile State */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Loading:</Text>
                  <Text style={styles.value}>{loading ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Profile Exists:</Text>
                  <Text style={[
                    styles.value, 
                    { color: profileExists ? '#10b981' : '#ef4444' }
                  ]}>
                    {profileExists ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Needs Creation:</Text>
                  <Text style={[
                    styles.value, 
                    { color: needsProfileCreation ? '#ef4444' : '#10b981' }
                  ]}>
                    {needsProfileCreation ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Onboarding Done:</Text>
                  <Text style={[
                    styles.value, 
                    { color: onboardingCompleted ? '#10b981' : '#ef4444' }
                  ]}>
                    {onboardingCompleted ? 'Yes' : 'No'}
                  </Text>
                </View>
                {profile && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Profile ID:</Text>
                      <Text style={styles.value}>{profile.userId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Username:</Text>
                      <Text style={styles.value}>{profile.username}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Display Name:</Text>
                      <Text style={styles.value}>{profile.displayName || 'N/A'}</Text>
                    </View>
                  </>
                )}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error:</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>

              {/* Storage Data */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Storage</Text>
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => setShowStorage(!showStorage)}
                  >
                    <Text style={styles.toggleText}>
                      {showStorage ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {showStorage && (
                  <View style={styles.storageData}>
                    {Object.keys(storageData).length === 0 ? (
                      <Text style={styles.emptyText}>No storage data found</Text>
                    ) : (
                      Object.entries(storageData).map(([key, value]) => (
                        <View key={key} style={styles.storageItem}>
                          <Text style={styles.storageKey}>{key}</Text>
                          <Text style={styles.storageValue}>
                            {typeof value === 'object' 
                              ? JSON.stringify(value, null, 2) 
                              : String(value)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.refreshButton]} 
                onPress={handleRefreshProfile}
              >
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.actionText}>Refresh Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.clearButton]} 
                onPress={clearError}
              >
                <X size={16} color="#FFFFFF" />
                <Text style={styles.actionText}>Clear Errors</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.storageButton]} 
                onPress={loadStorageData}
              >
                <Database size={16} color="#FFFFFF" />
                <Text style={styles.actionText}>Refresh Storage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.dangerButton]} 
                onPress={clearStorage}
              >
                <Trash2 size={16} color="#FFFFFF" />
                <Text style={styles.actionText}>Clear Storage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <LogOut size={16} color="#FFFFFF" />
                <Text style={styles.actionText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
    maxHeight: 500,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#1f2937',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#4b5563',
  },
  storageData: {
    marginTop: 8,
  },
  storageItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storageKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 4,
  },
  storageValue: {
    fontSize: 12,
    color: '#1f2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  storageButton: {
    backgroundColor: '#8b5cf6',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  logoutButton: {
    backgroundColor: '#f97316',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});