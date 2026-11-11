/**
 * utils/topBar.js
 *
 * Espacio arriba de las barras superiores. La barra de estado del teléfono ya tiene su lugar
 * (App.js deja libre ese espacio con SafeAreaView), así que en Android basta un margen normal.
 */
import { Platform } from 'react-native';

const ANDROID_TOP = 19;

/** El espacio en Android; en las demás plataformas, el que se pase. */
export const topBarPadding = (otherPlatforms) => (Platform.OS === 'android' ? ANDROID_TOP : otherPlatforms);
