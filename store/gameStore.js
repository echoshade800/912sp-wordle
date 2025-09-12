import { create } from 'zustand';
import StorageUtils from '../utils/StorageUtils';

const useGameStore = create((set, get) => ({
  // User data
  userData: null,
  storageData: null,
  
  // Game state
  currentLevel: 1,
  coins: 100,
  maxLevel: 1,
  maxScore: 0,
  maxTime: 0,
  
  // Game progress
  gameHistory: [],
  currentGame: null,
  
  // Initialize app data
  initializeApp: async () => {
    try {
      const userData = await StorageUtils.getUserData();
      const storageData = await StorageUtils.getData();
      
      const gameData = storageData || {
        maxLevel: 1,
        maxScore: 0,
        maxTime: 0,
        coins: 100,
        currentLevel: 1,
        gameHistory: []
      };
      
      set({
        userData,
        storageData: gameData,
        maxLevel: gameData.maxLevel,
        maxScore: gameData.maxScore,
        maxTime: gameData.maxTime,
        coins: gameData.coins,
        currentLevel: gameData.currentLevel,
        gameHistory: gameData.gameHistory || []
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  },
  
  // Update game data and persist to storage
  updateGameData: async (updates) => {
    const currentData = get();
    const newData = { ...currentData, ...updates };
    
    // Update state
    set(updates);
    
    // Persist to storage
    try {
      await StorageUtils.setData({
        maxLevel: newData.maxLevel,
        maxScore: newData.maxScore,
        maxTime: newData.maxTime,
        coins: newData.coins,
        currentLevel: newData.currentLevel,
        gameHistory: newData.gameHistory
      });
    } catch (error) {
      console.error('Failed to update game data:', error);
    }
  },
  
  // Start a new game
  startGame: (level) => {
    set({
      currentGame: {
        level,
        attempts: 0,
        startTime: Date.now(),
        guesses: [],
        isComplete: false,
        isWon: false
      }
    });
  },
  
  // Complete current game
  completeGame: async (won, finalTime, isBoosterSkip = false) => {
    const { currentGame, gameHistory, maxLevel, maxScore, maxTime, coins } = get();
    if (!currentGame) return;
    
    // Calculate coins earned based on which row the word was guessed
    let coinsEarned = 0;
    if (won && !isBoosterSkip) {
      const guessedRow = currentGame.attempts; // 0-based index (0 = first row, 1 = second row, etc.)
      switch (guessedRow) {
        case 0: coinsEarned = 50; break; // First row
        case 1: coinsEarned = 40; break; // Second row
        case 2: coinsEarned = 30; break; // Third row
        case 3: coinsEarned = 20; break; // Fourth row
        case 4: coinsEarned = 15; break; // Fifth row
        case 5: coinsEarned = 10; break; // Sixth row
        default: coinsEarned = 10; break; // Fallback
      }
    }
    
    const completedGame = {
      ...currentGame,
      isComplete: true,
      isWon: won,
      completionTime: finalTime,
      score: won ? Math.max(0, 100 - (currentGame.attempts * 10)) : 0,
      coinsEarned
    };
    
    const newHistory = [completedGame, ...gameHistory].slice(0, 50); // Keep last 50 games
    const updates = { 
      gameHistory: newHistory, 
      currentGame: null 
    };
    
    // Update records if this is a winning game
    if (won) {
      updates.maxLevel = Math.max(maxLevel, currentGame.level);
      updates.maxScore = Math.max(maxScore, completedGame.score);
      updates.maxTime = maxTime === 0 ? finalTime : Math.min(maxTime, finalTime);
      updates.coins = coins + coinsEarned;
      updates.currentLevel = currentGame.level + 1;
    }
    
    await get().updateGameData(updates);
    return coinsEarned;
  },
  
  // Use booster
  useBooster: async (type, cost) => {
    const { coins } = get();
    if (coins >= cost) {
      await get().updateGameData({ coins: coins - cost });
      return true;
    }
    return false;
  }
}));

export default useGameStore;