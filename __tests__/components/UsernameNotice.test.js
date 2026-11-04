/**
 * __tests__/components/UsernameNotice.test.js
 *
 * Sin nombre de usuario nadie te puede mencionar: tu perfil te pide elegir uno.
 */
import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import UsernameNotice from '../../components/UsernameNotice';

const textsOf = (renderer) => renderer.root.findAllByType(Text).map((node) => node.props.children);

it('sale solo si falta el usuario y al tocarlo abre dónde elegirlo', () => {
  const onPress = jest.fn();
  let renderer;
  act(() => { renderer = TestRenderer.create(<UsernameNotice user={{ id: 'yo', username: null }} onPress={onPress} />); });
  expect(textsOf(renderer)).toContain('Elige tu nombre de usuario para que te puedan mencionar y etiquetar.');

  const button = renderer.root.findAll((node) => node.props.accessibilityLabel === 'Elegir nombre de usuario' && node.props.onPress)[0];
  act(() => button.props.onPress());
  expect(onPress).toHaveBeenCalled();

  act(() => renderer.update(<UsernameNotice user={{ id: 'yo', username: 'ana' }} onPress={onPress} />));
  expect(renderer.toJSON()).toBeNull();
  // Mientras carga el perfil tampoco sale.
  act(() => renderer.update(<UsernameNotice user={undefined} onPress={onPress} />));
  expect(renderer.toJSON()).toBeNull();
  act(() => renderer.unmount());
});
