/** 3 herramientas propias de Diseño, registradas según el MCP Starter Kit del curso. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crearCarpetas, listarArchivos, organizarArchivos } from "../lib/designfile.js";

function resultado(datos: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(datos, null, 2) }] };
}
function errorControlado(e: unknown) {
  return { isError: true, content: [{ type: "text" as const, text: `Error: ${(e as Error).message ?? String(e)}` }] };
}

export function register(server: McpServer) {
  server.registerTool(
    "listar_archivos",
    {
      description: "Lee la carpeta autorizada DESIGNFILE_ROOT y propone una clasificación por extensión sin modificar archivos. Úsala para mostrar el ANTES y el plan de organización.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      try { return resultado(await listarArchivos()); }
      catch (e: unknown) { return errorControlado(e); }
    },
  );

  server.registerTool(
    "crear_carpetas",
    {
      description: "Crea cinco subcarpetas de clasificación en la carpeta autorizada. Pide autorización explícita del usuario ANTES de usar esta herramienta.",
      inputSchema: {
        confirmar: z.literal(true).describe("Debe ser true únicamente después de recibir autorización explícita del usuario."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ confirmar }) => {
      try {
        if (confirmar !== true) return errorControlado(new Error("Se requiere autorización explícita."));
        return resultado(await crearCarpetas());
      } catch (e: unknown) { return errorControlado(e); }
    },
  );

  server.registerTool(
    "organizar_archivos",
    {
      description: "Organiza archivos por extensión dentro de la carpeta autorizada; no sobrescribe destinos. Primero usa listar_archivos, muestra el plan y pide autorización explícita del usuario para mover archivos.",
      inputSchema: {
        confirmar: z.literal(true).describe("Debe ser true únicamente después de recibir autorización explícita del usuario para mover los archivos listados."),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async ({ confirmar }) => {
      try {
        if (confirmar !== true) return errorControlado(new Error("Se requiere autorización explícita."));
        return resultado(await organizarArchivos());
      } catch (e: unknown) { return errorControlado(e); }
    },
  );
}
