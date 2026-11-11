/**
 * plugins/withAndroidEnv.js
 *
 * Lo que la carpeta android/ necesita y Expo no genera solo. Se aplica en cada
 * `npx expo prebuild`, así que android/ se puede volver a generar sin perder nada.
 *
 * - La clave de Google Maps sale del .env (o de la variable GOOGLE_MAPS_API_KEY de la
 *   terminal) al compilar: el manifiesto solo tiene ${googleMapsApiKey} (react-native-maps en
 *   app.config.js), así la clave no queda escrita en git.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// withAndroidEnv: clave de Google Maps';

const READ_MAPS_KEY = `${MARK} desde el .env (no está en git); la variable de la terminal manda.
def googleMapsApiKey = System.getenv("GOOGLE_MAPS_API_KEY") ?: ""
def dotEnvFile = rootProject.file("../.env")
if (!googleMapsApiKey && dotEnvFile.exists()) {
    dotEnvFile.eachLine { line ->
        line = line.trim()
        if (line.startsWith("GOOGLE_MAPS_API_KEY=")) {
            googleMapsApiKey = line.substring("GOOGLE_MAPS_API_KEY=".length()).trim().replaceAll(/^["']|["']$/, "")
        }
    }
}
`;

function addMapsKey(contents) {
  if (contents.includes(MARK)) return contents;
  if (!/\nandroid \{/.test(contents) || !/defaultConfig \{\n/.test(contents)) {
    throw new Error('withAndroidEnv: android/app/build.gradle no tiene la forma esperada');
  }
  return contents
    .replace(/\nandroid \{/, `\n${READ_MAPS_KEY}\nandroid {`)
    .replace(/defaultConfig \{\n/, 'defaultConfig {\n        manifestPlaceholders = [googleMapsApiKey: googleMapsApiKey]\n');
}

module.exports = function withAndroidEnv(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addMapsKey(cfg.modResults.contents);
    return cfg;
  });
};
