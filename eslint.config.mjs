import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*"
  ]),
  // React Three Fiber props - not standard HTML attributes
  {
    rules: {
      "react/no-unknown-property": ["error", {
        ignore: [
          "attach",
          "args",
          "position",
          "rotation",
          "scale",
          "intensity",
          "castShadow",
          "receiveShadow",
          "geometry",
          "material",
          "dispose",
          "object",
          "transparent",
          "opacity",
          "side",
          "depthWrite",
          "blending",
          "wireframe",
          "vertexShader",
          "fragmentShader",
          "uniforms",
          "luminanceThreshold",
          "luminanceSmoothing",
          "mipmapBlur"
        ]
      }]
    }
  }
]);

export default eslintConfig;
