import React from 'react';
import { StyleSheet } from 'react-native';

import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home as HomeIcon, Library, Search, User } from 'lucide-react-native';

import AccountScreen from '../screens/AccountScreen';
import SearchScreen from '../screens/SearchScreen';
import HomeStackNavigator from './HomeStackNavigator';
import LibraryStackNavigator from './LibraryStackNavigator';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  LibraryTab: undefined;
  AccountTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabsNavigator() {
  return (
    <Tab.Navigator
      id="fan-tabs"
      screenOptions={({ route }): BottomTabNavigationOptions => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarIcon: ({ color, size }) => {
          const iconSize = size ?? 24;
          if (route.name === 'HomeTab') return <HomeIcon color={color} size={iconSize} />;
          if (route.name === 'SearchTab') return <Search color={color} size={iconSize} />;
          if (route.name === 'LibraryTab') return <Library color={color} size={iconSize} />;
          return <User color={color} size={iconSize} />;
        },
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="LibraryTab" component={LibraryStackNavigator} options={{ title: 'Library' }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabBarItem: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});
