import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

type HistoryEntry = {
  id: string;
  date: string;
  compliment: string;
  color: string;
  isFavorite: boolean;
};

const MOCK_HISTORY: HistoryEntry[] = [
  { id: '1', date: 'Today', compliment: 'You are radiant today! ✨', color: '#9b59b6', isFavorite: true },
  { id: '2', date: 'Yesterday', compliment: 'Your smile lights up every room. 😊', color: '#e74c3c', isFavorite: false },
  { id: '3', date: '2 days ago', compliment: 'Confidence looks beautiful on you. 💖', color: '#3498db', isFavorite: true },
];

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>(MOCK_HISTORY);

  const toggleFavorite = (id: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View style={[styles.card, { borderLeftColor: item.color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Text style={styles.heartIcon}>{item.isFavorite ? '♥️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.complimentText}>{item.compliment}</Text>
      <View style={[styles.colorBadge, { backgroundColor: item.color }]}>
        <Text style={styles.colorText}>Lucky Color</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Mirror History</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#2d2d4e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    color: '#aaa',
    fontSize: 12,
  },
  heartIcon: {
    fontSize: 18,
  },
  complimentText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  colorBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  colorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
