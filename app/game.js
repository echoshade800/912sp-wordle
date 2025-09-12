/**
 * Game (Classic Wordle Level) Screen
 * Purpose: Core Wordle gameplay with 5x6 grid, keyboard, and boosters
 * How to extend: Add power-ups, animations, sound effects, multiplayer modes
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions, Animated, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';

const BACKGROUND_COLORS = [
  '#D8E2DC', // 第1关：浅灰绿色
  '#FFE5D9', // 第2关：柔和杏桃粉
  '#FFCAD4', // 第3关：浅樱花粉
  '#F4ACB7', // 第4关：暖玫瑰粉
  '#9D8189', // 第5关：灰紫玫瑰
  '#B5EAD7', // 第6关：浅薄荷绿
  '#C7CEEA', // 第7关：柔和薰衣草紫
  '#E2F0CB', // 第8关：浅嫩芽绿
  '#FFDAC1', // 第9关：奶油杏色
  '#E0BBE4', // 第10关：淡紫丁香
];

const { width, height } = Dimensions.get('window');
const GRID_SIZE = Math.min(width - 40, 350);
const TILE_SIZE = (GRID_SIZE - 20) / 5;

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

export default function GameScreen() {
  const { currentLevel, coins, startGame, completeGame, useBooster, currentGame } = useGameStore();
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [startTime] = useState(Date.now());
  const [hintUsed, setHintUsed] = useState(false);
  const [hintPosition, setHintPosition] = useState(-1);
  const gameStarted = useRef(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationStep, setCelebrationStep] = useState(0); // 0: none, 1: flip, 2: confetti, 3: modal
  const [flipAnimations] = useState(Array.from({ length: 5 }, () => new Animated.Value(0)));
  const [confettiAnimations] = useState(Array.from({ length: 20 }, () => ({
    translateY: new Animated.Value(-100),
    translateX: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0)
  })));
  const [greatTextScale] = useState(new Animated.Value(0.8));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipRowAnimations] = useState(Array.from({ length: 6 }, () => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ));
  const [flippedTiles, setFlippedTiles] = useState(new Set());
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState('#fafafa');

  useEffect(() => {
    if (!gameStarted.current) {
      const word = getRandomWord();
      setTargetWord(word);
      startGame(currentLevel);
      // 设置当前关卡的背景色
      const colorIndex = (currentLevel - 1) % BACKGROUND_COLORS.length;
      setCurrentBackgroundColor(BACKGROUND_COLORS[colorIndex]);
      gameStarted.current = true;
    }
  }, [currentLevel, startGame]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      const endTime = Date.now();
      const finalTime = endTime - startTime;
      completeGame(gameStatus === 'won', finalTime);
    }
  }, [gameStatus, startTime, completeGame]);

  const getTileColor = (letter, position, rowIndex) => {
    // Show default color for future rows
    if (rowIndex > currentRow) return '#d3d6da';
    
    // Show default color for current row during flipping
    if (rowIndex === currentRow && isFlipping) {
      // Only show color if this specific tile has completed its flip
      const tileKey = `${rowIndex}-${position}`;
      if (!flippedTiles.has(tileKey)) {
        return '#d3d6da';
      }
    }
    
    // Show default color for current row during input (not submitted yet)
    if (rowIndex === currentRow && gameStatus === 'playing' && !isCelebrating && !guesses[rowIndex]) {
      return '#d3d6da';
    }
    
    if (!letter) return '#d3d6da';
    
    if (targetWord[position] === letter) return '#6aaa64';
    if (targetWord.includes(letter)) return '#c9b458';
    return '#787c7e';
  };

  const getKeyColor = (key) => {
    const status = keyboardStatus[key];
    if (status === 'correct') return '#6aaa64';
    if (status === 'present') return '#c9b458';
    if (status === 'absent') return '#787c7e';
    return '#d3d6da';
  };

  const getTileStyle = (rowIndex, colIndex) => {
    // Regular flip animation for current row during submission
    if (isFlipping && rowIndex === currentRow) {
      return {
        transform: [{
          rotateX: flipRowAnimations[rowIndex][colIndex].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['0deg', '90deg', '0deg']
          })
        }]
      };
    }
    
    // Victory celebration flip animation
    if (celebrationStep === 1 && rowIndex === currentRow && gameStatus === 'won') {
      return {
        transform: [{
          rotateX: flipAnimations[colIndex].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['0deg', '90deg', '0deg']
          })
        }]
      };
    }
    return {};
  };

  const updateKeyboardStatus = (guess, targetWord) => {
    const newStatus = { ...keyboardStatus };
    
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      if (targetWord[i] === letter) {
        newStatus[letter] = 'correct';
      } else if (targetWord.includes(letter) && newStatus[letter] !== 'correct') {
        newStatus[letter] = 'present';
      } else if (!targetWord.includes(letter)) {
        newStatus[letter] = 'absent';
      }
    }
    
    setKeyboardStatus(newStatus);
  };

  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing' || isCelebrating || isFlipping) return;

    if (key === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && key !== 'ENTER' && key !== 'BACK') {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleSubmit = () => {
    if (currentGuess.length !== 5 || !isValidWord(currentGuess) || gameStatus !== 'playing' || isCelebrating || isFlipping) return;
    submitGuess();
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5 || !isValidWord(currentGuess) || isFlipping) return;

    // Start flip animation
    setIsFlipping(true);
    setFlippedTiles(new Set()); // Reset flipped tiles
    
    // Update the guess in state but don't show colors yet
    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);
    
    // Create flip animation for current row
    const flipSequence = flipRowAnimations[currentRow].map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      })
    );
    
    // Start each flip animation individually to control color timing
    flipSequence.forEach((animation, index) => {
      animation.start(({ finished }) => {
        if (finished) {
          // Mark this tile as flipped so it can show its color
          const tileKey = `${currentRow}-${index}`;
          setFlippedTiles(prev => new Set([...prev, tileKey]));
          
          // Force re-render to show the color
          setGuesses(prevGuesses => [...prevGuesses]);
        }
        
        // If this is the last tile, process the game logic
        if (index === flipSequence.length - 1) {
          // Update keyboard status and process game logic after all flips complete
          updateKeyboardStatus(currentGuess, targetWord);
          processGuess();
        }
      });
    });
  };

  const processGuess = () => {
    setIsFlipping(false);
    setFlippedTiles(new Set()); // Clear flipped tiles state
    
    // Reset flip animations for current row
    flipRowAnimations[currentRow].forEach(anim => anim.setValue(0));

    // Game logic processing (guesses and keyboard already updated in submitGuess)

    if (currentGuess === targetWord) {
      setGameStatus('won');
      // Delay celebration to allow color change to be visible
      setTimeout(() => {
        startCelebration();
      }, 300);
    } else if (currentRow >= 5) {
      setGameStatus('lost');
      setTimeout(() => {
        Alert.alert(
          'Try Again!',
          `The word was "${targetWord}". Don't give up!`,
          [
            { text: 'Try Again', onPress: () => router.replace('/game') },
            { text: 'Home', onPress: () => router.replace('/') }
          ]
        );
      }, 1000);
    } else {
      setCurrentRow(currentRow + 1);
      setCurrentGuess('');
    }
  };

  const startCelebration = () => {
    setIsCelebrating(true);
    setCelebrationStep(1);
    
    // Stage A: Flip animation
    const flipSequence = flipAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      })
    );
    
    Animated.sequence([
      Animated.stagger(80, flipSequence),
      Animated.delay(200)
    ]).start(() => {
      // Stage B: Confetti and "GREAT!" text
      setCelebrationStep(2);
      startConfettiAnimation();
    });
  };

  const startConfettiAnimation = () => {
    // Animate "GREAT!" text
    Animated.sequence([
      Animated.timing(greatTextScale, {
        toValue: 1.05,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(greatTextScale, {
        toValue: 1.0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    // Animate confetti
    const confettiAnimationsList = confettiAnimations.map((anim, index) => {
      const isLeft = index % 2 === 0;
      const startX = isLeft ? -50 : width + 50;
      const endX = isLeft ? width * 0.3 + Math.random() * width * 0.4 : width * 0.3 + Math.random() * width * 0.4;
      
      anim.translateX.setValue(startX);
      anim.translateY.setValue(-100);
      anim.opacity.setValue(1);
      anim.rotate.setValue(0);
      
      return Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: endX,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: height + 100,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360,
          duration: 1200,
          useNativeDriver: true,
        })
      ]);
    });

    Animated.parallel(confettiAnimationsList).start(() => {
      // Stage C: Show modal
      setTimeout(() => {
        setCelebrationStep(3);
        setShowCelebrationModal(true);
      }, 300);
    });
  };

  const handleNextLevel = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = Date.now();
      const finalTime = endTime - startTime;
      await completeGame(true, finalTime);
      
      // Reset celebration state
      setIsCelebrating(false);
      setShowCelebrationModal(false);
      setCelebrationStep(0);
      flipAnimations.forEach(anim => anim.setValue(0));
      greatTextScale.setValue(0.8);
      
      // Start new game
      const newWord = getRandomWord();
      setTargetWord(newWord);
      setGuesses(Array(6).fill(''));
      setCurrentGuess('');
      setCurrentRow(0);
      setGameStatus('playing');
      setKeyboardStatus({});
      setHintUsed(false);
      setHintPosition(-1);
      
      // 设置新关卡的背景色
      const colorIndex = (currentLevel - 1) % BACKGROUND_COLORS.length;
      setCurrentBackgroundColor(BACKGROUND_COLORS[colorIndex]);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to proceed to next level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBooster = async (type) => {
    if (isCelebrating || isFlipping) return;
    
    let cost = 0;
    switch (type) {
      case 'dart':
        cost = 15;
        break;
      case 'hint':
        cost = 25;
        break;
      case 'skip':
        cost = 50;
        break;
    }

    if (coins < cost) {
      Alert.alert('Not Enough Coins', `You need ${cost} coins to use this booster.`);
      return;
    }

    const used = await useBooster(type, cost);
    if (!used) return;

    switch (type) {
      case 'dart':
        // Remove incorrect letters from keyboard
        const incorrectLetters = Object.keys(keyboardStatus).filter(
          key => keyboardStatus[key] === 'absent'
        ).slice(0, 3);
        Alert.alert('Dart Used! 🎯', `Removed ${incorrectLetters.length} incorrect letters from keyboard.`);
        break;
      case 'hint':
        // Reveal one correct letter position
        if (!hintUsed) {
          const availablePositions = [];
          for (let i = 0; i < 5; i++) {
            if (currentGuess[i] !== targetWord[i]) {
              availablePositions.push(i);
            }
          }
          if (availablePositions.length > 0) {
            const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            const newGuess = currentGuess.split('');
            newGuess[randomPos] = targetWord[randomPos];
            setCurrentGuess(newGuess.join(''));
            setHintUsed(true);
            setHintPosition(randomPos);
            Alert.alert('Hint Used! 💡', `Revealed letter at position ${randomPos + 1}.`);
          }
        }
        break;
      case 'skip':
        // Skip to next level
        Alert.alert(
          'Level Skipped',
          `Moving to Level ${currentLevel + 1}`,
          [{ text: 'Continue', onPress: () => router.replace('/') }]
        );
        break;
    }
  };

  const isSubmitEnabled = () => {
    return currentGuess.length === 5 && isValidWord(currentGuess) && !isFlipping;
  };

  const getSubmitButtonStyle = () => {
    if (isFlipping) return { backgroundColor: '#9ca3af' };
    if (currentGuess.length < 5) return { backgroundColor: '#9ca3af' };
    if (!isValidWord(currentGuess)) return { backgroundColor: '#ef4444' };
    return { backgroundColor: '#3b82f6' };
  };

  const getSubmitButtonText = () => {
    if (isFlipping) return 'CHECKING...';
    if (currentGuess.length < 5) return 'SUBMIT';
    if (!isValidWord(currentGuess)) return 'NOT A WORD';
    return 'SUBMIT';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentBackgroundColor }]}>
      {/* Celebration Overlay */}
      {isCelebrating && (
        <View style={styles.celebrationOverlay}>
          {celebrationStep === 2 && (
            <>
              {/* "GREAT!" Text */}
              <Animated.View style={[
                styles.greatTextContainer,
                { transform: [{ scale: greatTextScale }] }
              ]}>
                <Text style={styles.greatText}>GREAT!</Text>
              </Animated.View>
              
              {/* Confetti */}
              {confettiAnimations.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.confetti,
                    {
                      backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][index % 6],
                      transform: [
                        { translateX: anim.translateX },
                        { translateY: anim.translateY },
                        { rotate: anim.rotate.interpolate({
                          inputRange: [0, 360],
                          outputRange: ['0deg', '360deg']
                        })}
                      ],
                      opacity: anim.opacity
                    }
                  ]}
                />
              ))}
            </>
          )}
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.levelText}>Level {currentLevel}</Text>
        <View style={styles.coinsInfo}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      <View style={styles.gameBoard}>
        {guesses.map((guess, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const letter = rowIndex === currentRow && gameStatus === 'playing' 
                ? currentGuess[colIndex] || ''
                : guess[colIndex] || '';
              const isHintTile = hintUsed && hintPosition === colIndex && rowIndex === currentRow;
              
              return (
                <Animated.View
                  key={colIndex}
                  style={[
                    styles.tile,
                    { backgroundColor: getTileColor(letter, colIndex, rowIndex) },
                    isHintTile && styles.hintTile,
                    getTileStyle(rowIndex, colIndex)
                  ]}
                >
                  <Text style={styles.tileText}>{letter}</Text>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.keyboard}>
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              if (key === 'BACK') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.backKey}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={styles.backKeyText}>×</Text>
                  </TouchableOpacity>
                );
              } else {
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.key, { backgroundColor: getKeyColor(key) }]}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={[
                      styles.keyText,
                      getKeyColor(key) !== '#ffffff' && { color: 'white' }
                    ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        ))}
      </View>

      <View style={styles.bottomActions}>
        <View style={styles.boostersRow}>
          <TouchableOpacity
            style={[styles.circularBooster, coins < 15 && styles.disabledBooster]}
            onPress={() => handleBooster('dart')}
            disabled={coins < 15 || isCelebrating || isFlipping}
          >
            <Ionicons name="search" size={24} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circularBooster, { backgroundColor: '#8b5cf6' }, coins < 25 && styles.disabledBooster]}
            onPress={() => handleBooster('hint')}
            disabled={coins < 25 || hintUsed || isCelebrating || isFlipping}
          >
            <Ionicons name="target" size={24} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, getSubmitButtonStyle()]}
          onPress={handleSubmit}
          disabled={currentGuess.length < 5 || !isValidWord(currentGuess) || isCelebrating || isFlipping}
        >
          <Text style={styles.submitButtonText}>
            {getSubmitButtonText()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, coins < 50 && styles.disabledBooster]}
          onPress={() => handleBooster('skip')}
          disabled={coins < 50 || isCelebrating || isFlipping}
        >
          <Ionicons name="play-forward" size={24} color="white" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebrationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationModal}>
            <View style={styles.ribbonContainer}>
              <Text style={styles.ribbonText}>WELL DONE!</Text>
            </View>
            
            <View style={styles.rewardContainer}>
              <Ionicons name="star" size={48} color="#FFD700" />
              <Text style={styles.rewardText}>+20 Coins</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.nextButton, isSubmitting && styles.disabledButton]}
              onPress={handleNextLevel}
              disabled={isSubmitting}
            >
              <Text style={styles.nextButtonText}>
                {isSubmitting ? 'LOADING...' : 'NEXT'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  gameBoard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d3d6da',
  },
  hintTile: {
    borderColor: '#ffd60a',
    borderWidth: 3,
  },
  tileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  keyboard: {
    paddingHorizontal: 4,
    marginTop: 16,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  key: {
    minWidth: 32,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backKey: {
    minWidth: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backKeyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 16,
  },
  boostersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  circularBooster: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  submitButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledBooster: {
    opacity: 0.5,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  greatTextContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1001,
  },
  greatText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  ribbonContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ribbonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  rewardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: '#6aaa64',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
});