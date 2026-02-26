#!/bin/bash
echo "Testing build..."
npm install --legacy-peer-deps
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  exit 0
else
  echo "❌ Build failed"
  exit 1
fi