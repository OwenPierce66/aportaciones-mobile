/**
 * __tests__/utils/richText.test.js
 *
 * Menciones y hashtags en lo que se escribe: cómo se parten al mostrarse y cómo se
 * completan al escribir.
 */
import { activeToken, completeToken, splitRichText } from '../../utils/richText';

describe('splitRichText', () => {
  it('separa enlaces, menciones y hashtags en orden', () => {
    expect(splitRichText('Hola @ana, mira https://x.com/#a y #Viaje.hoy')).toEqual([
      { text: 'Hola ' },
      { text: '@ana', mention: 'ana' },
      { text: ', mira ' },
      { text: 'https://x.com/#a', url: 'https://x.com/#a' },
      { text: ' y ' },
      { text: '#Viaje', hashtag: 'Viaje' },
      { text: '.hoy' },
    ]);
  });

  it('acepta acentos y puntos en el usuario, pero no el punto final', () => {
    expect(splitRichText('Gracias @josé.pérez. #canción')).toEqual([
      { text: 'Gracias ' },
      { text: '@josé.pérez', mention: 'josé.pérez' },
      { text: '. ' },
      { text: '#canción', hashtag: 'canción' },
    ]);
  });

  it('no cuenta correos, números ni entidades', () => {
    expect(splitRichText('ana@correo.com puesto #3 &#39;')).toEqual([{ text: 'ana@correo.com puesto #3 &#39;' }]);
  });
});

describe('activeToken y completeToken', () => {
  it('detecta la palabra con @ o # antes del cursor', () => {
    expect(activeToken('Hola @an', 8)).toEqual({ sigil: '@', query: 'an', start: 5, end: 8 });
    expect(activeToken('Hola #', 6)).toEqual({ sigil: '#', query: '', start: 5, end: 6 });
    expect(activeToken('Hola @an', 4)).toBeNull();
    expect(activeToken('ana@correo', 10)).toBeNull();
    expect(activeToken('Hola @ana ', 10)).toBeNull();
  });

  it('completa la palabra con un espacio después, también a mitad del texto', () => {
    const atEnd = completeToken('Hola @an', activeToken('Hola @an', 8), 'ana.lu');
    expect(atEnd).toEqual({ text: 'Hola @ana.lu ', cursor: 13 });

    const text = 'Viaje #pla y más';
    const middle = completeToken(text, activeToken(text, 9), 'playa');
    expect(middle).toEqual({ text: 'Viaje #playa y más', cursor: 13 });
  });
});
