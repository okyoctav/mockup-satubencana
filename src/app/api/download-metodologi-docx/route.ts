import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildDocx } = require('../../../../scripts/generate_docx');

export async function GET() {
  try {
    const buffer = await buildDocx();

    // Also write to root directory if writable
    try {
      const filePath = path.join(process.cwd(), 'DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.docx');
      fs.writeFileSync(filePath, buffer);
    } catch {
      // ignore write error on readonly host environments
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.docx"',
      },
    });
  } catch (error) {
    console.error('Error generating docx:', error);
    return NextResponse.json(
      { error: 'Gagal membuat dokumen .docx', detail: String(error) },
      { status: 500 }
    );
  }
}
