import { Alert, Platform } from 'react-native';
import api from '@api';

/**
 * Acciones de moderación de cuentas (solo superadmin; el backend lo valida).
 * Las usan los menús de 3 puntos del perfil y de las publicaciones.
 */
const errorMessage = (error) => {
  const data = error?.response?.data;
  const first = (value) => (Array.isArray(value) ? value[0] : value);
  return first(data?.detail) || first(data?.is_active) || first(data?.is_superuser) || first(data?.is_staff)
    || 'Inténtalo de nuevo.';
};

const showError = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

const confirmAction = (title, message, onConfirm, destructive = false) => {
  // En web Alert.alert no muestra botones: se usa el confirm del navegador.
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
};

/** Suspende (`active=false`) o reactiva (`active=true`) una cuenta, con confirmación. */
export const setAccountActive = (userId, name, active, onDone) => {
  const label = name || 'esta cuenta';
  confirmAction(
    active ? 'Reactivar cuenta' : 'Suspender cuenta',
    active
      ? `¿Reactivar la cuenta de ${label}?`
      : `La cuenta de ${label} quedará desactivada; sus datos se conservarán.`,
    async () => {
      try {
        await api.post(`admin/users/${userId}/active/`, { is_active: active });
        onDone?.();
      } catch (error) {
        showError(active ? 'No se pudo reactivar' : 'No se pudo suspender', errorMessage(error));
      }
    },
    !active,
  );
};

const ROLE_MESSAGES = {
  is_staff: {
    on: (label) => `${label} podrá dar like como la App y verificar perfiles.`,
    off: (label) => `${label} perderá los permisos de staff.`,
  },
  is_superuser: {
    on: (label) => `${label} tendrá todos los permisos, incluido hacer staff o admin a otras cuentas.`,
    off: (label) => `${label} dejará de ser admin y quedará como staff.`,
  },
};

/**
 * Da (`value=true`) o quita un rol, con confirmación: `role` es 'is_staff' (staff) o 'is_superuser' (admin).
 * `onDone` recibe el rol nuevo: { is_staff, is_superuser }.
 */
export const setAccountRole = (userId, name, role, value, onDone) => {
  const label = name || 'esta cuenta';
  confirmAction(
    `${value ? 'Hacer' : 'Quitar'} ${role === 'is_superuser' ? 'admin' : 'staff'}`,
    ROLE_MESSAGES[role][value ? 'on' : 'off'](label),
    async () => {
      try {
        const { data } = await api.post(`admin/users/${userId}/role/`, { [role]: value });
        onDone?.(data);
      } catch (error) {
        showError('No se pudo actualizar el rol', errorMessage(error));
      }
    },
    !value,
  );
};

/** Da (`isStaff=true`) o quita el rol de staff, con confirmación. */
export const setAccountStaff = (userId, name, isStaff, onDone) => (
  setAccountRole(userId, name, 'is_staff', isStaff, onDone)
);
