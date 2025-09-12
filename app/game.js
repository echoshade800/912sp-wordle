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
const GRID_SIZE = Math.min(width - 40, 350);
const TILE_SIZE = (GRID_SIZE - 20) / 5;

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
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
    if (rowIndex > currentRow) return '#d3d6da';
    if (rowIndex === currentRow && gameStatus === 'playing') return '#d3d6da';
    
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
    } else if (key === 'ENTER') {
      if (currentGuess.length !== 5) return;
      if (!isValidWord(currentGuess)) return;
      
      submitGuess();
    } else if (currentGuess.length < 5 && key !== 'ENTER' && key !== 'BACK') {
      setCurrentGuess(prev => prev + key);
    }
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
    if (currentGuess.length < 5) return { backgroundColor: '#787c7e' };
    if (!isValidWord(currentGuess)) return { backgroundColor: '#ff4444' };
    return { backgroundColor: '#6aaa64' };
  };

  const getSubmitButtonText = () => {
    if (currentGuess.length < 5) return 'ENTER';
    if (!isValidWord(currentGuess)) return 'NOT A WORD';
    return 'ENTER';
  };

  return (
    <SafeAreaView style={styles.container}>
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
                  disabled={!isSubmitEnabled() && key === 'ENTER'}
                >
                  {key === 'BACK' ? (
                    <Ionicons name="backspace" size={20} color="#333" />
                  ) : (
                    <Text style={textStyle}>
                      {key === 'ENTER' ? getSubmitButtonText() : key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.boostersBar}>
        <TouchableOpacity
          style={[styles.boosterButton, coins < 15 && styles.disabledButton]}
          onPress={() => handleBooster('dart')}
          disabled={coins < 15}
        >
          <Ionicons name="location" size={20} color={coins >= 15 ? "#ff6b35" : "#ccc"} />
          <Text style={[styles.boosterText, coins < 15 && styles.disabledText]}>
            Dart (15)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boosterButton, coins < 25 && styles.disabledButton]}
          onPress={() => handleBooster('hint')}
          disabled={coins < 25 || hintUsed}
        >
          <Ionicons name="bulb" size={20} color={coins >= 25 && !hintUsed ? "#ffd60a" : "#ccc"} />
          <Text style={[styles.boosterText, (coins < 25 || hintUsed) && styles.disabledText]}>
            Hint (25)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boosterButton, coins < 50 && styles.disabledButton]}
          onPress={() => handleBooster('skip')}
          disabled={coins < 50}
        >
          <Ionicons name="play-forward" size={20} color={coins >= 50 ? "#06d6a0" : "#ccc"} />
          <Text style={[styles.boosterText, coins < 50 && styles.disabledText]}>
            Skip (50)
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 8,
    marginTop: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 4,
  },
  key: {
    minWidth: 28,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  enterKey: {
    minWidth: 60,
  },
  backKey: {
    minWidth: 40,
    backgroundColor: '#d3d6da',
  },
  keyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  enterKeyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  boostersBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  boosterButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  boosterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  disabledText: {
    color: '#ccc',
  },
});