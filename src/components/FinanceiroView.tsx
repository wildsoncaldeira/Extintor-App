'use client';

import React, { useState, useEffect } from 'react';
import { RelatorioFinanceiro, StatusPedido, Despesa, CategoriaDespesa } from '@/lib/types';
import { getRelatorioFinanceiro, getCategoriasDespesas, deleteDespesa } from '@/lib/actions';
import { DespesaModal } from './DespesaModal';
import { CategoriasDespesasModal } from './CategoriasDespesasModal';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Calendar, 
  FileText, 
  Percent, 
  RefreshCw, 
  Receipt, 
  Award, 
  ArrowUpRight, 
  Search,
  Filter,
  BarChart3,
  Layers,
  ChevronDown,
  Plus,
  Settings,
  Trash2,
  Edit2,
  PieChart,
  WalletCards,
  AlertCircle
} from 'lucide-react';

interface FinanceiroViewProps {
  onVerPedido?: (pedidoId: string) => void;
  onVerCliente?: (clienteId: string) => void;
}

export function FinanceiroView({ onVerPedido, onVerCliente }: FinanceiroViewProps) {
  const dataAtual = new Date();
  const [periodoTipo, setPeriodoTipo] = useState<'mes' | 'ano' | 'todos' | 'custom'>('mes');
  const [mesSelecionado, setMesSelecionado] = useState<number>(dataAtual.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(dataAtual.getFullYear());
  const [dataInicio, setDataInicio] = useState<string>(
    `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [dataFim, setDataFim] = useState<string>(dataAtual.toISOString().split('T')[0]);
  const [statusFiltro, setStatusFiltro] = useState<string>('Todos');

  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  
  // Abas internas de detalhamento
  const [abaDetalhe, setAbaDetalhe] = useState<'despesas' | 'produtos' | 'clientes' | 'pedidos'>('despesas');
  const [buscaTabela, setBuscaTabela] = useState('');

  // Modais de Despesas
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false);
  const [despesaParaEditar, setDespesaParaEditar] = useState<Despesa | null>(null);
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [excluindoDespesaId, setExcluindoDespesaId] = useState<string | null>(null);
  const [painelFiltroAberto, setPainelFiltroAberto] = useState(false);

  const carregarCategorias = async () => {
    try {
      const data = await getCategoriasDespesas();
      setCategorias(data);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      const data = await getRelatorioFinanceiro({
        periodoTipo,
        mes: mesSelecionado,
        ano: anoSelecionado,
        dataInicio,
        dataFim,
        status: statusFiltro,
      });
      setRelatorio(data);
    } catch (err) {
      console.error('Erro ao carregar relatório financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    carregarRelatorio();
  }, [periodoTipo, mesSelecionado, anoSelecionado, dataInicio, dataFim, statusFiltro]);

  const handleExcluirDespesa = async (despesa: Despesa) => {
    if (!confirm(`Deseja realmente excluir a despesa "${despesa.descricao}" no valor de R$ ${despesa.valor.toFixed(2)}?`)) {
      return;
    }

    setExcluindoDespesaId(despesa.id);
    try {
      const res = await deleteDespesa(despesa.id);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir despesa.');
      } else {
        await carregarRelatorio();
      }
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
      alert('Erro ao excluir despesa.');
    } finally {
      setExcluindoDespesaId(null);
    }
  };

  const formatMoeda = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status: StatusPedido) => {
    switch (status) {
      case 'Orçamento':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80';
      case 'Aprovado':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80';
      case 'Pago':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  const meses = [
    { num: 1, nome: 'Janeiro' },
    { num: 2, nome: 'Fevereiro' },
    { num: 3, nome: 'Março' },
    { num: 4, nome: 'Abril' },
    { num: 5, nome: 'Maio' },
    { num: 6, nome: 'Junho' },
    { num: 7, nome: 'Julho' },
    { num: 8, nome: 'Agosto' },
    { num: 9, nome: 'Setembro' },
    { num: 10, nome: 'Outubro' },
    { num: 11, nome: 'Novembro' },
    { num: 12, nome: 'Dezembro' },
  ];

  const anosDisponiveis = [2024, 2025, 2026, 2027];

  // Filtros de busca nas tabelas
  const despesasFiltradas = relatorio?.despesasLista?.filter((d) =>
    d.descricao.toLowerCase().includes(buscaTabela.toLowerCase()) ||
    (d.categoria_nome && d.categoria_nome.toLowerCase().includes(buscaTabela.toLowerCase())) ||
    (d.observacoes && d.observacoes.toLowerCase().includes(buscaTabela.toLowerCase()))
  ) || [];

  const topProdutosFiltrados = relatorio?.topProdutos.filter((p) => 
    p.nome.toLowerCase().includes(buscaTabela.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(buscaTabela.toLowerCase())) ||
    (p.tipo_kg && p.tipo_kg.toLowerCase().includes(buscaTabela.toLowerCase()))
  ) || [];

  const topClientesFiltrados = relatorio?.topClientes.filter((c) => 
    c.nome_empresa.toLowerCase().includes(buscaTabela.toLowerCase()) ||
    (c.nome_contato && c.nome_contato.toLowerCase().includes(buscaTabela.toLowerCase())) ||
    (c.cidade && c.cidade.toLowerCase().includes(buscaTabela.toLowerCase()))
  ) || [];

  const pedidosListaFiltrados = relatorio?.pedidosLista.filter((ped) => 
    ped.nome_empresa.toLowerCase().includes(buscaTabela.toLowerCase()) ||
    String(ped.numero_pedido).includes(buscaTabela)
  ) || [];

  // Maior faturamento mensal para dimensionar o gráfico em barra
  const maiorFaturamentoMes = relatorio?.vendasPorMes?.reduce((max, m) => Math.max(max, m.faturamento), 0) || 1;

  return (
    <div className="space-y-6">
      
      {/* 1. BARRA SUPERIOR COMPACTA COM BOTÃO ESCONDIDO DE FILTROS */}
      <div className="bg-white dark:bg-[#18181c] p-3 sm:p-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Botão de Filtro de Período (Abre/Fecha seletores) */}
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setPainelFiltroAberto(!painelFiltroAberto)}
              className={`inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex-1 sm:flex-none ${
                painelFiltroAberto
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 shadow-xs'
                  : 'bg-zinc-100/90 text-zinc-800 border-zinc-300/80 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                <span className="truncate">{relatorio?.periodoDescricao || 'Filtrar Período'}</span>
                {statusFiltro !== 'Todos' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold shrink-0">
                    {statusFiltro}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${painelFiltroAberto ? 'rotate-180 text-red-600' : 'text-zinc-400'}`} />
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setDespesaParaEditar(null);
                setModalDespesaAberto(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-sm shadow-red-900/20 transition cursor-pointer flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Despesa</span>
            </button>

            <button
              onClick={() => setModalCategoriasAberto(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Categorias</span>
            </button>

            <button
              onClick={carregarRelatorio}
              disabled={loading}
              title="Atualizar dados financeiros"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Painel Expansível de Filtros */}
        {painelFiltroAberto && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Tipo de Período */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Visualizar Por:
              </label>
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPeriodoTipo('mes')}
                  className={`py-1.5 px-1 font-bold rounded-md transition text-center cursor-pointer ${
                    periodoTipo === 'mes'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoTipo('ano')}
                  className={`py-1.5 px-1 font-bold rounded-md transition text-center cursor-pointer ${
                    periodoTipo === 'ano'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Ano
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoTipo('todos')}
                  className={`py-1.5 px-1 font-bold rounded-md transition text-center cursor-pointer ${
                    periodoTipo === 'todos'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoTipo('custom')}
                  className={`py-1.5 px-1 font-bold rounded-md transition text-center cursor-pointer ${
                    periodoTipo === 'custom'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Datas
                </button>
              </div>
            </div>

            {/* Seletores dependentes do Tipo de Período */}
            {periodoTipo === 'mes' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Mês de Referência:
                  </label>
                  <select
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {meses.map((m) => (
                      <option key={m.num} value={m.num} className="dark:bg-zinc-900">
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Ano:
                  </label>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {anosDisponiveis.map((a) => (
                      <option key={a} value={a} className="dark:bg-zinc-900">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {periodoTipo === 'ano' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Ano de Referência:
                </label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                >
                  {anosDisponiveis.map((a) => (
                    <option key={a} value={a} className="dark:bg-zinc-900">
                      Ano {a}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodoTipo === 'custom' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Data Final:
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            {/* Filtro por Status do Pedido */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Status das Vendas:
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Todos" className="dark:bg-zinc-900">Todos (Aprovados e Pagos)</option>
                <option value="Pago" className="dark:bg-zinc-900">🟢 Apenas Pagos</option>
                <option value="Aprovado" className="dark:bg-zinc-900">🔵 Apenas Aprovados</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. CARDS DE PRINCIPAIS INDICADORES FINANCEIROS (KPIS) COM DESPESAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Faturamento Bruto (Volume de Vendas) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-4 rounded-2xl border border-zinc-300 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Faturamento
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatMoeda(relatorio?.faturamentoTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {relatorio?.totalPedidos || 0} pedidos no período
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Ticket Médio:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {formatMoeda(relatorio?.ticketMedio || 0)}
            </strong>
          </div>
        </div>

        {/* Card 2: Custo das Vendas (CMV) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-4 rounded-2xl border border-zinc-300 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Custo dos Produtos (CMV)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatMoeda(relatorio?.custoTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Custos diretos dos itens
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Margem Bruta:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {(relatorio?.margemPercentual || 0).toFixed(1)}%
            </strong>
          </div>
        </div>

        {/* Card 3: Despesas Operacionais (Lançamentos manuais) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-4 rounded-2xl border border-zinc-300 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Despesas Operacionais
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-red-600 dark:text-red-400 tracking-tight">
              {formatMoeda(relatorio?.despesasOperacionaisTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {relatorio?.despesasLista?.length || 0} lançamentos manuais
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Combustível, taxas, etc.</span>
            <button
              onClick={() => {
                setDespesaParaEditar(null);
                setModalDespesaAberto(true);
              }}
              className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
            >
              + Lançar
            </button>
          </div>
        </div>

        {/* Card 4: Total de Custos & Despesas (CMV + Operacionais) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-4 rounded-2xl border border-zinc-300 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Despesas Totais
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatMoeda(relatorio?.despesasGeraisTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              CMV + Custos Operacionais
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Impacto na Receita:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {((relatorio?.faturamentoTotal || 0) > 0 
                ? (((relatorio?.despesasGeraisTotal || 0) / (relatorio?.faturamentoTotal || 1)) * 100).toFixed(1) 
                : '0')}%
            </strong>
          </div>
        </div>

        {/* Card 5: Lucro Líquido Real */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-4 rounded-2xl border border-zinc-300 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Lucro Líquido Real
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              (relatorio?.lucroLiquidoTotal || 0) >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className={`text-xl font-black tracking-tight ${
              (relatorio?.lucroLiquidoTotal || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatMoeda(relatorio?.lucroLiquidoTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Receita - Todos os Custos
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Resultado:</span>
            <strong className={`font-bold ${
              (relatorio?.lucroLiquidoTotal || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(relatorio?.lucroLiquidoTotal || 0) >= 0 ? 'Lucro Líquido' : 'Prejuízo Real'}
            </strong>
          </div>
        </div>

      </div>

      {/* 3. GRÁFICOS: EVOLUÇÃO MENSAL E DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico 1: Evolução Mensal (2/3 da largura em telas grandes) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-300 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Evolução Mensal das Vendas & Lucro ({anoSelecionado})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-red-600"></span>
                <span>Faturamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                <span>Lucro Bruto</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {relatorio?.vendasPorMes && relatorio.vendasPorMes.length > 0 ? (
              relatorio.vendasPorMes.map((mesData, idx) => {
                const alturaFat = maiorFaturamentoMes > 0 ? Math.max(6, (mesData.faturamento / maiorFaturamentoMes) * 100) : 6;
                const alturaLuc = maiorFaturamentoMes > 0 ? Math.max(4, (Math.max(0, mesData.lucro) / maiorFaturamentoMes) * 100) : 4;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group">
                    <div className="h-28 w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg flex items-end justify-center gap-1 p-1 relative">
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap shadow-lg">
                        <p className="font-bold">{mesData.mesAno}</p>
                        <p>Fat: {formatMoeda(mesData.faturamento)}</p>
                        <p className="text-emerald-400">Lucro: {formatMoeda(mesData.lucro)}</p>
                      </div>

                      <div 
                        style={{ height: `${alturaFat}%` }}
                        className="w-2.5 sm:w-3 bg-red-600 rounded-t-xs transition-all duration-300"
                        title={`Faturamento: ${formatMoeda(mesData.faturamento)}`}
                      ></div>
                      <div 
                        style={{ height: `${alturaLuc}%` }}
                        className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-xs transition-all duration-300"
                        title={`Lucro: ${formatMoeda(mesData.lucro)}`}
                      ></div>
                    </div>

                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      {mesData.rotulo}
                    </span>

                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
                      {mesData.quantidadePedidos} ped
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="col-span-12 py-8 text-center text-xs text-zinc-400">
                Sem dados mensais para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Composição de Despesas por Categoria (1/3 da largura) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-300 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Despesas por Categoria
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              Total: {formatMoeda(relatorio?.despesasGeraisTotal || 0)}
            </span>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {(!relatorio?.despesasPorCategoria || relatorio.despesasPorCategoria.length === 0) ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhuma despesa ou custo registrado no período.
              </div>
            ) : (
              relatorio.despesasPorCategoria.map((cat, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.cor }}
                      />
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {cat.categoria_nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {cat.porcentagem.toFixed(1)}%
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {formatMoeda(cat.total)}
                      </span>
                    </div>
                  </div>
                  {/* Barra de Progresso Proporcional */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(3, cat.porcentagem))}%`,
                        backgroundColor: cat.cor,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. SEÇÃO DETALHADA COM ABAS: DESPESAS, PRODUTOS MAIS VENDIDOS, CLIENTES E PEDIDOS */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 rounded-2xl border border-zinc-300 shadow-2xs overflow-hidden">
        
        {/* Abas Superiores & Barra de Busca */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAbaDetalhe('despesas')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                abaDetalhe === 'despesas'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Despesas ({relatorio?.despesasLista?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaDetalhe('produtos')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                abaDetalhe === 'produtos'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Produtos Mais Vendidos ({relatorio?.topProdutos.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaDetalhe('clientes')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                abaDetalhe === 'clientes'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Maiores Clientes ({relatorio?.topClientes.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaDetalhe('pedidos')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                abaDetalhe === 'pedidos'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Vendas do Período ({relatorio?.pedidosLista.length || 0})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar dados na tabela..."
              value={buscaTabela}
              onChange={(e) => setBuscaTabela(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {/* TABELA: DESPESAS */}
        {abaDetalhe === 'despesas' && (
          <div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                Mostrando {despesasFiltradas.length} despesas operacionais no período
              </span>
              <button
                type="button"
                onClick={() => {
                  setDespesaParaEditar(null);
                  setModalDespesaAberto(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Lançar Despesa</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição da Despesa</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Observações</th>
                    <th className="py-3 px-4 text-right">Valor (R$)</th>
                    <th className="py-3 px-4 text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {despesasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                        Nenhuma despesa registrada para o filtro atual.
                      </td>
                    </tr>
                  ) : (
                    despesasFiltradas.map((d) => (
                      <tr 
                        key={d.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition"
                      >
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-mono">
                          {formatDate(d.data_despesa)}
                        </td>
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                          {d.descricao}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{
                              borderColor: `${d.categoria_cor || '#64748b'}40`,
                              backgroundColor: `${d.categoria_cor || '#64748b'}15`,
                              color: d.categoria_cor || '#64748b',
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: d.categoria_cor || '#64748b' }}
                            />
                            {d.categoria_nome || 'Outros'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                          {d.observacoes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-red-600 dark:text-red-400 font-mono">
                          {formatMoeda(d.valor)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDespesaParaEditar(d);
                                setModalDespesaAberto(true);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                              title="Editar despesa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirDespesa(d)}
                              disabled={excluindoDespesaId === d.id}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer disabled:opacity-50"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABELA: PRODUTOS MAIS VENDIDOS */}
        {abaDetalhe === 'produtos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Produto / Serviço</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-center">Qtd Vendida</th>
                  <th className="py-3 px-4 text-right">Faturamento</th>
                  <th className="py-3 px-4 text-right">Custo Total</th>
                  <th className="py-3 px-4 text-right">Lucro Bruto</th>
                  <th className="py-3 px-4 text-center">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topProdutosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      Nenhum produto vendido com este critério de busca.
                    </td>
                  </tr>
                ) : (
                  topProdutosFiltrados.map((item, index) => (
                    <tr 
                      key={index}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition"
                    >
                      <td className="py-3 px-4 text-center font-bold text-zinc-400 dark:text-zinc-500">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                        {item.nome} {item.tipo_kg ? `(${item.tipo_kg})` : ''}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                        {item.categoria || 'Geral'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {item.quantidadeVendida} un
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-white">
                        {formatMoeda(item.faturamento)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                        {formatMoeda(item.custo)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoeda(item.lucro)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.margemPercentual >= 30
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : item.margemPercentual >= 0
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                        }`}>
                          {item.margemPercentual.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABELA: CLIENTES COM MAIORES VENDAS */}
        {abaDetalhe === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Cliente / Empresa</th>
                  <th className="py-3 px-4">Cidade</th>
                  <th className="py-3 px-4 text-center">Pedidos</th>
                  <th className="py-3 px-4 text-right">Volume Comprado</th>
                  <th className="py-3 px-4 text-right">Custo Estimado</th>
                  <th className="py-3 px-4 text-right">Lucro Gerado</th>
                  <th className="py-3 px-4 text-center">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topClientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      Nenhum cliente registrado no período selecionado.
                    </td>
                  </tr>
                ) : (
                  topClientesFiltrados.map((cli, index) => (
                    <tr 
                      key={cli.cliente_id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition cursor-pointer"
                      onClick={() => onVerCliente && onVerCliente(cli.cliente_id)}
                    >
                      <td className="py-3 px-4 text-center font-bold text-zinc-400 dark:text-zinc-500">
                        {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-900 dark:text-white block hover:text-red-600 dark:hover:text-red-400 transition">
                          {cli.nome_empresa}
                        </span>
                        {cli.nome_contato && (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                            Contato: {cli.nome_contato}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                        {cli.cidade || 'Conselheiro Lafaiete'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-zinc-800 dark:text-zinc-200">
                        {cli.totalPedidos}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-zinc-900 dark:text-white">
                        {formatMoeda(cli.faturamento)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                        {formatMoeda(cli.custo)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoeda(cli.lucro)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          cli.margemPercentual >= 30
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}>
                          {cli.margemPercentual.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABELA: PEDIDOS DETALHADOS DO PERÍODO */}
        {abaDetalhe === 'pedidos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Pedido #</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Custo Total</th>
                  <th className="py-3 px-4 text-right">Margem Bruta</th>
                  <th className="py-3 px-4 text-center">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pedidosListaFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      Nenhum pedido encontrado no período selecionado.
                    </td>
                  </tr>
                ) : (
                  pedidosListaFiltrados.map((ped) => (
                    <tr 
                      key={ped.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition cursor-pointer"
                      onClick={() => onVerPedido && onVerPedido(ped.id)}
                    >
                      <td className="py-3 px-4 font-bold text-red-700 dark:text-red-400">
                        #{ped.numero_pedido}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-mono">
                        {formatDate(ped.data_pedido)}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                        {ped.nome_empresa}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(ped.status)}`}>
                          {ped.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-zinc-900 dark:text-white">
                        {formatMoeda(ped.valor_total)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                        {formatMoeda(ped.custo_total)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoeda(ped.lucro)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ped.margemPercentual >= 30
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}>
                          {ped.margemPercentual.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL: NOVA OU EDITAR DESPESA */}
      {modalDespesaAberto && (
        <DespesaModal
          despesaParaEditar={despesaParaEditar}
          categorias={categorias}
          onClose={() => setModalDespesaAberto(false)}
          onSalvo={async () => {
            setModalDespesaAberto(false);
            await carregarRelatorio();
          }}
          onAbrirGerenciadorCategorias={() => {
            setModalDespesaAberto(false);
            setModalCategoriasAberto(true);
          }}
        />
      )}

      {/* MODAL: GERENCIAR CATEGORIAS */}
      {modalCategoriasAberto && (
        <CategoriasDespesasModal
          categorias={categorias}
          onClose={() => setModalCategoriasAberto(false)}
          onCategoriasAtualizadas={async () => {
            await carregarCategorias();
            await carregarRelatorio();
          }}
        />
      )}

    </div>
  );
}
