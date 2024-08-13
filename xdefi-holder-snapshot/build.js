const esbuild = require("esbuild");
const esbuildPluginTsc = require("esbuild-plugin-tsc");

esbuild
  .build({
    plugins: [esbuildPluginTsc()],
    bundle: true,
    platform: "node",
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    target: "es2020",
  })
  .then(() => {
    console.log("{done}");
  });
