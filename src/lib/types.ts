export type StatusPedido = 'Orçamento' | 'Aprovado' | 'Pago';

export interface Cliente {
  id: string;
  legacy_id?: string | null;
  nome_empresa: string;
  nome_contato?: string | null;
  telefone_whatsapp?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
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
  custo_unitario_padrao?: number;
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
  custo_unitario?: number;
  custo_total_item?: number;
}

export interface Pedido {
  id: string;
  legacy_id?: string | null;
  numero_pedido: number;
  data_pedido: string;
  data_entrega?: string | null;
  data_venda_futura?: string | null;
  cliente_id: string;
  status: StatusPedido;
  valor_total: number;
  subtotal?: number;
  desconto_tipo?: 'reais' | 'porcentagem' | null;
  desconto_valor?: number;
  custo_total?: number;
  margem_total?: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Campos juntados (JOIN)
  nome_empresa?: string;
  nome_contato?: string | null;
  telefone_whatsapp?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cnpj?: string | null;
  itens?: ItemPedido[];
}

export interface ClienteAnexo {
  id: string;
  cliente_id: string;
  nome_arquivo: string;
  tipo_arquivo?: string | null;
  tamanho_bytes?: number | null;
  conteudo_base64?: string | null;
  url?: string | null;
  created_at: string;
}

export interface TopProdutoFinanceiro {
  produto_id: string | null;
  nome: string;
  categoria?: string | null;
  tipo_kg?: string | null;
  quantidadeVendida: number;
  faturamento: number;
  custo: number;
  lucro: number;
  margemPercentual: number;
}

export interface TopClienteFinanceiro {
  cliente_id: string;
  nome_empresa: string;
  nome_contato?: string | null;
  cidade?: string | null;
  totalPedidos: number;
  faturamento: number;
  custo: number;
  lucro: number;
  margemPercentual: number;
}

export interface MesFinanceiro {
  rotulo: string;
  mesAno: string;
  faturamento: number;
  custo: number;
  lucro: number;
  margemPercentual: number;
  quantidadePedidos: number;
}

export interface PedidoFinanceiroItem {
  id: string;
  numero_pedido: number;
  data_pedido: string;
  cliente_id: string;
  nome_empresa: string;
  status: StatusPedido;
  valor_total: number;
  custo_total: number;
  lucro: number;
  margemPercentual: number;
  quantidade_itens: number;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  cor?: string;
  created_at?: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data_despesa: string;
  categoria_id?: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface CategoriaDespesaResumo {
  categoria_nome: string;
  cor: string;
  total: number;
  quantidade: number;
  porcentagem: number;
}

export type CrmEtapa = 'potencial' | 'orcamento' | 'aprovado' | 'pago' | 'venda_futura';

export interface CrmOportunidade {
  id: string;
  titulo: string;
  cliente_id?: string | null;
  cliente_nome: string;
  cliente_telefone?: string | null;
  cliente_email?: string | null;
  valor: number;
  etapa: CrmEtapa;
  pedido_id?: string | null;
  numero_pedido?: number | null;
  data_previsao?: string | null;
  data_venda_futura?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RelatorioFinanceiro {
  periodoDescricao: string;
  faturamentoTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemPercentual: number;
  totalPedidos: number;
  ticketMedio: number;
  pedidosPagos: number;
  pedidosAprovados: number;
  pedidosOrcamentos: number;
  // Despesas Operacionais e Gerais
  despesasOperacionaisTotal: number;
  despesasGeraisTotal: number; // Custo dos Produtos (CMV) + Despesas Operacionais
  lucroLiquidoTotal: number; // Faturamento - Despesas Gerais
  despesasPorCategoria: CategoriaDespesaResumo[];
  despesasLista: Despesa[];
  topProdutos: TopProdutoFinanceiro[];
  topClientes: TopClienteFinanceiro[];
  vendasPorMes: MesFinanceiro[];
  pedidosLista: PedidoFinanceiroItem[];
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

