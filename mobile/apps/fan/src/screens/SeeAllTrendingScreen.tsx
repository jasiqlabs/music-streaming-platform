import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

type ArtistCard = {
  id: string;
  name: string;
  subText: string;
  image: string;
  isVerified?: boolean;
  isSubscriptionBased?: boolean;
};

export default function SeeAllTrendingScreen({ navigation, route }: any) {
  const artists: ArtistCard[] = Array.isArray(route?.params?.artists) ? route.params.artists : [];

  const renderItem: ListRenderItem<ArtistCard> = ({ item }) => {
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('Artist', { artistId: item.id })}
      >
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subText} numberOfLines={1}>
          {item.subText}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No trending artists.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  name: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  subText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});
