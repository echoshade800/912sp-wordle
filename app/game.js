/**
 * Game Screen - Core Wordle gameplay
 * Purpose: Main game interface with 5x6 grid, keyboard, and game logic
 * How to extend: Add animations, sound effects, difficulty modes, multiplayer
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';
import GameUtils from '../utils/GameUtils';

const { width } = Dimensions.get('window');
const TILE_SIZE = Math.min((width - 60) / 5, 60);

export default function GameScreen() {
  const isMounted = useRef(true);
  const { 
    currentLevel, 
    coins, 
    startGame, 
    completeGame, 
    useBooster 
  } = useGameStore();

  // Game state
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [usedLetters, setUsedLetters] = useState({});
  const [startTime, setStartTime] = useState(Date.now());
  const [showBoosterMenu, setShowBoosterMenu] = useState(false);
  const [hintsUsed, setHintsUsed] = useState([]);

  // Initialize game
  useEffect(() => {
    if (isMounted.current) {
      const word = getRandomWord();
      setTargetWord(word);
      startGame(currentLevel);
      setStartTime(Date.now());
    }

    return () => {
      isMounted.current = false;
    };
  }, [currentLevel, startGame]);

  // Keyboard layout
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
  ];

  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === 'DELETE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key.length === 1 && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleSubmitGuess = () => {
    if (currentGuess.length !== 5) {
      Alert.alert('Invalid Length', 'Please enter a 5-letter word.');
      return;
    }

    if (!isValidWord(currentGuess)) {
      GameUtils.showNotAWord();
      return;
    }

    // Process the guess
    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    // Update used letters
    const newUsedLetters = { ...usedLetters };
    for (let i = 0; i < 5; i++) {
      const letter = currentGuess[i];
      const status = getLetterStatus(letter, i, currentGuess, targetWord);
      
      if (!newUsedLetters[letter] || 
          (newUsedLetters[letter] === 'absent' && status !== 'absent') ||
          (newUsedLetters[letter] === 'present' && status === 'correct')) {
        newUsedLetters[letter] = status;
      }
    }
    setUsedLetters(newUsedLetters);

    // Check win condition
    if (currentGuess === targetWord) {
      setGameStatus('won');
      const completionTime = Date.now() - startTime;
      completeGame(true, completionTime);
    } else if (currentRow === 5) {
      setGameStatus('lost');
      const completionTime = Date.now() - startTime;
      completeGame(false, completionTime);
    } else {
      setCurrentRow(prev => prev + 1);
      setCurrentGuess('');
    }
  };

  const getLetterStatus = (letter, position, guess, target) => {
    if (target[position] === letter) return 'correct';
    if (target.includes(letter)) return 'present';
    return 'absent';
  };

  const getTileStyle = (rowIndex, colIndex) => {
    const guess = guesses[rowIndex];
    const letter = guess[colIndex];
    
    if (!letter) return styles.tile;
    
    const status = getLetterStatus(letter, colIndex, guess, targetWord);
    
    if (hintsUsed.includes(colIndex)) {
      return [styles.tile, styles.hintTile];
    }
    
    switch (status) {
      case 'correct': return [styles.tile, styles.correctTile];
      case 'present': return [styles.tile, styles.presentTile];
      case 'absent': return [styles.tile, styles.absentTile];
      default: return styles.tile;
    }
  };

  const getKeyStyle = (key) => {
    if (key === 'ENTER' || key === 'DELETE') {
      return [styles.key, styles.specialKey];
    }
    
    const status = usedLetters[key];
    switch (status) {
      case 'correct': return [styles.key, styles.correctKey];
      case 'present': return [styles.key, styles.presentKey];
      case 'absent': return [styles.key, styles.absentKey];
      default: return styles.key;
    }
  };

  const handleBooster = async (type) => {
    let cost = 0;
    switch (type) {
      case 'dart': cost = 15; break;
      case 'hint': cost = 25; break;
      case 'skip': cost = 50; break;
    }

    const success = await useBooster(type, cost);
    if (!success) {
      Alert.alert('Insufficient Coins', `You need ${cost} coins to use this booster.`);
      return;
    }

    switch (type) {
      case 'dart':
        // Remove up to 3 incorrect letters
        const incorrectLetters = Object.keys(usedLetters).filter(
          letter => usedLetters[letter] === 'absent'
        ).slice(0, 3);
        
        const newUsedLetters = { ...usedLetters };
        incorrectLetters.forEach(letter => {
          newUsedLetters[letter] = 'removed';
        });
        setUsedLetters(newUsedLetters);
        break;
        
      case 'hint':
        // Reveal one correct letter
        const availablePositions = [];
        for (let i = 0; i < 5; i++) {
          if (!hintsUsed.includes(i)) {
            availablePositions.push(i);
          }
        }
        
        if (availablePositions.length > 0) {
          const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
          setHintsUsed(prev => [...prev, randomPos]);
          
          // Update current guess to include the hint
          const newGuess = currentGuess.split('');
          newGuess[randomPos] = targetWord[randomPos];
          setCurrentGuess(newGuess.join('').slice(0, 5));
        }
        break;
        
      case 'skip':
        // Skip to next level
        router.replace('/');
        break;
    }
    
    setShowBoosterMenu(false);
  };

  const renderGameResult = () => {
    if (gameStatus === 'playing') return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={[styles.resultText, { color: gameStatus === 'won' ? '#6aaa64' : '#ff4444' }]}>
          {gameStatus === 'won' ? 'Congratulations!' : 'Game Over'}
        </Text>
        <Text style={styles.targetWordText}>
          The word was: {targetWord}
        </Text>
        <View style={styles.resultButtons}>
          <TouchableOpacity 
            style={styles.resultButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.resultButtonText}>Home</Text>
          </TouchableOpacity>
          {gameStatus === 'won' && (
            <TouchableOpacity 
              style={[styles.resultButton, styles.nextLevelButton]}
              onPress={() => {
                // Reset game state for next level
                const word = getRandomWord();
                setTargetWord(word);
                setGuesses(Array(6).fill(''));
                setCurrentGuess('');
                setCurrentRow(0);
                setGameStatus('playing');
                setUsedLetters({});
                setHintsUsed([]);
                setStartTime(Date.now());
                startGame(currentLevel + 1);
              }}
            >
              <Text style={styles.resultButtonText}>Next Level</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.coinsInfo}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
          <TouchableOpacity 
            style={styles.boosterButton}
            onPress={() => setShowBoosterMenu(true)}
          >
            <Ionicons name="flash" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Grid */}
      <View style={styles.gameGrid}>
        {Array(6).fill(null).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array(5).fill(null).map((_, colIndex) => {
              const guess = guesses[rowIndex];
              const letter = rowIndex === currentRow ? 
                (currentGuess[colIndex] || '') : 
                (guess[colIndex] || '');
              
              return (
                <View key={colIndex} style={getTileStyle(rowIndex, colIndex)}>
                  <Text style={styles.tileText}>{letter}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Keyboard */}
      <View style={styles.keyboard}>
        {keyboardRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={getKeyStyle(key)}
                onPress={() => handleKeyPress(key)}
                disabled={usedLetters[key] === 'removed'}
              >
                <Text style={[
                  styles.keyText,
                  (key === 'ENTER' || key === 'DELETE') && styles.specialKeyText,
                  usedLetters[key] === 'removed' && styles.removedKeyText
                ]}>
                  {key === 'DELETE' ? '⌫' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            currentGuess.length !== 5 && styles.submitButtonDisabled,
            !isValidWord(currentGuess) && currentGuess.length === 5 && styles.submitButtonInvalid
          ]}
          onPress={handleSubmitGuess}
          disabled={gameStatus !== 'playing'}
        >
          <Text style={[
            styles.submitButtonText,
            currentGuess.length !== 5 && styles.submitButtonTextDisabled,
            !isValidWord(currentGuess) && currentGuess.length === 5 && styles.submitButtonTextInvalid
          ]}>
            {currentGuess.length !== 5 
              ? 'Enter 5 letters' 
              : !isValidWord(currentGuess) 
                ? 'Not a Word\nTry Again' 
                : 'Submit Guess'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Game Result */}
      {renderGameResult()}

      {/* Booster Menu */}
      {showBoosterMenu && (
        <View style={styles.boosterOverlay}>
          <View style={styles.boosterMenu}>
            <Text style={styles.boosterTitle}>Boosters</Text>
            
            <TouchableOpacity 
              style={styles.boosterOption}
              onPress={() => handleBooster('dart')}
            >
              <Ionicons name="location" size={24} color="#ff6b35" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Dart (15 coins)</Text>
                <Text style={styles.boosterDesc}>Remove 3 incorrect letters</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.boosterOption}
              onPress={() => handleBooster('hint')}
            >
              <Ionicons name="bulb" size={24} color="#ffd60a" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Hint (25 coins)</Text>
                <Text style={styles.boosterDesc}>Reveal 1 correct letter</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.boosterOption}
              onPress={() => handleBooster('skip')}
            >
              <Ionicons name="play-forward" size={24} color="#06d6a0" />
              <View style={styles.boosterInfo}>
                <Text style={styles.boosterName}>Skip (50 coins)</Text>
                <Text style={styles.boosterDesc}>Go to next level</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.boosterCancel}
              onPress={() => setShowBoosterMenu(false)}
            >
              <Text style={styles.boosterCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  boosterButton: {
    padding: 4,
  },
  gameGrid: {
    alignItems: 'center',
    marginVertical: 20,
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
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 4,
  },
  correctTile: {
    backgroundColor: '#6aaa64',
    borderColor: '#6aaa64',
  },
  presentTile: {
    backgroundColor: '#c9b458',
    borderColor: '#c9b458',
  },
  absentTile: {
    backgroundColor: '#787c7e',
    borderColor: '#787c7e',
  },
  hintTile: {
    backgroundColor: '#85c1e9',
    borderColor: '#5dade2',
  },
  tileText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  keyboard: {
    paddingHorizontal: 8,
    marginBottom: 10,
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
  specialKey: {
    paddingHorizontal: 12,
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
  specialKeyText: {
    fontSize: 12,
  },
  removedKeyText: {
    color: '#ccc',
    textDecorationLine: 'line-through',
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  submitButton: {
    backgroundColor: '#6aaa64',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    alignSelf: 'center',
    minHeight: 60,
  },
  submitButtonDisabled: {
    backgroundColor: '#d3d6da',
  },
  submitButtonInvalid: {
    backgroundColor: '#ff6b6b',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  submitButtonTextInvalid: {
    color: 'white',
    fontSize: 14,
    lineHeight: 16,
  },
  resultContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  targetWordText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 32,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  resultButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextLevelButton: {
    backgroundColor: '#6aaa64',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boosterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boosterMenu: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  boosterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  boosterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  boosterInfo: {
    marginLeft: 16,
    flex: 1,
  },
  boosterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  boosterDesc: {
    fontSize: 14,
    color: '#666',
  },
  boosterCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  boosterCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});