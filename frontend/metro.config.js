const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Windows-specific Metro fixes to prevent InternalBytecode.js errors
if (process.platform === 'win32') {
  // Disable problematic Metro features on Windows
  config.cacheStores = [];
  config.resetCache = true;
  config.watchFolders = [];
  
  // Force clean builds
  config.resolver.platforms = ['ios', 'android', 'native', 'web'];
  config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];
  
  // Block problematic node_modules
  config.resolver.blockList = [/node_modules\/.*\/node_modules\/react-native\/.*/];
  
  // Suppress use-latest-callback warnings (false positive on Windows)
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
}

// Suppress package.json warnings for use-latest-callback
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
