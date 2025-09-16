/**
 * Game Screen - Core Wordle Gameplay
 * Purpose: Main game logic, word guessing, feedback system
 * Features: 5x6 grid, keyboard, boosters, timer, scoring
 * How to extend: Add animations, sound effects, multiplayer, custom word lists
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';

const { width } = Dimensions.get('window');
const TILE_SIZE = Math.min((width - 60) / 5, 60);

export default function GameScreen() {
  const { 
    currentLevel, 
    coins, 
    startGame, 
    completeGame, 
    useBooster,
    settings
  } = useGameStore();

  // Game state
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [usedLetters, setUsedLetters] = useState({});
  const [eliminatedLetters, setEliminatedLetters] = useState(new Set());
  const [hintLetters, setHintLetters] = useState({});
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef(null);

  // Initialize game
  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentLevel]);

  // Timer
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStatus, startTime]);

  const initializeGame = () => {
    const word = getRandomWord();
    setTargetWord(word);
    setGuesses(Array(6).fill(''));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameStatus('playing');
    setUsedLetters({});
    setEliminatedLetters(new Set());
    setHintLetters({});
    setStartTime(Date.now());
    setElapsedTime(0);
    
    // Initialize game in store
    startGame(currentLevel);
  };

  const triggerHaptics = () => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleKeyPress = (key) => {
    triggerHaptics();
    
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = async () => {
    if (currentGuess.length !== 5) {
      Alert.alert('Invalid guess', 'Please enter a 5-letter word');
      return;
    }

    if (!isValidWord(currentGuess)) {
      Alert.alert('Invalid word', 'Please enter a valid English word');
      return;
    }

    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    // Update letter states
    const newUsedLetters = { ...usedLetters };
    const wordArray = targetWord.split('');
    const guessArray = currentGuess.split('');

    // First pass: mark exact matches
    const letterCounts = {};
    wordArray.forEach(letter => {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });

    const results = Array(5).fill('absent');
    
    // Mark correct positions first
    guessArray.forEach((letter, index) => {
      if (letter === wordArray[index]) {
        results[index] = 'correct';
        letterCounts[letter]--;
        newUsedLetters[letter] = 'correct';
      }
    });

    // Then mark present letters
    guessArray.forEach((letter, index) => {
      if (results[index] === 'absent' && letterCounts[letter] > 0) {
        results[index] = 'present';
        letterCounts[letter]--;
        if (newUsedLetters[letter] !== 'correct') {
          newUsedLetters[letter] = 'present';
        }
      } else if (results[index] === 'absent') {
        if (!newUsedLetters[letter]) {
          newUsedLetters[letter] = 'absent';
        }
      }
    });

    setUsedLetters(newUsedLetters);

    // Check win condition
    if (currentGuess === targetWord) {
      setGameStatus('won');
      const finalTime = Date.now() - startTime;
      await completeGame(true, finalTime);
      
      Alert.alert(
        'Congratulations! 🎉',
        `You found the word "${targetWord}" in ${currentRow + 1} attempts!\nTime: ${formatTime(finalTime)}`,
        [
          { text: 'Next Level', onPress: () => router.replace('/game') },
          { text: 'Home', onPress: () => router.replace('/') }
        ]
      );
    } else if (currentRow === 5) {
      setGameStatus('lost');
      const finalTime = Date.now() - startTime;
      await completeGame(false, finalTime);
      
      Alert.alert(
        'Game Over',
        `The word was "${targetWord}". Better luck next time!`,
        [
          { text: 'Try Again', onPress: () => initializeGame() },
          { text: 'Home', onPress: () => router.replace('/') }
        ]
      );
    } else {
      setCurrentRow(currentRow + 1);
      setCurrentGuess('');
    }
  };

  const formatTime = (timeMs) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getTileStyle = (rowIndex, colIndex) => {
    const guess = guesses[rowIndex];
    const letter = guess[colIndex];
    
    if (!letter) return styles.tile;
    
    if (rowIndex >= currentRow) {
      return [styles.tile, styles.tileWithLetter];
    }

    // Check hint letters first
    if (hintLetters[colIndex] && hintLetters[colIndex] === letter) {
      return [styles.tile, styles.tileCorrect];
    }

    const targetArray = targetWord.split('');
    const guessArray = guess.split('');
    
    if (letter === targetArray[colIndex]) {
      return [styles.tile, styles.tileCorrect];
    }
    
    // Check if letter exists elsewhere in word
    const letterCount = targetArray.filter(l => l === letter).length;
    const correctPositions = guessArray.filter((l, i) => l === letter && l === targetArray[i]).length;
    const presentPositions = guessArray.slice(0, colIndex).filter(l => l === letter).length;
    
    if (letterCount > correctPositions + presentPositions && targetArray.includes(letter)) {
      return [styles.tile, styles.tilePresent];
    }
    
    return [styles.tile, styles.tileAbsent];
  };

  const getKeyStyle = (key) => {
    const status = usedLetters[key];
    if (eliminatedLetters.has(key)) {
      return [styles.key, styles.keyEliminated];
    }
    if (status === 'correct') return [styles.key, styles.keyCorrect];
    if (status === 'present') return [styles.key, styles.keyPresent];
    if (status === 'absent') return [styles.key, styles.keyAbsent];
    return styles.key;
  };

  // Booster functions
  const useDartBooster = async () => {
    if (coins < 15) {
      Alert.alert('Not enough coins', 'You need 15 coins to use Dart booster');
      return;
    }

    const success = await useBooster('dart', 15);
    if (success) {
      // Find letters that are not in the target word
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const targetLetters = new Set(targetWord.split(''));
      const availableToEliminate = alphabet.filter(letter => 
        !targetLetters.has(letter) && 
        !eliminatedLetters.has(letter) &&
        !usedLetters[letter]
      );

      if (availableToEliminate.length > 0) {
        const toEliminate = availableToEliminate.slice(0, Math.min(3, availableToEliminate.length));
        setEliminatedLetters(prev => new Set([...prev, ...toEliminate]));
        Alert.alert('Dart Used!', `Eliminated letters: ${toEliminate.join(', ')}`);
      } else {
        Alert.alert('Dart Used!', 'No more letters to eliminate');
      }
    }
  };

  const useHintBooster = async () => {
    if (coins < 25) {
      Alert.alert('Not enough coins', 'You need 25 coins to use Hint booster');
      return;
    }

    const success = await useBooster('hint', 25);
    if (success) {
      // Find a position that hasn't been revealed yet
      const availablePositions = [];
      for (let i = 0; i < 5; i++) {
        if (!hintLetters[i]) {
          availablePositions.push(i);
        }
      }

      if (availablePositions.length > 0) {
        const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        const letter = targetWord[randomPos];
        setHintLetters(prev => ({ ...prev, [randomPos]: letter }));
        Alert.alert('Hint Used!', `Position ${randomPos + 1}: ${letter}`);
      } else {
        Alert.alert('Hint Used!', 'All positions already revealed');
      }
    }
  };

  const useSkipBooster = async () => {
    if (coins < 50) {
      Alert.alert('Not enough coins', 'You need 50 coins to use Skip booster');
      return;
    }

    Alert.alert(
      'Skip Level',
      'Are you sure you want to skip this level? You won\'t earn coins for completion.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            const success = await useBooster('skip', 50);
            if (success) {
              await completeGame(true, 0, true); // Skip coins
              router.replace('/game');
            }
          }
        }
      ]
    );
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
                  key === 'ENTER' || key === 'BACKSPACE' ? styles.keyWide : null
                ]}
                onPress={() => handleKeyPress(key)}
                disabled={eliminatedLetters.has(key)}
              >
                <Text style={[
                  styles.keyText,
                  eliminatedLetters.has(key) ? styles.keyTextEliminated : null
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.gameInfo}>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.coinsInfo}>
          <Image 
            source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
            style={{ width: 20, height: 20 }}
          />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      {/* Boosters */}
      <View style={styles.boostersContainer}>
        <TouchableOpacity style={styles.booster} onPress={useDartBooster}>
          <Ionicons name="location" size={24} color="#ff6b35" />
          <Text style={styles.boosterText}>Dart</Text>
          <View style={styles.boosterCost}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
              style={{ width: 16, height: 16 }}
            />
            <Text style={styles.boosterCostText}>15</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.booster} onPress={useHintBooster}>
          <Ionicons name="bulb" size={24} color="#ffd60a" />
          <Text style={styles.boosterText}>Hint</Text>
          <View style={styles.boosterCost}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
              style={{ width: 16, height: 16 }}
            />
            <Text style={styles.boosterCostText}>25</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.booster} onPress={useSkipBooster}>
          <Image 
            source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58rq967fvn8qpk556rabq6p_1758009760_img_0.webp' }}
            style={{ width: 40, height: 40 }}
          />
          <Text style={styles.boosterText}>Skip</Text>
          <View style={styles.boosterCost}>
            <Image 
              source={{ uri: 'https://xbeirdgyzgnbqbeqpswp.supabase.co/storage/v1/object/public/photo/assets_task_01k58q0270fpds2d9shszh5f72_1758007946_img_0.webp' }}
              style={{ width: 16, height: 16 }}
            />
            <Text style={styles.boosterCostText}>50</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Game Grid */}
      <View style={styles.gameGrid}>
        {Array(6).fill().map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array(5).fill().map((_, colIndex) => {
              const letter = rowIndex === currentRow ? currentGuess[colIndex] : guesses[rowIndex][colIndex];
              const isHint = hintLetters[colIndex];
              
              return (
                <View key={colIndex} style={getTileStyle(rowIndex, colIndex)}>
                  <Text style={[
                    styles.tileText,
                    isHint && styles.hintText
                  ]}>
                    {isHint || letter || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {renderKeyboard()}
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
  gameInfo: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  coinsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  boostersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  booster: {
    alignItems: 'center',
    padding: 8,
  },
  boosterText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  boosterCost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  boosterCostText: {
    fontSize: 10,
    color: '#666',
  },
  gameGrid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 2,
    borderColor: '#d3d6da',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tileWithLetter: {
    borderColor: '#878a8c',
  },
  tileCorrect: {
    backgroundColor: '#6aaa64',
    borderColor: '#6aaa64',
  },
  tilePresent: {
    backgroundColor: '#c9b458',
    borderColor: '#c9b458',
  },
  tileAbsent: {
    backgroundColor: '#787c7e',
    borderColor: '#787c7e',
  },
  tileText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  hintText: {
    color: '#fff',
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
  keyWide: {
    paddingHorizontal: 16,
    minWidth: 48,
  },
  keyCorrect: {
    backgroundColor: '#6aaa64',
  },
  keyPresent: {
    backgroundColor: '#c9b458',
  },
  keyAbsent: {
    backgroundColor: '#787c7e',
  },
  keyEliminated: {
    backgroundColor: '#ff6b6b',
    opacity: 0.6,
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  keyTextEliminated: {
    color: '#fff',
    textDecorationLine: 'line-through',
  },
});