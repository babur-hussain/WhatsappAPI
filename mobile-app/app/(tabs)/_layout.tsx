import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  // Initialize push notifications
  usePushNotifications();

  useEffect(() => {
      const interval = setInterval(async () => {
          try {
              const cached = await AsyncStorage.getItem('offline_conversations');
              if (cached) {
                  const parsed = JSON.parse(cached);
                  const count = parsed.filter((l: any) => l.unreadCount > 0).length;
                  setUnreadTotal(count);
              }
          } catch (e) {
              // ignore
          }
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#f1f5f9',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
            paddingBottom: Platform.OS === 'ios' ? 25 : insets.bottom + 10,
            paddingTop: 10,
            elevation: 0, // Remove shadow on Android
        },
        tabBarActiveTintColor: '#111B21',
        tabBarInactiveTintColor: '#54656F',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
          marginTop: 4,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused, color }) => (
            <View className={`w-16 h-8 rounded-full items-center justify-center ${focused ? 'bg-[#D8FDD2]' : 'bg-transparent'}`}>
              <MaterialCommunityIcons name={focused ? 'message-text' : 'message-text-outline'} size={24} color={focused ? '#111B21' : '#54656F'} />
              {unreadTotal > 0 && (
                <View className="absolute top-[-2px] right-2 bg-[#25D366] rounded-full min-w-[18px] h-[18px] items-center justify-center border-2 border-white">
                  <Text className="text-white text-[10px] font-bold">{unreadTotal}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ focused, color }) => (
            <View className={`w-16 h-8 rounded-full items-center justify-center ${focused ? 'bg-[#D8FDD2]' : 'bg-transparent'}`}>
                <Ionicons name={focused ? 'aperture' : 'aperture-outline'} size={24} color={focused ? '#111B21' : '#54656F'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <View className={`w-16 h-8 rounded-full items-center justify-center ${focused ? 'bg-[#D8FDD2]' : 'bg-transparent'}`}>
                <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={focused ? '#111B21' : '#54656F'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused, color }) => (
            <View className={`w-16 h-8 rounded-full items-center justify-center ${focused ? 'bg-[#D8FDD2]' : 'bg-transparent'}`}>
                <Ionicons name={focused ? 'call' : 'call-outline'} size={24} color={focused ? '#111B21' : '#54656F'} />
            </View>
          ),
        }}
      />
      {/* Hide the default two screen if it exists */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
