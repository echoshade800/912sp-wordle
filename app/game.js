/**
 * Game (Classic Wordle Level) Screen
 * Purpose: Core Wordle gameplay with 5x6 grid, keyboard, and boosters
 * How to extend: Add power-ups, animations, sound effects, multiplayer modes
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions, Animated, Modal, Image } from 'react-native';
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
  
  // Define booster availability
  const canUseDart = coins >= 10;
  const canUseHint = coins >= 15;
  const canUseSkip = coins >= 25;
  
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [startTime] = useState(Date.now());
  const [hintUsed, setHintUsed] = useState(false);
  const [hintPosition, setHintPosition] = useState(-1); // deprecated for ghost hints
  const [ghostHints, setGhostHints] = useState([]); // { row, col, letter }
  const HINT_COST = 15;
  const [lastHintAt, setLastHintAt] = useState(0);
  const ghostFlipMapRef = useRef(new Map()); // key: `${row}-${col}` -> Animated.Value
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
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'checking' | 'not_word'

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
    flipRowAnimations.forEach(rowAnims => {
      rowAnims.forEach(anim => anim.setValue(0));
    });
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

    // Ghost hint flip animation (per tile)
    const key = `${rowIndex}-${colIndex}`;
    const ghostAnim = ghostFlipMapRef.current.get(key);
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
    } else {
      setCurrentGuess(prev => {
        if (lockedPositions.has(prev.length)) {
          // Skip locked position
          return prev + targetWord[prev.length] + key;
        }
        return prev.length < 5 ? prev + key : prev;
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
      setTimeout(async () => {
        setGameStatus('won');
        // Delay celebration to allow color change to be visible
        setTimeout(() => {
          startCelebration();
        }, 300);
      });
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
        
      case 'hint': {
        // Debounce 200ms
        const now = Date.now();
        if (now - lastHintAt < 200) break;
        setLastHintAt(now);

        // Compute columns already confirmed green from previous rows
        const confirmedGreen = new Set();
        for (let r = 0; r < currentRow; r++) {
          const g = guesses[r];
          for (let c = 0; c < 5; c++) {
            if (g && g[c] === targetWord[c]) confirmedGreen.add(c);
          }
        }

        // Exclude columns already ghosted in current row, and columns already correct in current input
        const ghostedCols = new Set(ghostHints.filter(h => h.row === currentRow).map(h => h.col));
        const candidateCols = [];
        for (let c = 0; c < 5; c++) {
          if (confirmedGreen.has(c)) continue;
          if (ghostedCols.has(c)) continue;
          if ((currentGuess[c] || '') === targetWord[c]) continue; // already typed correct
          candidateCols.push(c);
        }

        if (candidateCols.length === 0) {
          // No available hint
          // Lightweight toast replacement
          Alert.alert('No available hint', 'All positions are already known.');
          break;
        }

        const col = candidateCols[Math.floor(Math.random() * candidateCols.length)];
        const ghost = { row: currentRow, col, letter: targetWord[col] };
        setGhostHints(prev => [...prev, ghost]);

        // Keyboard: mark letter as present (green priority)
        setKeyboardStatus(prev => ({ ...prev, [ghost.letter]: 'correct' }));

        // Haptic feedback
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

        break;
      }
        
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
          <Image 
            source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
            style={{ width: 20, height: 20 }}
          />
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
              // Ghost hint for current row when no user value
              const ghost = ghostHints.find(h => h.row === rowIndex && h.col === colIndex);
              
              return (
                <Animated.View
                  key={colIndex}
                  style={[
                    styles.tile,
                    // If ghost visible (no user letter), render semi-transparent green
                    ghost && rowIndex === currentRow && !letter
                      ? styles.ghostTile
                      : { backgroundColor: getTileColor(letter, colIndex, rowIndex) },
                    getTileStyle(rowIndex, colIndex)
                  ]}
                >
                  <Text style={[styles.tileText, ghost && rowIndex === currentRow && !letter ? styles.ghostLetter : null]}>
                    {letter || (ghost && rowIndex === currentRow ? ghost.letter : '')}
                  </Text>
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
            disabled={coins < 10 || isCelebrating || isFlipping}>
          >
            <View style={styles.boosterIconContainer}>
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58k4w7geqsrcw37csh4bvm7_1758003955_img_1-1.webp' }}
                style={[styles.boosterIconImage, { opacity: canUseDart ? 1 : 0.3 }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.boosterPriceContainer}>
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
                style={{ width: 10, height: 10 }}
              />
              <Text style={styles.boosterPriceText}>10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circularBooster, { backgroundColor: '#8b5cf6' }, coins < 15 && styles.disabledBooster]}
            onPress={() => handleBooster('hint')}
            disabled={coins < 15 || isCelebrating || isFlipping}
          >
            <View style={styles.boosterIconContainer}>
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58k571heq8t6b7hvbq1675k_1758003976_img_1.webp' }}
                style={[styles.boosterIconImage, { opacity: canUseHint ? 1 : 0.3 }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.boosterPriceContainer}>
              <Image 
                source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
                style={{ width: 10, height: 10 }}
              />
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
          <View style={styles.boosterIconContainer}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58rq967fvn8qpk556rabq6p_1758009760_img_0.webp' }}
              style={[styles.boosterIconImage, { opacity: canUseSkip ? 1 : 0.3 }]}
              resizeMode={'contain'}
            />
          </View>
          <View style={styles.boosterPriceContainer}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
              style={{ width: 10, height: 10 }}
            />
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
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>
                Retry (35 coins)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.noThanksButton}
              onPress={handleNoThanks}
            >
              <Text style={styles.noThanksButtonText}>
                No Thanks
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>

    {/* Rules Modal */}
    <GameRulesModal 
      visible={showRulesModal} 
      onClose={() => setShowRulesModal(false)} 
    />
  </SafeAreaView>
);
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
                    source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
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
                onPress={
                }
  )
}