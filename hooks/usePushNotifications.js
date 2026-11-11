import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Con la app abierta: aviso arriba y en la lista de notificaciones (antes, shouldShowAlert).
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(navigationRef) {
  const receivedSub = useRef(null);
  const responseSub = useRef(null);

  useEffect(() => {
    registerForPush();

    receivedSub.current = Notifications.addNotificationReceivedListener(() => {});

    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response?.notification?.request?.content?.data ?? {};
        // App.js pasa el ref de useRef: la navegación está en .current.
        const navigation = navigationRef?.current ?? navigationRef;
        if (navigation?.isReady?.() && data.notification_id) {
          navigation.navigate('Home', {
            screen: 'Notifications',
            params: { screen: 'NotificationsMain', pop: true },
          });
        }
      }
    );

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);
}

export async function registerForPush() {
  if (!Device.isDevice) return;

  const { status: current } = await Notifications.getPermissionsAsync();
  let finalStatus = current;

  if (current !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Aportaciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.post('/push-tokens/', { token, platform: Platform.OS });
  } catch (err) {
    console.warn('[push] Error registrando token:', err?.message);
  }
}

// Da de baja el token de ESTE dispositivo en el backend (se llama al cerrar
// sesión, mientras el access token aún es válido). Nunca lanza: si falla
// (sin red, permisos denegados, web) el logout local continúa igual.
export async function unregisterForPush() {
  if (!Device.isDevice) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token) return;
    await api.delete('/push-tokens/', { data: { token } });
  } catch (err) {
    console.warn('[push] No se pudo dar de baja el token:', err?.message);
  }
}