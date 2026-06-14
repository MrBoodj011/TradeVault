import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet('Trading Journal') || workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'No worksheet found in Excel file' }, { status: 400 });
    }

    const tradesToInsert: any[] = [];

    // Columns indices:
    // Cell 1: Trade ID
    // Cell 2: Date
    // Cell 3: Asset
    // Cell 4: Entry Model
    // Cell 5: Risk/Reward
    // Cell 6: Result
    // Cell 7: PnL (%)
    // Cell 8: Screenshot URL
    // Cell 9: Notes

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      const dateRaw = row.getCell(2).value;
      const assetRaw = row.getCell(3).value;
      const modelRaw = row.getCell(4).value;
      const rrRaw = row.getCell(5).value;
      const resultRaw = row.getCell(6).value;
      const pnlRaw = row.getCell(7).value;
      const screenshotRaw = row.getCell(8).value;
      const notesRaw = row.getCell(9).value;

      // Skip row if essential fields are missing
      if (!assetRaw || !resultRaw) return;

      // Safely parse date
      let parsedDate = new Date();
      if (dateRaw) {
        if (dateRaw instanceof Date) {
          parsedDate = dateRaw;
        } else {
          parsedDate = new Date(dateRaw.toString());
        }
      }

      // Format result value
      let result = resultRaw.toString().trim();
      // capitalize first letter
      result = result.charAt(0).toUpperCase() + result.slice(1);
      if (!['Win', 'Loss', 'Breakeven'].includes(result)) {
        result = 'Win'; // fallback
      }

      // Format screenshot URL value (handling hyperlinked object format from ExcelJS)
      let screenshotUrl = '';
      if (screenshotRaw) {
        if (typeof screenshotRaw === 'object' && 'hyperlink' in screenshotRaw) {
          screenshotUrl = screenshotRaw.hyperlink || '';
        } else if (typeof screenshotRaw === 'object' && 'text' in screenshotRaw) {
          screenshotUrl = (screenshotRaw as any).text || '';
        } else {
          screenshotUrl = screenshotRaw.toString();
        }
      }

      // Format notes value (handling hyperlinked or object format)
      let notes = '';
      if (notesRaw) {
        notes = typeof notesRaw === 'object' ? JSON.stringify(notesRaw) : notesRaw.toString();
      }

      tradesToInsert.push({
        trade_date: parsedDate,
        asset: assetRaw.toString().trim(),
        entry_model: modelRaw ? modelRaw.toString().trim() : 'Other',
        risk_reward: rrRaw ? Number(rrRaw) : 3.0,
        result: result,
        pnl_percentage: pnlRaw ? Number(pnlRaw) : 0.0,
        screenshot_url: screenshotUrl || null,
        notes: notes || null,
      });
    });

    if (tradesToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid trade rows found in Excel sheet' }, { status: 400 });
    }

    // Insert all trades into Postgres in bulk
    await prisma.trade.createMany({
      data: tradesToInsert,
    });

    return NextResponse.json({ success: true, count: tradesToInsert.length });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to import Excel data' }, { status: 500 });
  }
}
