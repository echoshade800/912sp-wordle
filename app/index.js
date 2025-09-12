/**
 * Home (Dashboard) Screen
 * Purpose: Overview of progress and quick start for next level
 * How to extend: Add more statistics cards, achievements, daily challenges
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';

export default function HomeScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const { 
    userData, 
    maxLevel, 
    maxScore, 
    maxTime, 
    coins, 
    currentLevel, 
    storageData 
  } = useGameStore();

  useEffect(() => {
    // Show onboarding if first time user
    if (!storageData || maxLevel === 1) {
      setShowIntro(true);
    }
  }, [storageData, maxLevel]);

  const handleInfoPress = () => {
    Alert.alert(
      'Wordle Mini',
      'Guess 5-letter English words level by level, earn coins and use boosters!\n\n🟩 Green: Correct letter in correct position\n🟨 Yellow: Correct letter in wrong position\n⬜ Gray: Letter not in word',
      [{ text: 'Got it!' }]
    );
  };

  const formatTime = (timeMs) => {
    if (!timeMs) return 'N/A';
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (showIntro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.introContainer}>
          <Text style={styles.welcomeTitle}>Welcome to Wordle Mini! 🎯</Text>
          <Text style={styles.welcomeText}>
            Guess 5-letter English words level by level, earn coins and use boosters!
          </Text>
          <View style={styles.rulesContainer}>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#6aaa64' }]} />
              <Text style={styles.ruleText}>Green: Correct letter, correct position</Text>
            </View>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#c9b458' }]} />
              <Text style={styles.ruleText}>Yellow: Correct letter, wrong position</Text>
            </View>
            <View style={styles.rule}>
              <View style={[styles.tileExample, { backgroundColor: '#787c7e' }]} />
              <Text style={styles.ruleText}>Gray: Letter not in word</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => setShowIntro(false)}
          >
            <Text style={styles.startButtonText}>Get Started</Text>
          </TouchableOpacity>
          <Link href="/about" asChild>
            <TouchableOpacity style={styles.privacyLink}>
              <Text style={styles.privacyText}>Privacy & Help</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <TouchableOpacity onPress={handleInfoPress}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.coinsInfo}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{maxLevel}</Text>
          <Text style={styles.statLabel}>Max Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{maxScore}</Text>
          <Text style={styles.statLabel}>Max Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(maxTime)}</Text>
          <Text style={styles.statLabel}>Best Time</Text>
        </View>
      </View>

      <View style={styles.mainActions}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => router.push('/game')}
        >
          <Text style={styles.playButtonText}>Play Level {currentLevel}</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/stats')}
          >
            <Ionicons name="bar-chart" size={24} color="#666" />
            <Text style={styles.secondaryButtonText}>Stats & History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/about')}
          >
            <Ionicons name="help-circle" size={24} color="#666" />
            <Text style={styles.secondaryButtonText}>About & Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  introContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  rulesContainer: {
    marginBottom: 40,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileExample: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
  },
  ruleText: {
    fontSize: 16,
    color: '#333',
  },
  startButton: {
    backgroundColor: '#6aaa64',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyLink: {
    padding: 8,
  },
  privacyText: {
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  coinsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mainActions: {
    padding: 20,
    flex: 1,
  },
  playButton: {
    backgroundColor: '#6aaa64',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  secondaryActions: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});