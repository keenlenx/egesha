import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Park',
          drawerLabel: 'Park',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'History',
          drawerLabel: 'History',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="mycars"
        options={{
          title: 'My Cars',
          drawerLabel: 'My Cars',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}