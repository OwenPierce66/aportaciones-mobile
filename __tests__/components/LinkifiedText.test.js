/**
 * __tests__/components/LinkifiedText.test.js
 *
 * Enlaces, menciones (@usuario) y hashtags (#tema) dentro del texto de las descripciones.
 */
import React from 'react';
import { Text, Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import api from '@api';
import LinkifiedText from '../../components/LinkifiedText';

jest.mock('@api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  getImageUrl: (path) => (path ? `https://cdn/${path}` : null),
}));

const linksOf = (renderer) => renderer.root.findAll(
  (node) => node.type === Text && node.props.accessibilityRole === 'link',
);

describe('LinkifiedText', () => {
  it('deja tocables los enlaces dentro del texto y abre la URL normalizada', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    let renderer;
    act(() => {
      renderer = TestRenderer.create(
        <LinkifiedText text="Guía en www.ejemplo.com/guia y https://otro.org." />,
      );
    });

    const links = linksOf(renderer);
    expect(links.map((node) => node.props.children)).toEqual(['www.ejemplo.com/guia', 'https://otro.org']);
    act(() => { links[0].props.onPress(); });
    expect(openURL).toHaveBeenCalledWith('https://www.ejemplo.com/guia');
    openURL.mockRestore();
  });

  it('sin enlaces se ve como un texto normal', () => {
    let renderer;
    act(() => { renderer = TestRenderer.create(<LinkifiedText text="Solo texto" style={{ fontSize: 14 }} />); });

    expect(linksOf(renderer)).toHaveLength(0);
    const outer = renderer.root.findAllByType(Text)[0];
    expect(outer.props.style).toEqual({ fontSize: 14 });
    expect(outer.props.children).toEqual(['Solo texto']);
  });

  it('no convierte en enlace esquemas peligrosos', () => {
    let renderer;
    act(() => { renderer = TestRenderer.create(<LinkifiedText text="javascript:alert(1) y archivo.pdf" />); });
    expect(linksOf(renderer)).toHaveLength(0);
  });

  it('las menciones abren el perfil y los hashtags la búsqueda', async () => {
    api.get.mockResolvedValue({ data: { id: 'u-ana', username: 'Ana.Lu', user_image: 'ana.jpg' } });
    const navigation = { navigate: jest.fn() };
    let renderer;
    act(() => {
      renderer = TestRenderer.create(
        <NavigationContext.Provider value={navigation}>
          <LinkifiedText text="Gracias @ana.lu. por el #Viaje!" />
        </NavigationContext.Provider>,
      );
    });

    const tags = linksOf(renderer);
    expect(tags.map((node) => node.props.children)).toEqual(['@ana.lu', '#Viaje']);
    await act(async () => { await tags[0].props.onPress(); });
    expect(api.get).toHaveBeenCalledWith('users/by-username/ana.lu/');
    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      userId: 'u-ana', userName: 'Ana.Lu', userAvatar: 'https://cdn/ana.jpg',
    });

    act(() => { tags[1].props.onPress(); });
    expect(navigation.navigate).toHaveBeenLastCalledWith('Tasks', { screen: 'TasksList', params: { searchQuery: '#Viaje' } });
  });

  it('un correo o una @ dentro de un enlace no son menciones', () => {
    let renderer;
    act(() => { renderer = TestRenderer.create(<LinkifiedText text="ana@correo.com y https://medium.com/@ana #1" />); });
    expect(linksOf(renderer).map((node) => node.props.children)).toEqual(['https://medium.com/@ana']);
  });
});
