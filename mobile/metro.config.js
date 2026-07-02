const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow all hosts — required for Replit's reverse proxy which uses a
// non-localhost Host header (e.g. *.replit.dev / *.repl.co).
// Metro 0.77+ validates the Host header by default; disable it here.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
      res.setHeader("Access-Control-Allow-Headers", "*");
      return middleware(req, res, next);
    };
  },
};

// Fix for expo-router asset resolution issue
config.resolver = {
  ...config.resolver,
  sourceExts: ["js", "json", "ts", "tsx", "cjs"],
};

module.exports = config;
