import fs from 'node:fs/promises';
import path from 'node:path';
const raiz = path.resolve('demo', 'Proyecto_Maestranza_EJEMPLO');
await fs.mkdir(raiz, {recursive:true});
const archivos = ['modulo_01.3dm', 'lamina_final.pdf', 'render_pabellon.jpg', 'referente_botanico.png', 'memoria_proyecto.docx'];
for (const archivo of archivos) {
  const destino = path.join(raiz, archivo);
  try { await fs.writeFile(destino, `EJEMPLO FICTICIO, NO ABRIR COMO ARCHIVO REAL: ${archivo}\n`, {flag:'wx'}); }
  catch (e) { if (e.code !== 'EEXIST') throw e; }
}
console.log(`Carpeta demostración: ${raiz}`);
console.log('Estos cinco archivos contienen texto de prueba, NO modelos o documentos reales.');
