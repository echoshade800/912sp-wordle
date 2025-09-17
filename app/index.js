/**
 * Home (Dashboard) Screen
 * Purpose: Overview of progress and quick start for next level
 * How to extend: Add more statistics cards, achievements, daily challenges
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ImageBackground, ScrollView, Animated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useGameStore from '../store/gameStore';

const { width } = Dimensions.get('window');

// 游戏规则模态组件
const GameRulesModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.rulesModalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.rulesModal} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* 顶部WORDLE标题 */}
          <View style={styles.modalWordleTitle}>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#D283B8' }]}>
              <Text style={styles.modalLetterText}>W</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#E28B6C' }]}>
              <Text style={styles.modalLetterText}>O</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#4FB0E8' }]}>
              <Text style={styles.modalLetterText}>R</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#8C7CC8' }]}>
              <Text style={styles.modalLetterText}>D</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#91C978' }]}>
              <Text style={styles.modalLetterText}>L</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#F1B544' }]}>
              <Text style={styles.modalLetterText}>E</Text>
            </View>
            <View style={[styles.modalLetterCircle, { backgroundColor: '#E2605C' }]}>
              <Text style={styles.modalLetterText}>!</Text>
            </View>
          </View>

          <ScrollView style={styles.rulesScrollView} showsVerticalScrollIndicator={false}>
            {/* HOW TO PLAY 部分 */}
            <View style={styles.howToPlaySection}>
              <Text style={styles.sectionTitle}>HOW TO PLAY:</Text>
              
              <View style={styles.ruleItem}>
                <View style={styles.ruleNumber}>
                  <Text style={styles.ruleNumberText}>6</Text>
                </View>
                <Text style={styles.ruleDescription}>You have 6 tries to guess the word.</Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleIcon, { backgroundColor: '#91C978' }]}>
                  <Text style={styles.ruleIconText}>Y</Text>
                </View>
                <Text style={styles.ruleDescription}>The colors of the letters will change to show if they are correct</Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleIcon, { backgroundColor: '#F1B544' }]}>
                  <Ionicons name="search" size={16} color="white" />
                </View>
                <Text style={styles.ruleDescription}>Use "Hint" to reveal one correct letter.</Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleIcon, { backgroundColor: '#E2605C' }]}>
                  <Text style={styles.ruleIconText}>?</Text>
                </View>
                <Text style={styles.ruleDescription}>Use "Dart" to remove three incorrect letters.</Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleIcon, { backgroundColor: '#4FB0E8' }]}>
                  <Ionicons name="play-forward" size={16} color="white" />
                </View>
                <Text style={styles.ruleDescription}>Use "Skip" to skip the current word with no penalties.</Text>
              </View>
            </View>

            {/* EXAMPLE 部分 */}
            <View style={styles.exampleSection}>
              <Image
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k5b68m0tfwar0zgke24dqkd7_1758091132_img_0.webp' }}
                style={styles.exampleImage}
                resizeMode="contain"
              />
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function HomeScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const { 
    userData, 
    maxLevel, 
    maxScore, 
    maxTime, 
    coins, 
    currentLevel, 
    storageData 
  } = useGameStore();

  // Animation refs
  const coinsAnimated = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Coins entrance animation
    Animated.timing(coinsAnimated, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [coins]);

  useEffect(() => {
    // Show onboarding if first time user
    if (!storageData || maxLevel === 1) {
      setShowIntro(true);
    } else {
      // Check if user has seen rules before (for existing users)
      const hasSeenRules = storageData?.hasSeenRules;
      if (!hasSeenRules) {
        // Show rules modal for first-time users after intro
        setTimeout(() => {
          setShowRulesModal(true);
        }, 500);
      }
    }
  }, [storageData, maxLevel]);

  const handleInfoPress = () => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      // Haptics not available on web
    }
    setShowRulesModal(true);
  };

  const formatTime = (timeMs) => {
    if (!timeMs) return 'N/A';
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handlePlayPress = () => {
    // Haptic feedback
    try {
      Haptics.selectionAsync();
    } catch (error) {
      // Haptics not available on web
    }
    
    // Button press animation
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    router.push('/game');
  };

  const handleSecondaryPress = (route) => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      // Haptics not available on web
    }
    router.push(route);
  };

  const handleRulesClose = async () => {
    setShowRulesModal(false);
    // Mark that user has seen rules
    try {
      const { setHasSeenRules } = useGameStore.getState();
      if (setHasSeenRules) {
        await setHasSeenRules(true);
      }
    } catch (error) {
      console.log('Error marking rules as seen:', error);
    }
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
    <ImageBackground 
      source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k5bamvpzenf9z12y6af7n40d_1758095669_img_1.webp' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* WORDLE! Title */}
          <View style={styles.wordleTitle}>
            <View style={[styles.letterCircle, { backgroundColor: '#D283B8' }]}>
              <Text style={styles.letterText}>W</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#E28B6C' }]}>
              <Text style={styles.letterText}>O</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#4FB0E8' }]}>
              <Text style={styles.letterText}>R</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#8C7CC8' }]}>
              <Text style={styles.letterText}>D</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#91C978' }]}>
              <Text style={styles.letterText}>L</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#F1B544' }]}>
              <Text style={styles.letterText}>E</Text>
            </View>
            <View style={[styles.letterCircle, { backgroundColor: '#E2605C' }]}>
              <Text style={styles.letterText}>!</Text>
            </View>
          </View>

          {/* Header Row */}
          <View style={styles.header}>
            <Text style={styles.levelText} numberOfLines={1} adjustsFontSizeToFit={true}>Level {currentLevel}</Text>
            <Animated.View 
              style={[
                styles.coinsPill,
                {
                  opacity: coinsAnimated,
                  transform: [{
                    translateY: coinsAnimated.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    })
                  }]
                }
              ]}
            >
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
                style={styles.coinIcon}
              />
              <Text style={styles.coinsText}>{coins}</Text>
            </Animated.View>
          </View>

          {/* Stats Strip */}
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

          {/* Primary CTA */}
          <Animated.View style={[styles.playButtonContainer, { transform: [{ scale: playButtonScale }] }]}>
            <TouchableOpacity 
              onPress={handlePlayPress}
              accessible={true}
              accessibilityLabel={`Play Level ${currentLevel}`}
              accessibilityRole="button"
              style={styles.playButtonTouchable}
            >
              <LinearGradient
                colors={[
                  '#4A8BA0', '#4A8BA0', '#56A3B8', '#56A3B8',
                  '#4A8BA0', '#4A8BA0', '#56A3B8', '#56A3B8',
                  '#4A8BA0', '#4A8BA0', '#56A3B8', '#56A3B8',
                  '#4A8BA0', '#4A8BA0', '#56A3B8', '#56A3B8'
                ]}
                locations={[
                  0, 0.06, 0.07, 0.13, 0.14, 0.20, 0.21, 0.27,
                  0.28, 0.34, 0.35, 0.41, 0.42, 0.48, 0.49, 1
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playButton}
              >
                <Text style={styles.playButtonText}>Play Level {currentLevel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary List */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => handleSecondaryPress('/stats')}
              accessible={true}
              accessibilityLabel="View Stats and History"
              accessibilityRole="button"
            >
              <Ionicons name="bar-chart" size={24} color="#667085" />
              <Text style={styles.secondaryButtonText}>Stats & History</Text>
              <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => handleSecondaryPress('/about')}
              accessible={true}
              accessibilityLabel="About and Help"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle" size={24} color="#667085" />
              <Text style={styles.secondaryButtonText}>About & Help</Text>
              <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleInfoPress} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#98A2B3" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Game Rules Modal */}
      <GameRulesModal 
        visible={showRulesModal} 
        onClose={handleRulesClose} 
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Background
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Intro styles (keeping original for onboarding)
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

  // WORDLE! Title styles
  wordleTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 4,
  },
  letterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  letterText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  // New polished main screen styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
  },
  levelText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333333',
    fontFamily: 'System',
    flex: 1,
    marginRight: 16,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
    minWidth: 100,
    flexShrink: 0,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },

  // Stats strip
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    flexWrap: width < 380 ? 'wrap' : 'nowrap',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#E6E6E6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: width < 380 ? (width - 72) / 2 : 80,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontWeight: 'normal',
  },

  // Primary CTA
  playButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  playButtonTouchable: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  playButton: {
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Secondary list
  secondaryActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 18,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DADADA',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
    fontFamily: 'System',
  },

  // Info button
  infoButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  // Rules Modal Styles
  rulesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rulesModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalWordleTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    gap: 3,
  },
  modalLetterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLetterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  rulesScrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  howToPlaySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ruleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleNumberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleDescription: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  exampleSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  exampleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});