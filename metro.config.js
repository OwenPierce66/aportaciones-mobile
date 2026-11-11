const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const SENTRY_WEB_STUB = path.resolve(__dirname, 'sentry.web.stub.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // En la web, Sentry (y cualquier archivo suyo) se cambia por funciones vacías.
  if (platform === 'web' && /^@sentry\/react-native(\/.*)?$/.test(moduleName)) {
    return { type: 'sourceFile', filePath: SENTRY_WEB_STUB };
  }
  // @tanstack/* declara "react-native": "src/index.ts" (TypeScript sin compilar).
  // Con esa fuente, los campos de tipo (getCurrentResult!: ...) de
  // InfiniteQueryObserver pisan los metodos heredados y rompen useInfiniteQuery.
  // Forzamos el build precompilado (campo "main") para estos paquetes.
  if (moduleName.startsWith('@tanstack/')) {
    return context.resolveRequest(
      { ...context, mainFields: ['main'] },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
