/**
 * components/GoogleButton.js
 *
 * Botón que abre Google para elegir una cuenta y entrega su id_token, que solo el servidor
 * verifica: Iniciar sesión lo cambia por la sesión (GoogleSignInButton) y Eliminar cuenta lo
 * usa para confirmar que eres tú. Solo sale si hay ID de cliente de Google para esta
 * plataforma (GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID o GOOGLE_IOS_CLIENT_ID en .env).
 *
 * `label`: el texto. `onIdToken(idToken)`: qué hacer con el token. `busy`: muestra que se
 * está usando. `onError(message)`: dónde mostrar un error ('' al volver a intentar).
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// En la web, la ventana de Google devuelve aquí el resultado y se cierra.
WebBrowser.maybeCompleteAuthSession();

const googleClientIds = () => Constants.expoConfig?.extra?.googleClientIds ?? {};

export const hasGoogleClientId = () => {
  const clientIds = googleClientIds();
  return Boolean(Platform.OS === 'web' ? clientIds.web : clientIds[Platform.OS]);
};

const ConfiguredGoogleButton = ({ label, onIdToken, busy = false, disabled = false, onError }) => {
  const clientIds = googleClientIds();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: clientIds.web || undefined,
    androidClientId: clientIds.android || undefined,
    iosClientId: clientIds.ios || undefined,
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type === 'error') {
      onError?.('Google no respondió. Inténtalo de nuevo.');
      return;
    }
    const idToken = response?.type === 'success' ? response.params?.id_token : null;
    if (idToken) onIdToken(idToken);
  }, [response]);

  const off = !request || busy || disabled;
  return (
    <TouchableOpacity
      style={[styles.button, off && styles.buttonDisabled]}
      onPress={() => {
        onError?.('');
        promptAsync();
      }}
      disabled={off}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? <ActivityIndicator color="#444" /> : (
        <>
          <Ionicons name="logo-google" size={20} color="#db4437" />
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const GoogleButton = (props) => (hasGoogleClientId() ? <ConfiguredGoogleButton {...props} /> : null);

const styles = StyleSheet.create({
  button: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cccccc',
    backgroundColor: '#fff',
  },
  buttonDisabled: { opacity: 0.6 },
  text: { color: '#333', fontSize: 16, fontWeight: '600' },
});

export default GoogleButton;
