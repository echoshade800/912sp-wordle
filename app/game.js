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

const GameRulesModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.newRulesModalOverlay}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={32} color="white" />
        </TouchableOpacity>
        
        <View style={styles.wordleExample}>
          <View style={styles.wordleLetters}>
            <View style={[styles.wordleLetter, { backgroundColor: '#e91e63' }]}>
              <Text style={styles.wordleLetterText}>W</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#ff9800' }]}>
              <Text style={styles.wordleLetterText}>O</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#2196f3' }]}>
              <Text style={styles.wordleLetterText}>R</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#9c27b0' }]}>
              <Text style={styles.wordleLetterText}>D</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#8bc34a' }]}>
              <Text style={styles.wordleLetterText}>L</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#ff5722' }]}>
              <Text style={styles.wordleLetterText}>E</Text>
            </View>
            <View style={[styles.wordleLetter, { backgroundColor: '#f44336' }]}>
              <Text style={styles.wordleLetterText}>!</Text>
            </View>
          </View>
        </View>

        <View style={styles.howToPlayCard}>
          <Text style={styles.howToPlayTitle}>HOW TO PLAY:</Text>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>6</Text>
            <Text style={styles.ruleText}>You have 6 tries to guess the word.</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIcon, { backgroundColor: '#8bc34a' }]}>
              <Text style={styles.ruleIconText}>Y</Text>
            </View>
            <Text style={styles.ruleText}>The colors of the letters will change to show if they are correct</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIcon, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="search" size={20} color="white" />
            </View>
            <Text style={styles.ruleText}>Use "Hint" to reveal one correct letter.</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIcon, { backgroundColor: '#e91e63' }]}>
              <Ionicons name="target" size={20} color="white" />
            </View>
            <Text style={styles.ruleText}>Use "Dart" to remove three incorrect letters.</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleIcon, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="play-forward" size={20} color="white" />
            </View>
            <Text style={styles.ruleText}>Use "Skip" to skip the current word with no penalties.</Text>
          </View>
        </View>

        <View style={styles.exampleSection}>
          <Text style={styles.exampleTitle}>EXAMPLE:</Text>
          
          <View style={styles.exampleLabels}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>Letter in{'\n'}correct{'\n'}spot</Text>
              <View style={styles.labelArrow} />
            </View>
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>Letter in{'\n'}the wrong{'\n'}spot</Text>
              <View style={styles.labelArrow} />
            </View>
          </View>
          
          <View style={styles.exampleTiles}>
            <View style={[styles.exampleTile, { backgroundColor: '#8bc34a' }]}>
              <Text style={styles.exampleTileText}>S</Text>
            </View>
            <View style={[styles.exampleTile, { backgroundColor: '#6b7280' }]}>
              <Text style={styles.exampleTileText}>C</Text>
            </View>
            <View style={[styles.exampleTile, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.exampleTileText}>O</Text>
            </View>
            <View style={[styles.exampleTile, { backgroundColor: '#6b7280' }]}>
              <Text style={styles.exampleTileText}>R</Text>
            </View>
            <View style={[styles.exampleTile, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.exampleTileText}>E</Text>
            </View>
          </View>
          
          <View style={styles.bottomLabel}>
            <View style={styles.bottomLabelArrow} />
            <Text style={styles.bottomLabelText}>Letter not{'\n'}in word</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
const GRID_SIZE = Math.min(width - 60, 320);
const TILE_SIZE = (GRID_SIZE - 30) / 5;

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

  // Booster modal states
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [selectedBooster, setSelectedBooster] = useState(null);
  const [modalOpacity] = useState(new Animated.Value(0));
  const [modalScale] = useState(new Animated.Value(0.95));

  // Game over modal states
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverOpacity] = useState(new Animated.Value(0));
  const [gameOverScale] = useState(new Animated.Value(0.95));
  
  // Rules modal state
  const [showRulesModal, setShowRulesModal] = useState(false);

  const showGameOverDialog = () => {
    setShowGameOverModal(true);
    
    // Show modal animation
    Animated.parallel([
      Animated.timing(gameOverOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(gameOverScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeGameOverModal = () => {
    Animated.parallel([
      Animated.timing(gameOverOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(gameOverScale, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowGameOverModal(false);
    });
  };

  const handleRetry = async () => {
    if (coins < 35) {
      Alert.alert('Not Enough Coins', 'You need 35 coins to retry this level.');
      return;
    }

    // Deduct coins
    const used = await useBooster('retry', 35);
    if (!used) return;

    // Close modal
    closeGameOverModal();

    // Reset game state but keep keyboard colors
    setGuesses(Array(6).fill(''));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameStatus('playing');
    setIsFlipping(false);
    setFlippedTiles(new Set());
    
    // Reset flip animations
    flipRowAnimations.forEach(rowAnims => 
      rowAnims.forEach(anim => anim.setValue(0))
    );
  };

  const handleNoThanks = () => {
    closeGameOverModal();
    router.back();
  };

  const handleInfoPress = () => {
    setShowRulesModal(true);
  };

  // Booster states
  const [lockedPositions, setLockedPositions] = useState(new Set());
  const [disabledKeys, setDisabledKeys] = useState(new Set());

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
    if (rowIndex > currentRow) return 'transparent';
    
    // Show default color for current row during flipping
    if (rowIndex === currentRow && isFlipping) {
      // Only show color if this specific tile has completed its flip
      const tileKey = `${rowIndex}-${position}`;
      if (!flippedTiles.has(tileKey)) {
        return 'transparent';
      }
    }
    
    // Show default color for current row during input (not submitted yet)
    if (rowIndex === currentRow && gameStatus === 'playing' && !isCelebrating && !guesses[rowIndex]) {
      return 'transparent';
    }
    
    if (!letter) return 'transparent';
    
    if (targetWord[position] === letter) return '#6aaa64';
    if (targetWord.includes(letter)) return '#c9b458';
    return '#787c7e';
  };

  const getKeyColor = (key) => {
    if (disabledKeys.has(key)) return '#9ca3af';
    const status = keyboardStatus[key];
    if (status === 'correct') return '#6aaa64';
    if (status === 'present') return '#c9b458';
    if (status === 'absent') return '#787c7e';
    return '#ffffff';
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
    if (gameStatus !== 'playing' || isCelebrating || isFlipping || disabledKeys.has(key)) return;

    if (key === 'BACK') {
      setCurrentGuess(prev => {
        const newGuess = prev.slice(0, -1);
        // Restore locked positions when backspacing
        const restored = newGuess.split('');
        for (let i = 0; i < 5; i++) {
          if (lockedPositions.has(i) && i < restored.length) {
            restored[i] = targetWord[i];
          }
        }
        return restored.join('');
      });
    } else if (currentGuess.length < 5 && key !== 'ENTER' && key !== 'BACK') {
      setCurrentGuess(prev => {
        if (lockedPositions.has(prev.length)) {
          // Skip locked position
          const newGuess = prev + targetWord[prev.length];
          if (newGuess.length < 5 && !lockedPositions.has(newGuess.length)) {
            return newGuess + key;
          }
          return newGuess;
        }
        return prev + key;
      });
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
        showGameOverDialog();
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
      
      // Check if this was a skipped game (no coin reward)
      const isSkipped = gameStatus === 'won' && guesses[currentRow] === targetWord && currentRow < 5;
      
      if (isSkipped) {
        // Skip: advance level but no coins
        await completeGame(false, finalTime);
      } else {
        // Normal win: advance level and award coins
        await completeGame(true, finalTime);
      }
      
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
      
      // Reset booster states for new level
      setLockedPositions(new Set());
      setDisabledKeys(new Set());
      
    } catch (error) {
      Alert.alert('Error', 'Failed to proceed to next level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBooster = async (type) => {
    if (isCelebrating || isFlipping) return;
    
    const boosterInfo = getBoosterInfo(type);
    
    if (coins < boosterInfo.cost) {
      Alert.alert('Not Enough Coins', `You need ${boosterInfo.cost} coins to use this booster.`);
      return;
    }

    setSelectedBooster(type);
    setShowBoosterModal(true);
    
    // Show modal animation
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getBoosterInfo = (type) => {
    switch (type) {
      case 'dart':
        return {
          cost: 10,
          title: 'Use Dart?',
          description: 'Remove up to 3 incorrect letters from the keyboard.',
          icon: 'search'
        };
      case 'hint':
        return {
          cost: 15,
          title: 'Use Hint?',
          description: 'Reveal and lock one correct letter position.',
          icon: 'target'
        };
      case 'skip':
        return {
          cost: 25,
          title: 'Skip Level?',
          description: 'Skip current level and advance to the next one.',
          icon: 'play-forward'
        };
      default:
        return { cost: 0, title: '', description: '', icon: '' };
    }
  };

  const handleConfirmBooster = async () => {
    if (!selectedBooster) return;
    
    const boosterInfo = getBoosterInfo(selectedBooster);
    const used = await useBooster(selectedBooster, boosterInfo.cost);
    if (!used) return;

    switch (selectedBooster) {
      case 'dart':
        // Find letters that are definitely not in the target word
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const incorrectLetters = alphabet.filter(letter => 
          !targetWord.includes(letter) && !disabledKeys.has(letter)
        ).slice(0, 3);
        
        if (incorrectLetters.length > 0) {
          setDisabledKeys(prev => new Set([...prev, ...incorrectLetters]));
        }
        break;
        
      case 'hint':
        // Find available positions that aren't locked yet
        const availablePositions = [];
        for (let i = 0; i < 5; i++) {
          if (!lockedPositions.has(i)) {
            availablePositions.push(i);
          }
        }
        
        if (availablePositions.length > 0) {
          const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
          setLockedPositions(prev => new Set([...prev, randomPos]));
          
          // Update current guess with the hint
          setCurrentGuess(prev => {
            const newGuess = prev.split('');
            while (newGuess.length < 5) newGuess.push('');
            newGuess[randomPos] = targetWord[randomPos];
            return newGuess.join('');
          });
        }
        break;
        
      case 'skip':
        // Complete current game as skipped
        const endTime = Date.now();
        const finalTime = endTime - startTime;
        
        // Fill in the correct answer
        const newGuesses = [...guesses];
        newGuesses[currentRow] = targetWord;
        setGuesses(newGuesses);
        
        // Update keyboard status to show all correct letters
        updateKeyboardStatus(targetWord, targetWord);
        
        // Set game as won but mark as skipped (no coins)
        setGameStatus('won');
        
        // Start celebration after a short delay to show the answer
        setTimeout(() => {
          startCelebration();
        }, 500);
        break;
    }
    
    closeBoosterModal();
  };

  const closeBoosterModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowBoosterModal(false);
      setSelectedBooster(null);
    });
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
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <TouchableOpacity onPress={handleInfoPress} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
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
              
              return (
                <Animated.View
                  key={colIndex}
                  style={[
                    styles.tile,
                    { backgroundColor: getTileColor(letter, colIndex, rowIndex) },
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
                    style={[
                      styles.key, 
                      { backgroundColor: getKeyColor(key) },
                      disabledKeys.has(key) && styles.disabledKey
                    ]}
                    onPress={() => handleKeyPress(key)}
                    disabled={disabledKeys.has(key)}
                  >
                    <Text style={[
                      styles.keyText,
                      getKeyColor(key) !== '#ffffff' ? { color: 'white' } : { color: '#374151' },
                      disabledKeys.has(key) && { color: '#6b7280' }
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
            style={[styles.circularBooster, coins < 10 && styles.disabledBooster]}
            onPress={() => handleBooster('dart')}
            disabled={coins < 10 || isCelebrating || isFlipping}
          >
            <Ionicons name="search" size={20} color="white" />
            <View style={styles.boosterPriceContainer}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.boosterPriceText}>10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circularBooster, { backgroundColor: '#8b5cf6' }, coins < 15 && styles.disabledBooster]}
            onPress={() => handleBooster('hint')}
            disabled={coins < 15 || isCelebrating || isFlipping}
          >
            <Ionicons name="target" size={20} color="white" />
            <View style={styles.boosterPriceContainer}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.boosterPriceText}>15</Text>
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
          style={[styles.skipButton, coins < 25 && styles.disabledBooster]}
          onPress={() => handleBooster('skip')}
          disabled={coins < 25 || isCelebrating || isFlipping}
        >
          <Ionicons name="play-forward" size={20} color="white" />
          <View style={styles.boosterPriceContainer}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.boosterPriceText}>25</Text>
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

      {/* Booster Confirmation Modal */}
      <Modal
        visible={showBoosterModal}
        transparent={true}
        animationType="none"
      >
        <View style={styles.boosterModalOverlay}>
          <Animated.View 
            style={[
              styles.boosterModal,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            {selectedBooster && (
              <>
                <View style={styles.boosterModalHeader}>
                  <Ionicons 
                    name={getBoosterInfo(selectedBooster).icon} 
                    size={40} 
                    color="#6366f1" 
                  />
                  <Text style={styles.boosterModalTitle}>
                    {getBoosterInfo(selectedBooster).title}
                  </Text>
                </View>
                
                <Text style={styles.boosterModalDescription}>
                  {getBoosterInfo(selectedBooster).description}
                </Text>
                
                <Text style={styles.boosterModalCost}>
                  This will cost {getBoosterInfo(selectedBooster).cost} coins.
                </Text>
                
                <View style={styles.boosterModalButtons}>
                  <TouchableOpacity
                    style={styles.boosterCancelButton}
                    onPress={closeBoosterModal}
                  >
                    <Text style={styles.boosterCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.boosterConfirmButton}
                    onPress={handleConfirmBooster}
                  >
                    <Text style={styles.boosterConfirmButtonText}>Use</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal
        visible={showGameOverModal}
        transparent={true}
        animationType="none"
      >
        <View style={styles.gameOverModalOverlay}>
          <Animated.View 
            style={[
              styles.gameOverModal,
              {
                opacity: gameOverOpacity,
                transform: [{ scale: gameOverScale }]
              }
            ]}
          >
            <Text style={styles.gameOverTitle}>ROUND OVER</Text>
            
            <View style={styles.flameIcon}>
              <Ionicons name="flame" size={72} color="#ff6b35" />
            </View>
            
            <Text style={styles.gameOverSubtitle}>
              Keep your streak going or your score will be reset!
            </Text>
            
            <View style={styles.gameOverButtons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <View style={styles.retryButtonContent}>
                  <Ionicons name="star" size={20} color="white" />
                  <Text style={styles.retryButtonText}>35</Text>
                  <Text style={styles.retryButtonLabel}>Retry</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.noThanksButton}
                onPress={handleNoThanks}
              >
                <Text style={styles.noThanksButtonText}>No Thanks</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Game Rules Modal */}
      <GameRulesModal 
        visible={showRulesModal} 
        onClose={() => setShowRulesModal(false)} 
      />
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
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoButton: {
    padding: 4,
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
    gap: 8,
    marginBottom: 4,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'transparent',
  },
  tileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  keyboard: {
    paddingHorizontal: 4,
    marginTop: -2,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  key: {
    minWidth: 32,
    height: 52,
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backKey: {
    minWidth: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backKeyText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#374151',
  },
  keyText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#374151',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 0,
    paddingBottom: 20,
    marginTop: 16,
    transform: [{ translateY: -2 }],
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
  boosterPriceContainer: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  boosterPriceText: {
    fontSize: 10,
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
    fontSize: 22,
    fontWeight: '900',
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
  disabledKey: {
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
  boosterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  boosterModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
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
  boosterModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  boosterModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  boosterModalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  boosterModalCost: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  boosterModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  boosterCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  boosterCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  boosterConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  boosterConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  gameOverModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameOverModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  gameOverAnswer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6aaa64',
    textAlign: 'center',
    marginBottom: 32,
  },
  gameOverButtons: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#6aaa64',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  retryButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  noThanksButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  noThanksButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  flameIcon: {
    marginBottom: 16,
  },
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
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  rulesContent: {
    padding: 20,
  },
  rulesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  rulesExamples: {
    marginBottom: 20,
  },
  ruleExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleTile: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exampleTileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  ruleText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  rulesFooter: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newRulesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  wordleExample: {
    alignItems: 'center',
    marginBottom: 30,
  },
  wordleLetters: {
    flexDirection: 'row',
    gap: 4,
  },
  wordleLetter: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordleLetterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  howToPlayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  howToPlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ruleNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    width: 32,
    textAlign: 'center',
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  exampleSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  exampleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  labelContainer: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  labelArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#666',
  },
  exampleTiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bottomLabel: {
    alignItems: 'center',
  },
  bottomLabelArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#666',
    marginBottom: 4,
  },
  bottomLabelText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});