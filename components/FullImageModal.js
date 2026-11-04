/**
 * components/FullImageModal.js
 *
 * Una foto completa en pantalla negra. En el feed cada foto se ve con su forma, pero entre
 * 4:5 y 1.91:1: si es más alta o más ancha se recorta un poco, y aquí se ve entera. Se
 * cierra con la X, tocándola o con el botón de regresar del celular.
 */
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const FullImageModal = ({ uri, onClose }) => (
  <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar foto">
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Cerrar">
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    top: 40,
    right: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default FullImageModal;
