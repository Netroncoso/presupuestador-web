# Generación y Almacenamiento de PDFs en Google Drive

## Índice
1. [Resumen](#resumen)
2. [Configuración Inicial](#configuración-inicial)
3. [Implementación Backend](#implementación-backend)
4. [Implementación Frontend](#implementación-frontend)
5. [Base de Datos](#base-de-datos)
6. [Testing](#testing)
7. [Migración a Servidor](#migración-a-servidor)
8. [Troubleshooting](#troubleshooting)

---

## Resumen

Sistema para generar PDFs de presupuestos y almacenarlos automáticamente en Google Drive usando la API oficial.

### Flujo Completo

```
Usuario → Frontend → Backend → PDF Generator → Google Drive API → MySQL
                                                        ↓
                                                   URL pública
                                                        ↓
                                                   Frontend (Ver PDF)
```

### Ventajas

✅ **Gratuito** - Sin costo, sin tarjeta de crédito
✅ **Rápido** - ~500ms por PDF
✅ **Escalable** - 1 billón requests/día
✅ **Portable** - Mismo código en cualquier servidor
✅ **Sin archivos temporales** - Todo en memoria
✅ **Seguro** - OAuth2 con Service Account

---

## Configuración Inicial

### 1. Crear Proyecto en Google Cloud Console

**Paso 1:** Ir a https://console.cloud.google.com

**Paso 2:** Crear nuevo proyecto
- Click en "Select a project" → "New Project"
- Nombre: `presupuestador-web`
- Click "Create"

**Paso 3:** Habilitar Google Drive API
- En el menú lateral: "APIs & Services" → "Library"
- Buscar "Google Drive API"
- Click "Enable"

### 2. Crear Service Account

**Paso 1:** Ir a "IAM & Admin" → "Service Accounts"

**Paso 2:** Click "Create Service Account"
- Name: `presupuestador-drive`
- Description: `Service account para subir PDFs a Drive`
- Click "Create and Continue"

**Paso 3:** Asignar rol (opcional, skip)
- Click "Continue" → "Done"

**Paso 4:** Crear credenciales
- Click en el Service Account creado
- Tab "Keys" → "Add Key" → "Create new key"
- Tipo: JSON
- Click "Create"
- **Guardar el archivo descargado como `google-credentials.json`**

**Paso 5:** Copiar el email del Service Account
- Ejemplo: `presupuestador-drive@proyecto.iam.gserviceaccount.com`

### 3. Configurar Google Drive

**Paso 1:** Crear carpeta en Google Drive
- Ir a https://drive.google.com
- Crear carpeta "Presupuestos"

**Paso 2:** Compartir carpeta con Service Account
- Click derecho en carpeta → "Share"
- Pegar el email del Service Account
- Rol: "Editor"
- Desmarcar "Notify people"
- Click "Share"

**Paso 3:** Copiar ID de carpeta
- Abrir la carpeta
- Copiar ID de la URL: `https://drive.google.com/drive/folders/1AbCdEfGhIjKl`
- ID = `1AbCdEfGhIjKl`

---

## Implementación Backend

### 1. Instalar Dependencias

```bash
cd backend
npm install googleapis pdfkit
npm install --save-dev @types/pdfkit
```

### 2. Configurar Variables de Entorno

**Archivo:** `backend/.env`

```env
# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKl
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

**Copiar archivo de credenciales:**
```bash
# Mover el archivo descargado a la carpeta backend
mv ~/Downloads/proyecto-xxxxx.json backend/google-credentials.json
```

### 3. Crear Servicio de Google Drive

**Archivo:** `backend/src/services/googleDriveService.ts`

```typescript
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GOOGLE_DRIVE_FOLDER_ID || !process.env.GOOGLE_CREDENTIALS_PATH) {
  throw new Error('Missing Google Drive configuration');
}

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Autenticación con Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export const googleDriveService = {
  /**
   * Sube un PDF a Google Drive y retorna la URL pública
   */
  async uploadPDF(buffer: Buffer, fileName: string): Promise<{ fileId: string; url: string }> {
    // Crear archivo en Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(buffer),
      },
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id!;
    const url = response.data.webViewLink!;

    // Hacer el archivo público (cualquiera con el link puede ver)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return { fileId, url };
  },

  /**
   * Elimina un archivo de Drive (opcional)
   */
  async deleteFile(fileId: string): Promise<void> {
    await drive.files.delete({ fileId });
  },
};
```

### 4. Crear Generador de PDF

**Archivo:** `backend/src/services/pdfService.ts`

```typescript
import PDFDocument from 'pdfkit';
import { Presupuesto, Insumo, Prestacion } from '../types';

interface PDFData {
  presupuesto: Presupuesto;
  insumos: Insumo[];
  prestaciones: Prestacion[];
  totales: {
    totalInsumos: number;
    totalPrestaciones: number;
    costoTotal: number;
    totalFacturar: number;
    rentabilidad: number;
  };
}

export const pdfService = {
  /**
   * Genera un PDF en memoria y retorna el Buffer
   */
  async generarPresupuestoPDF(data: PDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Capturar el PDF en memoria
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- HEADER ---
      doc.fontSize(20).text('PRESUPUESTO', { align: 'center' });
      doc.moveDown();

      // --- DATOS DEL CLIENTE ---
      doc.fontSize(12).text(`Cliente: ${data.presupuesto.Nombre_Apellido}`);
      doc.text(`DNI: ${data.presupuesto.DNI}`);
      doc.text(`Sucursal: ${data.presupuesto.Sucursal}`);
      doc.text(`Fecha: ${new Date(data.presupuesto.created_at!).toLocaleDateString('es-AR')}`);
      doc.moveDown();

      // --- INSUMOS ---
      if (data.insumos.length > 0) {
        doc.fontSize(14).text('INSUMOS', { underline: true });
        doc.moveDown(0.5);
        
        data.insumos.forEach((insumo) => {
          doc.fontSize(10).text(
            `${insumo.producto} - Cantidad: ${insumo.cantidad} - Costo: $${insumo.costo.toFixed(2)}`
          );
        });
        doc.moveDown();
      }

      // --- PRESTACIONES ---
      if (data.prestaciones.length > 0) {
        doc.fontSize(14).text('PRESTACIONES', { underline: true });
        doc.moveDown(0.5);
        
        data.prestaciones.forEach((prest) => {
          doc.fontSize(10).text(
            `${prest.prestacion} - Cantidad: ${prest.cantidad} - Valor: $${prest.valor_asignado.toFixed(2)}`
          );
        });
        doc.moveDown();
      }

      // --- TOTALES ---
      doc.fontSize(14).text('TOTALES', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Insumos: $${data.totales.totalInsumos.toFixed(2)}`);
      doc.text(`Total Prestaciones: $${data.totales.totalPrestaciones.toFixed(2)}`);
      doc.text(`Costo Total: $${data.totales.costoTotal.toFixed(2)}`);
      doc.text(`Total a Facturar: $${data.totales.totalFacturar.toFixed(2)}`);
      doc.text(`Rentabilidad: ${data.totales.rentabilidad.toFixed(2)}%`);

      // Finalizar documento
      doc.end();
    });
  },
};
```

### 5. Crear Endpoint

**Archivo:** `backend/src/controllers/pdfController.ts`

```typescript
import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { pdfService } from '../services/pdfService';
import { googleDriveService } from '../services/googleDriveService';

export const generarPDF = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);

  if (isNaN(presupuestoId) || presupuestoId <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  // Obtener datos del presupuesto
  const [presupuestos] = await pool.query<any[]>(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
    [presupuestoId]
  );

  if (presupuestos.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const presupuesto = presupuestos[0];

  // Obtener insumos y prestaciones
  const [[insumos], [prestaciones]] = await Promise.all([
    pool.query<any[]>('SELECT * FROM presupuesto_insumos WHERE idPresupuestos = ?', [presupuestoId]),
    pool.query<any[]>('SELECT * FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [presupuestoId]),
  ]);

  // Calcular totales
  const totalInsumos = insumos.reduce((sum, i) => sum + (i.costo * i.cantidad), 0);
  const totalPrestaciones = prestaciones.reduce((sum, p) => sum + (p.valor_asignado * p.cantidad), 0);
  const costoTotal = totalInsumos + totalPrestaciones;
  const totalFacturar = presupuesto.total_facturar || costoTotal;
  const rentabilidad = presupuesto.rentabilidad || 0;

  // Generar PDF
  const pdfBuffer = await pdfService.generarPresupuestoPDF({
    presupuesto,
    insumos,
    prestaciones,
    totales: { totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidad },
  });

  // Subir a Google Drive
  const fileName = `presupuesto-${presupuestoId}-${Date.now()}.pdf`;
  const { fileId, url } = await googleDriveService.uploadPDF(pdfBuffer, fileName);

  // Guardar URL en base de datos
  await pool.query(
    'UPDATE presupuestos SET pdf_url = ?, pdf_file_id = ? WHERE idPresupuestos = ?',
    [url, fileId, presupuestoId]
  );

  res.json({ ok: true, pdfUrl: url, fileId });
});
```

### 6. Agregar Ruta

**Archivo:** `backend/src/routes/presupuestos.ts`

```typescript
import { generarPDF } from '../controllers/pdfController';

// Agregar esta línea
router.post('/:id/generar-pdf', authenticateToken, generarPDF);
```

---

## Base de Datos

### Agregar Columnas

```sql
ALTER TABLE presupuestos 
ADD COLUMN pdf_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN pdf_file_id VARCHAR(100) DEFAULT NULL;
```

---

## Implementación Frontend

### 1. Actualizar Tipos

**Archivo:** `frontend/src/types/index.ts`

```typescript
export interface Presupuesto {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  // ... otros campos
  pdf_url?: string;
  pdf_file_id?: string;
}
```

### 2. Agregar Función en Servicio

**Archivo:** `frontend/src/services/presupuestoService.ts`

```typescript
export const presupuestoService = {
  // ... métodos existentes

  generarPDF: async (id: number) => {
    const res = await api.post(`/presupuestos/${id}/generar-pdf`, {});
    return res.data;
  },
};
```

### 3. Agregar Botón en Lista de Presupuestos

**Archivo:** `frontend/src/pages/ListaPresupuestos.tsx`

```typescript
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { presupuestoService } from '../services/presupuestoService';

// Dentro del componente
const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);

const handleGenerarPDF = async (id: number) => {
  setGenerandoPDF(id);
  try {
    const result = await presupuestoService.generarPDF(id);
    notifications.show({
      title: 'PDF Generado',
      message: 'El PDF se generó correctamente',
      color: 'green',
    });
    // Recargar lista para obtener la URL actualizada
    cargarPresupuestos();
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'Error al generar PDF',
      color: 'red',
    });
  } finally {
    setGenerandoPDF(null);
  }
};

// En la tabla
<Table.Td>
  {presupuesto.pdf_url ? (
    <Group gap="xs">
      <Button
        size="xs"
        component="a"
        href={presupuesto.pdf_url}
        target="_blank"
        rel="noopener noreferrer"
        leftSection={<DocumentArrowDownIcon style={{ width: 16, height: 16 }} />}
      >
        Ver PDF
      </Button>
      <Button
        size="xs"
        variant="light"
        onClick={() => handleGenerarPDF(presupuesto.idPresupuestos)}
        loading={generandoPDF === presupuesto.idPresupuestos}
      >
        Regenerar
      </Button>
    </Group>
  ) : (
    <Button
      size="xs"
      onClick={() => handleGenerarPDF(presupuesto.idPresupuestos)}
      loading={generandoPDF === presupuesto.idPresupuestos}
      leftSection={<DocumentArrowDownIcon style={{ width: 16, height: 16 }} />}
    >
      Generar PDF
    </Button>
  )}
</Table.Td>
```

---

## Testing

### Test Manual

```bash
# 1. Iniciar backend
cd backend
npm run dev

# 2. Probar endpoint con curl
curl -X POST http://localhost:4000/api/presupuestos/1/generar-pdf \
  -H "Authorization: Bearer TU_TOKEN"

# Respuesta esperada:
# {"ok":true,"pdfUrl":"https://drive.google.com/file/d/...","fileId":"..."}
```

### Test Unitario (Opcional)

```typescript
import { pdfService } from './pdfService';

test('genera PDF correctamente', async () => {
  const buffer = await pdfService.generarPresupuestoPDF(mockData);
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.length).toBeGreaterThan(0);
});
```

---

## Migración a Servidor

### 1. Preparar Archivos

```bash
# En tu PC
scp backend/google-credentials.json usuario@servidor:/var/www/backend/
```

### 2. Configurar Variables de Entorno

```bash
# En el servidor
nano /var/www/backend/.env
```

```env
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKl
GOOGLE_CREDENTIALS_PATH=/var/www/backend/google-credentials.json
```

### 3. Reiniciar Aplicación

```bash
pm2 restart backend
```

**Eso es todo.** No necesitas reconfigurar nada en Google.

---

## Troubleshooting

### Error: "Missing required authentication credential"

**Causa:** No encuentra el archivo de credenciales

**Solución:**
```bash
# Verificar que existe
ls -la backend/google-credentials.json

# Verificar permisos
chmod 600 backend/google-credentials.json
```

### Error: "Insufficient Permission"

**Causa:** Service Account no tiene acceso a la carpeta

**Solución:**
1. Ir a Google Drive
2. Click derecho en carpeta "Presupuestos" → Share
3. Agregar email del Service Account como Editor

### Error: "The caller does not have permission"

**Causa:** API no habilitada

**Solución:**
1. Ir a Google Cloud Console
2. APIs & Services → Library
3. Buscar "Google Drive API" → Enable

### PDFs no se ven

**Causa:** Permisos no configurados

**Solución:** Verificar que el código incluye:
```typescript
await drive.permissions.create({
  fileId,
  requestBody: { role: 'reader', type: 'anyone' },
});
```

---

## Mejoras Futuras

### 1. Agregar Logo/Marca de Agua
```typescript
doc.image('logo.png', 50, 45, { width: 50 });
```

### 2. Estilos Personalizados
```typescript
doc.fillColor('#333333')
   .fontSize(16)
   .font('Helvetica-Bold');
```

### 3. Tablas Formateadas
```typescript
// Usar librería: npm install pdfkit-table
```

### 4. Enviar por Email
```typescript
// Integrar con Nodemailer
await sendEmail({
  to: cliente.email,
  subject: 'Tu presupuesto',
  attachments: [{ filename: 'presupuesto.pdf', content: pdfBuffer }]
});
```

### 5. Comprimir PDFs
```typescript
// Usar: npm install pdf-lib
```

---

## Resumen de Archivos Creados

```
backend/
├── google-credentials.json          (credenciales)
├── .env                              (variables)
├── src/
│   ├── services/
│   │   ├── googleDriveService.ts    (subir a Drive)
│   │   └── pdfService.ts            (generar PDF)
│   ├── controllers/
│   │   └── pdfController.ts         (endpoint)
│   └── routes/
│       └── presupuestos.ts          (ruta)

frontend/
└── src/
    ├── services/
    │   └── presupuestoService.ts    (API call)
    └── pages/
        └── ListaPresupuestos.tsx    (botón Ver PDF)
```

---

## Checklist de Implementación

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google Drive API
- [ ] Crear Service Account y descargar JSON
- [ ] Crear carpeta en Drive y compartir con Service Account
- [ ] Copiar ID de carpeta
- [ ] Instalar dependencias: `googleapis`, `pdfkit`
- [ ] Crear `googleDriveService.ts`
- [ ] Crear `pdfService.ts`
- [ ] Crear `pdfController.ts`
- [ ] Agregar ruta en `presupuestos.ts`
- [ ] Agregar columnas en MySQL
- [ ] Actualizar tipos en frontend
- [ ] Agregar función en `presupuestoService.ts`
- [ ] Agregar botón en `ListaPresupuestos.tsx`
- [ ] Probar generación de PDF
- [ ] Verificar que se guarda en Drive
- [ ] Verificar que se guarda URL en DB
- [ ] Verificar que se puede ver el PDF

---

## Soporte

Para dudas o problemas, consultar:
- **Google Drive API Docs**: https://developers.google.com/drive/api/guides/about-sdk
- **PDFKit Docs**: https://pdfkit.org/docs/getting_started.html
- **ARCHITECTURE.md**: Arquitectura del sistema
