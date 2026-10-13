import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await sql.query(
      `SELECT nome_arquivo, tipo_arquivo, conteudo_base64 FROM public.cliente_anexos WHERE id = $1`,
      [id]
    );

    if (rows.length === 0 || !rows[0].conteudo_base64) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    const { nome_arquivo, tipo_arquivo, conteudo_base64 } = rows[0] as any;

    const base64Data = String(conteudo_base64).includes(',')
      ? String(conteudo_base64).split(',')[1]
      : String(conteudo_base64);

    const buffer = Buffer.from(base64Data, 'base64');
    const mime = tipo_arquivo || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${encodeURIComponent(nome_arquivo)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro ao servir anexo do cliente:', error);
    return new NextResponse('Erro interno ao buscar anexo', { status: 500 });
  }
}
