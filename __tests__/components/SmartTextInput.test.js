/**
 * __tests__/components/SmartTextInput.test.js
 *
 * Al escribir @ sugiere personas y al escribir # hashtags; tocar una sugerencia completa
 * la palabra.
 */
import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import api from '@api';
import SmartTextInput from '../../components/SmartTextInput';

jest.mock('@api', () => ({ __esModule: true, default: { get: jest.fn() } }));

let lastValue;
const Host = ({ initial = '' }) => {
  const [value, setValue] = useState(initial);
  lastValue = value;
  return <SmartTextInput value={value} onChangeText={setValue} placeholder="Descripción" />;
};

const inputOf = (renderer) => renderer.root.findByType(TextInput);
const labels = (renderer) => renderer.root.findAllByType(Text).map((node) => node.props.children);
const typeAt = async (renderer, text, cursor = text.length) => {
  await act(async () => {
    inputOf(renderer).props.onChangeText(text);
    inputOf(renderer).props.onSelectionChange({ nativeEvent: { selection: { start: cursor, end: cursor } } });
  });
  await act(async () => { jest.advanceTimersByTime(300); });
};
const pressLabel = async (renderer, label) => {
  const row = renderer.root.findAll((node) => node.props.onPress && node.findAll(
    (child) => child.type === Text && child.props.children === label,
  ).length > 0)[0];
  await act(async () => {
    row.props.onPressIn?.();
    row.props.onPress();
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  api.get.mockReset();
});
afterEach(() => jest.useRealTimers());

it('al escribir @ sugiere personas con su nombre y completa la mención', async () => {
  api.get.mockResolvedValue({ data: { profiles: [
    { id: 1, username: 'ana.lu', first_name: 'Ana', last_name: 'Luna' },
    { id: 2, username: 'andres' },
    { id: 3, username: null, first_name: 'Sin usuario' },
  ] } });
  let renderer;
  await act(async () => { renderer = TestRenderer.create(<Host />); });
  await act(async () => { inputOf(renderer).props.onFocus(); });

  await typeAt(renderer, 'Gracias @an');
  expect(api.get).toHaveBeenLastCalledWith('search/directory/', { params: { q: 'an', scope: 'profiles' } });
  expect(labels(renderer)).toEqual(expect.arrayContaining(['@ana.lu', 'Ana Luna', '@andres']));
  // A quien no tiene usuario no se le puede mencionar.
  expect(labels(renderer)).not.toContain('Sin usuario');

  await pressLabel(renderer, '@ana.lu');
  expect(lastValue).toBe('Gracias @ana.lu ');
  expect(labels(renderer)).not.toContain('@andres');
  act(() => renderer.unmount());
});

it('al escribir # sugiere los hashtags más usados', async () => {
  api.get.mockResolvedValue({ data: [{ tag: 'viaje', count: 3 }, { tag: 'viajero', count: 1 }] });
  let renderer;
  await act(async () => { renderer = TestRenderer.create(<Host initial="Ruta " />); });
  await act(async () => { inputOf(renderer).props.onFocus(); });

  await typeAt(renderer, 'Ruta #via');
  expect(api.get).toHaveBeenLastCalledWith('hashtags/', { params: { q: 'via' } });
  expect(labels(renderer)).toEqual(expect.arrayContaining(['#viaje', '3 publicaciones', '1 publicación']));

  await pressLabel(renderer, '#viajero');
  expect(lastValue).toBe('Ruta #viajero ');
  act(() => renderer.unmount());
});

it('sin @ ni # (o en un correo) no busca nada', async () => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(<Host />); });
  await act(async () => { inputOf(renderer).props.onFocus(); });
  await typeAt(renderer, 'Escríbeme a ana@correo');
  expect(api.get).not.toHaveBeenCalled();
  act(() => renderer.unmount());
});

it('pasa la ref al campo y en una barra muestra las sugerencias arriba', async () => {
  api.get.mockResolvedValue({ data: { profiles: [{ id: 1, username: 'ana' }] } });
  const ref = React.createRef();
  const Bar = () => {
    const [value, setValue] = useState('');
    return <SmartTextInput ref={ref} value={value} onChangeText={setValue} containerStyle={{ flex: 1 }} suggestionsAbove style={{ flex: 1 }} />;
  };
  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(<Bar />, { createNodeMock: () => ({ focus: jest.fn() }) });
  });
  expect(typeof ref.current.focus).toBe('function');
  // En la caja, el campo crece con lo que se escribe (su flex no aplica).
  expect(inputOf(renderer).props.style).toEqual([{ flex: 1 }, { flex: 0, alignSelf: 'stretch' }]);

  await act(async () => { inputOf(renderer).props.onFocus(); });
  await typeAt(renderer, '@a');
  const panel = renderer.root.findByProps({ accessibilityLabel: 'Personas para mencionar' });
  expect(panel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ position: 'absolute', bottom: '100%' })]));
  act(() => renderer.unmount());
});

