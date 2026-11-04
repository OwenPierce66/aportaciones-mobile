/**
 * utils/currentLocation.js
 *
 * Lee una sola vez dónde está la persona (para "Compartir desde mi ubicación" al crear una
 * tarea). Pide el permiso solo en ese momento, no al abrir la pantalla.
 * Devuelve { coords } o { error } con el mensaje que se le muestra.
 */
import * as Location from 'expo-location';

export const PCH_PIN_COLORS = {
  consejos: '#51cf66',
  peticiones: '#ff6b6b',
  historias: '#4dabf7',
};
export const pinColor = (pch) => PCH_PIN_COLORS[String(pch || '').toLowerCase()] || '#845ef7';

export async function readCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { error: 'Permite el acceso a tu ubicación para compartir la aportación desde donde estás.' };
    }
  } catch {
    return { error: 'No pudimos pedir el permiso de ubicación.' };
  }
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } };
  } catch {
    return { error: 'No pudimos obtener tu ubicación. Revisa que el GPS esté encendido.' };
  }
}
