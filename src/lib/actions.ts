'use server';

import crypto from 'crypto';
import { sql } from './db';
import { Cliente, ProdutoServico, CategoriaProduto, Pedido, ItemPedido, StatusPedido, DashboardStats, Usuario, normalizarCidade } from './types';
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
        p.cliente_id,
        p.status,
        p.valor_total::float as valor_total,
        p.observacoes,
        p.created_at::text as created_at,
        c.nome_empresa,
        c.nome_contato,
        c.telefone_whatsapp,
        c.endereco,
        c.cidade,
        c.uf,
        c.cnpj
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
        p.cliente_id,
        p.status,
        p.valor_total::float as valor_total,
        p.observacoes,
        p.created_at::text as created_at,
        c.nome_empresa,
        c.nome_contato,
        c.telefone_whatsapp,
        c.endereco,
        c.cidade,
        c.uf,
        c.cnpj
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
        i.valor_total_item::float as valor_total_item
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

export async function updatePedidoStatus(id: string, status: StatusPedido): Promise<boolean> {
  try {
    await sql.query(`UPDATE public.pedidos SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
    revalidatePath('/');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

export async function createPedido(data: {
  cliente_id: string;
  data_pedido: string;
  status: StatusPedido;
  observacoes?: string;
  itens: {
    produto_id: string;
    quantidade: number;
    valor_unitario: number;
    descricao_item?: string;
  }[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const proximoNum = await getProximoNumeroPedido();

    const pedRes = await sql.query(
      `
      INSERT INTO public.pedidos (numero_pedido, data_pedido, cliente_id, status, observacoes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [proximoNum, data.data_pedido, data.cliente_id, data.status, data.observacoes || null]
    );

    const pedidoId = (pedRes[0] as any)?.id;

    if (data.itens && data.itens.length > 0) {
      for (const item of data.itens) {
        const totalItem = Number(item.quantidade) * Number(item.valor_unitario);
        await sql.query(
          `
          INSERT INTO public.itens_pedido (pedido_id, produto_id, descricao_item, quantidade, valor_unitario, valor_total_item)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [pedidoId, item.produto_id, item.descricao_item || null, item.quantidade, item.valor_unitario, totalItem]
        );
      }
    }

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
    status: StatusPedido;
    observacoes?: string;
    itens: {
      produto_id: string;
      quantidade: number;
      valor_unitario: number;
      descricao_item?: string;
    }[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `
      UPDATE public.pedidos 
      SET cliente_id = $1, data_pedido = $2, status = $3, observacoes = $4, updated_at = now()
      WHERE id = $5
      `,
      [data.cliente_id, data.data_pedido, data.status, data.observacoes || null, id]
    );

    // Substitui itens
    await sql.query(`DELETE FROM public.itens_pedido WHERE pedido_id = $1`, [id]);

    if (data.itens && data.itens.length > 0) {
      for (const item of data.itens) {
        const totalItem = Number(item.quantidade) * Number(item.valor_unitario);
        await sql.query(
          `
          INSERT INTO public.itens_pedido (pedido_id, produto_id, descricao_item, quantidade, valor_unitario, valor_total_item)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [id, item.produto_id, item.descricao_item || null, item.quantidade, item.valor_unitario, totalItem]
        );
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao editar pedido:', error);
    return { success: false, error: error?.message || 'Erro ao atualizar pedido' };
  }
}

export async function deletePedido(id: string): Promise<boolean> {
  try {
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
        endereco,
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
      INSERT INTO public.clientes (nome_empresa, nome_contato, telefone_whatsapp, endereco, cidade, uf, cnpj)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        data.nome_empresa,
        data.nome_contato || null,
        data.telefone_whatsapp || null,
        data.endereco || null,
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
      SET nome_empresa = $1, nome_contato = $2, telefone_whatsapp = $3, endereco = $4, cidade = $5, uf = $6, cnpj = $7, updated_at = now()
      WHERE id = $8
      `,
      [
        data.nome_empresa,
        data.nome_contato || null,
        data.telefone_whatsapp || null,
        data.endereco || null,
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
  categoria_id?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await sql.query(
      `
      INSERT INTO public.produtos_servicos (descricao, tipo_kg, valor_unitario_padrao, categoria_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [data.descricao, data.tipo_kg || null, data.valor_unitario_padrao || 0, data.categoria_id || null]
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
  categoria_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(
      `
      UPDATE public.produtos_servicos
      SET descricao = $1, tipo_kg = $2, valor_unitario_padrao = $3, categoria_id = $4
      WHERE id = $5
      `,
      [data.descricao, data.tipo_kg || null, data.valor_unitario_padrao || 0, data.categoria_id || null, id]
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

    const rows = (await sql.query(
      `SELECT id, nome, email, senha_hash, cargo, ativo, ultimo_login::text as ultimo_login, created_at::text as created_at
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
