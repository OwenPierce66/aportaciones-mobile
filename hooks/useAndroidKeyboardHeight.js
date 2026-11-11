/**
 * hooks/useAndroidKeyboardHeight.js
 *
 * Alto del teclado en Android, contando la barra de navegación que tapa (0 si está cerrado).
 *
 * Desde Android 15 la app se dibuja hasta los bordes y la ventana ya no se encoge al abrir el
 * teclado (adjustResize deja de hacer efecto): quien muestre campos de texto tiene que dejarle
 * ese espacio. Lo usan el marco de App.js y components/Modal. Sale de
 * react-native-keyboard-controller, que también avisa del teclado dentro de los Modal (son
 * otra ventana y React Native ahí no avisa). En iOS y en la web siempre es 0.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';

export function useAndroidKeyboardHeight(active = true) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android' || !active) return undefined;
    const show = KeyboardEvents.addListener('keyboardDidShow', (event) => setHeight(Math.max(0, event?.height || 0)));
    const hide = KeyboardEvents.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setHeight(0);
    };
  }, [active]);
  return height;
}
