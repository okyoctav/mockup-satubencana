import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'docs',
      'DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.doc'
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Dokumen belum tersedia' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': 'attachment; filename="DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.doc"',
      },
    });
  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: 'Gagal mengunduh dokumen' },
      { status: 500 }
    );
  }
}
