/**
 * components/UsernameNotice.js
 *
 * Aviso en tu perfil cuando todavía no tienes nombre de usuario: sin él nadie te puede
 * mencionar (@usuario) ni etiquetar. Al tocarlo se abre Editar perfil.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UsernameNotice = ({ user, onPress, style }) => {
  // Mientras se carga el perfil (sin `user`) no se sabe si falta.
  if (!user || user.username) return null;
  return (
    <TouchableOpacity
      style={[styles.notice, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Elegir nombre de usuario"
    >
      <Ionicons name="at-circle-outline" size={22} color="#e8590c" />
      <Text style={styles.text}>Elige tu nombre de usuario para que te puedan mencionar y etiquetar.</Text>
      <Text style={styles.action}>Elegir</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd8a8',
    backgroundColor: '#fff4e6',
  },
  text: { flex: 1, color: '#d9480f', fontSize: 13, fontWeight: '600' },
  action: { color: '#e8590c', fontSize: 13, fontWeight: '800' },
});

export default UsernameNotice;
