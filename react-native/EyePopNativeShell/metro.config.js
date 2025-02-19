const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Add the path-browserify polyfill
defaultConfig.resolver.extraNodeModules = {
  path: require.resolve("path-browserify"),
  stream: require.resolve("stream-browserify"),
  buffer: require.resolve("buffer"),
  util: require.resolve("util"),
};

module.exports = defaultConfig;