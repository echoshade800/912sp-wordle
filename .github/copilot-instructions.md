# Copilot Instructions for Wordle Mini App

## Project Overview
- **Type:** React Native app using Expo, file-based routing, and Zustand for state
- **Goal:** Wordle-style game with level progression, coins, boosters, and stats

## Key Architecture
- **Pages:** All screens in `app/` (e.g., `game.js`, `index.js`, `onboarding.js`)
- **Navigation:** Expo Router, file-based, see `app/_layout.js` for stack setup
- **State:** Global state in `store/gameStore.js` (Zustand, persistent via AsyncStorage)
- **Data:** Word lists in `data/words.js`; persistent user/game data via `utils/StorageUtils.js`
- **Custom Hooks:** See `hooks/useFrameworkReady.js`

## Developer Workflows
- **Install:** `npm install` (see README)
- **Dev server:** `npm run dev` or `expo start`
- **Web build:** `npm run build:web`
- **iOS/Android build:** `expo build:ios` / `expo build:android`
- **iOS deploy:** See `deploy_ios.sh` for S3 upload and config update

## Project Conventions
- **Screens:** Each file in `app/` is a screen; export a default React component
- **Navigation:** Use `router.push()` for programmatic navigation
- **State:** Use Zustand hooks from `store/gameStore.js` for all global state
- **Storage:** Use `StorageUtils` for AsyncStorage access; do not use AsyncStorage directly
- **Styling:** Use React Native `StyleSheet`; follow 8px spacing, system fonts, and color palette (see README)
- **Game Logic:** Extend/modify in `app/game.js` and `store/gameStore.js`
- **Word List:** Update `data/words.js` for new words

## Integration & Patterns
- **Boosters:** Dart, Hint, Skip—see logic in `app/game.js` and state in `gameStore.js`
- **Onboarding:** Multi-slide tutorial in `app/onboarding.js`
- **Stats:** Calculated and displayed in `app/stats.js`
- **About/Help:** Rules, tips, and support in `app/about.js`
- **External:** Uses `@expo/vector-icons`, Expo Router, Zustand, AsyncStorage

## Examples
- **Add a new screen:** Create `app/yourScreen.js`, export default component, navigation handled by file name
- **Add a new booster:** Update logic in `gameStore.js` and UI in `game.js`
- **Change word list:** Edit `data/words.js`

## References
- See `README.md` for more details on features, structure, and customization
- For deployment, see `deploy_ios.sh` and `update_monster_config.cjs`

---
For any unclear conventions or missing patterns, consult the README or ask for clarification.