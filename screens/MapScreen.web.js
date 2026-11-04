/**
 * screens/MapScreen.web.js
 *
 * El Mapa en el navegador: react-native-maps no funciona en la web, así que se usa
 * Leaflet con OpenStreetMap (se carga del CDN al abrir el mapa). Muestra a la persona (punto
 * azul), se centra en ella cuando se conoce su ubicación y pone un pin por cada aportación
 * compartida desde una ubicación; al tocarlo sale su tarjeta.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LocationNotice from '@components/LocationNotice';
import MapTaskCard from '@components/MapTaskCard';
import { useMapTasks } from '@hooks/useApi';
import { useUserLocation } from '@hooks/useUserLocation';
import { pinColor } from '../utils/currentLocation';
import { DEFAULT_REGION } from '../utils/mapConfig';
import { openMapTask } from './mapNavigation';

const LEAFLET_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';
// Zoom de Leaflet: el país completo mientras no se sabe dónde está la persona; su zona después.
const COUNTRY_ZOOM = 5;
const USER_ZOOM = 13;

let leafletPromise = null;
export function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `${LEAFLET_URL}.css`;
      document.head.appendChild(css);
      const script = document.createElement('script');
      script.src = `${LEAFLET_URL}.js`;
      script.onload = () => resolve(window.L);
      script.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
      document.head.appendChild(script);
    });
  }
  return leafletPromise;
}

const MapScreen = ({ navigation }) => {
  const location = useUserLocation();
  const { coords } = location;
  const { data: tasks = [], refetch } = useMapTasks();
  const [selected, setSelected] = useState(null);
  const [failed, setFailed] = useState(false);
  // { L, map, pins, me }: se llena cuando Leaflet terminó de cargar.
  const [leaflet, setLeaflet] = useState(null);
  const containerRef = useRef(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  useEffect(() => {
    let cancelled = false;
    let map = null;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current).setView([DEFAULT_REGION.latitude, DEFAULT_REGION.longitude], COUNTRY_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      map.on('click', () => setSelected(null));
      setLeaflet({ L, map, pins: L.layerGroup().addTo(map), me: L.layerGroup().addTo(map) });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    if (!leaflet) return;
    const { L, pins } = leaflet;
    pins.clearLayers();
    tasks.forEach((task) => {
      L.circleMarker([task.latitude, task.longitude], {
        radius: 9, color: '#fff', weight: 2, fillColor: pinColor(task.pch), fillOpacity: 1,
      }).on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        setSelected(task);
      }).addTo(pins);
    });
  }, [leaflet, tasks]);

  useEffect(() => {
    if (!leaflet || !coords) return;
    const { L, map, me } = leaflet;
    const point = [coords.latitude, coords.longitude];
    me.clearLayers();
    L.circleMarker(point, { radius: 7, color: '#fff', weight: 3, fillColor: '#4285f4', fillOpacity: 1 }).addTo(me);
    map.setView(point, USER_ZOOM);
  }, [leaflet, coords]);

  return (
    <View style={styles.container}>
      <View ref={containerRef} style={styles.map} />
      {failed ? <Text style={styles.failed}>No se pudo cargar el mapa. Revisa tu conexión.</Text> : null}
      <MapTaskCard task={selected} onOpen={(task) => openMapTask(navigation, task)} onClose={() => setSelected(null)} />
      <LocationNotice location={location} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  failed: { position: 'absolute', top: 12, left: 12, right: 12, textAlign: 'center', color: '#868e96' },
});

export default MapScreen;
