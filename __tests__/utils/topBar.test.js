/**
 * __tests__/utils/topBar.test.js
 *
 * Espacio arriba de las barras superiores: la barra de estado ya tiene su lugar (App.js), así
 * que en Android basta un margen normal, en el APK y en Expo Go.
 */
const loadTopBarPadding = ({ os }) => {
  let topBarPadding;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    ({ topBarPadding } = require('../../utils/topBar'));
  });
  return topBarPadding;
};

describe('topBarPadding', () => {
  it('en Android deja un margen normal', () => {
    expect(loadTopBarPadding({ os: 'android' })(14)).toBe(19);
  });

  it('en iOS y en la web usa el espacio de cada pantalla', () => {
    expect(loadTopBarPadding({ os: 'ios' })(50)).toBe(50);
    expect(loadTopBarPadding({ os: 'web' })(34)).toBe(34);
  });
});
