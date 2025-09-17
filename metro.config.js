const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Enable experimental require.context for Expo Router
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};


module.exports = config;
