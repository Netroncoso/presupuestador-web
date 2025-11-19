**Proceso: Generación y Guardado de Presupuestos en Google Drive (Ejemplo)**
# **Resumen**
Este documento muestra, a modo de ejemplo, los pasos prácticos para generar un PDF de un presupuesto desde un backend en TypeScript/Node, subirlo automáticamente a Google Drive mediante Google Apps Script, guardar la URL en MySQL y mostrarla en una lista en React (TSX). La solución propuesta es gratuita y no requiere Google Cloud ni tarjeta de crédito.
# **1) Crear la carpeta en Google Drive**
• Crear una carpeta en Google Drive llamada 'Presupuestos'. • Copiar el ID de la carpeta desde la URL (p. ej. '1AbCdEfGhIjKl').
# **2) Crear el Google Apps Script (Web App)**
• Entrar a https://script.google.com y crear un nuevo proyecto. • Pegar el siguiente código en el editor y reemplazar ID\_DE\_TU\_CARPETA por el ID real:

function doPost(e) {   try {     const folderId = "ID\_DE\_TU\_CARPETA";     const folder = DriveApp.getFolderById(folderId);     const raw = Utilities.base64Decode(e.postData.contents);     const blob = Utilities.newBlob(raw, "application/pdf", `presupuesto-${Date.now()}.pdf`);     const file = folder.createFile(blob);     file.setSharing(DriveApp.Access.ANYONE\_WITH\_LINK, DriveApp.Permission.VIEW);     return ContentService.createTextOutput(JSON.stringify({ fileId: file.getId(), url: file.getUrl(), na   } catch (err) {     return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentSe   }

}
# **3) Deploy como Web App**
• Deploy → New deployment → Web App. • Execute as: Me (tu usuario). • Who has access: Anyone. • Copiar la URL del deploy (ej: https://script.google.com/macros/s/AKf.../exec).
# **4) Backend Node.js (TypeScript) - Generar PDF**
• Instalar pdfkit: npm install pdfkit • Ejemplo de función para crear el PDF:

import PDFDocument from 'pdfkit'; import fs from 'fs';

export function crearPdfPresupuesto(datos: any, outputPath: string): Promise<void> {   return new Promise((resolve) => {     const doc = new PDFDocument();     doc.pipe(fs.createWriteStream(outputPath));     doc.fontSize(20).text('Presupuesto', { align: 'center' });     doc.moveDown();     doc.fontSize(12).text(`Cliente: ${datos.cliente}`);     doc.text(`Fecha: ${datos.fecha}`);     doc.text(`Total: $${datos.total}`);     doc.end();     doc.on('finish', resolve);   });

}
# **5) Subir PDF al Apps Script desde Node**
• Leer el archivo PDF y convertirlo a base64. Enviar POST a la URL del Web App.

import fs from 'fs';

export async function subirPdfAGoogleAppsScript(path: string, url: string) {   const buffer = fs.readFileSync(path);   const base64 = buffer.toString('base64');   const respuesta = await fetch(url, {     method: 'POST',     headers: { 'Content-Type': 'application/pdf' },     body: base64,   });   return await respuesta.json(); }
# **6) Endpoint Express completo**
• Flujo: generar PDF → subir al Apps Script → guardar URL en MySQL → devolver respuesta al front.

app.post('/api/presupuestos', async (req, res) => {   const datos = req.body;   const outputPath = `tmp/presupuesto-${Date.now()}.pdf`;   await crearPdfPresupuesto(datos, outputPath);   const scriptUrl = 'URL\_WEB\_APP\_SCRIPT';

`  `const driveResp = await subirPdfAGoogleAppsScript(outputPath, scriptUrl);

`  `await db.query('INSERT INTO presupuestos (cliente, total, fecha, pdf\_url) VALUES (?, ?, ?, ?)', [datos   res.json({ ok: true, pdfUrl: driveResp.url }); });

**7) MySQL - Agregar columna pdf\_url**

• ALTER TABLE presupuestos ADD COLUMN pdf\_url VARCHAR(255);
# **8) Frontend React (TSX) - Botón 'Ver PDF'**
• Mostrar el enlace devuelto en la tabla de historial. Ejemplo:

<a href={p.pdf\_url} target="\_blank" rel="noopener noreferrer">Ver PDF</a>
