/**
 * app.config.js
 *
 * Reemplaza app.json para poder inyectar variables de entorno desde .env
 * en la configuración de Expo (accesibles vía expo-constants en runtime).
 *
 * Las variables de .env se leen aquí en BUILD TIME y se exponen en:
 *   import Constants from 'expo-constants';
 *   Constants.expoConfig.extra.apiUrl
 *   Constants.expoConfig.extra.apiLocalIp
 *   Constants.expoConfig.extra.apiPort
 */

// Expo carga el .env solo (también al compilar el APK: expo-constants lo lee).
const LOCAL_IP  = process.env.LOCAL_IP   || '192.168.1.115';
const API_PORT  = process.env.API_PORT   || '8001';
const API_URL   = process.env.API_URL   || process.env.EXPO_PUBLIC_API_URL || '';
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
// Entrar con Google: IDs de cliente OAuth por plataforma (sin el de la plataforma no sale el botón).
const GOOGLE_CLIENT_IDS = {
  web:     process.env.GOOGLE_WEB_CLIENT_ID     || '',
  android: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
  ios:     process.env.GOOGLE_IOS_CLIENT_ID     || '',
};

module.exports = {
  expo: {
    name:        'Aportaciones',
    slug:        'aportaciones-mobile',
    version:     '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    // aportaciones://… abre la app; com.aportaciones.app:/… es donde vuelve el login de Google.
    scheme: ['aportaciones', 'com.aportaciones.app'],
    ios: {
      supportsTablet: true,
      config: { googleMapsApiKey: GOOGLE_MAPS_API_KEY },
    },
    android: {
      package: 'com.aportaciones.app',
      // Permisos que traen las librerías y la app no usa. Play pide justificar los de fotos y
      // videos (READ_MEDIA_*) y solo los acepta si la app necesita ver toda la galería; para
      // guardar descargas no hacen falta.
      blockedPermissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.RECORD_AUDIO',
        // "Mostrar sobre otras apps": la plantilla lo trae y la app no lo usa.
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
    },
    web: {},

    plugins: [
      // Lo que no sale de Expo y antes se escribía a mano en android/ (ver el archivo).
      './plugins/withAndroidEnv',
      // Sin minificar (R8) el release, como antes: minificado, WorkManager no arranca
      // ("Failed to create an instance of ... WorkDatabase") y la app se cierra al abrir.
      ['expo-build-properties', { android: { enableMinifyInReleaseBuilds: false } }],
      // Mapa en Android: la clave se lee del .env al compilar (withAndroidEnv), así no queda en git.
      ['react-native-maps', { androidGoogleMapsApiKey: '${googleMapsApiKey}' }],
      // Fotos y videos se eligen con el selector del sistema: sin cámara ni micrófono.
      ['expo-image-picker', { cameraPermission: false, microphonePermission: false }],
      'expo-secure-store',
      'expo-video',
      // Mapa (menú lateral): solo se pide mientras se usa la app.
      [
        'expo-location',
        { locationWhenInUsePermission: 'Aportaciones usa tu ubicación para mostrarte en el mapa.' },
      ],
      // Descargar imágenes y videos de las aportaciones a la galería.
      [
        'expo-media-library',
        {
          photosPermission: 'Permite que Aportaciones acceda a tus fotos para guardar lo que descargas.',
          savePhotosPermission: 'Permite que Aportaciones guarde en tu galería las imágenes y videos que descargas.',
          isAccessMediaLocationEnabled: false,
          // Solo se guardan descargas, y eso no pide permiso desde Android 10.
          granularPermissions: [],
        },
      ],
    ],

    // ─── Variables accesibles en runtime ──────────────────────────────────
    extra: {
      /** URL base del backend; si no se define, se elige según el entorno */
      apiUrl: API_URL,
      /** IP local del backend — usada en iOS/Android para conectar via red */
      apiLocalIp: LOCAL_IP,
      /** Puerto del proxy nginx */
      apiPort: API_PORT,
      /** DSN de Sentry para crash reporting (vacío = deshabilitado) */
      sentryDsn: SENTRY_DSN,
      /** Entrar con Google: { web, android, ios } (vacío = sin el botón en esa plataforma) */
      googleClientIds: GOOGLE_CLIENT_IDS,
    },
  },
};
