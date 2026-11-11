/**
 * components/Modal.js
 *
 * El Modal de React Native, con el espacio de las barras del teléfono (y del teclado en
 * Android, ver hooks/useAndroidKeyboardHeight) libre, como se veía antes. Desde Android 15 la app se dibuja hasta los bordes y los
 * Modal también: sin esto, los encabezados quedan debajo de la barra de estado y los botones de
 * abajo debajo de la barra de navegación. Mismas props que el de React Native.
 *
 * `statusBarTranslucent`: el contenido sí llega hasta arriba (p. ej. fotos a pantalla completa).
 */
import React from 'react';
import { Modal as NativeModal } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAndroidKeyboardHeight } from '../hooks/useAndroidKeyboardHeight';

/** Bordes que se dejan libres: arriba solo si el contenido no debe llegar hasta allá; abajo,
 * solo sin teclado (su alto ya cubre la barra de navegación). */
const edgesFor = (statusBarTranslucent, keyboardOpen) => [
  ...(statusBarTranslucent ? [] : ['top']),
  ...(keyboardOpen ? [] : ['bottom']),
  'left',
  'right',
];

export default function Modal({ children, statusBarTranslucent = false, ...props }) {
  const keyboardHeight = useAndroidKeyboardHeight(props.visible !== false);
  return (
    <NativeModal {...props} statusBarTranslucent={statusBarTranslucent} navigationBarTranslucent>
      {/* El Modal ocupa la pantalla como la ventana principal: sus medidas sirven de inicio, así
          el contenido sale desde el primer cuadro. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView
          style={{ flex: 1, paddingBottom: keyboardHeight }}
          edges={edgesFor(statusBarTranslucent, keyboardHeight > 0)}
        >
          {children}
        </SafeAreaView>
      </SafeAreaProvider>
    </NativeModal>
  );
}
