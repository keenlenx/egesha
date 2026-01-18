import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../../constants/config';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: CONFIG.UI.COLORS.PRIMARY,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: 'white',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Park',
          headerTitle: 'KenPark',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mycars"
        options={{
          title: 'My Cars',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />
     
    </Tabs>
  );
}