/**
 * __tests__/components/SideMenu.test.js
 *
 * El menú lateral lleva a las secciones de la app, también al Mapa (que no tiene botón en la
 * barra de abajo).
 */
import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import SideMenu from '../../components/SideMenu';

const tabs = {
  getState: () => ({ type: 'tab', routeNames: ['Tasks', 'HomeTab', 'Reels', 'Messages', 'Notifications', 'Profile', 'Map'] }),
  navigate: jest.fn(),
};
// La pantalla con el menú está dentro de la pila de una pestaña.
const screen = { getState: () => ({ type: 'stack' }), getParent: () => tabs, navigate: jest.fn() };

const press = (renderer, label) => {
  const button = renderer.root.findAll((node) => node.props.onPress && (
    node.props.accessibilityLabel === label
    || node.findAll((child) => child.type === Text && child.props.children === label).length > 0
  ))[0];
  act(() => button.props.onPress());
};

it('abre el Mapa en su pestaña', () => {
  let renderer;
  act(() => { renderer = TestRenderer.create(<SideMenu navigation={screen} user={{ username: 'ana' }} />); });
  press(renderer, 'Abrir menú lateral');
  press(renderer, 'Mapa');
  expect(tabs.navigate).toHaveBeenCalledWith('Map', undefined);
  expect(screen.navigate).not.toHaveBeenCalled();
  act(() => renderer.unmount());
});
