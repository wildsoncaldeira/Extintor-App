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
