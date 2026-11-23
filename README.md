# DesignFile MCP — examen de Diseño

Proyecto basado en la estructura `mcp-starter-kit` (rama `main`), con tres herramientas MCP propias para gestionar archivos visibles en Finder en una carpeta local autorizada.

## Requisitos
- Mac con Node.js 18+ y npm; OpenCode para demostración conversacional.
- Una carpeta de prueba sin información sensible.

## Instalación (Terminal)
```bash
cd /ruta/a/DesignFile_MCP_Kit_Adaptado
npm ci
npm run build
npm test
npm run demo:crear
npm run configurar:designfile
```

Para abrir OpenCode, estando en esta carpeta, ejecuta `node scripts/lanzar.mjs opencode` (puede solicitar instalación). También puedes abrir OpenCode manualmente desde esta carpeta.

## Herramientas
- `listar_archivos`: lectura y clasificación de archivos de la carpeta autorizada.
- `crear_carpetas`: crea subcarpetas de categorías solo con `confirmar: true`.
- `organizar_archivos`: mueve archivos sin sobrescribir, solo con `confirmar: true`.

## Demostración
La carpeta de ejemplo contiene archivos FICTICIOS de texto con extensiones de Diseño; no son modelos Rhino ni PDFs reales. Mostrar Finder antes, pedir `listar_archivos`, aprobar `crear_carpetas` y `organizar_archivos`, mostrar Finder después.

## Seguridad y límites
El servidor solo usa `DESIGNFILE_ROOT`, una carpeta local autorizada. No recorre subcarpetas ni sigue enlaces simbólicos; no sobrescribe archivos existentes. Mover archivos es una acción que modifica el sistema de archivos y requiere autorización. No subir información privada ni tokens. Probar primero con la carpeta de ejemplo.

## Publicación
Crear un repositorio GitHub público con este código, agregar commits propios y adjuntar un video real de funcionamiento. No subir `.env`, claves ni archivos académicos privados.

## Origen y uso de IA
Adaptado de la plantilla académica MCP Starter Kit. El código y documentación fueron asistidos por IA y deben ser revisados y verificados por la estudiante en su computador.
