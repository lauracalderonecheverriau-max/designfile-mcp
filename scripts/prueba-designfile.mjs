/** Prueba real de extremo a extremo usando el SDK: listado, llamada a 3 herramientas, movimiento. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const proyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = await mkdtemp(path.join(os.tmpdir(), 'designfile-mcp-'));
let cliente;
try {
  await writeFile(path.join(raiz,'pieza.3dm'),'3D');
  await writeFile(path.join(raiz,'plano.pdf'),'PDF');
  await writeFile(path.join(raiz,'render.jpg'),'JPG');
  cliente = new Client({name:'prueba-designfile',version:'1.0.0'});
  const transporte = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(proyecto,'dist','index.js')],
    env: {...process.env, DESIGNFILE_ROOT:raiz},
  });
  await cliente.connect(transporte);
  const names = (await cliente.listTools()).tools.map(t=>t.name);
  for (const n of ['listar_archivos','crear_carpetas','organizar_archivos']) assert(names.includes(n), `No aparece ${n}`);
  const antes = await cliente.callTool({name:'listar_archivos',arguments:{}});
  assert.match(JSON.stringify(antes),/pieza\.3dm/);
  assert.equal((await readdir(raiz)).length,3);
  const sinPermiso = await cliente.callTool({name:'organizar_archivos', arguments:{}});
  assert(sinPermiso.isError, 'Organizar sin confirmar debió ser rechazado');
  const carpetas = await cliente.callTool({name:'crear_carpetas',arguments:{confirmar:true}});
  assert(!carpetas.isError, 'Falló crear_carpetas');
  const despues = await cliente.callTool({name:'organizar_archivos',arguments:{confirmar:true}});
  assert(!despues.isError, 'Falló organizar_archivos');
  assert.equal(await readFile(path.join(raiz,'Modelos_3D','pieza.3dm'),'utf8'),'3D');
  assert.equal(await readFile(path.join(raiz,'Laminas_y_Planos','plano.pdf'),'utf8'),'PDF');
  assert.equal(await readFile(path.join(raiz,'Renders_e_Imagenes','render.jpg'),'utf8'),'JPG');
  await writeFile(path.join(raiz, 'render.jpg'),'OTRO');
  const colision=await cliente.callTool({name:'organizar_archivos',arguments:{confirmar:true}});
  assert(!colision.isError);
  assert.equal(await readFile(path.join(raiz,'Renders_e_Imagenes','render.jpg'),'utf8'),'JPG');
  assert.equal(await readFile(path.join(raiz,'render.jpg'),'utf8'),'OTRO');
  console.log('PRUEBA DESIGNFILE SUPERADA: las 3 herramientas se conectan por MCP y no sobrescriben archivos.');
} finally {
  if (cliente) await cliente.close().catch(()=>{});
  await rm(raiz,{recursive:true,force:true});
}
