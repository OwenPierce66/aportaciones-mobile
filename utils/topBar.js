/**
 * utils/topBar.js
 *
 * Espacio arriba de las barras superiores. En Android, Expo Go dibuja la app debajo de la
 * barra de estado del teléfono y hay que dejarle lugar; en el APK esa barra ya tiene su propio
 * espacio y basta con un margen normal.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ANDROID_TOP = Constants?.executionEnvironment === 'storeClient' ? 34 : 19;

/** El espacio en Android; en las demás plataformas, el que se pase. */
export const topBarPadding = (otherPlatforms) => (Platform.OS === 'android' ? ANDROID_TOP : otherPlatforms);
