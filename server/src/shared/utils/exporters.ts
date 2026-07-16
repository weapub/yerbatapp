import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ReportColumn {
  key: string;
  header: string;
  /** Formatea el valor para mostrar (Excel/PDF/CSV); por defecto usa String(valor). */
  format?: (value: unknown) => string;
}

export type ReportRow = Record<string, unknown>;

const cellValue = (row: ReportRow, col: ReportColumn): string => {
  const raw = row[col.key];
  if (raw === null || raw === undefined) return '';
  return col.format ? col.format(raw) : String(raw);
};

const csvEscape = (value: string): string => {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
};

export const exportCsv = (res: Response, columns: ReportColumn[], rows: ReportRow[], filename: string): void => {
  const lines = [
    columns.map((c) => csvEscape(c.header)).join(';'),
    ...rows.map((row) => columns.map((c) => csvEscape(cellValue(row, c))).join(';')),
  ];
  // BOM UTF-8 para que Excel abra tildes/ñ correctamente.
  const csv = '﻿' + lines.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
};

export const exportExcel = async (
  res: Response,
  columns: ReportColumn[],
  rows: ReportRow[],
  filename: string,
  sheetTitle: string,
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'YerbatApp';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31));

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: Math.max(c.header.length + 4, 14) }));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3D2E' } };

  rows.forEach((row) => {
    const values: ReportRow = {};
    columns.forEach((c) => {
      values[c.key] = c.format ? c.format(row[c.key]) : row[c.key];
    });
    sheet.addRow(values);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportPdf = (
  res: Response,
  columns: ReportColumn[],
  rows: ReportRow[],
  filename: string,
  title: string,
): void => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .fillColor('#555')
    .text(`Generado el ${new Date().toLocaleDateString('es-AR')} · ${rows.length} registros`, { align: 'center' });
  doc.moveDown(1.2);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;
  const startX = doc.page.margins.left;
  const rowHeight = 16;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  const drawHeader = (y: number): number => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000');
    columns.forEach((col, i) => doc.text(col.header, startX + i * colWidth, y, { width: colWidth - 4 }));
    const lineY = y + rowHeight;
    doc.moveTo(startX, lineY).lineTo(startX + pageWidth, lineY).strokeColor('#ccc').stroke();
    doc.font('Helvetica').fontSize(8);
    return lineY + 4;
  };

  let y = drawHeader(doc.y);

  for (const row of rows) {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
    }
    columns.forEach((col, i) => {
      doc.text(cellValue(row, col), startX + i * colWidth, y, { width: colWidth - 4 });
    });
    y += rowHeight;
  }

  doc.end();
};

export const exportReport = async (
  res: Response,
  formato: 'csv' | 'excel' | 'pdf',
  columns: ReportColumn[],
  rows: ReportRow[],
  filename: string,
  title: string,
): Promise<void> => {
  if (formato === 'csv') return exportCsv(res, columns, rows, filename);
  if (formato === 'excel') return exportExcel(res, columns, rows, filename, title);
  return exportPdf(res, columns, rows, filename, title);
};
