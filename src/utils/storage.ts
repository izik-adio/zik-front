import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      // Create a safe copy of the value to avoid circular references
      let safeValue = value;

      // If it's an object, create a clean copy with only serializable properties
      if (typeof value === 'object' && value !== null) {
        safeValue = JSON.parse(
          JSON.stringify(value, (key, val) => {
            // Skip functions, undefined, and symbols
            if (
              typeof val === 'function' ||
              typeof val === 'undefined' ||
              typeof val === 'symbol'
            ) {
              return undefined;
            }
            // Skip properties that start with _ (often internal properties)
            if (typeof key === 'string' && key.startsWith('_')) {
              return undefined;
            }
            return val;
          })
        );
      }

      const jsonValue = JSON.stringify(safeValue);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};