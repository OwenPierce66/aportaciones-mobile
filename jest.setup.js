// Mock oficial de AsyncStorage para todas las pruebas: el filtro por categorías
// (CategoryHierarchy) lo usa en muchas pantallas. Una prueba puede volver a mockearlo.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Sin teléfono no llegan las medidas de las barras: el simulador oficial da medidas fijas (si
// no, SafeAreaProvider no dibuja nada, p. ej. dentro de components/Modal).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Simulador oficial de react-native-keyboard-controller (hooks/useAndroidKeyboardHeight).
jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));

// expo-video no trae simulador para jest: un reproductor que no reproduce nada y una vista
// simple. components/Video.js funciona encima de esto igual que en el teléfono.
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createPlayer = () => ({
    play: jest.fn(),
    pause: jest.fn(),
    replay: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    generateThumbnailsAsync: jest.fn(() => Promise.resolve([])),
    loop: false,
    muted: false,
    playing: false,
    currentTime: 0,
    duration: 0,
    status: 'idle',
    timeUpdateEventInterval: 0,
    videoTrack: null,
  });
  return {
    createVideoPlayer: () => createPlayer(),
    useVideoPlayer: (source, setup) => {
      const player = React.useRef(null);
      if (!player.current) {
        player.current = createPlayer();
        setup?.(player.current);
      }
      return player.current;
    },
    VideoView: (props) => React.createElement(View, props),
  };
});
