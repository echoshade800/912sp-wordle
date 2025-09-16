/**
 * Game Screen - Core Wordle gameplay
 * Purpose: Main game interface with 5x6 grid, keyboard, and boosters
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
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reward coins based on attempts (1-6 attempts)
const WIN_REWARD = [50, 40, 30, 20, 15, 10];

export default function GameScreen() {
  const { 
    currentLevel, 
    coins, 
    completeGame, 
    useBooster,
    updateGameData,
    startGame 
  } = useGameStore();

  // Game state
  const [targetWord, setTargetWord] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [grid, setGrid] = useState(Array(6).fill().map(() => Array(5).fill('')));
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [guessedLetters, setGuessedLetters] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  
  // Animation states
  const [showGreat, setShowGreat] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  
  // Animation values
  const greatAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array(20).fill().map(() => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1)
    }))
  ).current;

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [currentLevel]);

  const initializeGame = () => {
    const word = getRandomWord();
    setTargetWord(word);
    setCurrentRow(0);
    setCurrentCol(0);
    setGrid(Array(6).fill().map(() => Array(5).fill('')));
    setGameStatus('playing');
    setGuessedLetters({});
    setIsSubmitting(false);
    setStartTime(Date.now());
    setShowGreat(false);
    setShowConfetti(false);
    setPendingLevelUp(false);
    setRewardCoins(0);
    
    // Reset animations
    greatAnimation.setValue(0);
    confettiAnimations.forEach(anim => {
      anim.x.setValue(Math.random() * screenWidth);
      anim.y.setValue(-50);
      anim.rotation.setValue(0);
      anim.opacity.setValue(1);
    });
    
    startGame(currentLevel);
  };

  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing' || isSubmitting) return;

    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === 'BACKSPACE') {
      handleBackspace();
    } else if (currentCol < 5) {
      const newGrid = [...grid];
      newGrid[currentRow][currentCol] = key;
      setGrid(newGrid);
      setCurrentCol(currentCol + 1);
    }
  };

  const handleBackspace = () => {
    if (currentCol > 0) {
      const newGrid = [...grid];
      newGrid[currentRow][currentCol - 1] = '';
      setGrid(newGrid);
      setCurrentCol(currentCol - 1);
    }
  };

  const handleSubmitGuess = async () => {
    if (currentCol !== 5) {
      Alert.alert('Incomplete Word', 'Please complete the 5-letter word');
      return;
    }

    const guess = grid[currentRow].join('');
    
    if (!isValidWord(guess)) {
      Alert.alert('Invalid Word', 'Please enter a valid English word');
      return;
    }

    setIsSubmitting(true);

    // Process the guess
    const newGuessedLetters = { ...guessedLetters };
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    
    // Mark letters as correct, present, or absent
    guessLetters.forEach((letter, index) => {
      if (targetLetters[index] === letter) {
        newGuessedLetters[letter] = 'correct';
      } else if (targetLetters.includes(letter) && newGuessedLetters[letter] !== 'correct') {
        newGuessedLetters[letter] = 'present';
      } else if (!newGuessedLetters[letter]) {
        newGuessedLetters[letter] = 'absent';
      }
    });

    setGuessedLetters(newGuessedLetters);

    // Check if word is correct
    if (guess === targetWord) {
      setGameStatus('won');
      
      // Calculate reward but don't award yet
      const attemptIndex = Math.min(currentRow + 1, 6); // 1..6
      const coinsDelta = WIN_REWARD[attemptIndex - 1] || WIN_REWARD[5];
      setRewardCoins(coinsDelta);
      
      // Set pending level up state
      setPendingLevelUp(true);
      
      // Start celebration animations
      triggerCelebration();
      
    } else if (currentRow === 5) {
      // Game over
      setGameStatus('lost');
      setTimeout(() => {
        completeGame(false, Date.now() - startTime);
      }, 1000);
    } else {
      setCurrentRow(currentRow + 1);
      setCurrentCol(0);
    }

    setIsSubmitting(false);
  };

  const triggerCelebration = () => {
    // Show "GREAT!" animation
    setShowGreat(true);
    Animated.sequence([
      Animated.timing(greatAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(greatAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowGreat(false);
    });

    // Show confetti
    setShowConfetti(true);
    const confettiAnimationPromises = confettiAnimations.map((anim, index) => {
      return new Promise(resolve => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: screenHeight + 100,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotation, {
            toValue: Math.random() * 720,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });
    });

    Promise.all(confettiAnimationPromises).then(() => {
      setShowConfetti(false);
    });
  };

  const handleNextLevel = async () => {
    setIsSubmitting(true);
    
    try {
      // Complete the current game and award coins
      const endTime = Date.now();
      const attemptIndex = Math.min(currentRow + 1, 6);
      await completeGame(true, endTime - startTime, false, attemptIndex - 1);
      
      // Reset pending state
      setPendingLevelUp(false);
      setRewardCoins(0);
      
      // Initialize next level
      initializeGame();
    } catch (error) {
      console.error('Error completing game:', error);
      Alert.alert('Error', 'Failed to proceed to next level');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCellStyle = (rowIndex, colIndex) => {
    const letter = grid[rowIndex][colIndex];
    if (!letter) return styles.cell;

    if (rowIndex < currentRow) {
      // This row has been submitted
      const targetLetters = targetWord.split('');
      const guessLetters = grid[rowIndex];
      
      if (targetLetters[colIndex] === letter) {
        return [styles.cell, styles.correctCell];
      } else if (targetLetters.includes(letter)) {
        return [styles.cell, styles.presentCell];
      } else {
        return [styles.cell, styles.absentCell];
      }
    }

    return [styles.cell, styles.filledCell];
  };

  const getKeyStyle = (key) => {
    const status = guessedLetters[key];
    if (status === 'correct') return [styles.key, styles.correctKey];
    if (status === 'present') return [styles.key, styles.presentKey];
    if (status === 'absent') return [styles.key, styles.absentKey];
    return styles.key;
  };

  // Booster functions
  const useDartBooster = async () => {
    const cost = 15;
    const success = await useBooster('dart', cost);
    if (success) {
      // Remove up to 3 incorrect letters from keyboard
      const incorrectLetters = Object.keys(guessedLetters).filter(
        letter => guessedLetters[letter] === 'absent'
      );
      const lettersToRemove = incorrectLetters.slice(0, 3);
      
      Alert.alert(
        'Dart Used!',
        `Removed ${lettersToRemove.length} incorrect letters: ${lettersToRemove.join(', ')}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Not Enough Coins', `You need ${cost} coins to use Dart booster`);
    }
  };

  const useHintBooster = async () => {
    const cost = 25;
    const success = await useBooster('hint', cost);
    if (success) {
      // Reveal one correct letter position
      const targetLetters = targetWord.split('');
      const currentGuess = grid[currentRow];
      
      // Find a position that hasn't been filled or is incorrect
      let hintPosition = -1;
      for (let i = 0; i < 5; i++) {
        if (!currentGuess[i] || currentGuess[i] !== targetLetters[i]) {
          hintPosition = i;
          break;
        }
      }
      
      if (hintPosition !== -1) {
        const newGrid = [...grid];
        newGrid[currentRow][hintPosition] = targetLetters[hintPosition];
        setGrid(newGrid);
        
        // Update current column position
        let newCol = 0;
        for (let i = 0; i < 5; i++) {
          if (newGrid[currentRow][i]) newCol = i + 1;
        }
        setCurrentCol(newCol);
        
        Alert.alert('Hint Used!', `Revealed letter: ${targetLetters[hintPosition]} at position ${hintPosition + 1}`);
      } else {
        Alert.alert('Hint', 'All positions are already correct!');
      }
    } else {
      Alert.alert('Not Enough Coins', `You need ${cost} coins to use Hint booster`);
    }
  };

  const useSkipBooster = async () => {
    const cost = 50;
    const success = await useBooster('skip', cost);
    if (success) {
      Alert.alert(
        'Skip Level',
        'Are you sure you want to skip this level?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Skip', 
            onPress: async () => {
              await completeGame(true, Date.now() - startTime, true); // skipCoins = true
              initializeGame();
            }
          }
        ]
      );
    } else {
      Alert.alert('Not Enough Coins', `You need ${cost} coins to use Skip booster`);
    }
  };

  const renderKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    return (
      <View style={styles.keyboard}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  getKeyStyle(key),
                  key === 'ENTER' || key === 'BACKSPACE' ? styles.wideKey : null
                ]}
                onPress={() => handleKeyPress(key)}
                disabled={gameStatus !== 'playing' || isSubmitting}
              >
                <Text style={[
                  styles.keyText,
                  key === 'ENTER' || key === 'BACKSPACE' ? styles.wideKeyText : null
                ]}>
                  {key === 'BACKSPACE' ? '⌫' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const getBackgroundColor = () => {
    const colors = [
      '#f0f8ff', '#f5f5dc', '#ffe4e1', '#f0fff0', '#fff8dc',
      '#e6e6fa', '#fdf5e6', '#f5fffa', '#fff0f5', '#f0f0f0'
    ];
    return colors[(currentLevel - 1) % colors.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.levelText}>Level {currentLevel}</Text>
        <View style={styles.coinsInfo}>
          <Image 
            source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
            style={{ width: 20, height: 20 }}
          />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View key={colIndex} style={getCellStyle(rowIndex, colIndex)}>
                <Text style={styles.cellText}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Boosters */}
      <View style={styles.boostersContainer}>
        <TouchableOpacity 
          style={styles.boosterButton}
          onPress={useDartBooster}
          disabled={gameStatus !== 'playing'}
        >
          <Ionicons name="location" size={20} color="#ff6b35" />
          <Text style={styles.boosterText}>Dart (15)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.boosterButton}
          onPress={useHintBooster}
          disabled={gameStatus !== 'playing'}
        >
          <Ionicons name="bulb" size={20} color="#ffd60a" />
          <Text style={styles.boosterText}>Hint (25)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.boosterButton}
          onPress={useSkipBooster}
          disabled={gameStatus !== 'playing'}
        >
          <Ionicons name="play-forward" size={20} color="#06d6a0" />
          <Text style={styles.boosterText}>Skip (50)</Text>
        </TouchableOpacity>
      </View>

      {/* Keyboard */}
      {renderKeyboard()}

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

      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {confettiAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate: anim.rotation.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg']
                      })
                    }
                  ],
                  opacity: anim.opacity
                }
              ]}
            />
          ))}
        </View>
      )}

      {/* Reward Modal */}
      <Modal
        visible={pendingLevelUp}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rewardModal}>
            <Text style={styles.rewardTitle}>Level Complete!</Text>
            <View style={styles.rewardContent}>
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
                style={{ width: 40, height: 40 }}
              />
              <Text style={styles.rewardCoinsText}>+{rewardCoins}</Text>
            </View>
            <Text style={styles.rewardSubtext}>Coins earned!</Text>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextLevel}
              disabled={isSubmitting}
            >
              <Text style={styles.nextButtonText}>
                {isSubmitting ? 'Loading...' : 'Next Level'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      {gameStatus === 'lost' && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.gameOverModal}>
              <Text style={styles.gameOverTitle}>Game Over</Text>
              <Text style={styles.gameOverText}>The word was: {targetWord}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={initializeGame}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.homeButton}
                onPress={() => router.back()}
              >
                <Text style={styles.homeButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  gridContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cell: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#d3d6da',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  filledCell: {
    borderColor: '#878a8c',
  },
  correctCell: {
    backgroundColor: '#6aaa64',
    borderColor: '#6aaa64',
  },
  presentCell: {
    backgroundColor: '#c9b458',
    borderColor: '#c9b458',
  },
  absentCell: {
    backgroundColor: '#787c7e',
    borderColor: '#787c7e',
  },
  cellText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  boostersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  boosterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boosterText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
    justifyContent: 'center',
  },
  wideKey: {
    paddingHorizontal: 16,
    minWidth: 60,
  },
  correctKey: {
    backgroundColor: '#6aaa64',
  },
  presentKey: {
    backgroundColor: '#c9b458',
  },
  absentKey: {
    backgroundColor: '#787c7e',
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  wideKeyText: {
    fontSize: 12,
  },
  greatContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  greatText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6aaa64',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#ffd700',
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
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardCoinsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
    marginLeft: 10,
  },
  rewardSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  nextButton: {
    backgroundColor: '#6aaa64',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameOverModal: {
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
  gameOverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 15,
  },
  gameOverText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6aaa64',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});