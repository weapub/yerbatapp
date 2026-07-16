import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PanelIva } from './iva.service';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const filename = (desde: Date, hasta: Date, ext: string) =>
  `panel-iva_${toISODate(desde)}_${toISODate(hasta)}.${ext}`;

export const exportarIvaExcel = async (res: Response, panel: PanelIva, desde: Date, hasta: Date): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'YerbatApp';
  const sheet = workbook.addWorksheet('Panel IVA');

  sheet.columns = [
    { header: 'Período', key: 'periodo', width: 14 },
    { header: 'IVA Ventas', key: 'ivaVentas', width: 16 },
    { header: 'IVA Compras', key: 'ivaCompras', width: 16 },
    { header: 'Débito Fiscal', key: 'debitoFiscal', width: 16 },
    { header: 'Crédito Fiscal', key: 'creditoFiscal', width: 16 },
    { header: 'Saldo Técnico', key: 'saldoTecnico', width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3D2E' } };
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  panel.porMes.forEach((p) => sheet.addRow(p));

  const totalRow = sheet.addRow({ ...panel.totales, periodo: 'TOTAL' });
  totalRow.font = { bold: true };

  sheet.getColumn('ivaVentas').numFmt = '#,##0.00';
  sheet.getColumn('ivaCompras').numFmt = '#,##0.00';
  sheet.getColumn('debitoFiscal').numFmt = '#,##0.00';
  sheet.getColumn('creditoFiscal').numFmt = '#,##0.00';
  sheet.getColumn('saldoTecnico').numFmt = '#,##0.00';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename(desde, hasta, 'xlsx')}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const COLUMNS = [
  { key: 'periodo', label: 'Período', x: 40, width: 60 },
  { key: 'ivaVentas', label: 'IVA Ventas', x: 100, width: 80 },
  { key: 'ivaCompras', label: 'IVA Compras', x: 180, width: 80 },
  { key: 'debitoFiscal', label: 'Débito Fiscal', x: 260, width: 80 },
  { key: 'creditoFiscal', label: 'Crédito Fiscal', x: 340, width: 80 },
  { key: 'saldoTecnico', label: 'Saldo Técnico', x: 420, width: 100 },
] as const;

const money = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const exportarIvaPdf = (res: Response, panel: PanelIva, desde: Date, hasta: Date): void => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename(desde, hasta, 'pdf')}"`);
  doc.pipe(res);

  doc.fontSize(16).text('Panel IVA — YerbatApp', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#555').text(`Período: ${toISODate(desde)} a ${toISODate(hasta)}`, { align: 'center' });
  doc.moveDown(1.5);

  let y = doc.y;
  doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
  COLUMNS.forEach((col) => doc.text(col.label, col.x, y, { width: col.width }));
  y += 16;
  doc.moveTo(40, y).lineTo(520, y).strokeColor('#ccc').stroke();
  y += 6;
  doc.font('Helvetica');

  const rows = [...panel.porMes, { ...panel.totales, periodo: 'TOTAL' }];
  for (const row of rows) {
    COLUMNS.forEach((col) => {
      const value = col.key === 'periodo' ? row.periodo : money(row[col.key]);
      doc.text(value, col.x, y, { width: col.width });
    });
    y += 16;
  }

  doc.end();
};
