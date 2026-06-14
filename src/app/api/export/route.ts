import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';
import { Trade } from '@/types/trade';

// Set up column definitions
const COLUMNS = [
  { header: 'Trade ID', key: 'id', width: 15 },
  { header: 'Date', key: 'trade_date', width: 15 },
  { header: 'Asset', key: 'asset', width: 12 },
  { header: 'Entry Model', key: 'entry_model', width: 22 },
  { header: 'Risk/Reward', key: 'risk_reward', width: 15 },
  { header: 'Result', key: 'result', width: 12 },
  { header: 'PnL (%)', key: 'pnl_percentage', width: 12 },
  { header: 'Screenshot URL', key: 'screenshot_url', width: 25 },
  { header: 'Notes', key: 'notes', width: 35 },
];

function generateExcelBuffer(trades: Trade[]): Promise<any> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Trading Journal');

  // Set up columns
  worksheet.columns = COLUMNS;

  // Add rows
  trades.forEach((trade) => {
    worksheet.addRow({
      id: trade.id.substring(0, 8), // shorten ID for display
      trade_date: new Date(trade.trade_date).toISOString().split('T')[0],
      asset: trade.asset,
      entry_model: trade.entry_model,
      risk_reward: Number(trade.risk_reward),
      result: trade.result,
      pnl_percentage: Number(trade.pnl_percentage),
      screenshot_url: trade.screenshot_url || '',
      notes: trade.notes || '',
    });
  });

  // Enable Auto Filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, trades.length + 1), column: COLUMNS.length },
  };

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1E24' }, // Premium Dark Background
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFd4af37' } }, // Gold bottom border
    };
  });

  // Style Data Rows
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      // General styling
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Left align notes and screenshot URLs
      if (colNumber === 8 || colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Add number formatting to PnL and Risk Reward
      if (colNumber === 5) {
        cell.numFmt = '0.0';
      }
      if (colNumber === 7) {
        cell.numFmt = '0.00"%"';
      }

      // Conditional formatting for Result column (Column 6)
      if (colNumber === 6) {
        const resultVal = cell.value?.toString();
        if (resultVal === 'Win') {
          cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF107C41' } }; // Excel green
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2F0D9' }, // Light soft green
          };
        } else if (resultVal === 'Loss') {
          cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFA51D24' } }; // Soft red
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCE4D6' }, // Light soft red
          };
        } else {
          cell.font = { name: 'Segoe UI', italic: true, color: { argb: 'FF595959' } }; // Muted grey
        }
      }
    });
  });

  // Auto-adjust Column Widths based on content (with safety margin)
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });
    column.width = Math.max(maxLength + 4, 12);
  });

  return workbook.xlsx.writeBuffer() as any;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trades: Trade[] = body.trades || [];
    const buffer = await generateExcelBuffer(trades);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tradevault_journal.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate Excel file' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: {
        trade_date: 'asc',
      },
    });

    const formattedTrades = trades.map((t) => ({
      ...t,
      trade_date: t.trade_date.toISOString(),
      created_at: t.created_at.toISOString(),
    }));

    const buffer = await generateExcelBuffer(formattedTrades as any);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tradevault_journal.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to export trades' }, { status: 500 });
  }
}
