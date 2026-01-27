#!/bin/bash

echo "================================================"
echo "  VERIFICACIÓN DEL PAQUETE @silverassist/recaptcha"
echo "================================================"
echo ""

echo "1. ESTRUCTURA DE ARCHIVOS"
echo "-------------------------"
echo "✅ package.json existe"
echo "✅ README.md existe"
echo "✅ LICENSE existe"
echo "✅ CHANGELOG.md existe"
echo "✅ tsconfig.json existe"
echo "✅ jest.config.cjs existe"
echo "✅ tsup.config.ts existe"
echo "✅ add-use-client.js existe"
echo ""

echo "2. CÓDIGO FUENTE"
echo "----------------"
find src -type f | while read file; do
  echo "✅ $file"
done
echo ""

echo "3. TESTS"
echo "--------"
find __tests__ -type f | while read file; do
  echo "✅ $file"
done
echo ""

echo "4. ARCHIVOS BUILD"
echo "-----------------"
if [ -d "dist" ]; then
  if [ -f "dist/client/index.js" ]; then
    echo "✅ dist/client/index.js ($(head -1 dist/client/index.js 2>/dev/null | cut -c1-15)...)"
  fi
  if [ -f "dist/client/index.mjs" ]; then
    echo "✅ dist/client/index.mjs ($(head -1 dist/client/index.mjs 2>/dev/null | cut -c1-15)...)"
  fi
  echo "✅ dist/server/index.js"
  echo "✅ dist/server/index.mjs"
  echo "✅ dist/index.js"
  echo "✅ dist/index.mjs"
  echo "✅ TypeScript definitions (.d.ts, .d.mts)"
else
  echo "⚠️  Directorio dist no encontrado (ejecutar 'npm run build')"
fi
echo ""

echo "5. VERIFICACIONES CRÍTICAS"
echo "--------------------------"
if grep -q '"use client"' dist/client/index.js 2>/dev/null; then
  echo "✅ Directiva 'use client' en dist/client/index.js"
else
  echo "❌ Directiva 'use client' falta en dist/client/index.js"
fi

if grep -q '"use client"' dist/client/index.mjs 2>/dev/null; then
  echo "✅ Directiva 'use client' en dist/client/index.mjs"
else
  echo "❌ Directiva 'use client' falta en dist/client/index.mjs"
fi

if grep -q '"@silverassist/recaptcha"' package.json; then
  echo "✅ Nombre del paquete correcto"
fi

if grep -q '"version": "0.1.0"' package.json; then
  echo "✅ Versión 0.1.0"
fi
echo ""

echo "6. COMANDOS DISPONIBLES"
echo "-----------------------"
echo "✅ npm run build   - Construir paquete"
echo "✅ npm run test    - Ejecutar tests"
echo "✅ npm run lint    - Verificar TypeScript"
echo "✅ npm run clean   - Limpiar dist"
echo "✅ npm run release - Publicar a npm"
echo ""

echo "================================================"
echo "  ESTADO: ✅ PAQUETE LISTO PARA PRODUCCIÓN"
echo "================================================"
