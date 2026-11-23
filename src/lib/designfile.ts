/**
 * Lógica de DesignFile: trabaja con archivos que Finder muestra en una única carpeta
 * local previamente autorizada con DESIGNFILE_ROOT. Sin shell ni recorrido recursivo.
 */
import { constants } from "node:fs";
import { copyFile, link, lstat, mkdir, readdir, realpath, stat, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const CATEGORIAS = {
  Modelos_3D: [".3dm", ".obj", ".stl", ".fbx", ".blend", ".skp"],
  Laminas_y_Planos: [".pdf", ".dwg", ".dxf"],
  Renders_e_Imagenes: [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".heic"],
  Documentos: [".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".txt", ".md"],
} as const;
export type Categoria = keyof typeof CATEGORIAS | "Otros";
export type Archivo = { nombre: string; carpeta: Categoria };

export function clasificar(nombre: string): Categoria {
  const ext = path.extname(nombre).toLowerCase();
  for (const [carpeta, extensiones] of Object.entries(CATEGORIAS)) {
    if ((extensiones as readonly string[]).includes(ext)) return carpeta as Categoria;
  }
  return "Otros";
}

async function raizAutorizada(): Promise<string> {
  const variable = process.env.DESIGNFILE_ROOT;
  if (!variable || !path.isAbsolute(variable)) {
    throw new Error("Falta DESIGNFILE_ROOT. Debe ser una carpeta absoluta, local y autorizada.");
  }
  const solicitada = path.resolve(variable);
  const datos = await lstat(solicitada);
  if (datos.isSymbolicLink() || !datos.isDirectory()) {
    throw new Error("DESIGNFILE_ROOT debe ser una carpeta real, no un enlace simbólico.");
  }
  const real = await realpath(solicitada);
  const home = await realpath(homedir());
  if ([path.parse(real).root, home, path.dirname(home)].includes(real)) {
    throw new Error("Por seguridad, no se permite organizar el disco, el inicio ni la carpeta de usuario completa.");
  }
  return real;
}

export async function listarArchivos(): Promise<{ carpeta_autorizada: string; archivos: Archivo[]; ignorados: number }> {
  const root = await raizAutorizada();
  const entradas = await readdir(root, { withFileTypes: true });
  const archivos = entradas
    .filter((entrada) => entrada.isFile() && !entrada.name.startsWith("."))
    .map((entrada) => ({ nombre: entrada.name, carpeta: clasificar(entrada.name) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { carpeta_autorizada: root, archivos, ignorados: entradas.length - archivos.length };
}

async function asegurarCarpeta(base: string, carpeta: Categoria): Promise<"creada" | "existente"> {
  const destino = path.join(base, carpeta);
  let creada = false;
  try {
    await mkdir(destino);
    creada = true;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  }
  const info = await lstat(destino);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Subcarpeta no segura: ${carpeta}`);
  return creada ? "creada" : "existente";
}

export async function crearCarpetas(): Promise<{ carpeta_autorizada: string; carpetas: { nombre: Categoria; estado: string }[] }> {
  const root = await raizAutorizada();
  const carpetas: { nombre: Categoria; estado: string }[] = [];
  for (const nombre of [...Object.keys(CATEGORIAS), "Otros"] as Categoria[]) {
    carpetas.push({ nombre, estado: await asegurarCarpeta(root, nombre) });
  }
  return { carpeta_autorizada: root, carpetas };
}

/**
 * Crea primero un enlace duro exclusivo; si el sistema de archivos no lo permite,
 * hace una copia exclusiva. Solo elimina el origen tras comprobar el destino.
 * No sigue enlaces simbólicos ni sobrescribe destinos preexistentes.
 */
async function moverSinSobrescribir(origen: string, destino: string): Promise<void> {
  const dato = await lstat(origen);
  if (!dato.isFile() || dato.isSymbolicLink()) throw new Error("El origen dejó de ser un archivo regular.");
  let copiado = false;
  try {
    await link(origen, destino);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (!["EPERM", "EOPNOTSUPP", "ENOTSUP", "EXDEV", "EMLINK", "ENOSYS"].includes(String(code))) throw e;
    await copyFile(origen, destino, constants.COPYFILE_EXCL);
    copiado = true;
  }
  const resultado = await stat(destino);
  if (!resultado.isFile() || resultado.size !== dato.size) {
    if (copiado) await unlink(destino).catch(() => {});
    throw new Error("No se pudo verificar la copia. Se conservó el archivo original.");
  }
  await unlink(origen);
}

export async function organizarArchivos(): Promise<{
  carpeta_autorizada: string;
  movidos: Archivo[];
  omitidos: { nombre: string; motivo: string }[];
}> {
  const { carpeta_autorizada, archivos } = await listarArchivos();
  // Se revisan las carpetas de destino antes de empezar a mover archivos.
  await crearCarpetas();
  const movidos: Archivo[] = [];
  const omitidos: { nombre: string; motivo: string }[] = [];
  for (const archivo of archivos) {
    const origen = path.join(carpeta_autorizada, archivo.nombre);
    const destino = path.join(carpeta_autorizada, archivo.carpeta, archivo.nombre);
    try {
      await moverSinSobrescribir(origen, destino);
      movidos.push(archivo);
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException).code;
      omitidos.push({
        nombre: archivo.nombre,
        motivo: code === "EEXIST" ? "El destino ya existe; no se sobrescribió." : String((e as Error).message),
      });
    }
  }
  return { carpeta_autorizada, movidos, omitidos };
}
