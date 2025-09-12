import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility class for AsyncStorage operations
 */
class StorageUtils {
  static miniAppName = 'wordle';
  
  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }
  
  static async saveUserData(userData) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  }
  
  static async getData() {
    try {
      const infoData = await AsyncStorage.getItem(`${this.miniAppName}info`);
      return infoData ? JSON.parse(infoData) : null;
    } catch (error) {
      console.error('Failed to get info data:', error);
      return null;
    }
  }
  
  static async setData(newData) {
    try {
      const oldData = await this.getData();
      const mergedData = oldData ? { ...oldData, ...newData } : newData;
      await AsyncStorage.setItem(`${this.miniAppName}info`, JSON.stringify(mergedData));
      return true;
    } catch (error) {
      console.error('Failed to set info data:', error);
      return false;
    }
  }
}

export default StorageUtils;