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
      console.log(`Storage: Set item "${key}" (${jsonValue.length} bytes)`);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      console.log(`Storage: Get item "${key}" - ${jsonValue ? 'found' : 'not found'}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Storage: Removed item "${key}"`);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('Storage: Cleared all data');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
  
  // Debug utility to list all keys in storage
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },
  
  // Debug utility to dump all storage contents
  async dumpStorage(): Promise<Record<string, any>> {
    try {
      const keys = await this.getAllKeys();
      const result: Record<string, any> = {};
      
      for (const key of keys) {
        const value = await this.getItem(key);
        result[key] = value;
      }
      
      return result;
    } catch (error) {
      console.error('Error dumping storage:', error);
      return {};
    }
  }
};
