/**
 * sentry.web.stub.js
 *
 * Stub vacío de @sentry/react-native para la versión web: en el navegador no se manda nada a
 * Sentry. metro.config.js lo pone en lugar de '@sentry/react-native' (y de sus archivos) cuando
 * se arma la web.
 *
 * Exporta los mismos símbolos que usa nuestro sentry.js para que no haya
 * errores de referencia, pero todas las funciones son no-ops.
 */

const noop = () => {};

module.exports = {
  // Inicialización
  init: noop,

  // Captura de errores y mensajes
  captureException: noop,
  captureMessage: noop,

  // Scope / contexto
  withScope: noop,
  setUser: noop,
  setTag: noop,
  setContext: noop,
  setExtra: noop,

  // Performance tracing
  startTransaction: () => ({ finish: noop }),
  getCurrentHub: () => ({
    getScope: () => ({ setTag: noop, setUser: noop }),
    captureException: noop,
    captureMessage: noop,
  }),

  // HOC de envoltura (identidad — devuelve el componente sin modificar)
  wrap: (Component) => Component,

  // Severity levels
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Log: 'log',
    Info: 'info',
    Debug: 'debug',
    Critical: 'critical',
  },
};
