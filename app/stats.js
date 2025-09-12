/**
 * Stats & History Screen
 * Purpose: View past performance and game statistics
 * How to extend: Add charts, achievements, leaderboards, export data
 */

import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';

export default function StatsScreen() {
  const { 
    maxLevel, 
    maxScore, 
    maxTime, 
    gameHistory, 
    coins 
  } = useGameStore();

  const formatTime = (timeMs) => {
    if (!timeMs) return 'N/A';
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getWinRate = () => {
    if (gameHistory.length === 0) return 0;
    const wins = gameHistory.filter(game => game.isWon).length;
    return Math.round((wins / gameHistory.length) * 100);
  };

  const getAverageAttempts = () => {
    const wonGames = gameHistory.filter(game => game.isWon);
    if (wonGames.length === 0) return 0;
    const totalAttempts = wonGames.reduce((sum, game) => sum + (game.attempts + 1), 0);
    return (totalAttempts / wonGames.length).toFixed(1);
  };

  const renderGameItem = ({ item }) => (
    <View style={styles.gameItem}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameLevel}>Level {item.level}</Text>
        <Text style={[
          styles.gameResult, 
          { color: item.isWon ? '#6aaa64' : '#ff4444' }
        ]}>
          {item.isWon ? 'WON' : 'LOST'}
        </Text>
      </View>
      <View style={styles.gameDetails}>
        <Text style={styles.gameDetail}>
          Attempts: {item.isWon ? item.attempts + 1 : 6}/6
        </Text>
        <Text style={styles.gameDetail}>
          Time: {formatTime(item.completionTime)}
        </Text>
        <Text style={styles.gameDetail}>
          Score: {item.score}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stats & History</Text>
        <View style={styles.coinsInfo}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{maxLevel}</Text>
            <Text style={styles.statLabel}>Max Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{maxScore}</Text>
            <Text style={styles.statLabel}>Max Score</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(maxTime)}</Text>
            <Text style={styles.statLabel}>Best Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getWinRate()}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{gameHistory.length}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getAverageAttempts()}</Text>
            <Text style={styles.statLabel}>Avg. Attempts</Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {gameHistory.length > 0 ? (
          <FlatList
            data={gameHistory}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderGameItem}
            showsVerticalScrollIndicator={false}
            style={styles.historyList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No games played yet</Text>
            <Text style={styles.emptySubtext}>Start playing to see your history here</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  coinsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryStats: {
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  historyList: {
    flex: 1,
  },
  gameItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gameResult: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameDetail: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});