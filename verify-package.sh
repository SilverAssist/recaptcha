#!/bin/bash

# Track verification errors
ERRORS=0

echo "================================================"
echo "  VERIFICACIÓN DEL PAQUETE @silverassist/recaptcha"
echo "================================================"
echo ""

echo "1. ESTRUCTURA DE ARCHIVOS"
echo "-------------------------"
for file in "package.json" "README.md" "LICENSE" "CHANGELOG.md" "tsconfig.json" "jest.config.cjs" "tsup.config.ts" "add-use-client.js"; do
  if [ -f "$file" ]; then
    echo "✅ $file existe"
  else
    echo "❌ $file no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
done
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
  else
    echo "❌ dist/client/index.js no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -f "dist/client/index.mjs" ]; then
    echo "✅ dist/client/index.mjs ($(head -1 dist/client/index.mjs 2>/dev/null | cut -c1-15)...)"
  else
    echo "❌ dist/client/index.mjs no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -f "dist/server/index.js" ]; then
    echo "✅ dist/server/index.js"
  else
    echo "❌ dist/server/index.js no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -f "dist/server/index.mjs" ]; then
    echo "✅ dist/server/index.mjs"
  else
    echo "❌ dist/server/index.mjs no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js"
  else
    echo "❌ dist/index.js no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if [ -f "dist/index.mjs" ]; then
    echo "✅ dist/index.mjs"
  else
    echo "❌ dist/index.mjs no encontrado"
    ERRORS=$((ERRORS + 1))
  fi
  if find dist -type f \( -name "*.d.ts" -o -name "*.d.mts" \) 2>/dev/null | grep -q .; then
    echo "✅ TypeScript definitions (.d.ts, .d.mts)"
  else
    echo "❌ TypeScript definitions (.d.ts, .d.mts) no encontradas"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "⚠️  Directorio dist no encontrado (ejecutar 'npm run build')"
  ERRORS=$((ERRORS + 1))
fi
echo ""

echo "5. VERIFICACIONES CRÍTICAS"
echo "--------------------------"
if grep -q '"use client"' dist/client/index.js 2>/dev/null; then
  echo "✅ Directiva 'use client' en dist/client/index.js"
else
  echo "❌ Directiva 'use client' falta en dist/client/index.js"
  ERRORS=$((ERRORS + 1))
fi

if grep -q '"use client"' dist/client/index.mjs 2>/dev/null; then
  echo "✅ Directiva 'use client' en dist/client/index.mjs"
else
  echo "❌ Directiva 'use client' falta en dist/client/index.mjs"
  ERRORS=$((ERRORS + 1))
fi

if grep -q '"@silverassist/recaptcha"' package.json; then
  echo "✅ Nombre del paquete correcto"
else
  echo "❌ Nombre del paquete incorrecto"
  ERRORS=$((ERRORS + 1))
fi

VERSION=$(grep -o '"version": "[^"]*"' package.json | head -1 | cut -d'"' -f4)
if [[ -n "$VERSION" && "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "✅ Versión $VERSION"
else
  echo "❌ Versión incorrecta o no encontrada"
  ERRORS=$((ERRORS + 1))
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
if [ $ERRORS -eq 0 ]; then
  echo "  ESTADO: ✅ PAQUETE LISTO PARA PRODUCCIÓN"
  echo "================================================"
  exit 0
else
  echo "  ESTADO: ❌ ERRORES ENCONTRADOS ($ERRORS)"
  echo "================================================"
  exit 1
fi
