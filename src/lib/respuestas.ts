export const texto=(mensaje:string)=>({content:[{type:"text" as const,text:mensaje}]});
export const json=(datos:unknown)=>texto(JSON.stringify(datos,null,2));
export const error=(mensaje:string)=>({isError:true,content:[{type:"text" as const,text:mensaje}]});
