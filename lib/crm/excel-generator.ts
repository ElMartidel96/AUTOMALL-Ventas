/**
 * Excel Generator — Export deals + payments to XLSX
 *
 * Generates workbook matching "AUTOMALL Control de Ventas" template exactly.
 * 40 columns, 3 header rows (title, categories, column names), 6 fixed payment slots.
 * Uses exceljs to create in-memory buffer (no temp files).
 */

import ExcelJS from 'exceljs';
import type { CRMDeal, CRMPayment } from './types';

// ── Brand Colors ──
const AM_BLUE = 'FF1B3A6B';
const AM_BLUE_LIGHT = 'FF2B5EA7';
const AM_ORANGE = 'FFE8832A';
const AM_GREEN = 'FF2D8F4E';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: AM_BLUE },
};

const CATEGORY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: AM_BLUE_LIGHT },
};

const WHITE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 14,
};

const STATUS_COLORS: Record<string, string> = {
  paid: AM_GREEN,
  pending: 'FFFFF3CD',
  overdue: 'FFFFC7CE',
  partial: 'FFFFD699',
  cancelled: 'FFD9D9D9',
};

const DEAL_STATUS_COLORS: Record<string, string> = {
  active: AM_GREEN,
  completed: AM_BLUE,
  default: 'FFDC3545',
  cancelled: 'FF6C757D',
};

const CURRENCY_FMT = '$#,##0.00';
const DATE_FMT = 'MM/DD/YYYY';
const NUMBER_FMT = '#,##0';

// 6 fixed payment slots (matching the reference template)
const MAX_PAYMENT_SLOTS = 6;

// ── Column widths matching the reference template ──
const COL_WIDTHS = [
  5,   // A: #
  13,  // B: Fecha Venta
  22,  // C: Nombre Cliente
  15,  // D: Teléfono
  22,  // E: Email
  16,  // F: Referido Por
  12,  // G: Fuente
  14,  // H: Marca
  14,  // I: Modelo
  7,   // J: Año
  10,  // K: Color
  20,  // L: VIN
  10,  // M: Millaje
  15,  // N: Precio Venta
  13,  // O: Enganche
  17,  // P: Monto Financiado
  12,  // Q: Pick Payment
  10,  // R: # Cuotas
  13,  // S: 1er Pago (Fecha)
  10,  // T: Día de Pago
  14,  // U: Cuota Semanal
  13, 12, // V-W: P1 Fecha, P1 Estatus
  13, 12, // X-Y: P2 Fecha, P2 Estatus
  13, 12, // Z-AA: P3 Fecha, P3 Estatus
  13, 12, // AB-AC: P4 Fecha, P4 Estatus
  13, 12, // AD-AE: P5 Fecha, P5 Estatus
  13, 12, // AF-AG: P6 Fecha, P6 Estatus
  15,  // AH: Total Cobrado
  16,  // AI: Saldo Pendiente
  16,  // AJ: Financiera / Banco
  8,   // AK: GPS Instal.
  12,  // AL: Estatus Deal
  12,  // AM: Comisión
  30,  // AN: Notas
];

// ── Category groups (Row 2) with merge ranges ──
const CATEGORY_GROUPS: Array<{ label: string; start: number; end: number }> = [
  { label: 'ID', start: 1, end: 1 },
  { label: 'INFO', start: 2, end: 2 },
  { label: 'CLIENTE', start: 3, end: 7 },
  { label: 'VEHÍCULO', start: 8, end: 13 },
  { label: 'FINANCIERO', start: 14, end: 16 },
  { label: 'PICK PAYMENT', start: 17, end: 21 },
  { label: 'CALENDARIO DE PAGOS', start: 22, end: 33 },
  { label: 'RESUMEN', start: 34, end: 35 },
  { label: 'ADICIONAL', start: 36, end: 40 },
];

// ── Labels ──
const finTypeLabels: Record<string, string> = {
  cash: 'NO',
  in_house: 'SÍ',
  external: 'SÍ',
};

const freqLabels: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

const statusLabels: Record<string, string> = {
  paid: 'PAGADO',
  pending: 'PENDIENTE',
  overdue: 'ATRASADO',
  partial: 'PARCIAL',
  cancelled: 'CANCELADO',
};

const dealStatusLabels: Record<string, string> = {
  active: 'ACTIVO',
  completed: 'COMPLETADO',
  default: 'DEFAULT',
  cancelled: 'CANCELADO',
};

const sourceLabels: Record<string, string> = {
  website: 'WEBSITE',
  facebook: 'FACEBOOK',
  whatsapp: 'WHATSAPP',
  referral: 'REFERIDO',
  walk_in: 'WALK-IN',
  other: 'OTRO',
};

export async function generateDealExcel(
  deals: CRMDeal[],
  paymentsByDeal: Map<string, CRMPayment[]>,
  sellerName?: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Autos MALL';
  wb.created = new Date();

  const ws = wb.addWorksheet('Ventas', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }],
  });

  // ── Set column widths ──
  for (let i = 0; i < COL_WIDTHS.length; i++) {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  }

  // ══════════════════════════════════════════════
  // ROW 1: Title (merged across all 40 columns)
  // ══════════════════════════════════════════════
  ws.mergeCells(1, 1, 1, 40);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'AUTOMALL  ·  CONTROL DE VENTAS';
  titleCell.font = TITLE_FONT;
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AM_BLUE } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 35;

  // ══════════════════════════════════════════════
  // ROW 2: Category groups (merged)
  // ══════════════════════════════════════════════
  for (const group of CATEGORY_GROUPS) {
    if (group.start !== group.end) {
      ws.mergeCells(2, group.start, 2, group.end);
    }
    const cell = ws.getCell(2, group.start);
    cell.value = group.label;
    cell.font = WHITE_FONT;
    cell.fill = CATEGORY_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  ws.getRow(2).height = 22;

  // ══════════════════════════════════════════════
  // ROW 3: Column headers (40 columns, exact match)
  // ══════════════════════════════════════════════
  const headers = [
    '#',                    // 1
    'FECHA\nVENTA',         // 2
    'NOMBRE\nCLIENTE',      // 3
    'TELÉFONO',             // 4
    'EMAIL',                // 5
    'REFERIDO POR',         // 6
    'FUENTE',               // 7
    'MARCA',                // 8
    'MODELO',               // 9
    'AÑO',                  // 10
    'COLOR',                // 11
    'VIN',                  // 12
    'MILLAJE',              // 13
    'PRECIO\nVENTA',        // 14
    'ENGANCHE',             // 15
    'MONTO\nFINANCIADO',    // 16
    'PICK\nPAYMENT',        // 17
    '# CUOTAS',             // 18
    '1er PAGO\n(FECHA)',    // 19
    'DÍA DE\nPAGO',         // 20
    'CUOTA\nSEMANAL',       // 21
    'PAGO 1\nFECHA',        // 22
    'P1\nESTATUS',          // 23
    'PAGO 2\nFECHA',        // 24
    'P2\nESTATUS',          // 25
    'PAGO 3\nFECHA',        // 26
    'P3\nESTATUS',          // 27
    'PAGO 4\nFECHA',        // 28
    'P4\nESTATUS',          // 29
    'PAGO 5\nFECHA',        // 30
    'P5\nESTATUS',          // 31
    'PAGO 6\nFECHA',        // 32
    'P6\nESTATUS',          // 33
    'TOTAL\nCOBRADO',       // 34
    'SALDO\nPENDIENTE',     // 35
    'FINANCIERA /\nBANCO',  // 36
    'GPS\nINSTAL.',         // 37
    'ESTATUS\nDEAL',        // 38
    'COMISIÓN',             // 39
    'NOTAS',                // 40
  ];

  const headerRow = ws.getRow(3);
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.fill = HEADER_FILL;
    cell.font = WHITE_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });
  headerRow.height = 36;

  // ══════════════════════════════════════════════
  // DATA ROWS (starting at row 4)
  // ══════════════════════════════════════════════
  deals.forEach((deal, idx) => {
    const payments = paymentsByDeal.get(deal.id) || [];
    const rowNum = idx + 4;
    const row = ws.getRow(rowNum);

    // Determine lead source if available
    const source = (deal as unknown as Record<string, unknown>).source as string | undefined;

    // Col 1: #
    row.getCell(1).value = idx + 1;

    // Col 2: Fecha Venta
    if (deal.sale_date) {
      row.getCell(2).value = new Date(deal.sale_date + 'T12:00:00');
      row.getCell(2).numFmt = DATE_FMT;
    }

    // Col 3-7: Cliente
    row.getCell(3).value = deal.client_name;
    row.getCell(4).value = deal.client_phone || '';
    row.getCell(5).value = deal.client_email || '';
    row.getCell(6).value = deal.referred_by || '';
    row.getCell(7).value = source ? (sourceLabels[source] || source.toUpperCase()) : '';

    // Col 8-13: Vehículo
    row.getCell(8).value = deal.vehicle_brand;
    row.getCell(9).value = deal.vehicle_model;
    row.getCell(10).value = deal.vehicle_year;
    row.getCell(11).value = deal.vehicle_color || '';
    row.getCell(12).value = deal.vehicle_vin || '';
    if (deal.vehicle_mileage) {
      row.getCell(13).value = deal.vehicle_mileage;
      row.getCell(13).numFmt = NUMBER_FMT;
    }

    // Col 14-16: Financiero
    row.getCell(14).value = Number(deal.sale_price);
    row.getCell(14).numFmt = CURRENCY_FMT;
    row.getCell(15).value = Number(deal.down_payment);
    row.getCell(15).numFmt = CURRENCY_FMT;
    row.getCell(16).value = Number(deal.financed_amount);
    row.getCell(16).numFmt = CURRENCY_FMT;

    // Col 17-21: Pick Payment
    row.getCell(17).value = finTypeLabels[deal.financing_type] || deal.financing_type;
    row.getCell(18).value = deal.num_installments || '';
    if (deal.first_payment_date) {
      row.getCell(19).value = new Date(deal.first_payment_date + 'T12:00:00');
      row.getCell(19).numFmt = DATE_FMT;
    }
    row.getCell(20).value = deal.payment_day || '';
    if (deal.installment_amount) {
      row.getCell(21).value = Number(deal.installment_amount);
      row.getCell(21).numFmt = CURRENCY_FMT;
    }

    // Col 22-33: Calendario de Pagos (6 fixed slots)
    for (let i = 0; i < MAX_PAYMENT_SLOTS; i++) {
      const dateCol = 22 + (i * 2);
      const statusCol = 23 + (i * 2);
      const p = payments[i];

      if (p) {
        // Payment date
        const dateStr = p.paid_date || p.due_date;
        if (dateStr) {
          row.getCell(dateCol).value = new Date(dateStr + 'T12:00:00');
          row.getCell(dateCol).numFmt = DATE_FMT;
        }
        // Payment status
        row.getCell(statusCol).value = statusLabels[p.status] || p.status;

        // Color-code status
        const color = STATUS_COLORS[p.status];
        if (color) {
          row.getCell(statusCol).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color },
          };
          if (p.status === 'paid') {
            row.getCell(statusCol).font = { color: { argb: 'FFFFFFFF' }, bold: true };
          }
        }
      }
    }

    // Col 34-35: Resumen
    row.getCell(34).value = Number(deal.total_collected);
    row.getCell(34).numFmt = CURRENCY_FMT;
    row.getCell(35).value = Number(deal.outstanding_balance);
    row.getCell(35).numFmt = CURRENCY_FMT;

    // Highlight outstanding balance in orange if > 0
    if (Number(deal.outstanding_balance) > 0) {
      row.getCell(35).font = { color: { argb: AM_ORANGE }, bold: true };
    }

    // Col 36-40: Adicional
    row.getCell(36).value = deal.finance_company || '';
    row.getCell(37).value = deal.gps_installed ? 'SÍ' : 'NO';
    row.getCell(38).value = dealStatusLabels[deal.deal_status] || deal.deal_status;
    row.getCell(39).value = Number(deal.commission);
    row.getCell(39).numFmt = CURRENCY_FMT;
    row.getCell(40).value = deal.notes || '';

    // Color-code deal status
    const dsColor = DEAL_STATUS_COLORS[deal.deal_status];
    if (dsColor) {
      row.getCell(38).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: dsColor },
      };
      row.getCell(38).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    // Alternate row background
    if (idx % 2 === 1) {
      for (let c = 1; c <= 40; c++) {
        const cell = row.getCell(c);
        if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern !== 'solid') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' },
          };
        }
      }
    }

    // Center-align specific columns
    [1, 10, 17, 18, 20, 37].forEach(c => {
      row.getCell(c).alignment = { horizontal: 'center' };
    });
  });

  // ── Print header ──
  if (sellerName) {
    ws.headerFooter.oddHeader = `&C&B${sellerName} — Control de Ventas`;
  }

  // ── Auto-filter on header row ──
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: 40 },
  };

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
