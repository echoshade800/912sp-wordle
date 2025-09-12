# Wordle Mini App

A complete React Native Wordle game built with Expo, featuring level progression, coins, boosters, and comprehensive game statistics.

## Features

- **Classic Wordle Gameplay**: 5x6 grid with color-coded feedback
- **Level Progression**: Advance through unlimited levels
- **Coin System**: Earn coins by completing levels
- **Boosters**: Dart (remove incorrect letters), Hint (reveal correct letter), Skip (advance level)
- **Statistics**: Track max level, score, time, win rate, and game history
- **Onboarding**: Interactive tutorial for new players
- **Responsive Design**: Works on iOS, Android, and Web

## Installation

```bash
# Install dependencies
npm install

# Install Expo CLI (if not already installed)
npm install -g @expo/cli

# Start development server
npm run dev
```

## Running the App

### Development
```bash
# Start Expo development server
npm run dev

# Or use expo directly
expo start
```

### Build for Production
```bash
# Web build
npm run build:web

# iOS build (requires Apple Developer account)
expo build:ios

# Android build
expo build:android
```

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── _layout.js         # Root layout with navigation
│   ├── index.js           # Home/Dashboard screen
│   ├── game.js            # Core Wordle gameplay
│   ├── stats.js           # Statistics and history
│   └── about.js           # Help and rules
├── store/                 # State management
│   └── gameStore.js       # Zustand store for game state
├── utils/                 # Utilities
│   └── StorageUtils.js    # AsyncStorage wrapper
├── data/                  # Game data
│   └── words.js           # Word dictionary
└── hooks/                 # Custom hooks
    └── useFrameworkReady.js
```

## Key Technologies

- **Expo 53.0.20**: React Native framework
- **Expo Router**: File-based navigation
- **Zustand**: Lightweight state management
- **AsyncStorage**: Local data persistence
- **@expo/vector-icons**: Icon components

## Game Rules

1. Guess the hidden 5-letter word in 6 attempts
2. Each guess must be a valid English word
3. Color feedback after each guess:
   - 🟩 **Green**: Correct letter in correct position
   - 🟨 **Yellow**: Correct letter in wrong position
   - ⬜ **Gray**: Letter not in word

## Boosters

- **Dart (15 coins)**: Remove up to 3 incorrect letters from keyboard
- **Hint (25 coins)**: Reveal and lock 1 correct letter position
- **Skip (50 coins)**: Advance to next level without completing current

## Architecture

### State Management
The app uses Zustand for global state management with persistent storage via AsyncStorage. Key state includes:
- User progress (level, coins, stats)
- Game history
- Current game state

### Storage
`StorageUtils` class provides a clean interface for AsyncStorage operations:
- `getUserData()`: Retrieve user profile data
- `getData()`: Get app-specific game data
- `setData()`: Save game progress and statistics

### Navigation
Expo Router provides file-based routing:
- Stack navigation for main screens
- Programmatic navigation for game flow
- Deep linking support

## Next Steps

Here are 5-8 concrete follow-up tasks to enhance the app:

1. **API Integration**: Connect to external word API for dynamic word lists and validation
2. **User Authentication**: Add user accounts with cloud save/sync via Firebase or Supabase
3. **Daily Challenges**: Implement daily words with leaderboards and special rewards
4. **Achievements System**: Add badges for milestones (streak days, perfect games, speed records)
5. **Social Features**: Share results, compete with friends, weekly tournaments
6. **Enhanced Animations**: Add tile flip animations, confetti effects, smooth transitions
7. **Accessibility**: Implement VoiceOver support, high contrast mode, larger text options
8. **Push Notifications**: Daily reminders, achievement unlocks, challenge announcements

## Customization

### Adding New Screens
1. Create a new file in `app/` directory
2. Export default React component
3. Add navigation logic in existing screens

### Extending Game Logic
- Modify `data/words.js` for custom word lists
- Update `gameStore.js` for new game mechanics
- Customize scoring in the game completion logic

### Styling
The app uses React Native StyleSheet with a consistent design system:
- Colors: Green (#6aaa64), Yellow (#c9b458), Gray (#787c7e)
- Typography: System fonts with proper hierarchy
- Spacing: 8px grid system

## Support

For issues or questions, create an issue in the repository or contact support through the app's About screen.

## License

MIT License - feel free to modify and distribute as needed.