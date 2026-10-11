export type StatusPedido = 'Orçamento' | 'Aprovado' | 'Pago';

export interface Cliente {
  id: string;
  legacy_id?: string | null;
  nome_empresa: string;
  nome_contato?: string | null;
  telefone_whatsapp?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cnpj?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaProduto {
  id: string;
  nome: string;
  ordem?: number;
  total_produtos?: number;
  created_at?: string;
}

export interface ProdutoServico {
  id: string;
  legacy_id?: string | null;
  categoria_id?: string | null;
  nome_categoria?: string | null;
  descricao: string;
  tipo_kg?: string | null;
  valor_unitario_padrao: number;
  ativo?: boolean;
  created_at?: string;
}

export interface ItemPedido {
  id?: string;
  pedido_id?: string;
  produto_id?: string | null;
  descricao_item?: string | null;
  tipo_kg?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total_item: number;
}

export interface Pedido {
  id: string;
  legacy_id?: string | null;
  numero_pedido: number;
  data_pedido: string;
  cliente_id: string;
  status: StatusPedido;
  valor_total: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Campos juntados (JOIN)
  nome_empresa?: string;
  nome_contato?: string | null;
  telefone_whatsapp?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cnpj?: string | null;
  itens?: ItemPedido[];
}

export interface DashboardStats {
  faturamentoTotal: number;
  faturamentoMes: number;
  totalPedidos: number;
  pedidosOrcamento: number;
  pedidosAprovado: number;
  pedidosPago: number;
  totalClientes: number;
  totalProdutos: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  ativo: boolean;
  ultimo_login?: string | null;
  created_at?: string;
}

export function normalizarCidade(cidade?: string | null): string {
  if (!cidade) return 'Conselheiro Lafaiete';
  const limpo = cidade.trim();
  const upper = limpo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (upper.includes('CONSEHEIRO') || upper.includes('CONSELHEIRO') || upper.includes('LAFAIETE')) {
    return 'Conselheiro Lafaiete';
  }
  if (upper === 'CARANDAI') {
    return 'Carandaí';
  }
  if (upper === 'CONGONHAS') {
    return 'Congonhas';
  }
  if (upper === 'CRISTIANO OTONI') {
    return 'Cristiano Otoni';
  }
  if (upper === 'BELO VALE') {
    return 'Belo Vale';
  }
  if (upper === 'OURO BRANCO') {
    return 'Ouro Branco';
  }
  if (upper === 'BARBACENA') {
    return 'Barbacena';
  }
  if (upper === 'RIO ESPERA') {
    return 'Rio Espera';
  }

  return limpo.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

