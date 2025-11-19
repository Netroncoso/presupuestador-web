# Imprimir/Descargar Presupuesto como PDF (Cliente)

## Resumen

Generar PDF directamente en el navegador del usuario sin backend. El usuario puede:
- 📥 Descargar el PDF a su máquina
- 🖨️ Imprimir directamente
- 💾 Guardar donde quiera

## Ventajas

✅ **Instantáneo** - Se genera en el navegador
✅ **Sin backend** - No requiere servidor
✅ **Gratis** - 100% cliente
✅ **Offline** - Funciona sin internet
✅ **Simple** - Solo 1 librería

---

## Implementación

### 1. Instalar Librería

```bash
cd frontend
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

### 2. Crear Servicio de PDF

**Archivo:** `frontend/src/services/pdfClientService.ts`

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PresupuestoData {
  cliente: string;
  dni: string;
  sucursal: string;
  fecha: string;
  presupuestoId: number;
  insumos: Array<{ producto: string; cantidad: number; costo: number }>;
  prestaciones: Array<{ prestacion: string; cantidad: number; valor_asignado: number }>;
  totales: {
    totalInsumos: number;
    totalPrestaciones: number;
    costoTotal: number;
    totalFacturar: number;
    rentabilidad: number;
  };
}

export const pdfClientService = {
  /**
   * Genera y descarga el PDF
   */
  generarYDescargar(data: PresupuestoData) {
    const doc = new jsPDF();
    let yPos = 20;

    // --- HEADER ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 105, yPos, { align: 'center' });
    yPos += 15;

    // --- DATOS DEL CLIENTE ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${data.cliente}`, 20, yPos);
    yPos += 7;
    doc.text(`DNI: ${data.dni}`, 20, yPos);
    yPos += 7;
    doc.text(`Sucursal: ${data.sucursal}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha: ${data.fecha}`, 20, yPos);
    yPos += 7;
    doc.text(`Presupuesto #${data.presupuestoId}`, 20, yPos);
    yPos += 15;

    // --- INSUMOS ---
    if (data.insumos.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INSUMOS', 20, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['Producto', 'Cantidad', 'Precio Unit.', 'Total']],
        body: data.insumos.map(i => [
          i.producto,
          i.cantidad.toString(),
          `$${i.costo.toFixed(2)}`,
          `$${(i.costo * i.cantidad).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- PRESTACIONES ---
    if (data.prestaciones.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESTACIONES', 20, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['Servicio', 'Cantidad', 'Precio Unit.', 'Total']],
        body: data.prestaciones.map(p => [
          p.prestacion,
          p.cantidad.toString(),
          `$${p.valor_asignado.toFixed(2)}`,
          `$${(p.valor_asignado * p.cantidad).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- TOTALES ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALES', 20, yPos);
    yPos += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Insumos: $${data.totales.totalInsumos.toFixed(2)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Prestaciones: $${data.totales.totalPrestaciones.toFixed(2)}`, 20, yPos);
    yPos += 7;
    doc.text(`Costo Total: $${data.totales.costoTotal.toFixed(2)}`, 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total a Facturar: $${data.totales.totalFacturar.toFixed(2)}`, 20, yPos);
    yPos += 7;
    doc.text(`Rentabilidad: ${data.totales.rentabilidad.toFixed(2)}%`, 20, yPos);

    // --- FOOTER ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generado el ${new Date().toLocaleString('es-AR')}`,
        105,
        285,
        { align: 'center' }
      );
    }

    // Descargar
    doc.save(`presupuesto-${data.presupuestoId}.pdf`);
  },

  /**
   * Genera y abre ventana de impresión
   */
  generarYImprimir(data: PresupuestoData) {
    const doc = new jsPDF();
    // ... mismo código de generación ...
    
    // Abrir ventana de impresión
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  },
};
```

### 3. Agregar Botones en UserDashboard

**Archivo:** `frontend/src/pages/UserDashboard.tsx`

```typescript
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { pdfClientService } from '../services/pdfClientService';

// Dentro del componente, agregar función
const handleDescargarPDF = () => {
  const data = {
    cliente: clienteNombre,
    dni: '12345678', // Obtener del presupuesto
    sucursal: 'Centro', // Obtener del presupuesto
    fecha: new Date().toLocaleDateString('es-AR'),
    presupuestoId: presupuestoId || 0,
    insumos: insumosSeleccionados,
    prestaciones: prestacionesSeleccionadas,
    totales: {
      totalInsumos,
      totalPrestaciones,
      costoTotal,
      totalFacturar,
      rentabilidad,
    },
  };

  pdfClientService.generarYDescargar(data);
};

const handleImprimirPDF = () => {
  const data = {
    // ... mismo data
  };

  pdfClientService.generarYImprimir(data);
};

// En el JSX, junto al botón "Guardar Versión"
<Group gap="xs">
  <Button
    onClick={handleGuardarVersion}
    loading={guardandoTotales}
    disabled={!presupuestoId}
  >
    Guardar Versión
  </Button>

  <Button
    variant="light"
    leftSection={<ArrowDownTrayIcon style={{ width: 20, height: 20 }} />}
    onClick={handleDescargarPDF}
    disabled={!presupuestoId}
  >
    Descargar PDF
  </Button>

  <Button
    variant="outline"
    leftSection={<PrinterIcon style={{ width: 20, height: 20 }} />}
    onClick={handleImprimirPDF}
    disabled={!presupuestoId}
  >
    Imprimir
  </Button>
</Group>
```

---

## Cómo se Ve

### Botones en la UI

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Guardar Versión]  [📥 Descargar PDF]  [🖨️ Imprimir] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Flujo de Usuario

**Descargar:**
1. Click en "Descargar PDF"
2. Se genera PDF en el navegador
3. Se descarga automáticamente: `presupuesto-1234.pdf`

**Imprimir:**
1. Click en "Imprimir"
2. Se genera PDF en el navegador
3. Se abre ventana de impresión del navegador
4. Usuario elige impresora o "Guardar como PDF"

---

## Ventajas vs Google Drive

| Aspecto | Cliente (jsPDF) | Google Drive API |
|---------|-----------------|------------------|
| **Setup** | 2 min | 15 min |
| **Velocidad** | Instantáneo | ~500ms |
| **Requiere backend** | ❌ No | ✅ Sí |
| **Requiere internet** | ❌ No | ✅ Sí |
| **Almacena en nube** | ❌ No | ✅ Sí |
| **Historial** | ❌ No | ✅ Sí |
| **Compartir link** | ❌ No | ✅ Sí |

---

## Personalización

### Agregar Logo

```typescript
// Agregar imagen (debe ser base64 o URL)
doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
```

### Cambiar Colores

```typescript
// Header azul
headStyles: { fillColor: [37, 99, 235] } // RGB

// Texto rojo
doc.setTextColor(239, 68, 68);
```

### Agregar Marca de Agua

```typescript
doc.setTextColor(200, 200, 200);
doc.setFontSize(50);
doc.text('BORRADOR', 105, 150, { 
  align: 'center', 
  angle: 45 
});
```

---

## Combinación Recomendada

**Mejor de ambos mundos:**

1. **Botón "Descargar PDF"** → jsPDF (cliente)
   - Para que el usuario lo guarde localmente
   - Rápido e instantáneo

2. **Botón "Guardar en Drive"** → Google Drive API (backend)
   - Para historial en la nube
   - Para compartir con otros
   - Para auditoría

```typescript
<Group>
  <Button onClick={handleDescargarPDF}>
    📥 Descargar PDF
  </Button>
  
  <Button onClick={handleGuardarEnDrive}>
    ☁️ Guardar en Drive
  </Button>
</Group>
```

---

## Próximos Pasos

1. ✅ Implementar botones de descarga/impresión (este documento)
2. ⏭️ Implementar Google Drive API (GOOGLE_DRIVE_PDF.md)
3. ⏭️ Mejorar diseño del PDF (opcional)

---

## Testing

```typescript
// Probar en consola del navegador
import { pdfClientService } from './services/pdfClientService';

const mockData = {
  cliente: 'Juan Pérez',
  dni: '12345678',
  sucursal: 'Centro',
  fecha: '15/01/2024',
  presupuestoId: 1,
  insumos: [{ producto: 'Vendas', cantidad: 10, costo: 50 }],
  prestaciones: [{ prestacion: 'Kinesiología', cantidad: 20, valor_asignado: 200 }],
  totales: {
    totalInsumos: 500,
    totalPrestaciones: 4000,
    costoTotal: 4500,
    totalFacturar: 6000,
    rentabilidad: 33.33,
  },
};

pdfClientService.generarYDescargar(mockData);
```

---

## Resumen

**Implementación simple en 3 pasos:**

1. `npm install jspdf jspdf-autotable`
2. Crear `pdfClientService.ts`
3. Agregar 2 botones en `UserDashboard.tsx`

**Resultado:** Usuario puede descargar/imprimir PDF instantáneamente. 🚀
