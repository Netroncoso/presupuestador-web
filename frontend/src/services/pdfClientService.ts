import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberFormat } from '../utils/numberFormat';

interface PresupuestoData {
  cliente: string;
  dni: string;
  sucursal: string;
  presupuestoId: number;
  insumos: Array<{ producto: string; cantidad: number; costo: number }>;
  prestaciones: Array<{ prestacion: string; cantidad: number; valor_asignado: number }>;
  equipamientos: Array<{ nombre: string; tipo: string; cantidad: number; costo: number }>;
  totales: {
    totalInsumos: number;
    totalPrestaciones: number;
    totalEquipamientos: number;
    costoTotal: number;
    totalFacturar: number;
    rentabilidad: number;
  };
}

export const pdfClientService = {
  generarYDescargar(data: PresupuestoData) {
    const doc = new jsPDF();
    let yPos = 20;

    // HEADER
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 105, yPos, { align: 'center' });
    yPos += 15;

    // DATOS DEL CLIENTE
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${data.cliente}`, 20, yPos);
    yPos += 7;
    doc.text(`DNI: ${data.dni}`, 20, yPos);
    yPos += 7;
    doc.text(`Sucursal: ${data.sucursal}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 20, yPos);
    yPos += 7;
    doc.text(`Presupuesto #${data.presupuestoId}`, 20, yPos);
    yPos += 15;

    // INSUMOS
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
          numberFormat.formatCurrency(i.costo),
          numberFormat.formatCurrency(i.costo * i.cantidad)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // PRESTACIONES
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
          numberFormat.formatCurrency(p.valor_asignado),
          numberFormat.formatCurrency(p.valor_asignado * p.cantidad)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // EQUIPAMIENTOS
    if (data.equipamientos && data.equipamientos.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPAMIENTOS', 20, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['Equipamiento', 'Tipo', 'Cantidad', 'Precio Unit.', 'Total']],
        body: data.equipamientos.map(e => [
          e.nombre,
          e.tipo,
          e.cantidad.toString(),
          numberFormat.formatCurrency(e.costo),
          numberFormat.formatCurrency(e.costo * e.cantidad)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // TOTALES
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALES', 20, yPos);
    yPos += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Insumos: ${numberFormat.formatCurrency(data.totales.totalInsumos)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Prestaciones: ${numberFormat.formatCurrency(data.totales.totalPrestaciones)}`, 20, yPos);
    yPos += 7;
    if (data.totales.totalEquipamientos > 0) {
      doc.text(`Total Equipamientos: ${numberFormat.formatCurrency(data.totales.totalEquipamientos)}`, 20, yPos);
      yPos += 7;
    }
    doc.text(`Costo Total: ${numberFormat.formatCurrency(data.totales.costoTotal)}`, 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total a Facturar: ${numberFormat.formatCurrency(data.totales.totalFacturar)}`, 20, yPos);
    yPos += 7;
    doc.text(`Rentabilidad: ${data.totales.rentabilidad.toFixed(2)}%`, 20, yPos);

    // FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado el ${new Date().toLocaleString('es-AR')}`,
      105,
      285,
      { align: 'center' }
    );

    // Descargar
    doc.save(`presupuesto-${data.presupuestoId}.pdf`);
  },
};
