'use server';

import crypto from 'crypto';
import { sql } from './db';
import { 
  Cliente, 
  ProdutoServico, 
  CategoriaProduto, 
  Pedido, 
  ItemPedido, 
  StatusPedido, 
  DashboardStats, 
  Usuario, 
  normalizarCidade,
  ClienteAnexo,
  RelatorioFinanceiro,
  TopProdutoFinanceiro,
  TopClienteFinanceiro,
  MesFinanceiro,
  PedidoFinanceiroItem,
  CategoriaDespesa,
  Despesa,
  CategoriaDespesaResumo,
  CrmEtapa,
  CrmOportunidade
} from './types';
import { revalidatePath } from 'next/cache';

// ==========================================
// PEDIDOS
// ==========================================

export async function getPedidos(search?: string, statusFilter?: string): Promise<Pedido[]> {
  try {
    let query = `
      SELECT 
        p.id,
        p.legacy_id,
        p.numero_pedido,
        p.data_pedido::text as data_pedido,
        COALESCE(p.data_entrega, p.data_pedido)::text as data_entrega,
        p.data_venda_futura::text as data_venda_futura,
        p.cliente_id,
        p.status,
        p.valor_total::float as valor_total,
        COALESCE(p.subtotal, p.valor_total)::float as subtotal,
        COALESCE(p.desconto_tipo, 'reais') as desconto_tipo,
        COALESCE(p.desconto_valor, 0)::float as desconto_valor,
        p.observacoes,
        p.created_at::text as created_at,
        c.nome_empresa,
        c.nome_contato,
        c.telefone_whatsapp,
        c.cep,
        c.endereco,
        c.numero,
        c.bairro,
        c.complemento,
        c.cidade,
        c.uf,
        c.cnpj,
        COALESCE((
          SELECT SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))
          FROM public.itens_pedido i
          LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
          WHERE i.pedido_id = p.id
        ), 0)::float as custo_total
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      query += ` AND (
        LOWER(c.nome_empresa) LIKE $${idx} OR 
        LOWER(COALESCE(c.nome_contato, '')) LIKE $${idx} OR 
        p.numero_pedido::text LIKE $${idx}
      )`;
    }

    if (statusFilter && statusFilter !== 'Todos') {
      params.push(statusFilter);
      const idx = params.length;
      query += ` AND p.status = $${idx}`;
    }

    query += ` ORDER BY p.numero_pedido DESC LIMIT 150`;

    const rows = await sql.query(query, params);
    return rows as unknown as Pedido[];
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

export async function getPedidoDetalhes(id: string): Promise<Pedido | null> {
  try {
    const pedidos = await sql.query(
      `
      SELECT 
        p.id,
        p.legacy_id,
        p.numero_pedido,
        p.data_pedido::text as data_pedido,
        COALESCE(p.data_entrega, p.data_pedido)::text as data_entrega,
        p.data_venda_futura::text as data_venda_futura,
        p.cliente_id,
        p.status,
        p.valor_total::float as valor_total,
        COALESCE(p.subtotal, p.valor_total)::float as subtotal,
        COALESCE(p.desconto_tipo, 'reais') as desconto_tipo,
        COALESCE(p.desconto_valor, 0)::float as desconto_valor,
        p.observacoes,
        p.created_at::text as created_at,
        c.nome_empresa,
        c.nome_contato,
        c.telefone_whatsapp,
        c.cep,
        c.endereco,
        c.numero,
        c.bairro,
        c.complemento,
        c.cidade,
        c.uf,
        c.cnpj,
        COALESCE((
          SELECT SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))
          FROM public.itens_pedido i
          LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
          WHERE i.pedido_id = p.id
        ), 0)::float as custo_total
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (!pedidos || pedidos.length === 0) return null;
    const pedido = pedidos[0] as unknown as Pedido;

    const itens = await sql.query(
      `
      SELECT 
        i.id,
        i.pedido_id,
        i.produto_id,
        COALESCE(i.descricao_item, prod.descricao) as descricao_item,
        prod.tipo_kg,
        i.quantidade::float as quantidade,
        i.valor_unitario::float as valor_unitario,
        i.valor_total_item::float as valor_total_item,
        COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0)::float as custo_unitario,
        (i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))::float as custo_total_item
      FROM public.itens_pedido i
      LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
      WHERE i.pedido_id = $1
      ORDER BY i.created_at ASC
      `,
      [id]
    );

    pedido.itens = itens as unknown as ItemPedido[];
    return pedido;
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    return null;
  }
}

export async function getProximoNumeroPedido(): Promise<number> {
  try {
    const res = await sql.query(`SELECT COALESCE(MAX(numero_pedido), 1280) + 1 as proximo FROM public.pedidos`);
    return Number((res[0] as any)?.proximo || 1281);
  } catch {
    return 1281;
  }
}

async function syncPedidoCrm(pedidoId: string, status: StatusPedido, valorTotal: number, dataPedido: string, clienteId: string) {
  try {
    const etapaMap: Record<StatusPedido, CrmEtapa> = {
      'Orçamento': 'orcamento',
      'Aprovado': 'aprovado',
      'Pago': 'pago',
    };
    const etapa = etapaMap[status] || 'orcamento';

    const cliRows = await sql.query(`SELECT nome_empresa, telefone_whatsapp FROM public.clientes WHERE id = $1`, [clienteId]);
    const cli = (cliRows[0] as any) || { nome_empresa: 'Cliente', telefone_whatsapp: null };

    const pedRows = await sql.query(`SELECT numero_pedido FROM public.pedidos WHERE id = $1`, [pedidoId]);
    const numPed = (pedRows[0] as any)?.numero_pedido || '';

    const opRows = await sql.query(
      `SELECT id FROM public.crm_oportunidades WHERE pedido_id = $1 AND etapa != 'venda_futura'`,
      [pedidoId]
    );

    if (opRows && opRows.length > 0) {
      await sql.query(
        `UPDATE public.crm_oportunidades 
         SET etapa = $1, valor = $2, cliente_nome = $3, cliente_telefone = $4, data_previsao = $5, updated_at = now() 
         WHERE id = $6`,
        [etapa, valorTotal, cli.nome_empresa, cli.telefone_whatsapp, dataPedido, (opRows[0] as any).id]
      );
    } else {
      await sql.query(
        `INSERT INTO public.crm_oportunidades (
          titulo, cliente_id, cliente_nome, cliente_telefone, valor, etapa, pedido_id, data_previsao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `Pedido #${numPed} - ${cli.nome_empresa}`,
          clienteId,
          cli.nome_empresa,
          cli.telefone_whatsapp,
          valorTotal,
          etapa,
          pedidoId,
          dataPedido,
        ]
      );
    }
  } catch (err) {
    console.error('Erro ao sincronizar CRM para pedido:', err);
  }
}

export async function updatePedidoStatus(id: string, status: StatusPedido): Promise<boolean> {
  try {
    await sql.query(`UPDATE public.pedidos SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);

    const rows = await sql.query(`SELECT valor_total, data_pedido::text as data_pedido, cliente_id FROM public.pedidos WHERE id = $1`, [id]);
    if (rows && rows.length > 0) {
      const p = rows[0] as any;
      await syncPedidoCrm(id, status, Number(p.valor_total) || 0, p.data_pedido, p.cliente_id);
    }

    revalidatePath('/');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

export async function agendarVendaFutura(pedidoId: string, dataVendaFutura: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`UPDATE public.pedidos SET data_venda_futura = $1, updated_at = now() WHERE id = $2`, [dataVendaFutura, pedidoId]);

    const rows = await sql.query(`
      SELECT p.numero_pedido, p.valor_total, p.cliente_id, c.nome_empresa, c.telefone_whatsapp
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
    `, [pedidoId]);

    if (rows && rows.length > 0) {
      const ped = rows[0] as any;
      await sql.query(`
        INSERT INTO public.crm_oportunidades (
          titulo, cliente_id, cliente_nome, cliente_telefone, valor, etapa, pedido_id, data_previsao, data_venda_futura
        ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8)
      `, [
        `Renovação Extintores - ${ped.nome_empresa}`,
        ped.cliente_id,
        ped.nome_empresa,
        ped.telefone_whatsapp,
        Number(ped.valor_total) || 0,
        'venda_futura',
        dataVendaFutura,
        dataVendaFutura
      ]);
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao agendar venda futura:', err);
    return { success: false, error: err?.message || 'Erro ao agendar venda futura' };
  }
}

export async function createPedido(data: {
  cliente_id: string;
  data_pedido: string;
  data_entrega?: string;
  data_venda_futura?: string;
  status: StatusPedido;
  observacoes?: string;
  desconto_tipo?: 'reais' | 'porcentagem';
  desconto_valor?: number;
  itens: {
    produto_id: string;
    quantidade: number;
    valor_unitario: number;
    custo_unitario?: number;
    descricao_item?: string;
  }[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const proximoNum = await getProximoNumeroPedido();

    const subtotal = data.itens?.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valor_unitario)), 0) || 0;
    const descTipo = data.desconto_tipo || 'reais';
    const descValor = Number(data.desconto_valor) || 0;
    const descCalculado = descTipo === 'porcentagem' ? (subtotal * (descValor / 100)) : descValor;
    const valorTotal = Math.max(0, subtotal - descCalculado);
    const dataEntrega = data.data_entrega || data.data_pedido;

    const pedRes = await sql.query(
      `
      INSERT INTO public.pedidos (
        numero_pedido, data_pedido, data_entrega, data_venda_futura, cliente_id, status, observacoes, subtotal, desconto_tipo, desconto_valor, valor_total
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
      `,
      [
        proximoNum, 
        data.data_pedido, 
        dataEntrega, 
        data.data_venda_futura || null, 
        data.cliente_id, 
        data.status, 
        data.observacoes || null, 
        subtotal, 
        descTipo, 
        descValor, 
        valorTotal
      ]
    );

    const pedidoId = (pedRes[0] as any)?.id;

    if (data.itens && data.itens.length > 0) {
      for (const item of data.itens) {
        const totalItem = Number(item.quantidade) * Number(item.valor_unitario);
        await sql.query(
          `
          INSERT INTO public.itens_pedido (pedido_id, produto_id, descricao_item, quantidade, valor_unitario, valor_total_item, custo_unitario)
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, (SELECT custo_unitario_padrao FROM public.produtos_servicos WHERE id = $2), 0))
          `,
          [pedidoId, item.produto_id, item.descricao_item || null, item.quantidade, item.valor_unitario, totalItem, item.custo_unitario ?? null]
        );
      }
    }

    // Sincroniza com CRM
    await syncPedidoCrm(pedidoId, data.status, valorTotal, data.data_pedido, data.cliente_id);

    revalidatePath('/');
    return { success: true, id: pedidoId };
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error: error?.message || 'Erro ao criar pedido' };
  }
}

export async function updatePedido(
  id: string,
  data: {
    cliente_id: string;
    data_pedido: string;
    data_entrega?: string;
    data_venda_futura?: string;
    status: StatusPedido;
    observacoes?: string;
    desconto_tipo?: 'reais' | 'porcentagem';
    desconto_valor?: number;
    itens: {
      produto_id: string;
      quantidade: number;
      valor_unitario: number;
      custo_unitario?: number;
      descricao_item?: string;
    }[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subtotal = data.itens?.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valor_unitario)), 0) || 0;
    const descTipo = data.desconto_tipo || 'reais';
    const descValor = Number(data.desconto_valor) || 0;
    const descCalculado = descTipo === 'porcentagem' ? (subtotal * (descValor / 100)) : descValor;
    const valorTotal = Math.max(0, subtotal - descCalculado);
    const dataEntrega = data.data_entrega || data.data_pedido;

    await sql.query(
      `
      UPDATE public.pedidos 
      SET cliente_id = $1, data_pedido = $2, data_entrega = $3, data_venda_futura = $4, status = $5, observacoes = $6, subtotal = $7, desconto_tipo = $8, desconto_valor = $9, valor_total = $10, updated_at = now()
      WHERE id = $11
      `,
      [
        data.cliente_id, 
        data.data_pedido, 
        dataEntrega, 
        data.data_venda_futura || null, 
        data.status, 
        data.observacoes || null, 
        subtotal, 
        descTipo, 
        descValor, 
        valorTotal, 
        id
      ]
    );

    // Substitui itens
    await sql.query(`DELETE FROM public.itens_pedido WHERE pedido_id = $1`, [id]);

    if (data.itens && data.itens.length > 0) {
      for (const item of data.itens) {
        const totalItem = Number(item.quantidade) * Number(item.valor_unitario);
        await sql.query(
          `
          INSERT INTO public.itens_pedido (pedido_id, produto_id, descricao_item, quantidade, valor_unitario, valor_total_item, custo_unitario)
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, (SELECT custo_unitario_padrao FROM public.produtos_servicos WHERE id = $2), 0))
          `,
          [id, item.produto_id, item.descricao_item || null, item.quantidade, item.valor_unitario, totalItem, item.custo_unitario ?? null]
        );
      }
    }

    // Sincroniza com CRM
    await syncPedidoCrm(id, data.status, valorTotal, data.data_pedido, data.cliente_id);

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao editar pedido:', error);
    return { success: false, error: error?.message || 'Erro ao atualizar pedido' };
  }
}

export async function deletePedido(id: string): Promise<boolean> {
  try {
    // Exclui oportunidades do CRM geradas a partir deste pedido
    try {
      await sql.query(`DELETE FROM public.crm_oportunidades WHERE pedido_id = $1`, [id]);
    } catch (crmErr) {
      console.warn('Erro ao excluir oportunidade vinculada ao pedido:', crmErr);
    }

    await sql.query(`DELETE FROM public.pedidos WHERE id = $1`, [id]);
    revalidatePath('/');
    return true;
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    return false;
  }
}

// ==========================================
// CLIENTES
// ==========================================

export async function getClientes(search?: string): Promise<Cliente[]> {
  try {
    let query = `
      SELECT 
        id,
        legacy_id,
        nome_empresa,
        nome_contato,
        telefone_whatsapp,
        cep,
        endereco,
        numero,
        bairro,
        complemento,
        cidade,
        uf,
        cnpj,
        created_at::text as created_at
      FROM public.clientes
      WHERE 1=1
    `;

    const params: string[] = [];
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(nome_empresa) LIKE $1 OR 
        LOWER(COALESCE(nome_contato, '')) LIKE $1 OR 
        LOWER(COALESCE(cidade, '')) LIKE $1 OR 
        LOWER(COALESCE(cnpj, '')) LIKE $1
      )`;
    }

    query += ` ORDER BY nome_empresa ASC`;
    const rows = await sql.query(query, params);
    return rows as unknown as Cliente[];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

export async function createCliente(data: Omit<Cliente, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await sql.query(
      `
      INSERT INTO public.clientes (nome_empresa, nome_contato, telefone_whatsapp, cep, endereco, numero, bairro, complemento, cidade, uf, cnpj)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
      `,
      [
        data.nome_empresa,
        data.nome_contato || null,
        data.telefone_whatsapp || null,
        data.cep || null,
        data.endereco || null,
        data.numero || null,
        data.bairro || null,
        data.complemento || null,
        normalizarCidade(data.cidade),
        data.uf || 'MG',
        data.cnpj || null,
      ]
    );

    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao criar cliente' };
  }
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `
      UPDATE public.clientes
      SET nome_empresa = $1, nome_contato = $2, telefone_whatsapp = $3, cep = $4, endereco = $5, numero = $6, bairro = $7, complemento = $8, cidade = $9, uf = $10, cnpj = $11, updated_at = now()
      WHERE id = $12
      `,
      [
        data.nome_empresa,
        data.nome_contato || null,
        data.telefone_whatsapp || null,
        data.cep || null,
        data.endereco || null,
        data.numero || null,
        data.bairro || null,
        data.complemento || null,
        normalizarCidade(data.cidade),
        data.uf || 'MG',
        data.cnpj || null,
        id,
      ]
    );

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao atualizar cliente' };
  }
}

export async function deleteCliente(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const countRes = await sql.query(`SELECT count(*) as total FROM public.pedidos WHERE cliente_id = $1`, [id]);
    if (Number((countRes[0] as any)?.total || 0) > 0) {
      return { success: false, error: 'Este cliente possui pedidos cadastrados e não pode ser excluído.' };
    }

    await sql.query(`DELETE FROM public.clientes WHERE id = $1`, [id]);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao deletar cliente' };
  }
}

// ==========================================
// CATEGORIAS DE PRODUTOS
// ==========================================

export async function getCategorias(): Promise<CategoriaProduto[]> {
  try {
    const rows = await sql.query(`
      SELECT 
        c.id,
        c.nome,
        c.ordem,
        c.created_at::text as created_at,
        COUNT(p.id)::int as total_produtos
      FROM public.categorias_produtos c
      LEFT JOIN public.produtos_servicos p ON p.categoria_id = c.id AND p.ativo = true
      GROUP BY c.id, c.nome, c.ordem, c.created_at
      ORDER BY c.nome ASC
    `);
    return rows as unknown as CategoriaProduto[];
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function createCategoria(nome: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await sql.query(
      `INSERT INTO public.categorias_produtos (nome) VALUES ($1) RETURNING id`,
      [nome.trim()]
    );
    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao criar categoria' };
  }
}

export async function updateCategoria(id: string, nome: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `UPDATE public.categorias_produtos SET nome = $1 WHERE id = $2`,
      [nome.trim(), id]
    );
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao editar categoria' };
  }
}

export async function deleteCategoria(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`UPDATE public.produtos_servicos SET categoria_id = NULL WHERE categoria_id = $1`, [id]);
    await sql.query(`DELETE FROM public.categorias_produtos WHERE id = $1`, [id]);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao deletar categoria' };
  }
}

// ==========================================
// PRODUTOS & SERVIÇOS
// ==========================================

export async function getProdutos(search?: string, categoriaId?: string): Promise<ProdutoServico[]> {
  try {
    let query = `
      SELECT 
        p.id,
        p.legacy_id,
        p.categoria_id,
        c.nome as nome_categoria,
        p.descricao,
        p.tipo_kg,
        p.valor_unitario_padrao::float as valor_unitario_padrao,
        COALESCE(p.custo_unitario_padrao, 0)::float as custo_unitario_padrao,
        p.ativo,
        p.created_at::text as created_at
      FROM public.produtos_servicos p
      LEFT JOIN public.categorias_produtos c ON p.categoria_id = c.id
      WHERE p.ativo = true
    `;

    const params: string[] = [];
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(p.descricao) LIKE $1 OR LOWER(COALESCE(p.tipo_kg, '')) LIKE $1 OR LOWER(COALESCE(c.nome, '')) LIKE $1)`;
    }

    if (categoriaId) {
      params.push(categoriaId);
      const idx = params.length;
      query += ` AND p.categoria_id = $${idx}`;
    }

    query += ` ORDER BY COALESCE(c.nome, p.descricao) ASC, p.tipo_kg ASC`;
    const rows = await sql.query(query, params);
    return rows as unknown as ProdutoServico[];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function createProduto(data: {
  descricao: string;
  tipo_kg?: string;
  valor_unitario_padrao: number;
  custo_unitario_padrao?: number;
  categoria_id?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await sql.query(
      `
      INSERT INTO public.produtos_servicos (descricao, tipo_kg, valor_unitario_padrao, custo_unitario_padrao, categoria_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        data.descricao, 
        data.tipo_kg || null, 
        data.valor_unitario_padrao || 0, 
        data.custo_unitario_padrao || 0, 
        data.categoria_id || null
      ]
    );

    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao criar produto' };
  }
}

export async function updateProduto(id: string, data: {
  descricao: string;
  tipo_kg?: string;
  valor_unitario_padrao: number;
  custo_unitario_padrao?: number;
  categoria_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `
      UPDATE public.produtos_servicos
      SET descricao = $1, tipo_kg = $2, valor_unitario_padrao = $3, custo_unitario_padrao = $4, categoria_id = $5
      WHERE id = $6
      `,
      [
        data.descricao, 
        data.tipo_kg || null, 
        data.valor_unitario_padrao || 0, 
        data.custo_unitario_padrao || 0, 
        data.categoria_id || null, 
        id
      ]
    );

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao atualizar produto' };
  }
}

export async function deleteProduto(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const countRes = await sql.query(`SELECT count(*) as total FROM public.itens_pedido WHERE produto_id = $1`, [id]);
    if (Number((countRes[0] as any)?.total || 0) > 0) {
      await sql.query(`UPDATE public.produtos_servicos SET ativo = false WHERE id = $1`, [id]);
    } else {
      await sql.query(`DELETE FROM public.produtos_servicos WHERE id = $1`, [id]);
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao excluir produto' };
  }
}

// ==========================================
// DASHBOARD & CALENDÁRIO
// ==========================================

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [totais, mesAtual, contagemStatus, totalCli, totalProd] = await Promise.all([
      sql.query(`SELECT count(*) as total_pedidos, COALESCE(sum(valor_total), 0)::float as faturamento_total FROM public.pedidos`),
      sql.query(`
        SELECT COALESCE(sum(valor_total), 0)::float as faturamento_mes 
        FROM public.pedidos 
        WHERE date_trunc('month', data_pedido) = date_trunc('month', CURRENT_DATE)
      `),
      sql.query(`
        SELECT 
          count(*) FILTER (WHERE status = 'Orçamento') as orcamento,
          count(*) FILTER (WHERE status = 'Aprovado') as aprovado,
          count(*) FILTER (WHERE status = 'Pago') as pago
        FROM public.pedidos
      `),
      sql.query(`SELECT count(*) as total FROM public.clientes`),
      sql.query(`SELECT count(*) as total FROM public.produtos_servicos WHERE ativo = true`),
    ]);

    const tot = totais[0] as any;
    const mes = mesAtual[0] as any;
    const st = contagemStatus[0] as any;
    const cli = totalCli[0] as any;
    const prod = totalProd[0] as any;

    return {
      faturamentoTotal: Number(tot?.faturamento_total || 0),
      faturamentoMes: Number(mes?.faturamento_mes || 0),
      totalPedidos: Number(tot?.total_pedidos || 0),
      pedidosOrcamento: Number(st?.orcamento || 0),
      pedidosAprovado: Number(st?.aprovado || 0),
      pedidosPago: Number(st?.pago || 0),
      totalClientes: Number(cli?.total || 0),
      totalProdutos: Number(prod?.total || 0),
    };
  } catch (error) {
    console.error('Erro nas estatísticas:', error);
    return {
      faturamentoTotal: 0,
      faturamentoMes: 0,
      totalPedidos: 0,
      pedidosOrcamento: 0,
      pedidosAprovado: 0,
      pedidosPago: 0,
      totalClientes: 0,
      totalProdutos: 0,
    };
  }
}

// ==========================================
// AUTENTICAÇÃO E USUÁRIOS
// ==========================================

function hashSenha(senha: string): string {
  return crypto.createHash('sha256').update(senha + '_extintores_secret_salt_2026').digest('hex');
}

export async function loginUsuario(
  email: string,
  senha: string
): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!cleanEmail || !cleanSenha) {
      return { success: false, error: 'Informe o e-mail e a senha de acesso.' };
    }

    // Garante coluna foto_url na tabela usuarios
    await sql.query(`ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url text;`);

    const rows = (await sql.query(
      `SELECT id, nome, email, senha_hash, cargo, ativo, foto_url, ultimo_login::text as ultimo_login, created_at::text as created_at
       FROM public.usuarios
       WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail]
    )) as any[];

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Usuário não encontrado ou não autorizado.' };
    }

    const u = rows[0];

    if (!u.ativo) {
      return { success: false, error: 'Este usuário está desativado no sistema.' };
    }

    const hashCalculado = hashSenha(cleanSenha);
    if (u.senha_hash !== hashCalculado) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    // Atualiza data do último login
    await sql.query(
      `UPDATE public.usuarios SET ultimo_login = NOW() WHERE id = $1`,
      [u.id]
    );

    const usuario: Usuario = {
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo || 'Administrador',
      ativo: u.ativo,
      foto_url: u.foto_url || null,
      ultimo_login: new Date().toISOString(),
      created_at: u.created_at,
    };

    return { success: true, usuario };
  } catch (error) {
    console.error('Erro ao efetuar login:', error);
    return { success: false, error: 'Erro interno ao validar credenciais.' };
  }
}

export async function getUsuariosAutorizados(): Promise<Array<{ nome: string; email: string; cargo: string }>> {
  try {
    const rows = (await sql.query(
      `SELECT nome, email, cargo FROM public.usuarios WHERE ativo = true ORDER BY nome ASC`
    )) as any[];
    return rows.map((r) => ({
      nome: r.nome,
      email: r.email,
      cargo: r.cargo || 'Administrador',
    }));
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }
}

export async function trocarSenhaUsuario(
  email: string,
  senhaAtual: string,
  novaSenha: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const rows = (await sql.query(
      `SELECT id, senha_hash FROM public.usuarios WHERE LOWER(email) = LOWER($1) AND ativo = true`,
      [cleanEmail]
    )) as any[];

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const u = rows[0];
    const hashAtual = hashSenha(senhaAtual.trim());
    if (u.senha_hash !== hashAtual) {
      return { success: false, error: 'A senha atual está incorreta.' };
    }

    if (novaSenha.trim().length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const novoHash = hashSenha(novaSenha.trim());
    await sql.query(
      `UPDATE public.usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2`,
      [novoHash, u.id]
    );

    return { success: true };
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    return { success: false, error: 'Erro ao atualizar a senha no banco de dados.' };
  }
}

export async function updateUsuarioPerfil(
  id: string,
  data: {
    nome: string;
    email: string;
    foto_url?: string | null;
    senhaAtual?: string;
    novaSenha?: string;
  }
): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
  try {
    await sql.query(`ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url text;`);

    const cleanNome = data.nome.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanNome || !cleanEmail) {
      return { success: false, error: 'Nome e e-mail são obrigatórios.' };
    }

    const rows = (await sql.query(
      `SELECT id, nome, email, senha_hash, cargo, ativo, foto_url, ultimo_login::text as ultimo_login, created_at::text as created_at
       FROM public.usuarios WHERE id = $1`,
      [id]
    )) as any[];

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const u = rows[0];

    // Se forneceu nova senha, validar senha atual
    if (data.novaSenha && data.novaSenha.trim().length > 0) {
      if (!data.senhaAtual || !data.senhaAtual.trim()) {
        return { success: false, error: 'Informe a senha atual para alterar a senha.' };
      }
      const hashAtual = hashSenha(data.senhaAtual.trim());
      if (u.senha_hash !== hashAtual) {
        return { success: false, error: 'A senha atual está incorreta.' };
      }
      if (data.novaSenha.trim().length < 6) {
        return { success: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
      }
      const novoHash = hashSenha(data.novaSenha.trim());
      await sql.query(`UPDATE public.usuarios SET senha_hash = $1 WHERE id = $2`, [novoHash, id]);
    }

    // Verificar se já existe outro usuário com esse e-mail
    const emailExistente = (await sql.query(
      `SELECT id FROM public.usuarios WHERE LOWER(email) = LOWER($1) AND id != $2`,
      [cleanEmail, id]
    )) as any[];

    if (emailExistente && emailExistente.length > 0) {
      return { success: false, error: 'Já existe outro usuário cadastrado com este e-mail.' };
    }

    const novaFoto = data.foto_url !== undefined ? data.foto_url : u.foto_url;

    await sql.query(
      `UPDATE public.usuarios SET nome = $1, email = $2, foto_url = $3, updated_at = NOW() WHERE id = $4`,
      [cleanNome, cleanEmail, novaFoto, id]
    );

    const usuarioAtualizado: Usuario = {
      id: u.id,
      nome: cleanNome,
      email: cleanEmail,
      cargo: u.cargo || 'Administrador',
      ativo: u.ativo,
      foto_url: novaFoto || null,
      ultimo_login: u.ultimo_login,
      created_at: u.created_at,
    };

    revalidatePath('/');
    return { success: true, usuario: usuarioAtualizado };
  } catch (err: any) {
    console.error('Erro ao atualizar perfil do usuário:', err);
    return { success: false, error: err?.message || 'Erro ao atualizar dados do perfil.' };
  }
}

export async function getUsuarioAtual(id: string): Promise<Usuario | null> {
  try {
    await sql.query(`ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url text;`);
    const rows = (await sql.query(
      `SELECT id, nome, email, cargo, ativo, foto_url, ultimo_login::text as ultimo_login, created_at::text as created_at
       FROM public.usuarios WHERE id = $1 AND ativo = true`,
      [id]
    )) as any[];

    if (!rows || rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo || 'Administrador',
      ativo: u.ativo,
      foto_url: u.foto_url || null,
      ultimo_login: u.ultimo_login,
      created_at: u.created_at,
    };
  } catch (err) {
    console.error('Erro ao buscar dados atualizados do usuário:', err);
    return null;
  }
}

// ==========================================
// ANEXOS DE CLIENTES
// ==========================================

export async function getClienteAnexos(clienteId: string): Promise<ClienteAnexo[]> {
  try {
    const rows = await sql.query(
      `
      SELECT 
        id,
        cliente_id,
        nome_arquivo,
        tipo_arquivo,
        tamanho_bytes::text as tamanho_bytes,
        conteudo_base64,
        url,
        created_at::text as created_at
      FROM public.cliente_anexos
      WHERE cliente_id = $1
      ORDER BY created_at DESC
      `,
      [clienteId]
    );
    return rows.map((r: any) => ({
      ...r,
      tamanho_bytes: Number(r.tamanho_bytes || 0),
    })) as ClienteAnexo[];
  } catch (error) {
    console.error('Erro ao buscar anexos do cliente:', error);
    return [];
  }
}

export async function uploadClienteAnexo(data: {
  cliente_id: string;
  nome_arquivo: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  conteudo_base64?: string;
  url?: string;
}): Promise<{ success: boolean; anexo?: ClienteAnexo; error?: string }> {
  try {
    const res = await sql.query(
      `
      INSERT INTO public.cliente_anexos (cliente_id, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64, url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, cliente_id, nome_arquivo, tipo_arquivo, tamanho_bytes::text as tamanho_bytes, url, created_at::text as created_at
      `,
      [
        data.cliente_id,
        data.nome_arquivo,
        data.tipo_arquivo || 'application/octet-stream',
        data.tamanho_bytes || 0,
        data.conteudo_base64 || null,
        data.url || null,
      ]
    );

    const row = res[0] as any;
    const anexo: ClienteAnexo = {
      id: row.id,
      cliente_id: row.cliente_id,
      nome_arquivo: row.nome_arquivo,
      tipo_arquivo: row.tipo_arquivo,
      tamanho_bytes: Number(row.tamanho_bytes || data.tamanho_bytes || 0),
      conteudo_base64: data.conteudo_base64 || null,
      url: row.url,
      created_at: row.created_at,
    };

    return { success: true, anexo };
  } catch (error: any) {
    console.error('Erro ao anexar arquivo:', error);
    return { success: false, error: error?.message || 'Erro ao fazer upload do arquivo' };
  }
}

export async function deleteClienteAnexo(anexoId: string, clienteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `DELETE FROM public.cliente_anexos WHERE id = $1 AND cliente_id = $2`,
      [anexoId, clienteId]
    );
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar anexo:', error);
    return { success: false, error: error?.message || 'Erro ao excluir anexo' };
  }
}

// ==========================================
// RELATÓRIO FINANCEIRO & MARGEM
// ==========================================

export async function getRelatorioFinanceiro(filtros?: {
  periodoTipo?: 'mes' | 'ano' | 'todos' | 'custom';
  mes?: number;
  ano?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}): Promise<RelatorioFinanceiro> {
  try {
    const periodoTipo = filtros?.periodoTipo || 'mes';
    const now = new Date();
    const ano = filtros?.ano || now.getFullYear();
    const mes = filtros?.mes || (now.getMonth() + 1);
    const status = filtros?.status || 'Todos';

    let dateWhere = '';
    const params: (string | number)[] = [];
    let periodoDescricao = '';

    const mesesNomes = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    if (periodoTipo === 'mes') {
      params.push(mes, ano);
      dateWhere = `EXTRACT(MONTH FROM p.data_pedido) = $${params.length - 1} AND EXTRACT(YEAR FROM p.data_pedido) = $${params.length}`;
      periodoDescricao = `${mesesNomes[mes]} de ${ano}`;
    } else if (periodoTipo === 'ano') {
      params.push(ano);
      dateWhere = `EXTRACT(YEAR FROM p.data_pedido) = $${params.length}`;
      periodoDescricao = `Ano de ${ano}`;
    } else if (periodoTipo === 'custom' && filtros?.dataInicio && filtros?.dataFim) {
      params.push(filtros.dataInicio, filtros.dataFim);
      dateWhere = `p.data_pedido >= $${params.length - 1} AND p.data_pedido <= $${params.length}`;
      periodoDescricao = `Período de ${filtros.dataInicio} até ${filtros.dataFim}`;
    } else {
      dateWhere = '1=1';
      periodoDescricao = 'Todos os Períodos';
    }

    let statusWhere = "p.status IN ('Aprovado', 'Pago')";
    if (status && status !== 'Todos' && (status === 'Pago' || status === 'Aprovado')) {
      params.push(status);
      statusWhere = `p.status = $${params.length}`;
    }

    // 1. Pedidos do período
    const pedidosQuery = `
      SELECT 
        p.id,
        p.numero_pedido,
        p.data_pedido::text as data_pedido,
        p.cliente_id,
        c.nome_empresa,
        p.status,
        p.valor_total::float as valor_total,
        COALESCE(p.subtotal, p.valor_total)::float as subtotal,
        COALESCE(p.desconto_tipo, 'reais') as desconto_tipo,
        COALESCE(p.desconto_valor, 0)::float as desconto_valor,
        COALESCE((
          SELECT SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))
          FROM public.itens_pedido i
          LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
          WHERE i.pedido_id = p.id
        ), 0)::float as custo_total,
        COALESCE((
          SELECT SUM(i.quantidade)
          FROM public.itens_pedido i
          WHERE i.pedido_id = p.id
        ), 0)::float as quantidade_itens
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE ${dateWhere} AND ${statusWhere}
      ORDER BY p.data_pedido DESC, p.numero_pedido DESC
    `;

    const pedidosRows = (await sql.query(pedidosQuery, params)) as any[];

    let faturamentoTotal = 0;
    let custoTotal = 0;
    let pedidosPagos = 0;
    let pedidosAprovados = 0;
    let pedidosOrcamentos = 0;

    const pedidosLista: PedidoFinanceiroItem[] = pedidosRows.map((p) => {
      const vTotal = Number(p.valor_total || 0);
      const cTotal = Number(p.custo_total || 0);
      const lucro = vTotal - cTotal;
      const margemPercentual = vTotal > 0 ? (lucro / vTotal) * 100 : 0;

      faturamentoTotal += vTotal;
      custoTotal += cTotal;

      if (p.status === 'Pago') pedidosPagos++;
      else if (p.status === 'Aprovado') pedidosAprovados++;
      else if (p.status === 'Orçamento') pedidosOrcamentos++;

      return {
        id: p.id,
        numero_pedido: p.numero_pedido,
        data_pedido: p.data_pedido,
        cliente_id: p.cliente_id,
        nome_empresa: p.nome_empresa,
        status: p.status,
        valor_total: vTotal,
        custo_total: cTotal,
        lucro,
        margemPercentual,
        quantidade_itens: Number(p.quantidade_itens || 0),
      };
    });

    const lucroTotal = faturamentoTotal - custoTotal;
    const margemPercentual = faturamentoTotal > 0 ? (lucroTotal / faturamentoTotal) * 100 : 0;
    const totalPedidos = pedidosLista.length;
    const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

    // 2. Ranking de Produtos Mais Vendidos no período
    const topProdutosQuery = `
      SELECT 
        i.produto_id,
        COALESCE(i.descricao_item, prod.descricao, 'Item não especificado') as nome,
        prod.tipo_kg,
        cat.nome as categoria,
        SUM(i.quantidade)::float as quantidade_vendida,
        SUM(i.valor_total_item)::float as faturamento,
        SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))::float as custo
      FROM public.itens_pedido i
      JOIN public.pedidos p ON i.pedido_id = p.id
      LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
      LEFT JOIN public.categorias_produtos cat ON prod.categoria_id = cat.id
      WHERE ${dateWhere} AND ${statusWhere}
      GROUP BY i.produto_id, COALESCE(i.descricao_item, prod.descricao, 'Item não especificado'), prod.tipo_kg, cat.nome
      ORDER BY quantidade_vendida DESC, faturamento DESC
      LIMIT 50
    `;

    const topProdutosRows = (await sql.query(topProdutosQuery, params)) as any[];
    const topProdutos: TopProdutoFinanceiro[] = topProdutosRows.map((r) => {
      const fat = Number(r.faturamento || 0);
      const cus = Number(r.custo || 0);
      const luc = fat - cus;
      return {
        produto_id: r.produto_id,
        nome: r.nome,
        categoria: r.categoria,
        tipo_kg: r.tipo_kg,
        quantidadeVendida: Number(r.quantidade_vendida || 0),
        faturamento: fat,
        custo: cus,
        lucro: luc,
        margemPercentual: fat > 0 ? (luc / fat) * 100 : 0,
      };
    });

    // 3. Ranking de Clientes com Maiores Vendas no período
    const topClientesQuery = `
      SELECT 
        c.id as cliente_id,
        c.nome_empresa,
        c.nome_contato,
        c.cidade,
        COUNT(DISTINCT p.id)::int as total_pedidos,
        SUM(p.valor_total)::float as faturamento,
        COALESCE(SUM(
          (SELECT SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))
           FROM public.itens_pedido i
           LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
           WHERE i.pedido_id = p.id)
        ), 0)::float as custo
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE ${dateWhere} AND ${statusWhere}
      GROUP BY c.id, c.nome_empresa, c.nome_contato, c.cidade
      ORDER BY faturamento DESC
      LIMIT 50
    `;

    const topClientesRows = (await sql.query(topClientesQuery, params)) as any[];
    const topClientes: TopClienteFinanceiro[] = topClientesRows.map((r) => {
      const fat = Number(r.faturamento || 0);
      const cus = Number(r.custo || 0);
      const luc = fat - cus;
      return {
        cliente_id: r.cliente_id,
        nome_empresa: r.nome_empresa,
        nome_contato: r.nome_contato,
        cidade: r.cidade,
        totalPedidos: Number(r.total_pedidos || 0),
        faturamento: fat,
        custo: cus,
        lucro: luc,
        margemPercentual: fat > 0 ? (luc / fat) * 100 : 0,
      };
    });

    // 4. Vendas Mês a Mês do ano (para tendências e gráficos)
    const anoGrafico = periodoTipo === 'ano' ? ano : (periodoTipo === 'mes' ? ano : new Date().getFullYear());
    const paramsMes: (string | number)[] = [anoGrafico];
    let whereMes = "EXTRACT(YEAR FROM p.data_pedido) = $1 AND p.status IN ('Aprovado', 'Pago')";
    if (status && status !== 'Todos' && (status === 'Pago' || status === 'Aprovado')) {
      paramsMes.push(status);
      whereMes += ' AND p.status = $2';
    }

    const vendasMesQuery = `
      SELECT 
        EXTRACT(MONTH FROM p.data_pedido)::int as mes,
        COUNT(p.id)::int as qtd_pedidos,
        SUM(p.valor_total)::float as faturamento,
        COALESCE(SUM(
          (SELECT SUM(i.quantidade * COALESCE(i.custo_unitario, prod.custo_unitario_padrao, 0))
           FROM public.itens_pedido i
           LEFT JOIN public.produtos_servicos prod ON i.produto_id = prod.id
           WHERE i.pedido_id = p.id)
        ), 0)::float as custo
      FROM public.pedidos p
      WHERE ${whereMes}
      GROUP BY EXTRACT(MONTH FROM p.data_pedido)
      ORDER BY mes ASC
    `;

    const mesesMap: Record<number, MesFinanceiro> = {};
    const siglasMeses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let m = 1; m <= 12; m++) {
      mesesMap[m] = {
        rotulo: siglasMeses[m],
        mesAno: `${siglasMeses[m]}/${anoGrafico}`,
        faturamento: 0,
        custo: 0,
        lucro: 0,
        margemPercentual: 0,
        quantidadePedidos: 0,
      };
    }

    try {
      const mesesRows = (await sql.query(vendasMesQuery, paramsMes)) as any[];

      for (const row of mesesRows) {
        const m = Number(row.mes);
        if (mesesMap[m]) {
          const fat = Number(row.faturamento || 0);
          const cus = Number(row.custo || 0);
          const luc = fat - cus;
          mesesMap[m] = {
            rotulo: siglasMeses[m],
            mesAno: `${siglasMeses[m]}/${anoGrafico}`,
            faturamento: fat,
            custo: cus,
            lucro: luc,
            margemPercentual: fat > 0 ? (luc / fat) * 100 : 0,
            quantidadePedidos: Number(row.qtd_pedidos || 0),
          };
        }
      }
    } catch (e) {
      console.error('Erro ao buscar vendas por mês:', e);
    }

    const vendasPorMes: MesFinanceiro[] = Object.values(mesesMap);

    // 5. Despesas do período
    let dateWhereDespesas = '1=1';
    const paramsDespesas: (string | number)[] = [];
    if (periodoTipo === 'mes') {
      paramsDespesas.push(mes, ano);
      dateWhereDespesas = `EXTRACT(MONTH FROM d.data_despesa) = $1 AND EXTRACT(YEAR FROM d.data_despesa) = $2`;
    } else if (periodoTipo === 'ano') {
      paramsDespesas.push(ano);
      dateWhereDespesas = `EXTRACT(YEAR FROM d.data_despesa) = $1`;
    } else if (periodoTipo === 'custom' && filtros?.dataInicio && filtros?.dataFim) {
      paramsDespesas.push(filtros.dataInicio, filtros.dataFim);
      dateWhereDespesas = `d.data_despesa >= $1 AND d.data_despesa <= $2`;
    }

    const despesasQuery = `
      SELECT 
        d.id,
        d.descricao,
        d.valor::float as valor,
        d.data_despesa::text as data_despesa,
        d.categoria_id,
        COALESCE(c.nome, d.categoria_nome, 'Outros') as categoria_nome,
        COALESCE(c.cor, '#64748b') as categoria_cor,
        d.observacoes,
        d.created_at::text as created_at
      FROM public.despesas d
      LEFT JOIN public.categorias_despesas c ON d.categoria_id = c.id
      WHERE ${dateWhereDespesas}
      ORDER BY d.data_despesa DESC, d.created_at DESC
    `;

    const despesasRows = (await sql.query(despesasQuery, paramsDespesas)) as any[];
    const despesasLista: Despesa[] = despesasRows.map((r) => ({
      id: r.id,
      descricao: r.descricao,
      valor: Number(r.valor || 0),
      data_despesa: r.data_despesa,
      categoria_id: r.categoria_id,
      categoria_nome: r.categoria_nome,
      categoria_cor: r.categoria_cor,
      observacoes: r.observacoes,
      created_at: r.created_at,
    }));

    const despesasOperacionaisTotal = despesasLista.reduce((acc, d) => acc + d.valor, 0);
    const despesasGeraisTotal = custoTotal + despesasOperacionaisTotal;
    const lucroLiquidoTotal = faturamentoTotal - despesasGeraisTotal;

    // Agrupamento de despesas por categoria (incluindo Custo dos Produtos/Serviços como CMV)
    const mapaCat: Record<string, { total: number; count: number; cor: string }> = {};

    if (custoTotal > 0) {
      mapaCat['Custo de Produtos/Serviços (CMV)'] = {
        total: custoTotal,
        count: totalPedidos,
        cor: '#ef4444',
      };
    }

    for (const d of despesasLista) {
      const cNome = d.categoria_nome || 'Outros';
      const cor = d.categoria_cor || '#64748b';
      if (!mapaCat[cNome]) {
        mapaCat[cNome] = { total: 0, count: 0, cor };
      }
      mapaCat[cNome].total += d.valor;
      mapaCat[cNome].count += 1;
    }

    const totalBaseCategorias = Math.max(despesasGeraisTotal, 1);
    const despesasPorCategoria: CategoriaDespesaResumo[] = Object.entries(mapaCat).map(([nome, dados]) => ({
      categoria_nome: nome,
      cor: dados.cor,
      total: dados.total,
      quantidade: dados.count,
      porcentagem: (dados.total / totalBaseCategorias) * 100,
    })).sort((a, b) => b.total - a.total);

    return {
      periodoDescricao,
      faturamentoTotal,
      custoTotal,
      lucroTotal,
      margemPercentual,
      totalPedidos,
      ticketMedio,
      pedidosPagos,
      pedidosAprovados,
      pedidosOrcamentos,
      despesasOperacionaisTotal,
      despesasGeraisTotal,
      lucroLiquidoTotal,
      despesasPorCategoria,
      despesasLista,
      topProdutos,
      topClientes,
      vendasPorMes,
      pedidosLista,
    };
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return {
      periodoDescricao: 'Erro ao carregar',
      faturamentoTotal: 0,
      custoTotal: 0,
      lucroTotal: 0,
      margemPercentual: 0,
      totalPedidos: 0,
      ticketMedio: 0,
      pedidosPagos: 0,
      pedidosAprovados: 0,
      pedidosOrcamentos: 0,
      despesasOperacionaisTotal: 0,
      despesasGeraisTotal: 0,
      lucroLiquidoTotal: 0,
      despesasPorCategoria: [],
      despesasLista: [],
      topProdutos: [],
      topClientes: [],
      vendasPorMes: [],
      pedidosLista: [],
    };
  }
}

// ==========================================
// CATEGORIAS DE DESPESAS
// ==========================================

export async function getCategoriasDespesas(): Promise<CategoriaDespesa[]> {
  try {
    const rows = await sql.query(`SELECT id, nome, cor, created_at::text as created_at FROM public.categorias_despesas ORDER BY nome ASC`);
    return rows as unknown as CategoriaDespesa[];
  } catch (err) {
    console.error('Erro ao buscar categorias de despesas:', err);
    return [];
  }
}

export async function createCategoriaDespesa(nome: string, cor?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await sql.query(`
      INSERT INTO public.categorias_despesas (nome, cor) VALUES ($1, $2) RETURNING id
    `, [nome.trim(), cor || '#ef4444']);
    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao criar categoria de despesa' };
  }
}

export async function deleteCategoriaDespesa(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`UPDATE public.despesas SET categoria_id = NULL WHERE categoria_id = $1`, [id]);
    await sql.query(`DELETE FROM public.categorias_despesas WHERE id = $1`, [id]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir categoria de despesa' };
  }
}

// ==========================================
// DESPESAS
// ==========================================

export async function getDespesas(filtros?: {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
}): Promise<Despesa[]> {
  try {
    let query = `
      SELECT 
        d.id,
        d.descricao,
        d.valor::float as valor,
        d.data_despesa::text as data_despesa,
        d.categoria_id,
        COALESCE(c.nome, d.categoria_nome, 'Outros') as categoria_nome,
        COALESCE(c.cor, '#64748b') as categoria_cor,
        d.observacoes,
        d.created_at::text as created_at
      FROM public.despesas d
      LEFT JOIN public.categorias_despesas c ON d.categoria_id = c.id
      WHERE 1=1
    `;
    const params: string[] = [];
    if (filtros?.dataInicio) {
      params.push(filtros.dataInicio);
      query += ` AND d.data_despesa >= $${params.length}`;
    }
    if (filtros?.dataFim) {
      params.push(filtros.dataFim);
      query += ` AND d.data_despesa <= $${params.length}`;
    }
    if (filtros?.categoriaId) {
      params.push(filtros.categoriaId);
      query += ` AND d.categoria_id = $${params.length}`;
    }
    query += ` ORDER BY d.data_despesa DESC, d.created_at DESC`;
    const rows = await sql.query(query, params);
    return rows as unknown as Despesa[];
  } catch (err) {
    console.error('Erro ao buscar despesas:', err);
    return [];
  }
}

export async function createDespesa(data: {
  descricao: string;
  valor: number;
  data_despesa: string;
  categoria_id?: string;
  observacoes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    let catNome = null;
    if (data.categoria_id) {
      const c = await sql.query(`SELECT nome FROM public.categorias_despesas WHERE id = $1`, [data.categoria_id]);
      if (c && c.length > 0) catNome = (c[0] as any).nome;
    }
    const res = await sql.query(`
      INSERT INTO public.despesas (descricao, valor, data_despesa, categoria_id, categoria_nome, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      data.descricao.trim(),
      Number(data.valor) || 0,
      data.data_despesa || new Date().toISOString().split('T')[0],
      data.categoria_id || null,
      catNome,
      data.observacoes || null
    ]);
    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao criar despesa' };
  }
}

export async function updateDespesa(
  id: string,
  data: {
    descricao: string;
    valor: number;
    data_despesa: string;
    categoria_id?: string;
    observacoes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    let catNome = null;
    if (data.categoria_id) {
      const c = await sql.query(`SELECT nome FROM public.categorias_despesas WHERE id = $1`, [data.categoria_id]);
      if (c && c.length > 0) catNome = (c[0] as any).nome;
    }
    await sql.query(`
      UPDATE public.despesas
      SET descricao = $1, valor = $2, data_despesa = $3, categoria_id = $4, categoria_nome = $5, observacoes = $6
      WHERE id = $7
    `, [
      data.descricao.trim(),
      Number(data.valor) || 0,
      data.data_despesa,
      data.categoria_id || null,
      catNome,
      data.observacoes || null,
      id
    ]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao atualizar despesa' };
  }
}

export async function deleteDespesa(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`DELETE FROM public.despesas WHERE id = $1`, [id]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir despesa' };
  }
}

// ==========================================
// CRM DE VENDAS & OPORTUNIDADES
// ==========================================

export async function getCrmOportunidades(): Promise<CrmOportunidade[]> {
  try {
    const rows = await sql.query(`
      SELECT 
        o.id,
        o.titulo,
        o.cliente_id,
        o.cliente_nome,
        o.cliente_telefone,
        o.cliente_email,
        o.valor::float as valor,
        o.etapa,
        o.pedido_id,
        p.numero_pedido,
        o.data_previsao::text as data_previsao,
        o.data_venda_futura::text as data_venda_futura,
        o.observacoes,
        o.created_at::text as created_at,
        o.updated_at::text as updated_at
      FROM public.crm_oportunidades o
      LEFT JOIN public.pedidos p ON o.pedido_id = p.id
      ORDER BY o.created_at DESC
    `);
    return rows as unknown as CrmOportunidade[];
  } catch (error) {
    console.error('Erro ao buscar oportunidades CRM:', error);
    return [];
  }
}

export async function createCrmOportunidade(data: {
  titulo: string;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  valor: number;
  etapa: CrmEtapa;
  data_previsao?: string;
  data_venda_futura?: string;
  observacoes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const dataVendaFutura = data.data_venda_futura || (data.etapa === 'venda_futura' ? data.data_previsao : null);
    const res = await sql.query(`
      INSERT INTO public.crm_oportunidades (
        titulo, cliente_id, cliente_nome, cliente_telefone, cliente_email, valor, etapa, data_previsao, data_venda_futura, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      data.titulo.trim(),
      data.cliente_id || null,
      data.cliente_nome.trim(),
      data.cliente_telefone || null,
      data.cliente_email || null,
      Number(data.valor) || 0,
      data.etapa || 'potencial',
      data.data_previsao || null,
      dataVendaFutura || null,
      data.observacoes || null
    ]);
    revalidatePath('/');
    return { success: true, id: (res[0] as any)?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao criar oportunidade CRM' };
  }
}

export async function updateCrmEtapa(id: string, etapa: CrmEtapa): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`UPDATE public.crm_oportunidades SET etapa = $1, updated_at = now() WHERE id = $2`, [etapa, id]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao atualizar etapa no CRM' };
  }
}

export async function updateCrmOportunidade(
  id: string,
  data: {
    titulo: string;
    cliente_nome: string;
    cliente_telefone?: string;
    cliente_email?: string;
    valor: number;
    etapa: CrmEtapa;
    data_previsao?: string;
    data_venda_futura?: string;
    observacoes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const dataVendaFutura = data.data_venda_futura || (data.etapa === 'venda_futura' ? data.data_previsao : null);
    await sql.query(`
      UPDATE public.crm_oportunidades
      SET titulo = $1, cliente_nome = $2, cliente_telefone = $3, cliente_email = $4, valor = $5, etapa = $6, data_previsao = $7, data_venda_futura = $8, observacoes = $9, updated_at = now()
      WHERE id = $10
    `, [
      data.titulo.trim(),
      data.cliente_nome.trim(),
      data.cliente_telefone || null,
      data.cliente_email || null,
      Number(data.valor) || 0,
      data.etapa,
      data.data_previsao || null,
      dataVendaFutura || null,
      data.observacoes || null,
      id
    ]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao atualizar oportunidade CRM' };
  }
}

export async function deleteCrmOportunidade(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`DELETE FROM public.crm_oportunidades WHERE id = $1`, [id]);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao deletar oportunidade CRM' };
  }
}

// Analisa clientes com datas no nome e gera oportunidades de Venda Futura automaticamente
export async function processarDatasNomesClientes(): Promise<{ success: boolean; processados: number; error?: string }> {
  try {
    const MESES_MAP: Record<string, string> = {
      'JAN': '01', 'JANEIRO': '01',
      'FEV': '02', 'FEVEREIRO': '02',
      'MAR': '03', 'MARCO': '03', 'MARÇO': '03',
      'ABR': '04', 'ABRIL': '04',
      'MAI': '05', 'MAIO': '05',
      'JUN': '06', 'JUNHO': '06',
      'JUL': '07', 'JULHO': '07',
      'AGO': '08', 'AGOSTO': '08',
      'SET': '09', 'SETEMBRO': '09',
      'OUT': '10', 'OUTUBRO': '10',
      'NOV': '11', 'NOVEMBRO': '11',
      'DEZ': '12', 'DEZEMBRO': '12'
    };

    const regex = /[\s\-\(]*\(+(?:VENCE\s+EM\s+)?([A-Za-zÇç]+)[\s\-\/]*(\d{2,4})\)+/i;

    const clientes = await sql.query(`
      SELECT id, nome_empresa, telefone_whatsapp,
        (SELECT valor_total FROM public.pedidos WHERE cliente_id = public.clientes.id ORDER BY data_pedido DESC LIMIT 1) as ultimo_valor
      FROM public.clientes
      ORDER BY nome_empresa ASC
    `);

    let total = 0;

    for (const c of clientes as any[]) {
      const match = c.nome_empresa.match(regex);
      if (!match) continue;

      const mesStr = match[1].toUpperCase();
      const anoStr = match[2];
      const mesNum = MESES_MAP[mesStr];
      if (!mesNum) continue;

      const anoCompleto = anoStr.length === 2 ? `20${anoStr}` : anoStr;
      const dataFormatada = `${anoCompleto}-${mesNum}-10`;
      const nomeLimpo = c.nome_empresa.replace(regex, '').replace(/\s*-\s*$/, '').trim();

      // Atualiza nome do cliente
      await sql.query(`UPDATE public.clientes SET nome_empresa = $1, updated_at = now() WHERE id = $2`, [nomeLimpo, c.id]);

      // Verifica se já existe oportunidade de Venda Futura para este cliente
      const opExistente = await sql.query(
        `SELECT id FROM public.crm_oportunidades WHERE cliente_id = $1 AND etapa = 'venda_futura'`,
        [c.id]
      );

      const valorEstimado = Number(c.ultimo_valor) || 0;
      const tituloOp = `Renovação Extintores - ${nomeLimpo}`;
      const obs = `Oportunidade gerada automaticamente a partir da data de renovação registrada no cadastro (${c.nome_empresa})`;

      if (opExistente && (opExistente as any[]).length > 0) {
        await sql.query(
          `UPDATE public.crm_oportunidades SET titulo = $1, cliente_nome = $2, data_previsao = $3, data_venda_futura = $4, pedido_id = NULL, updated_at = now() WHERE id = $5`,
          [tituloOp, nomeLimpo, dataFormatada, dataFormatada, (opExistente as any[])[0].id]
        );
      } else {
        await sql.query(
          `INSERT INTO public.crm_oportunidades (
            titulo, cliente_id, cliente_nome, cliente_telefone, valor, etapa, pedido_id, data_previsao, data_venda_futura, observacoes
          ) VALUES ($1, $2, $3, $4, $5, 'venda_futura', NULL, $6, $7, $8)`,
          [tituloOp, c.id, nomeLimpo, c.telefone_whatsapp || null, valorEstimado, dataFormatada, dataFormatada, obs]
        );
      }

      total++;
    }

    revalidatePath('/');
    return { success: true, processados: total };
  } catch (err: any) {
    console.error('Erro ao processar datas nos nomes dos clientes:', err);
    return { success: false, processados: 0, error: err?.message || 'Erro ao processar datas' };
  }
}

