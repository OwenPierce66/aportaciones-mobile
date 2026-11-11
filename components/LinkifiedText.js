import React, { useContext } from 'react';
import { Text, Linking, Alert, Platform, StyleSheet } from 'react-native';
import * as ReactNavigation from '@react-navigation/native';
import api, { getImageUrl } from '@api';
import { splitRichText } from '../utils/richText';
import ExpandableText from './ExpandableText';

// La navegación de la pantalla donde está el texto. Fuera de una pantalla (o en pruebas sin
// navegación) las menciones y los hashtags se ven igual, pero no abren nada.
const NavigationContext = ReactNavigation.NavigationContext || React.createContext(undefined);

const notify = (message) => (Platform.OS === 'web' ? window.alert(message) : Alert.alert(message));

/** @usuario: abre su perfil (la mención solo trae el nombre, así que primero se busca). */
export async function openMention(navigation, username) {
  if (!navigation) return;
  try {
    const { data } = await api.get(`users/by-username/${encodeURIComponent(username)}/`);
    navigation.navigate('UserProfile', {
      userId: data.id,
      userName: data.username,
      userAvatar: getImageUrl(data.user_image),
    });
  } catch {
    notify(`No encontramos a @${username}.`);
  }
}

/** #tema: la búsqueda de Aportaciones con ese hashtag. */
export function openHashtag(navigation, hashtag) {
  navigation?.navigate('Tasks', { screen: 'TasksList', pop: true, params: { searchQuery: `#${hashtag}` } });
}

/**
 * Texto de una descripción con sus enlaces (http(s):// o www.), menciones (@usuario) y
 * hashtags (#tema) tocables. Se usa en lugar de <Text>: sin nada de eso se ve igual.
 * `collapsedLines`: se corta en esos renglones con "Ver más" si el texto es más largo.
 * `onHashtagPress(tag)`: a dónde lleva un hashtag (en el foro, al foro); si no, a la búsqueda
 * de Aportaciones.
 */
const LinkifiedText = ({ collapsedLines, ...props }) => (collapsedLines ? (
  <ExpandableText lines={collapsedLines} renderText={(lines) => <RichText {...props} numberOfLines={lines} />} />
) : (
  <RichText {...props} />
));

export const RichText = ({ text, style, linkStyle, numberOfLines, onHashtagPress }) => {
  const navigation = useContext(NavigationContext);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {splitRichText(text).map((part, index) => {
        if (part.url) {
          return (
            <Text
              key={index}
              style={[styles.link, linkStyle]}
              onPress={() => Linking.openURL(part.url).catch(() => Alert.alert('No se pudo abrir el enlace', part.url))}
              accessibilityRole="link"
            >
              {part.text}
            </Text>
          );
        }
        if (part.mention || part.hashtag) {
          return (
            <Text
              key={index}
              style={[styles.tag, linkStyle && { color: StyleSheet.flatten(linkStyle).color }]}
              onPress={() => {
                if (part.mention) openMention(navigation, part.mention);
                else if (onHashtagPress) onHashtagPress(part.hashtag);
                else openHashtag(navigation, part.hashtag);
              }}
              accessibilityRole="link"
              accessibilityLabel={part.mention ? `Ver el perfil de @${part.mention}` : `Buscar #${part.hashtag}`}
            >
              {part.text}
            </Text>
          );
        }
        return part.text;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  link: { color: '#1c7ed6', textDecorationLine: 'underline' },
  tag: { color: '#1c7ed6', fontWeight: '600' },
});

export default LinkifiedText;
