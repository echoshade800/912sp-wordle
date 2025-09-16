/**
 * Game Screen - Core Wordle gameplay
 * Purpose: Main game logic, grid display, keyboard input, boosters
 * How to extend: Add more boosters, animations, sound effects, multiplayer
 */

import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  Animated, 
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GameScreen() {
  const { 
    currentLevel, 
    coins, 
    completeGame, 
    useBooster,
    settings 
  } = useGameStore();

  // Game state
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Booster states
  const [dartUsed, setDartUsed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [removedLetters, setRemovedLetters] = useState(new Set());
  const [hintLetters, setHintLetters] = useState(new Set());

  // Animation states
  const [showGreat, setShowGreat] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const greatAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // Initialize game
  const initializeGame = () => {
    const word = getRandomWord();
    setTargetWord(word);
    setGuesses(Array(6).fill(''));
    setCurrentRow(0);
    setCurrentGuess('');
    setGameStatus('playing');
    setIsSubmitting(false);
    setStartTime(Date.now());
    setPendingLevelUp(false);
    setEarnedCoins(0);
    setShowRewardModal(false);
    setDartUsed(false);
    setHintUsed(false);
    setRemovedLetters(new Set());
    setHintLetters(new Set());
    setShowGreat(false);
    setShowConfetti(false);
    greatAnimation.setValue(0);
    confettiAnimations.forEach(anim => {
      anim.x.setValue(Math.random() * screenWidth);
      anim.y.setValue(-50);
      anim.rotation.setValue(0);
    });
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Get background gradient based on level
  const getBackgroundGradient = () => {
    const colors = [
      ['#667eea', '#764ba2'], // Level 1-5: Purple-Blue
      ['#f093fb', '#f5576c'], // Level 6-10: Pink-Red
      ['#4facfe', '#00f2fe'], // Level 11-15: Blue-Cyan
      ['#43e97b', '#38f9d7'], // Level 16-20: Green-Teal
      ['#fa709a', '#fee140'], // Level 21-25: Pink-Yellow
      ['#a8edea', '#fed6e3'], // Level 26-30: Mint-Pink
      ['#ff9a9e', '#fecfef'], // Level 31-35: Coral-Pink
      ['#ffecd2', '#fcb69f'], // Level 36-40: Peach
    ];
    
    const index = Math.floor((currentLevel - 1) / 5) % colors.length;
    return colors[index];
  };

  // Handle keyboard input
  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing' || isSubmitting) return;

    if (key === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      handleGuess();
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  // Handle guess submission
  const handleGuess = async () => {
    if (currentGuess.length !== 5) {
      Alert.alert('Invalid guess', 'Please enter a 5-letter word');
      return;
    }

    if (!isValidWord(currentGuess)) {
      Alert.alert('Invalid word', 'Please enter a valid English word');
      return;
    }

    setIsSubmitting(true);

    // Update guesses array
    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    // Check if guess is correct
    if (currentGuess.toUpperCase() === targetWord) {
      setGameStatus('won');
      
      // Calculate earned coins but don't award them yet
      const coinsMap = [50, 40, 30, 20, 15, 10];
      const reward = coinsMap[Math.max(0, Math.min(5, currentRow))] || 0;
      setEarnedCoins(reward);
      setPendingLevelUp(true);

      // Start celebration animations
      setShowGreat(true);
      setShowConfetti(true);

      // Animate "GREAT!" text
      Animated.sequence([
        Animated.timing(greatAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(greatAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();

      // Animate confetti
      confettiAnimations.forEach((anim, index) => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: screenHeight + 100,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotation, {
            toValue: 360 * (2 + Math.random()),
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          })
        ]).start();
      });

      // Show reward modal after 3 seconds
      setTimeout(() => {
        setShowRewardModal(true);
      }, 3000);

    } else if (currentRow === 5) {
      setGameStatus('lost');
      setTimeout(() => {
        completeGame(false, Date.now() - startTime);
      }, 1000);
    } else {
      setCurrentRow(currentRow + 1);
    }

    setCurrentGuess('');
    setIsSubmitting(false);
  };

  // Handle next level progression
  const handleNextLevel = async () => {
    if (!pendingLevelUp) return;
    
    setIsSubmitting(true);
    
    // Complete the game and award coins
    await completeGame(true, Date.now() - startTime, false, currentRow);
    
    // Initialize new game
    initializeGame();
    
    setIsSubmitting(false);
  };

  // Get tile color based on letter status
  const getTileColor = (guess, letterIndex, rowIndex) => {
    if (rowIndex > currentRow || (rowIndex === currentRow && gameStatus === 'playing')) {
      return '#ffffff';
    }

    const letter = guess[letterIndex];
    const targetLetter = targetWord[letterIndex];

    if (letter === targetLetter) {
      return '#6aaa64'; // Green - correct position
    } else if (targetWord.includes(letter)) {
      return '#c9b458'; // Yellow - wrong position
    } else {
      return '#787c7e'; // Gray - not in word
    }
  };

  // Get keyboard key color
  const getKeyColor = (key) => {
    if (removedLetters.has(key)) {
      return '#ff4444'; // Red for removed letters
    }

    let status = 'unused';
    
    for (let i = 0; i <= currentRow; i++) {
      const guess = guesses[i];
      if (!guess) continue;
      
      for (let j = 0; j < guess.length; j++) {
        if (guess[j] === key) {
          if (targetWord[j] === key) {
            status = 'correct';
            break;
          } else if (targetWord.includes(key)) {
            if (status !== 'correct') status = 'present';
          } else {
            if (status === 'unused') status = 'absent';
          }
        }
      }
    }

    switch (status) {
      case 'correct': return '#6aaa64';
      case 'present': return '#c9b458';
      case 'absent': return '#787c7e';
      default: return '#d3d6da';
    }
  };

  // Booster functions
  const useDart = async () => {
    if (dartUsed || gameStatus !== 'playing') return;
    
    const success = await useBooster('dart', 15);
    if (success) {
      setDartUsed(true);
      
      // Find incorrect letters from previous guesses
      const incorrectLetters = new Set();
      for (let i = 0; i < currentRow; i++) {
        const guess = guesses[i];
        if (guess) {
          for (let j = 0; j < guess.length; j++) {
            const letter = guess[j];
            if (!targetWord.includes(letter)) {
              incorrectLetters.add(letter);
            }
          }
        }
      }
      
      // Remove up to 3 incorrect letters
      const lettersToRemove = Array.from(incorrectLetters).slice(0, 3);
      setRemovedLetters(new Set(lettersToRemove));
      
      Alert.alert('Dart Used!', `Removed ${lettersToRemove.length} incorrect letters from keyboard`);
    } else {
      Alert.alert('Not enough coins', 'You need 15 coins to use Dart');
    }
  };

  const useHint = async () => {
    if (hintUsed || gameStatus !== 'playing') return;
    
    const success = await useBooster('hint', 25);
    if (success) {
      setHintUsed(true);
      
      // Find a letter that hasn't been guessed correctly yet
      const availablePositions = [];
      for (let i = 0; i < 5; i++) {
        let isRevealed = false;
        for (let j = 0; j < currentRow; j++) {
          if (guesses[j] && guesses[j][i] === targetWord[i]) {
            isRevealed = true;
            break;
          }
        }
        if (!isRevealed) {
          availablePositions.push(i);
        }
      }
      
      if (availablePositions.length > 0) {
        const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        const hintLetter = targetWord[randomPos];
        setHintLetters(new Set([`${hintLetter}-${randomPos}`]));
        Alert.alert('Hint Used!', `The letter "${hintLetter}" is in position ${randomPos + 1}`);
      }
    } else {
      Alert.alert('Not enough coins', 'You need 25 coins to use Hint');
    }
  };

  const useSkip = async () => {
    if (gameStatus !== 'playing') return;
    
    Alert.alert(
      'Skip Level',
      'Skip this level for 50 coins? You won\'t earn any coins for this level.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: async () => {
            const success = await useBooster('skip', 50);
            if (success) {
              setGameStatus('won');
              setTimeout(async () => {
                await completeGame(true, Date.now() - startTime, true); // skipCoins = true
                initializeGame();
              }, 1000);
            } else {
              Alert.alert('Not enough coins', 'You need 50 coins to skip this level');
            }
          }
        }
      ]
    );
  };

  const renderGrid = () => {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: 5 }, (_, colIndex) => {
              const guess = rowIndex === currentRow ? currentGuess : guesses[rowIndex];
              const letter = guess ? guess[colIndex] || '' : '';
              const backgroundColor = getTileColor(guess || '', colIndex, rowIndex);
              
              // Check if this position has a hint
              const hasHint = hintLetters.has(`${targetWord[colIndex]}-${colIndex}`) && 
                           rowIndex === currentRow && !letter;
              
              return (
                <View
                  key={colIndex}
                  style={[
                    styles.tile,
                    { backgroundColor },
                    hasHint && styles.hintTile
                  ]}
                >
                  <Text style={[
                    styles.tileText,
                    { color: backgroundColor === '#ffffff' ? '#000' : '#fff' }
                  ]}>
                    {hasHint ? targetWord[colIndex] : letter.toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ];

    return (
      <View style={styles.keyboard}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              const isDisabled = removedLetters.has(key);
              const backgroundColor = getKeyColor(key);
              
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    key === 'ENTER' || key === 'BACK' ? styles.wideKey : null,
                    { backgroundColor: isDisabled ? '#ff4444' : backgroundColor }
                  ]}
                  onPress={() => !isDisabled && handleKeyPress(key)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.keyText,
                    key === 'ENTER' || key === 'BACK' ? styles.wideKeyText : null
                  ]}>
                    {key === 'BACK' ? '⌫' : key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderConfetti = () => {
    if (!showConfetti) return null;

    return (
      <View style={styles.confettiContainer}>
        {confettiAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { rotate: anim.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })}
                ]
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={getBackgroundGradient()}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <View style={styles.coinsContainer}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
              style={styles.coinIcon}
            />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
        </View>

        {/* Boosters */}
        <View style={styles.boostersContainer}>
          <TouchableOpacity 
            style={[styles.booster, dartUsed && styles.boosterUsed]}
            onPress={useDart}
            disabled={dartUsed}
          >
            <Ionicons name="location" size={20} color={dartUsed ? "#999" : "#ff6b35"} />
            <Text style={[styles.boosterText, dartUsed && styles.boosterUsedText]}>
              Dart (15)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.booster, hintUsed && styles.boosterUsed]}
            onPress={useHint}
            disabled={hintUsed}
          >
            <Ionicons name="bulb" size={20} color={hintUsed ? "#999" : "#ffd60a"} />
            <Text style={[styles.boosterText, hintUsed && styles.boosterUsedText]}>
              Hint (25)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.booster}
            onPress={useSkip}
          >
            <Ionicons name="play-forward" size={20} color="#06d6a0" />
            <Text style={styles.boosterText}>Skip (50)</Text>
          </TouchableOpacity>
        </View>

        {/* Game Grid */}
        {renderGrid()}

        {/* Keyboard */}
        {renderKeyboard()}

        {/* Confetti Animation */}
        {renderConfetti()}

        {/* "GREAT!" Animation */}
        {showGreat && (
          <Animated.View
            style={[
              styles.greatContainer,
              {
                opacity: greatAnimation,
                transform: [{
                  scale: greatAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.greatText}>GREAT!</Text>
          </Animated.View>
        )}

        {/* Reward Modal */}
        <Modal
          visible={showRewardModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rewardModal}>
              <Text style={styles.rewardTitle}>Level Complete!</Text>
              <View style={styles.rewardCoinsContainer}>
                <Image 
                  source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
                  style={styles.rewardCoinIcon}
                />
                <Text style={styles.rewardCoinsText}>+{earnedCoins}</Text>
              </View>
              <TouchableOpacity 
                style={styles.nextLevelButton}
                onPress={handleNextLevel}
                disabled={isSubmitting}
              >
                <Text style={styles.nextLevelButtonText}>
                  {isSubmitting ? 'Loading...' : 'Next Level'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  boostersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  booster: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  boosterUsed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  boosterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  boosterUsedText: {
    color: '#999',
  },
  grid: {
    alignItems: 'center',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tile: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#d3d6da',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  hintTile: {
    borderColor: '#ffd60a',
    borderWidth: 3,
  },
  tileText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  keyboard: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key: {
    backgroundColor: '#d3d6da',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  wideKey: {
    paddingHorizontal: 16,
    minWidth: 60,
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  wideKeyText: {
    fontSize: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#ffd700',
    borderRadius: 4,
  },
  greatContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  greatText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 250,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  rewardCoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 8,
  },
  rewardCoinIcon: {
    width: 32,
    height: 32,
  },
  rewardCoinsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  nextLevelButton: {
    backgroundColor: '#6aaa64',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  nextLevelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});