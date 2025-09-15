import { Alert } from 'react-native';

/**
 * Game utility functions
 */
class GameUtils {
  static showNotAWord() {
    Alert.alert(
      'Invalid Word',
      'Please enter a valid 5-letter English word.',
      [{ text: 'OK' }]
    );
  }
}

export default GameUtils;