const path = require("path");

let production = process.argv.indexOf("--mode");
production = production !== -1 ? process.argv[production + 1] === "production" : false;

const moduleConfig = {
  rules: [
    {
      test: /\.glsl$/,
      exclude: /node_modules/,
      loader: "raw-loader",
    },
    {
      test: /\.ts$/,
      exclude: /node_modules/,
      loader: "ts-loader",
    },
  ],
};

module.exports = [
  {
    name: "osigma",
    mode: production ? "production" : "none",
    entry: "./src/index-bundle.ts",
    output: {
      filename: production ? "osigma.min.js" : "osigma.js",
      path: path.join(__dirname, "build"),
      library: "osigma",
      libraryTarget: "var",
    },
    resolve: {
      extensions: [".ts", ".js", ".glsl"],
    },
    module: moduleConfig,
  },
];
