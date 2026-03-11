/**
 * Excel Generator — Export deals + payments to XLSX
 *
 * Generates workbook matching "AUTOMALL Control de Ventas" template.
 * Uses exceljs to create in-memory buffer (no temp files).
 */

import ExcelJS from 'exceljs';
import type { CRMDeal, CRMPayment } from './types';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1B3A6B' }, // am-blue
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const STATUS_COLORS: Record<string, string> = {
  paid: 'FF2D8F4E',      // am-green
  pending: 'FFFFF3CD',    // yellow
  overdue: 'FFFFC7CE',    // red-light
  partial: 'FFFFD699',    // orange-light
  cancelled: 'FFD9D9D9',  // gray
};

const DEAL_STATUS_COLORS: Record<string, string> = {
  active: 'FF2D8F4E',
  completed: 'FF1B3A6B',
  default: 'FFDC3545',
  cancelled: 'FF6C757D',
};

const CURRENCY_FORMAT = '$#,##0.00';
const DATE_FORMAT = 'MM/DD/YYYY';

export async function generateDealExcel(
  deals: CRMDeal[],
  paymentsByDeal: Map<string, CRMPayment[]>,
  sellerName?: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Autos MALL';
  wb.created = new Date();

  const ws = wb.addWorksheet('Control de Ventas', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Determine max number of payments across all deals
  let maxPayments = 0;
  for (const [, payments] of paymentsByDeal) {
    if (payments.length > maxPayments) maxPayments = payments.length;
  }

  // ── Define columns ──
  const baseColumns: Partial<ExcelJS.Column>[] = [
    { header: '#', key: 'num', width: 5 },
    { header: 'Fecha Venta', key: 'sale_date', width: 13 },
    { header: 'Cliente', key: 'client_name', width: 22 },
    { header: 'Teléfono', key: 'client_phone', width: 15 },
    { header: 'Email', key: 'client_email', width: 22 },
    { header: 'Referido Por', key: 'referred_by', width: 16 },
    { header: 'Marca', key: 'vehicle_brand', width: 14 },
    { header: 'Modelo', key: 'vehicle_model', width: 14 },
    { header: 'Año', key: 'vehicle_year', width: 7 },
    { header: 'Color', key: 'vehicle_color', width: 10 },
    { header: 'VIN', key: 'vehicle_vin', width: 20 },
    { header: 'Millaje', key: 'vehicle_mileage', width: 10 },
    { header: 'Precio Venta', key: 'sale_price', width: 15 },
    { header: 'Enganche', key: 'down_payment', width: 13 },
    { header: 'Monto Financiado', key: 'financed_amount', width: 17 },
    { header: 'Tipo Financiamiento', key: 'financing_type', width: 20 },
    { header: '# Cuotas', key: 'num_installments', width: 10 },
    { header: '1er Pago', key: 'first_payment_date', width: 13 },
    { header: 'Frecuencia', key: 'payment_frequency', width: 13 },
    { header: 'Monto Cuota', key: 'installment_amount', width: 14 },
  ];

  // Payment columns (dynamic based on max)
  const paymentColumns: Partial<ExcelJS.Column>[] = [];
  for (let i = 1; i <= maxPayments; i++) {
    paymentColumns.push(
      { header: `P${i} Fecha`, key: `p${i}_date`, width: 13 },
      { header: `P${i} Estado`, key: `p${i}_status`, width: 12 },
    );
  }

  const tailColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Total Cobrado', key: 'total_collected', width: 15 },
    { header: 'Saldo Pendiente', key: 'outstanding_balance', width: 16 },
    { header: 'Financiera', key: 'finance_company', width: 16 },
    { header: 'GPS', key: 'gps_installed', width: 6 },
    { header: 'Estado', key: 'deal_status', width: 12 },
    { header: 'Comisión', key: 'commission', width: 12 },
    { header: 'Notas', key: 'notes', width: 30 },
  ];

  ws.columns = [...baseColumns, ...paymentColumns, ...tailColumns];

  // ── Style header row ──
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });
  headerRow.height = 30;

  // ── Financing type labels ──
  const finTypeLabels: Record<string, string> = {
    cash: 'Efectivo',
    in_house: 'In-House',
    external: 'Externo',
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
    active: 'Activo',
    completed: 'Completado',
    default: 'Default',
    cancelled: 'Cancelado',
  };

  // ── Add data rows ──
  deals.forEach((deal, idx) => {
    const payments = paymentsByDeal.get(deal.id) || [];

    const rowData: Record<string, unknown> = {
      num: idx + 1,
      sale_date: deal.sale_date ? new Date(deal.sale_date + 'T12:00:00') : '',
      client_name: deal.client_name,
      client_phone: deal.client_phone || '',
      client_email: deal.client_email || '',
      referred_by: deal.referred_by || '',
      vehicle_brand: deal.vehicle_brand,
      vehicle_model: deal.vehicle_model,
      vehicle_year: deal.vehicle_year,
      vehicle_color: deal.vehicle_color || '',
      vehicle_vin: deal.vehicle_vin || '',
      vehicle_mileage: deal.vehicle_mileage || '',
      sale_price: Number(deal.sale_price),
      down_payment: Number(deal.down_payment),
      financed_amount: Number(deal.financed_amount),
      financing_type: finTypeLabels[deal.financing_type] || deal.financing_type,
      num_installments: deal.num_installments,
      first_payment_date: deal.first_payment_date ? new Date(deal.first_payment_date + 'T12:00:00') : '',
      payment_frequency: freqLabels[deal.payment_frequency] || deal.payment_frequency,
      installment_amount: deal.installment_amount ? Number(deal.installment_amount) : '',
      total_collected: Number(deal.total_collected),
      outstanding_balance: Number(deal.outstanding_balance),
      finance_company: deal.finance_company || '',
      gps_installed: deal.gps_installed ? 'Sí' : 'No',
      deal_status: dealStatusLabels[deal.deal_status] || deal.deal_status,
      commission: Number(deal.commission),
      notes: deal.notes || '',
    };

    // Add payment data
    for (let i = 0; i < maxPayments; i++) {
      const p = payments[i];
      if (p) {
        rowData[`p${i + 1}_date`] = p.paid_date
          ? new Date(p.paid_date + 'T12:00:00')
          : (p.due_date ? new Date(p.due_date + 'T12:00:00') : '');
        rowData[`p${i + 1}_status`] = statusLabels[p.status] || p.status;
      } else {
        rowData[`p${i + 1}_date`] = '';
        rowData[`p${i + 1}_status`] = '';
      }
    }

    const row = ws.addRow(rowData);

    // Style currency columns
    const currencyCols = ['sale_price', 'down_payment', 'financed_amount', 'installment_amount', 'total_collected', 'outstanding_balance', 'commission'];
    for (const colKey of currencyCols) {
      const col = ws.getColumn(colKey);
      if (col) {
        const cell = row.getCell(col.number);
        if (typeof cell.value === 'number') {
          cell.numFmt = CURRENCY_FORMAT;
        }
      }
    }

    // Style date columns
    const dateCols = ['sale_date', 'first_payment_date'];
    for (const colKey of dateCols) {
      const col = ws.getColumn(colKey);
      if (col) {
        const cell = row.getCell(col.number);
        if (cell.value instanceof Date) {
          cell.numFmt = DATE_FORMAT;
        }
      }
    }

    // Style payment status cells with colors
    for (let i = 0; i < maxPayments; i++) {
      const p = payments[i];
      if (p) {
        const statusColKey = `p${i + 1}_status`;
        const col = ws.getColumn(statusColKey);
        if (col) {
          const cell = row.getCell(col.number);
          const color = STATUS_COLORS[p.status];
          if (color) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color },
            };
            if (p.status === 'paid') {
              cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            }
          }
        }

        // Payment date formatting
        const dateColKey = `p${i + 1}_date`;
        const dateCol = ws.getColumn(dateColKey);
        if (dateCol) {
          const cell = row.getCell(dateCol.number);
          if (cell.value instanceof Date) {
            cell.numFmt = DATE_FORMAT;
          }
        }
      }
    }

    // Style deal status cell
    const statusCol = ws.getColumn('deal_status');
    if (statusCol) {
      const cell = row.getCell(statusCol.number);
      const color = DEAL_STATUS_COLORS[deal.deal_status];
      if (color) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    }

    // Alternate row background
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern !== 'solid') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' },
          };
        }
      });
    }
  });

  // ── Title row info (optional — add as header comment) ──
  if (sellerName) {
    ws.headerFooter.oddHeader = `&C&B${sellerName} — Control de Ventas`;
  }

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
