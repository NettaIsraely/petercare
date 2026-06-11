import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Define the shape of our Horse data based on your backend
interface Horse {
  id: string;
  name: string;
  last_shoeing_date?: string;
  color_type?: 'brown' | 'black' | 'cream'; 
}

// We simplified this! The card stays white, we only change the icon color.
// Note: We made the 'cream' a bit more golden so it doesn't vanish against a white background!
const ICON_COLORS = {
  brown: '#8D6E63', 
  black: '#2C3E50', // A soft, dark slate instead of pitch black
  cream: '#F4D03F', 
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  // --- STATE ---
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- FUNCTIONS ---
  
  useEffect(() => {
    fetchHorses();
  }, []);

  const fetchHorses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/horses');
      setHorses(response.data);
    } catch (err: any) {
      console.error('Error fetching horses:', err);
      setError('Failed to load horses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // --- RENDERERS ---

  const renderHorseCard = ({ item, index }: { item: Horse; index: number }) => {
    // Determine the color: use backend value if provided, otherwise cycle through them
    const colorKeys: ('brown' | 'black' | 'cream')[] = ['brown', 'black', 'cream'];
    const chosenColorKey = item.color_type || colorKeys[index % colorKeys.length];
    
    // Grab the specific hex code for our icon
    const iconColor = ICON_COLORS[chosenColorKey];

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Text is always the same readable color for every card */}
          <Text style={styles.horseName}>{item.name}</Text>
          {item.last_shoeing_date ? (
            <Text style={styles.horseDetail}>
              Last Shoeing: {new Date(item.last_shoeing_date).toLocaleDateString()}
            </Text>
          ) : (
            <Text style={styles.horseDetail}>
              No shoeing date recorded
            </Text>
          )}
        </View>

        {/* Just the horse head, beautifully colored! */}
        <View style={styles.iconContainer}>
          <FontAwesome5 name="horse-head" size={36} color={iconColor} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello {user?.name ?? 'there'}</Text>
          <Text style={styles.title}>The Stable</Text>
          <Text style={styles.subtitle}>Your active horses</Text>
          {user?.role ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Section */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Saddling up...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHorses}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : horses.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>The stable is currently empty.</Text>
        </View>
      ) : (
        <FlatList
          data={horses}
          keyExtractor={(item) => item.id}
          renderItem={renderHorseCard}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={fetchHorses}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  greeting: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2980B9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row', 
    backgroundColor: 'white', // The card is ALWAYS white now
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1, 
  },
  horseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50', // Unified dark text
    marginBottom: 4,
  },
  horseDetail: {
    fontSize: 14,
    color: '#7F8C8D', // Unified sub-text
  },
  iconContainer: {
    marginLeft: 10,
    opacity: 0.9, 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
    fontSize: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    color: '#7F8C8D',
    fontSize: 18,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});