/**
 * screens/MapScreen.js
 *
 * Mapa (se abre desde el menú lateral): Google Maps con el punto azul, el botón "mi
 * ubicación" y un pin por cada aportación compartida desde una ubicación (al tocarlo sale
 * su tarjeta). Al abrirlo pide el permiso y se centra en la persona. La versión web está en
 * MapScreen.web.js, porque react-native-maps no funciona en el navegador.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import LocationNotice from '@components/LocationNotice';
import MapTaskCard from '@components/MapTaskCard';
import { useMapTasks } from '@hooks/useApi';
import { useUserLocation } from '@hooks/useUserLocation';
import { pinColor } from '../utils/currentLocation';
import { DEFAULT_REGION, StarLightTheme, USER_REGION_DELTA } from '../utils/mapConfig';
import { openMapTask } from './mapNavigation';

const MapScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const location = useUserLocation();
  const { status, coords } = location;
  // Android solo los activa si el permiso ya está concedido.
  const granted = status === 'granted';
  const { data: tasks = [], refetch } = useMapTasks();
  const [selected, setSelected] = useState(null);

  // Al volver al mapa (p. ej. después de publicar) se recargan los pines.
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  useEffect(() => {
    if (!coords) return;
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: USER_REGION_DELTA, longitudeDelta: USER_REGION_DELTA },
      600,
    );
  }, [coords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={StarLightTheme}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={granted}
        showsMyLocationButton={granted}
        showsCompass
        rotateEnabled
        onPress={() => setSelected(null)}
      >
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{ latitude: task.latitude, longitude: task.longitude }}
            pinColor={pinColor(task.pch)}
            onPress={(event) => { event?.stopPropagation?.(); setSelected(task); }}
          />
        ))}
      </MapView>
      <MapTaskCard task={selected} onOpen={(task) => openMapTask(navigation, task)} onClose={() => setSelected(null)} />
      <LocationNotice location={location} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Ancho y alto explícitos: con la arquitectura nueva, MapView queda en 0 de alto si su tamaño
  // sale solo de top/bottom (absoluteFill).
  map: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});

export default MapScreen;
