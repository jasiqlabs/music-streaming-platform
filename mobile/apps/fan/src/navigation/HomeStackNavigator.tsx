import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ArtistScreen from '../screens/ArtistScreen';
import ArtistSubscriptionScreen from '../screens/ArtistSubscriptionScreen';
import ContentPlayerScreen from '../screens/ContentPlayerScreen';
import HomeScreen from '../screens/HomeScreen';
import SeeAllTrendingScreen from '../screens/SeeAllTrendingScreen';
import SubscriptionFlowScreen from '../screens/SubscriptionFlowScreen';
import SeeAllSongsScreen from '../screens/SeeAllSongsScreen';

export type HomeStackParamList = {
  Home: undefined;
  SeeAllSongs: undefined;
  SeeAllTrending: {
    artists?: any[];
  };
  Artist: {
    artistId?: string;
    unlocked?: boolean;
    contentId?: string;
  };
  ArtistScreen: {
    artistId?: string;
    unlocked?: boolean;
    contentId?: string;
  };
  SubscriptionFlow: {
    artistId?: string;
    artistName?: string;
    contentId?: string;
    artwork?: string;
  };
  ContentPlayer: {
    contentId?: string;
  };
  ArtistSubscription: {
    song?: {
      id: string;
      title: string;
      artist: string;
      duration: string;
      thumbnail: string;
      locked: boolean;
    };
    coverImage?: string;
  };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator id="fan-home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="SeeAllSongs"
        component={SeeAllSongsScreen}
        options={{ headerShown: true, title: 'See All' }}
      />
      <Stack.Screen
        name="SeeAllTrending"
        component={SeeAllTrendingScreen}
        options={{ headerShown: true, title: 'Trending Artists' }}
      />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="ArtistScreen" component={ArtistScreen} />
      <Stack.Screen name="ArtistSubscription" component={ArtistSubscriptionScreen} />
      <Stack.Screen name="ContentPlayer" component={ContentPlayerScreen} />
      <Stack.Screen name="SubscriptionFlow" component={SubscriptionFlowScreen} />
    </Stack.Navigator>
  );
}
