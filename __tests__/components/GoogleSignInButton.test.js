/**
 * __tests__/components/GoogleSignInButton.test.js
 *
 * "Continuar con Google": solo con ID de cliente; el id_token de Google se cambia en el
 * servidor por la sesión, como al entrar con correo.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import api, { saveAuthData } from '@api';
import { AuthContext } from '@app';
import GoogleSignInButton from '../../components/GoogleSignInButton';

let mockExtra = {};
let mockResponse = null;
const mockPromptAsync = jest.fn();

jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return { extra: mockExtra }; } } }));
// El ícono real carga su fuente con el expo-constants de verdad.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: jest.fn(() => [{ url: 'https://accounts.google.com/o/oauth2/v2/auth' }, mockResponse, mockPromptAsync]),
}));
jest.mock('@api', () => ({ __esModule: true, default: { post: jest.fn() }, saveAuthData: jest.fn() }));
jest.mock('@app', () => ({ AuthContext: require('react').createContext({}) }));

const ALL_PLATFORMS = { googleClientIds: { web: 'web-id', android: 'android-id', ios: 'ios-id' } };
const signIn = jest.fn();
const onError = jest.fn();
const screen = () => (
  <AuthContext.Provider value={{ signIn }}>
    <GoogleSignInButton onError={onError} />
  </AuthContext.Provider>
);
const googleButton = (renderer) => renderer.root.findAll((node) => node.props.accessibilityLabel === 'Continuar con Google' && node.props.onPress)[0];

let renderer;
beforeEach(() => {
  mockExtra = {};
  mockResponse = null;
  jest.clearAllMocks();
});
afterEach(() => act(() => renderer?.unmount()));

it('sin ID de cliente de Google no sale', () => {
  act(() => { renderer = TestRenderer.create(screen()); });
  expect(renderer.toJSON()).toBeNull();
});

it('con la cuenta de Google elegida, entra con la sesión que da el servidor', async () => {
  mockExtra = ALL_PLATFORMS;
  api.post.mockResolvedValue({ data: { access: 'acceso', refresh: 'renovar', created: true } });
  act(() => { renderer = TestRenderer.create(screen()); });

  act(() => googleButton(renderer).props.onPress());
  expect(mockPromptAsync).toHaveBeenCalled();
  expect(onError).toHaveBeenLastCalledWith('');

  mockResponse = { type: 'success', params: { id_token: 'token-de-google' } };
  await act(async () => { renderer.update(screen()); });
  expect(api.post).toHaveBeenCalledWith('auth/google/', { id_token: 'token-de-google' });
  expect(saveAuthData).toHaveBeenCalledWith({ access: 'acceso', refresh: 'renovar', created: true });
  expect(signIn).toHaveBeenCalledWith('acceso');
});

it('si el servidor no lo acepta, muestra por qué', async () => {
  mockExtra = ALL_PLATFORMS;
  api.post.mockRejectedValue({ response: { data: { detail: 'Esta cuenta está desactivada.' } } });
  mockResponse = { type: 'success', params: { id_token: 'token-de-google' } };
  await act(async () => { renderer = TestRenderer.create(screen()); });
  expect(onError).toHaveBeenLastCalledWith('Esta cuenta está desactivada.');
  expect(signIn).not.toHaveBeenCalled();
  expect(googleButton(renderer).props.disabled).toBe(false);
});
