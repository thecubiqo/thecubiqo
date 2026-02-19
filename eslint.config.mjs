import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", "out/**", "build/**"],
  },
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
          "vertexShaders",
          "fragmentShader",
          "uniforms",
          "luminanceThreshold",
          "luminanceSmoothing",
          "mipmapBlur"
        ] 
      }]
    }
  }
];

export default eslintConfig;
