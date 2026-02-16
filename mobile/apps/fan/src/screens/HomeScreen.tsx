import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Home as HomeIcon, Library, User, Play, Pause, FastForward } from 'lucide-react-native';
import { apiV1 } from '../services/api'; // Axios instance assume kar raha hoon

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [trendingArtists, setTrendingArtists] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend calls using axios (apiV1)
      const [contentRes, artistsRes] = await Promise.all([
        apiV1.get('v1/content'),
        apiV1.get('v1/artists')
      ]);

      setContent(contentRes.data?.items || []);
      setTrendingArtists(artistsRes.data?.artists || []);
      
      if (contentRes.data?.items?.length > 0) {
        setCurrentSong(contentRes.data.items[0]);
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSeeAll = () => {
    // Navigation with 'latest' filter for artists/logs
    navigation.navigate('SeeAllSongs', { filter: 'latest' });
  };

  const renderFeaturedCard = ({ item }) => (
    <Pressable style={styles.featuredCard} onPress={() => setCurrentSong(item)}>
      <Image source={{ uri: item.artwork || 'https://via.placeholder.com/300' }} style={styles.featuredImg} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featuredOverlay}>
        <Text style={styles.featuredArtistName}>{item.artistName || 'Luna Ray'}</Text>
        {item.locked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>LOCKED EARLY ACCESS</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#FF4500" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}></Text>
          <Pressable><Search color="#fff" size={24} /></Pressable>
        </View>

        {/* Featured Slider */}
        <FlatList
          data={content.slice(0, 3)}
          horizontal
          renderItem={renderFeaturedCard}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.75 + 20}
          decelerationRate="fast"
          contentContainerStyle={{ paddingLeft: 20 }}
        />

        {/* Trending Artists Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Artists</Text>
          <Pressable onPress={onSeeAll}><Text style={styles.seeAll}>See All {'>'}</Text></Pressable>
        </View>

        <FlatList
          data={trendingArtists}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20 }}
          renderItem={({ item }) => (
            <View style={styles.artistCard}>
              <Image source={{ uri: item.banner || 'https://via.placeholder.com/100' }} style={styles.artistImg} />
              <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.artistSubText}>Artist</Text>
            </View>
          )}
        />

        {/* Secondary Trending Grid */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 25 }]}>Trending Artists</Text>
        <View style={styles.gridContainer}>
          {content.slice(3, 9).map((item) => (
            <Pressable key={item.id} style={styles.gridItem} onPress={() => setCurrentSong(item)}>
              <Image source={{ uri: item.artwork }} style={styles.gridImg} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Mini Player */}
      {currentSong && (
        <BlurPlayer song={currentSong} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      )}

      {/* Footer Tab Bar */}
      <View style={styles.footer}>
        <TabItem icon={HomeIcon} label="Home" active={activeTab === 'Home'} onPress={() => setActiveTab('Home')} />
        <TabItem icon={Search} label="Search" active={activeTab === 'Search'} onPress={() => setActiveTab('Search')} />
        <TabItem icon={Library} label="Library" active={activeTab === 'Library'} onPress={() => setActiveTab('Library')} />
        <TabItem icon={User} label="Account" active={activeTab === 'Account'} onPress={() => setActiveTab('Account')} />
      </View>
    </SafeAreaView>
  );
}

const BlurPlayer = ({ song, isPlaying, setIsPlaying }) => (
  <View style={styles.miniPlayer}>
    <Image source={{ uri: song.artwork }} style={styles.miniPlayerImg} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.miniSongTitle}>{song.title}</Text>
      <Text style={styles.miniArtistName}>{song.artistName || 'Unknown'}</Text>
      <View style={styles.progressBar}><View style={styles.progressFill} /></View>
    </View>
    <View style={styles.miniControls}>
      <Pressable onPress={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? <Pause color="#fff" fill="#fff" size={24} /> : <Play color="#fff" fill="#fff" size={24} />}
      </Pressable>
      <FastForward color="#fff" fill="#fff" size={24} style={{ marginLeft: 15 }} />
    </View>
  </View>
);

const TabItem = ({ icon: Icon, label, active, onPress }) => (
  <Pressable style={styles.tabItem} onPress={onPress}>
    <Icon color={active ? '#fff' : '#666'} size={24} />
    <Text style={[styles.tabLabel, { color: active ? '#fff' : '#666' }]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  featuredCard: { width: width * 0.75, height: 200, borderRadius: 20, overflow: 'hidden', marginRight: 15 },
  featuredImg: { width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 15 },
  featuredArtistName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  lockedBadge: { backgroundColor: '#8B4513', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, alignSelf: 'flex-start', marginTop: 5 },
  lockedText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: '#888', fontSize: 14 },
  artistCard: { width: 100, marginRight: 15, alignItems: 'center' },
  artistImg: { width: 100, height: 100, borderRadius: 15 },
  artistName: { color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '600' },
  artistSubText: { color: '#666', fontSize: 12 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  gridItem: { width: '31%', aspectRatio: 1, marginBottom: 10, borderRadius: 10, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  miniPlayer: { position: 'absolute', bottom: 85, left: 15, right: 15, height: 70, backgroundColor: 'rgba(30,30,30,0.95)', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#333' },
  miniPlayerImg: { width: 50, height: 50, borderRadius: 8 },
  miniSongTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  miniArtistName: { color: '#888', fontSize: 12 },
  progressBar: { height: 2, backgroundColor: '#444', marginTop: 8, borderRadius: 1 },
  progressFill: { width: '40%', height: '100%', backgroundColor: '#fff' },
  miniControls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  footer: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#222', paddingBottom: 10 },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});