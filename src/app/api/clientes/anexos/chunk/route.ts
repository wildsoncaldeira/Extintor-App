import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { anexo_id, chunk_data } = data;

    if (!anexo_id || typeof chunk_data !== 'string') {
      return NextResponse.json(
        { success: false, error: 'anexo_id e chunk_data são obrigatórios' },
        { status: 400 }
      );
    }

    await sql.query(
      `UPDATE public.cliente_anexos SET conteudo_base64 = COALESCE(conteudo_base64, '') || $1::text WHERE id = $2`,
      [chunk_data, anexo_id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API ao anexar parte do arquivo:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao processar parte do arquivo' },
      { status: 500 }
    );
  }
}
