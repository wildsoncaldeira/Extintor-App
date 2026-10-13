import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ClienteAnexo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cliente_id, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64, url, is_chunked } = data;

    if (!cliente_id || !nome_arquivo) {
      return NextResponse.json(
        { success: false, error: 'cliente_id e nome_arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    const valorBase64 = is_chunked ? '' : (conteudo_base64 || null);

    const res = await sql.query(
      `
      INSERT INTO public.cliente_anexos (cliente_id, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64, url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, cliente_id, nome_arquivo, tipo_arquivo, tamanho_bytes::text as tamanho_bytes, url, created_at::text as created_at
      `,
      [
        cliente_id,
        nome_arquivo,
        tipo_arquivo || 'application/octet-stream',
        tamanho_bytes || 0,
        valorBase64,
        url || null,
      ]
    );

    const row = res[0] as any;
    const anexo: ClienteAnexo = {
      id: row.id,
      cliente_id: row.cliente_id,
      nome_arquivo: row.nome_arquivo,
      tipo_arquivo: row.tipo_arquivo,
      tamanho_bytes: Number(row.tamanho_bytes || tamanho_bytes || 0),
      conteudo_base64: valorBase64,
      url: row.url,
      created_at: row.created_at,
    };

    return NextResponse.json({ success: true, anexo_id: row.id, anexo });
  } catch (error: any) {
    console.error('Erro na API ao anexar arquivo:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao realizar upload do arquivo' },
      { status: 500 }
    );
  }
}
