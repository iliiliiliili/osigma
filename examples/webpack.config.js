const path = require("path");

module.exports = {
  resolve: {
    extensions: [".ts", ".js", ".glsl"],
    alias: {
      "osigma/types": path.resolve(__dirname, "../src/types.ts"),
      "osigma/utils": path.resolve(__dirname, "../src/utils/"),
      "osigma/utils/animate": path.resolve(__dirname, "../src/utils/animate.ts"),
      "osigma/rendering/webgl/programs/edge": path.resolve(__dirname, "../src/rendering/webgl/programs/edge.ts"),
      "osigma/rendering/webgl/programs/edge.fast": path.resolve(
        __dirname,
        "../src/rendering/webgl/programs/edge.fast.ts",
      ),
      "osigma/rendering/webgl/programs/node.image": path.resolve(
        __dirname,
        "../src/rendering/webgl/programs/node.image.ts",
      ),
      "osigma/rendering/webgl/programs/common/node": path.resolve(
        __dirname,
        "../src/rendering/webgl/programs/common/node.ts",
      ),
      osigma: path.resolve(__dirname, "../src/index.ts"),
    },
  },
  module: {
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
  },
};
