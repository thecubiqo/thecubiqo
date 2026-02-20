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
      }],
      // Enforce using logAdminAction utility instead of direct RPC calls
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.property.name='rpc'][arguments.0.value='log_admin_action']",
          "message": "Use logAdminAction() from '@/lib/audit' instead of calling supabase.rpc('log_admin_action') directly"
        }
      ]
    }
  }
];

export default eslintConfig;
