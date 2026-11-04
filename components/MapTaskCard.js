/**
 * components/MapTaskCard.js
 *
 * Tarjeta de la aportación que se tocó en el mapa: título, autor y "Ver aportación".
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pinColor } from '../utils/currentLocation';

const MapTaskCard = ({ task, onOpen, onClose }) => {
  if (!task) return null;
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: pinColor(task.pch) }]} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{task.title || 'Aportación'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {task.pch ? `${task.pch} · ` : ''}@{task.user?.username || 'usuario'}
        </Text>
        <TouchableOpacity onPress={() => onOpen(task)} accessibilityRole="button">
          <Text style={styles.open}>Ver aportación</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar" hitSlop={10}>
        <Ionicons name="close" size={20} color="#868e96" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '700', color: '#212529' },
  meta: { fontSize: 13, color: '#868e96' },
  open: { marginTop: 4, color: '#4dabf7', fontSize: 14, fontWeight: '800' },
});

export default MapTaskCard;
