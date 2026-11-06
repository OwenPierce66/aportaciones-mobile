/**
 * __tests__/screens/DeleteAccountScreen.test.js
 *
 * Eliminar la cuenta: pide escribir ELIMINAR y la contraseña o confirmar con Google (las
 * cuentas creadas con Google solo con Google); al terminar cierra la sesión local.
 */
import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import api from '@api';
import { AuthContext } from '@app';
import DeleteAccountScreen from '../../screens/DeleteAccountScreen';

let mockExtra = {};
let mockResponse = null;
const mockPromptAsync = jest.fn();

jest.mock('@api', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('@app', () => ({ AuthContext: require('react').createContext({}) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return { extra: mockExtra }; } } }));
// El ícono real carga su fuente con el expo-constants de verdad.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: jest.fn(() => [{ url: 'https://accounts.google.com/o/oauth2/v2/auth' }, mockResponse, mockPromptAsync]),
}));

const GOOGLE_READY = { googleClientIds: { web: 'web-id', android: 'android-id', ios: 'ios-id' } };
const GOOGLE_LABEL = 'Confirmar con Google y eliminar';
const signOut = jest.fn();
const navigation = { goBack: jest.fn() };
const textsOf = (renderer) => renderer.root.findAllByType(Text)
  .map((node) => [].concat(node.props.children).filter((p) => typeof p === 'string').join(''));
const input = (renderer, placeholder) => renderer.root.findAllByType(TextInput).find((node) => node.props.placeholder === placeholder);
const buttonNamed = (renderer, label) => renderer.root.findAllByType(TouchableOpacity)
  .find((node) => node.props.accessibilityLabel === label);
const deleteButton = (renderer) => buttonNamed(renderer, 'Eliminar mi cuenta para siempre');
const screen = (user) => (
  <AuthContext.Provider value={{ signOut, user }}>
    <DeleteAccountScreen navigation={navigation} />
  </AuthContext.Provider>
);
const open = async (user = { has_password: true }) => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(screen(user)); });
  return renderer;
};
const typeWord = (renderer, word = 'eliminar') => act(async () => { input(renderer, 'ELIMINAR').props.onChangeText(word); });
const fill = async (renderer, { password = 'mi-clave', word = 'eliminar' } = {}) => {
  await act(async () => { input(renderer, 'Contraseña').props.onChangeText(password); });
  await typeWord(renderer, word);
};
const pressDelete = (renderer) => act(async () => { deleteButton(renderer).props.onPress(); });
// Google responde con la cuenta elegida: la pantalla se vuelve a dibujar con ese resultado.
const chooseGoogleAccount = async (renderer, user) => {
  act(() => buttonNamed(renderer, GOOGLE_LABEL).props.onPress());
  expect(mockPromptAsync).toHaveBeenCalled();
  mockResponse = { type: 'success', params: { id_token: 'token-de-google' } };
  await act(async () => { renderer.update(screen(user)); });
};

beforeEach(() => {
  mockExtra = {};
  mockResponse = null;
  jest.clearAllMocks();
});

it('explica lo que se pierde', async () => {
  const renderer = await open();
  const texts = textsOf(renderer).join(' ');
  expect(texts).toContain('no se puede deshacer');
  expect(texts).toContain('suscripciones');
  act(() => renderer.unmount());
});

it('no deja eliminar sin la contraseña y la palabra', async () => {
  const renderer = await open();
  expect(deleteButton(renderer).props.disabled).toBe(true);
  await fill(renderer, { word: 'borrar' });
  expect(deleteButton(renderer).props.disabled).toBe(true);
  await pressDelete(renderer);
  expect(api.post).not.toHaveBeenCalled();
  await fill(renderer, { password: '', word: 'ELIMINAR' });
  expect(deleteButton(renderer).props.disabled).toBe(true);
  act(() => renderer.unmount());
});

it('elimina la cuenta y cierra la sesión sin volver a llamar al servidor', async () => {
  const renderer = await open();
  await fill(renderer);
  api.post.mockResolvedValueOnce({ status: 204 });
  await pressDelete(renderer);
  expect(api.post).toHaveBeenCalledWith('users/me/delete/', { password: 'mi-clave' }, expect.any(Object));
  expect(signOut).toHaveBeenCalledWith({ accountDeleted: true });
  act(() => renderer.unmount());
});

it('una contraseña incorrecta se muestra y no cierra la sesión', async () => {
  const renderer = await open();
  await fill(renderer);
  api.post.mockRejectedValueOnce({ response: { status: 400, data: { password: ['La contraseña no es correcta.'] } } });
  await pressDelete(renderer);
  expect(textsOf(renderer)).toContain('La contraseña no es correcta.');
  expect(signOut).not.toHaveBeenCalled();
  expect(deleteButton(renderer).props.disabled).toBe(false);
  act(() => renderer.unmount());
});

it('si no se pudieron cancelar los cobros, avisa que la cuenta sigue activa', async () => {
  const renderer = await open();
  await fill(renderer);
  const detail = 'No pudimos cancelar tus suscripciones. Tu cuenta sigue activa: intenta de nuevo.';
  api.post.mockRejectedValueOnce({ response: { status: 503, data: { detail } } });
  await pressDelete(renderer);
  expect(textsOf(renderer)).toContain(detail);
  expect(signOut).not.toHaveBeenCalled();
  act(() => renderer.unmount());
});

it('sin conexión también lo dice', async () => {
  const renderer = await open();
  await fill(renderer);
  api.post.mockRejectedValueOnce(new Error('Network Error'));
  await pressDelete(renderer);
  expect(textsOf(renderer).join(' ')).toContain('Revisa tu conexión');
  act(() => renderer.unmount());
});

it('sin ID de cliente de Google solo se confirma con la contraseña', async () => {
  const renderer = await open();
  expect(buttonNamed(renderer, GOOGLE_LABEL)).toBeUndefined();
  expect(deleteButton(renderer)).toBeDefined();
  act(() => renderer.unmount());
});

it('con contraseña también se puede confirmar con Google, después de escribir la palabra', async () => {
  mockExtra = GOOGLE_READY;
  const user = { has_password: true };
  const renderer = await open(user);
  expect(deleteButton(renderer)).toBeDefined();
  expect(buttonNamed(renderer, GOOGLE_LABEL).props.disabled).toBe(true);

  await typeWord(renderer);
  api.post.mockResolvedValueOnce({ status: 204 });
  await chooseGoogleAccount(renderer, user);
  expect(api.post).toHaveBeenCalledWith('users/me/delete/', { id_token: 'token-de-google' }, expect.any(Object));
  expect(signOut).toHaveBeenCalledWith({ accountDeleted: true });
  act(() => renderer.unmount());
});

it('una cuenta creada con Google no ve la contraseña y confirma con Google', async () => {
  mockExtra = GOOGLE_READY;
  const user = { has_password: false };
  const renderer = await open(user);
  expect(input(renderer, 'Contraseña')).toBeUndefined();
  expect(deleteButton(renderer)).toBeUndefined();

  await typeWord(renderer);
  api.post.mockRejectedValueOnce({ response: { status: 400, data: { id_token: ['Elige la cuenta de Google ana@gmail.com.'] } } });
  await chooseGoogleAccount(renderer, user);
  expect(textsOf(renderer)).toContain('Elige la cuenta de Google ana@gmail.com.');
  expect(signOut).not.toHaveBeenCalled();
  expect(buttonNamed(renderer, GOOGLE_LABEL).props.disabled).toBe(false);
  act(() => renderer.unmount());
});

it('una cuenta creada con Google, sin Google en esta app, sabe qué hacer', async () => {
  const renderer = await open({ has_password: false });
  expect(buttonNamed(renderer, GOOGLE_LABEL)).toBeUndefined();
  expect(textsOf(renderer).join(' ')).toContain('¿Olvidaste tu contraseña?');
  act(() => renderer.unmount());
});
