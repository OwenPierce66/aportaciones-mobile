/**
 * components/SmartTextInput.js
 *
 * TextInput para escribir descripciones: al escribir @ sugiere personas (con su nombre, para
 * distinguir usuarios parecidos) y al escribir # los hashtags que ya se usan (los más usados
 * primero); tocar una sugerencia completa la palabra. Al mostrarse (LinkifiedText) los enlaces, menciones y hashtags se pueden tocar,
 * y a quien mencionas le llega un aviso cuando se publica.
 *
 * `containerStyle`: el estilo de la caja que envuelve el campo (p. ej. { flex: 1 } en una barra).
 *   Con él, la caja ocupa el lugar y el campo crece con lo que se escribe (su `flex` no aplica).
 * `suggestionsAbove`: las sugerencias salen arriba del campo (barras fijas abajo de la pantalla).
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '@api';
import { activeToken, completeToken } from '../utils/richText';

const SEARCH_DELAY_MS = 250;
const MAX_SUGGESTIONS = 6;
// Al tocar una sugerencia el campo pierde el foco antes del toque (en la web): se espera
// un poco antes de esconderlas.
const BLUR_DELAY_MS = 250;

async function fetchSuggestions({ sigil, query }) {
  if (sigil === '@') {
    const { data } = await api.get('search/directory/', { params: { q: query, scope: 'profiles' } });
    return (Array.isArray(data?.profiles) ? data.profiles : [])
      .filter((profile) => profile.username)
      .slice(0, MAX_SUGGESTIONS)
      .map((profile) => ({
        key: `@${profile.id}`,
        name: profile.username,
        label: `@${profile.username}`,
        subtitle: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
      }));
  }
  const { data } = await api.get('hashtags/', { params: { q: query } });
  return (Array.isArray(data) ? data : [])
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => ({
      key: `#${item.tag}`,
      name: item.tag,
      label: `#${item.tag}`,
      detail: `${item.count} ${item.count === 1 ? 'publicación' : 'publicaciones'}`,
    }));
}

const SmartTextInput = forwardRef(({
  value, onChangeText, onFocus, onBlur, onSelectionChange, containerStyle, suggestionsAbove = false, style, ...inputProps
}, ref) => {
  const inputRef = useRef(null);
  // Quien lo usa recibe el TextInput de adentro (focus, blur, clear).
  useImperativeHandle(ref, () => inputRef.current);
  const blurTimer = useRef(null);
  const [cursor, setCursor] = useState(null);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = focused ? activeToken(value, cursor) : null;
  const sigil = token?.sigil;
  const query = token?.query;

  useEffect(() => {
    if (!sigil) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await fetchSuggestions({ sigil, query });
        if (!cancelled) setSuggestions(rows);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sigil, query]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const pick = (item) => {
    const next = completeToken(value, token, item.name);
    onChangeText(next.text);
    setCursor(next.cursor);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <View style={containerStyle}>
      <TextInput
        ref={inputRef}
        {...inputProps}
        style={containerStyle ? [style, styles.inputInContainer] : style}
        value={value}
        onChangeText={onChangeText}
        // El cursor llega aparte del texto (antes o después, según la plataforma); sin él se
        // asume al final.
        onSelectionChange={(event) => {
          setCursor(event.nativeEvent.selection?.end ?? null);
          onSelectionChange?.(event);
        }}
        onFocus={(event) => {
          clearTimeout(blurTimer.current);
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          blurTimer.current = setTimeout(() => setFocused(false), BLUR_DELAY_MS);
          onBlur?.(event);
        }}
      />
      {token && (loading || suggestions.length) ? (
        <View
          style={[styles.panel, suggestionsAbove && styles.panelAbove]}
          accessibilityLabel={sigil === '@' ? 'Personas para mencionar' : 'Hashtags'}
        >
          {loading && !suggestions.length ? <ActivityIndicator style={styles.loader} color="#4dabf7" /> : null}
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.row}
              onPressIn={() => clearTimeout(blurTimer.current)}
              onPress={() => pick(item)}
              accessibilityRole="button"
            >
              <View style={styles.texts}>
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text> : null}
              </View>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  panel: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  inputInContainer: { flex: 0, alignSelf: 'stretch' },
  // Flota arriba del campo, encima de lo que haya en la pantalla.
  panelAbove: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginTop: 0,
    marginBottom: 6,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  loader: { paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  texts: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1c7ed6' },
  subtitle: { marginTop: 1, fontSize: 12, color: '#868e96' },
  detail: { fontSize: 12, color: '#868e96' },
});

export default SmartTextInput;
