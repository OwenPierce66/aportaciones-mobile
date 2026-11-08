/**
 * __tests__/utils/topBar.test.js
 *
 * Espacio arriba de las barras superiores: en Android, Expo Go dibuja la app debajo de la
 * barra de estado; en el APK esa barra ya tiene su propio espacio.
 */
const loadTopBarPadding = ({ os, executionEnvironment }) => {
  let topBarPadding;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment } }));
    ({ topBarPadding } = require('../../utils/topBar'));
  });
  return topBarPadding;
};

describe('topBarPadding', () => {
  it('en el APK de Android deja un margen normal', () => {
    expect(loadTopBarPadding({ os: 'android', executionEnvironment: 'bare' })(14)).toBe(19);
  });

  it('en Expo Go deja lugar para la barra de estado', () => {
    expect(loadTopBarPadding({ os: 'android', executionEnvironment: 'storeClient' })(14)).toBe(34);
  });

  it('en iOS y en la web usa el espacio de cada pantalla', () => {
    expect(loadTopBarPadding({ os: 'ios', executionEnvironment: 'bare' })(50)).toBe(50);
    expect(loadTopBarPadding({ os: 'web', executionEnvironment: 'bare' })(34)).toBe(34);
  });
});
