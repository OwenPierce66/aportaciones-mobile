module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [{
      // Solo @tanstack/query-core v5 (src con #privados) necesita estos plugins;
      // aplicarlos a react-native rompe FlatList (this.props undefined).
      // Función y no regex: Metro carga esta configuración sin nombre de archivo, y Babel no
      // acepta un regex en ese caso.
      test: (filename) => typeof filename === 'string' && /node_modules[\\/]@tanstack/.test(filename),
      plugins: [
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }],
        ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ],
    }],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            // Archivos raíz
            '@api':     './api',
            '@storage': './secureStorage',
            '@app':     './App',

            // Carpetas
            '@screens':    './screens',
            '@components': './components',
            '@contexts':   './contexts',
            '@hooks':      './hooks',
          },
        },
      ],
      // Reanimated 4: babel-preset-expo ya agrega react-native-worklets/plugin; no repetirlo aquí.
    ],
  };
};
