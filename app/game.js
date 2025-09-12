/**
 * Game (Classic Wordle Level) Screen
 * Purpose: Core Wordle gameplay with 5x6 grid, keyboard, and boosters
 * How to extend: Add power-ups, animations, sound effects, multiplayer modes
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { getRandomWord, isValidWord } from '../data/words';

const { width } = Dimensions.get('window');
const GRID_SIZE = Math.min(width - 40, 320);
const TILE_SIZE = (GRID_SIZE - 16) / 5;

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

  useEffect(() => {
    if (!gameStarted.current) {
      const word = getRandomWord();
      setTargetWord(word);
      startGame(currentLevel);
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
    if (rowIndex > currentRow) return 'transparent';
    if (rowIndex === currentRow && gameStatus === 'playing') return 'transparent';
    
    if (!letter) return 'transparent';
    
    if (targetWord[position] === letter) return '#6aaa64';
    if (targetWord.includes(letter)) return '#c9b458';
    return '#787c7e';
  };

  const getKeyColor = (key) => {
    const status = keyboardStatus[key];
    if (status === 'correct') return '#6aaa64';
    if (status === 'present') return '#c9b458';
    if (status === 'absent') return '#787c7e';
    return '#ffffff';
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
    if (gameStatus !== 'playing') return;

    if (key === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && key !== 'ENTER' && key !== 'BACK') {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleSubmit = () => {
    if (currentGuess.length !== 5) return;
    if (!isValidWord(currentGuess)) return;
    
    submitGuess();
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5 || !isValidWord(currentGuess)) return;

    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    updateKeyboardStatus(currentGuess, targetWord);

    if (currentGuess === targetWord) {
      setGameStatus('won');
      setTimeout(() => {
        Alert.alert(
          `Level ${currentLevel} Cleared! 🎉`,
          `Great job! You found "${targetWord}" in ${currentRow + 1} attempts!`,
          [
            { text: 'Next Level', onPress: () => router.replace('/') },
            { text: 'Home', onPress: () => router.replace('/') }
          ]
        );
      }, 1000);
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

  const handleBooster = async (type) => {
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
    return currentGuess.length === 5 && isValidWord(currentGuess);
  };

  const getSubmitButtonStyle = () => {
    if (currentGuess.length < 5) return { backgroundColor: '#9ca3af', opacity: 0.6 };
    if (!isValidWord(currentGuess)) return { backgroundColor: '#9ca3af', opacity: 0.6 };
    return { backgroundColor: '#6b7280' };
  };

  const getSubmitButtonText = () => {
    return 'SUBMIT';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={32} color="#4b5563" />
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
                <View
                  key={colIndex}
                  style={[
                    styles.tile,
                    { backgroundColor: getTileColor(letter, colIndex, rowIndex) },
                    isHintTile && styles.hintTile
                  ]}
                >
                  <Text style={styles.tileText}>{letter}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.keyboard}>
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              let keyStyle = [styles.key];
              let textStyle = [styles.keyText];
              
              if (key === 'ENTER') {
                keyStyle.push(styles.enterKey, getSubmitButtonStyle());
                textStyle.push(styles.enterKeyText);
              } else if (key === 'BACK') {
                keyStyle.push(styles.backKey);
              } else {
                keyStyle.push({ backgroundColor: getKeyColor(key) });
                if (getKeyColor(key) !== '#d3d6da') {
                  textStyle.push({ color: 'white' });
                }
              }
              
              return (
                <TouchableOpacity
                  key={key}
                  style={keyStyle}
                  onPress={() => handleKeyPress(key)}
                  disabled={gameStatus !== 'playing'}
                >
                  {key === 'BACK' ? (
                    <Ionicons name="backspace" size={20} color="#333" />
                  ) : (
                    <Text style={textStyle}>
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, getSubmitButtonStyle()]}
          onPress={handleSubmit}
          disabled={!isSubmitEnabled()}
        >
          <Text style={styles.submitButtonText}>{getSubmitButtonText()}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.boostersBar}>
        <TouchableOpacity
          style={[styles.boosterButton, styles.searchBooster, coins < 15 && styles.disabledButton]}
          onPress={() => handleBooster('dart')}
          disabled={coins < 15}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
          <View style={styles.boosterBadge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boosterButton, styles.hintBooster, coins < 25 && styles.disabledButton]}
          onPress={() => handleBooster('hint')}
          disabled={coins < 25 || hintUsed}
        >
          <Ionicons name="refresh" size={24} color="#ffffff" />
          <View style={styles.boosterBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boosterButton, styles.skipBooster, coins < 50 && styles.disabledButton]}
          onPress={() => handleBooster('skip')}
          disabled={coins < 50}
        >
          <Ionicons name="play-forward" size={24} color="#ffffff" />
          <View style={styles.boosterBadge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c4a0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  levelText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
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
    paddingVertical: 30,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  hintTile: {
    borderColor: '#ffd60a',
    borderWidth: 3,
  },
  tileText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  keyboard: {
    paddingHorizontal: 16,
    marginTop: 10,
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
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backKey: {
    minWidth: 48,
    backgroundColor: '#6b7280',
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    zIndex: 10,
    textAlign: 'center',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  boostersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  boosterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  searchBooster: {
    backgroundColor: '#f97316',
  },
  hintBooster: {
    backgroundColor: '#a855f7',
  },
  skipBooster: {
    backgroundColor: '#22c55e',
  },
  boosterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});