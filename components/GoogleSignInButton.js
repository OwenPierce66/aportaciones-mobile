/**
 * components/GoogleSignInButton.js
 *
 * "Continuar con Google" en Iniciar sesión y Registrarse. El id_token de Google se cambia en
 * el servidor (auth/google/) por la sesión: entra a la cuenta con ese correo o crea una (sin
 * usuario: el perfil pide elegirlo). Sin ID de cliente de Google no sale (ver GoogleButton).
 *
 * `onError(message)`: dónde mostrar un error ('' al volver a intentar).
 */
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import api, { saveAuthData } from '@api';
import { AuthContext } from '@app';
import GoogleButton, { hasGoogleClientId } from './GoogleButton';

const GoogleSignInButton = ({ onError }) => {
  const { signIn } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);

  const signInWith = (idToken) => {
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
  };

  if (!hasGoogleClientId()) return null;
  return (
    <>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.line} />
      </View>
      <GoogleButton label="Continuar con Google" busy={busy} onIdToken={signInWith} onError={onError} />
    </>
  );
};

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 6 },
  line: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { color: '#888', fontSize: 13 },
});

export default GoogleSignInButton;
