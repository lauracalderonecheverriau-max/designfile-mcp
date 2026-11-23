import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const demo=path.join(raiz,'demo','Proyecto_Maestranza_EJEMPLO');
const config={$schema:'https://opencode.ai/config.json',mcp:{designfile:{type:'local',command:[process.execPath,path.join(raiz,'dist','index.js')],environment:{DESIGNFILE_ROOT:demo},enabled:true,timeout:30000}}};
await fs.writeFile(path.join(raiz,'opencode.json'),JSON.stringify(config,null,2)+'\n');
console.log('Configurado DesignFile para:',demo);
