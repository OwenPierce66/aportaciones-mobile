/**
 * secureStorage.js
 *
 * Wrapper de almacenamiento seguro multiplataforma:
 * - En Android/iOS: usa expo-secure-store (Android Keystore / iOS Keychain)
 * - En Web:         usa AsyncStorage como fallback (los navegadores no tienen Keystore nativo)
 *
 * Importa siempre desde aquí, nunca directamente de las librerías nativas.
 *
 * Antes era react-native-encrypted-storage, que no sirve con la arquitectura nueva de React
 * Native: al instalar esta versión encima de una vieja, la sesión guardada no se lee y hay que
 * entrar de nuevo una vez.
 */

import { Platform } from 'react-native';

let storage;

if (Platform.OS === 'web') {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  storage = {
    setItem:    (key, value) => AsyncStorage.setItem(key, value),
    getItem:    (key)        => AsyncStorage.getItem(key),
    removeItem: (key)        => AsyncStorage.removeItem(key),
  };
} else {
  const SecureStore = require('expo-secure-store');

  storage = {
    setItem:    (key, value) => SecureStore.setItemAsync(key, value),
    getItem:    (key)        => SecureStore.getItemAsync(key),
    removeItem: (key)        => SecureStore.deleteItemAsync(key),
  };
}

export default storage;
