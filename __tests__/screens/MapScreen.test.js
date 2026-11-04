/**
 * __tests__/screens/MapScreen.test.js
 *
 * Pestaña Mapa: pide el permiso al abrir, se centra en la persona y explica qué hacer
 * si no se puede mostrar su ubicación. También la versión web (OpenStreetMap).
 */
import React from 'react';
import { Linking, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import * as Location from 'expo-location';
import MapScreen from '../../screens/MapScreen';
import WebMapScreen from '../../screens/MapScreen.web';

const mockAnimateToRegion = jest.fn();
jest.mock('react-native-maps', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  const MockMapView = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({ animateToRegion: mockAnimateToRegion }));
    return props.children ?? null;
  });
  const MockMarker = () => null;
  return { __esModule: true, default: MockMapView, Marker: MockMarker, PROVIDER_GOOGLE: 'google' };
});
jest.mock('@react-navigation/native', () => ({ useFocusEffect: () => {} }));
const mockMapTasks = { data: [] };
jest.mock('@hooks/useApi', () => ({ useMapTasks: () => ({ ...mockMapTasks, refetch: jest.fn() }) }));
const TASKS = [
  { id: 't1', title: 'Consejo cerca', pch: 'consejos', latitude: 28.6, longitude: -106.1, user: { id: 'u1', username: 'ana' } },
  { id: 't2', title: 'Petición', pch: 'peticiones', latitude: 28.7, longitude: -106.2, user: { id: 'u2', username: 'beto' } },
];
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const POSITION = { coords: { latitude: 28.5, longitude: -106.1 } };
const textsOf = (renderer) => renderer.root.findAllByType(Text).map((node) => [].concat(node.props.children).join(''));
const navigation = { navigate: jest.fn() };
const render = async (Screen = MapScreen, options) => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(<Screen navigation={navigation} />, options); });
  return renderer;
};
const pressText = async (renderer, label) => {
  const target = renderer.root.findAll((node) => (
    node.props.onPress && node.findAll((child) => child.type === Text && child.props.children === label).length > 0
  )).pop();
  if (!target) throw new Error(`No hay botón "${label}"`);
  await act(async () => { await target.props.onPress(); });
};
const grant = () => Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });

beforeEach(() => {
  jest.clearAllMocks();
  Location.getLastKnownPositionAsync.mockResolvedValue(null);
  Location.getCurrentPositionAsync.mockResolvedValue(POSITION);
  mockMapTasks.data = [];
});

it('con permiso muestra el punto azul y se centra en la persona', async () => {
  grant();
  const renderer = await render();
  const map = renderer.root.findByProps({ provider: 'google' });
  expect(map.props.showsUserLocation).toBe(true);
  expect(map.props.showsMyLocationButton).toBe(true);
  expect(mockAnimateToRegion).toHaveBeenLastCalledWith(
    { latitude: 28.5, longitude: -106.1, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600,
  );
  expect(textsOf(renderer)).toEqual([]);
  act(() => renderer.unmount());
});

it('si lo niega se puede volver a pedir', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied', canAskAgain: true });
  const renderer = await render();
  expect(renderer.root.findByProps({ provider: 'google' }).props.showsUserLocation).toBe(false);
  expect(textsOf(renderer)).toContain('Activa tu ubicación para verte en el mapa.');

  grant();
  await pressText(renderer, 'Permitir');
  expect(renderer.root.findByProps({ provider: 'google' }).props.showsUserLocation).toBe(true);
  expect(textsOf(renderer)).toEqual([]);
  act(() => renderer.unmount());
});

it('si ya no se puede pedir, lleva a Ajustes', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const renderer = await render();
  await pressText(renderer, 'Abrir Ajustes');
  expect(openSettings).toHaveBeenCalled();
  act(() => renderer.unmount());
});

it('si no se puede leer la posición (GPS apagado) deja reintentar', async () => {
  grant();
  Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('GPS apagado'));
  const renderer = await render();
  expect(textsOf(renderer)).toContain('No pudimos obtener tu ubicación. Revisa que el GPS esté encendido.');
  expect(mockAnimateToRegion).not.toHaveBeenCalled();

  await pressText(renderer, 'Reintentar');
  expect(mockAnimateToRegion).toHaveBeenCalled();
  expect(textsOf(renderer)).toEqual([]);
  act(() => renderer.unmount());
});

it('pone un pin por aportación con ubicación y al tocarlo abre su tarjeta', async () => {
  grant();
  mockMapTasks.data = TASKS;
  const renderer = await render();
  const pins = renderer.root.findAll((node) => node.props.coordinate && node.props.pinColor);
  expect(pins.map((pin) => pin.props.coordinate)).toEqual([
    { latitude: 28.6, longitude: -106.1 }, { latitude: 28.7, longitude: -106.2 },
  ]);
  expect(pins[0].props.pinColor).not.toBe(pins[1].props.pinColor);

  await act(async () => { pins[1].props.onPress({ stopPropagation: jest.fn() }); });
  expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Petición', 'peticiones · @beto']));
  await pressText(renderer, 'Ver aportación');
  expect(navigation.navigate).toHaveBeenCalledWith('Tasks', { screen: 'TaskDetail', params: { taskId: 't2' } });
  act(() => renderer.unmount());
});

it('en la web usa Leaflet: pines de las aportaciones y la persona al centro', async () => {
  grant();
  mockMapTasks.data = TASKS;
  const handlers = [];
  const layer = () => ({ addTo: jest.fn().mockReturnThis(), clearLayers: jest.fn() });
  const map = { setView: jest.fn().mockReturnThis(), on: jest.fn(), remove: jest.fn() };
  const markers = [];
  window.L = {
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => layer()),
    layerGroup: jest.fn(() => layer()),
    DomEvent: { stopPropagation: jest.fn() },
    circleMarker: jest.fn((point, style) => {
      const marker = { point, style, on: jest.fn((name, fn) => { handlers.push(fn); return marker; }), addTo: jest.fn() };
      markers.push(marker);
      return marker;
    }),
  };
  const renderer = await render(WebMapScreen, { createNodeMock: () => ({}) });
  await act(async () => {});
  expect(markers.slice(0, 2).map((m) => m.point)).toEqual([[28.6, -106.1], [28.7, -106.2]]);
  expect(map.setView).toHaveBeenLastCalledWith([28.5, -106.1], 13);

  await act(async () => { handlers[0]({}); });
  expect(textsOf(renderer)).toContain('Consejo cerca');
  act(() => renderer.unmount());
  expect(map.remove).toHaveBeenCalled();
  delete window.L;
});
