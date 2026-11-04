/**
 * components/GoogleSignInButton.js
 *
 * "Continuar con Google" en Iniciar sesión y Registrarse. Google le da a la app un id_token
 * que el servidor verifica (auth/google/): entra a la cuenta con ese correo o crea una (sin
 * usuario: el perfil pide elegirlo). Solo sale si hay ID de cliente de Google para esta
 * plataforma (GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID o GOOGLE_IOS_CLIENT_ID en .env).
 *
 * `onError(message)`: dónde mostrar un error ('' al volver a intentar).
 */
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import api, { saveAuthData } from '@api';
import { AuthContext } from '@app';

// En la web, la ventana de Google devuelve aquí el resultado y se cierra.
WebBrowser.maybeCompleteAuthSession();

const GoogleButton = ({ clientIds, onError }) => {
  const { signIn } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: clientIds.web || undefined,
    androidClientId: clientIds.android || undefined,
    iosClientId: clientIds.ios || undefined,
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type === 'error') {
      onError?.('Google no pudo completar el inicio de sesión. Inténtalo de nuevo.');
      return;
    }
    const idToken = response?.type === 'success' ? response.params?.id_token : null;
    if (!idToken) return;
    setBusy(true);
    // Al entrar, esta pantalla se cierra: `busy` se queda para que no se toque dos veces.
    api.post('auth/google/', { id_token: idToken })
      .then(async ({ data }) => {
        await saveAuthData(data);
        signIn(data.access);
      })
      .catch((error) => {
        setBusy(false);
        onError?.(error.response?.data?.detail || 'No se pudo entrar con Google. Inténtalo de nuevo.');
      });
  }, [response]);

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.line} />
      </View>
      <TouchableOpacity
        style={[styles.button, (!request || busy) && styles.buttonDisabled]}
        onPress={() => {
          onError?.('');
          promptAsync();
        }}
        disabled={!request || busy}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Continuar con Google"
      >
        {busy ? <ActivityIndicator color="#444" /> : (
          <>
            <Ionicons name="logo-google" size={20} color="#db4437" />
            <Text style={styles.text}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
};

const GoogleSignInButton = (props) => {
  const clientIds = Constants.expoConfig?.extra?.googleClientIds ?? {};
  const platformClientId = Platform.OS === 'web' ? clientIds.web : clientIds[Platform.OS];
  return platformClientId ? <GoogleButton clientIds={clientIds} {...props} /> : null;
};

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 6 },
  line: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { color: '#888', fontSize: 13 },
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

export default GoogleSignInButton;
