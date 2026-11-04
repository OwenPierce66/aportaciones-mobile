/**
 * utils/richText.js
 *
 * Lo que se escribe en una descripción: enlaces, menciones (@usuario) y hashtags (#tema).
 * Mismas reglas que el backend (api/mentions.py): una mención o un hashtag dentro de un
 * enlace no cuenta, la de un correo tampoco (ana@correo.com) y un hashtag lleva al menos
 * una letra (#1 no lo es).
 */
import { splitTextWithLinks } from './links';

// \w de JavaScript solo tiene letras sin acento: se agregan las del español.
const WORD = 'A-Za-z0-9_À-ÖØ-öø-ÿ';
const LETTER = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
// Lo que no puede ir justo antes de @ o #: una letra (correos), otra @, / (enlaces) o & y # (&#39;).
const NOT_BEFORE = `[^${WORD}@/&#]`;
const TOKEN = new RegExp(`(^|${NOT_BEFORE})([@#])([${WORD}.-]+)`, 'g');
const HASHTAG_NAME = new RegExp(`^[${WORD}]+`);
const MAX_MENTION = 150;
const MAX_HASHTAG = 50;

/** El nombre que de verdad toma una mención o un hashtag (o '' si no lo es). */
function tokenName(sigil, raw) {
  if (sigil === '@') {
    const name = raw.replace(/\.+$/, '');
    return name.length <= MAX_MENTION ? name : '';
  }
  const name = (HASHTAG_NAME.exec(raw) || [''])[0];
  return name.length <= MAX_HASHTAG && LETTER.test(name) ? name : '';
}

/**
 * Parte un texto en trozos, en orden: { text } normal, { text, url } enlace,
 * { text, mention } (@usuario, sin la @) y { text, hashtag } (#tema, sin el #).
 */
export function splitRichText(text) {
  const parts = [];
  splitTextWithLinks(text).forEach((part) => {
    if (part.url) {
      parts.push(part);
      return;
    }
    const value = part.text;
    const pattern = new RegExp(TOKEN.source, 'g');
    let last = 0;
    let match;
    while ((match = pattern.exec(value)) !== null) {
      const [, before, sigil, raw] = match;
      const name = tokenName(sigil, raw);
      if (!name) continue;
      const start = match.index + before.length;
      if (start > last) parts.push({ text: value.slice(last, start) });
      parts.push(sigil === '@' ? { text: `@${name}`, mention: name } : { text: `#${name}`, hashtag: name });
      last = start + 1 + name.length;
      // Lo que sobró de la palabra ("#viaje.hoy" -> ".hoy") se revisa como texto normal.
      pattern.lastIndex = last;
    }
    if (last < value.length) parts.push({ text: value.slice(last) });
  });
  return parts;
}

/**
 * La palabra con @ o # que se está escribiendo justo antes del cursor, para sugerir:
 * { sigil, query, start, end } (`query` sin el símbolo), o null.
 */
export function activeToken(text, cursor) {
  const value = String(text ?? '');
  const end = Math.min(Math.max(cursor ?? value.length, 0), value.length);
  const match = new RegExp(`(^|${NOT_BEFORE})([@#])([${WORD}.-]{0,${MAX_HASHTAG}})$`).exec(value.slice(0, end));
  if (!match) return null;
  const [, before, sigil, query] = match;
  if (sigil === '#' && /[.-]/.test(query)) return null;
  return { sigil, query, start: match.index + before.length, end };
}

/**
 * Cambia la palabra que se estaba escribiendo (`token`) por la sugerencia elegida, con un
 * espacio después. Devuelve { text, cursor } con el cursor después de ese espacio.
 */
export function completeToken(text, token, name) {
  const value = String(text ?? '');
  // Si el cursor estaba a mitad de la palabra, también se cambia lo que seguía.
  const rest = value.slice(token.end).replace(new RegExp(`^[${WORD}.-]*`), '');
  const inserted = `${token.sigil}${name}`;
  const spacer = /^\s/.test(rest) ? '' : ' ';
  return {
    text: `${value.slice(0, token.start)}${inserted}${spacer}${rest}`,
    cursor: token.start + inserted.length + 1,
  };
}
