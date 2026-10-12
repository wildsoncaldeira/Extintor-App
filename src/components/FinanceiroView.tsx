'use client';

import React, { useState, useEffect } from 'react';
import { RelatorioFinanceiro, StatusPedido } from '@/lib/types';
import { getRelatorioFinanceiro } from '@/lib/actions';
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
  ChevronDown
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
  
  // Abas internas de detalhamento
  const [abaDetalhe, setAbaDetalhe] = useState<'produtos' | 'clientes' | 'pedidos'>('produtos');
  const [buscaTabela, setBuscaTabela] = useState('');

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
    carregarRelatorio();
  }, [periodoTipo, mesSelecionado, anoSelecionado, dataInicio, dataFim, statusFiltro]);

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

  // Filtro na busca da tabela ativa
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

  // Encontra o maior faturamento mensal para dimensionar o gráfico em barra
  const maiorFaturamentoMes = relatorio?.vendasPorMes?.reduce((max, m) => Math.max(max, m.faturamento), 0) || 1;

  return (
    <div className="space-y-6">
      
      {/* 1. BARRA SUPERIOR DE FILTROS POR PERÍODO E STATUS */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                Painel Financeiro & Margens
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Filtro ativo: <strong className="text-red-700 dark:text-red-400">{relatorio?.periodoDescricao || 'Carregando...'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">

            <button
              onClick={carregarRelatorio}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Controles de Filtro: Tipo de Período, Mês, Ano e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
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
      </div>

      {/* 2. CARDS DE PRINCIPAIS INDICADORES FINANCEIROS (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Faturamento Bruto (Volume de Vendas) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Volume de Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatMoeda(relatorio?.faturamentoTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>{relatorio?.totalPedidos || 0} pedidos no período</span>
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Ticket Médio:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {formatMoeda(relatorio?.ticketMedio || 0)}
            </strong>
          </div>
        </div>

        {/* Card 2: Custos Operacionais dos Produtos/Serviços */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Custo Total das Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatMoeda(relatorio?.custoTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Baseado no custo padrão dos itens
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Representatividade:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {((relatorio?.faturamentoTotal || 0) > 0 
                ? (((relatorio?.custoTotal || 0) / (relatorio?.faturamentoTotal || 1)) * 100).toFixed(1) 
                : '0')}% da receita
            </strong>
          </div>
        </div>

        {/* Card 3: Lucro Bruto Estimado */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Lucro Bruto (Margem R$)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatMoeda(relatorio?.lucroTotal || 0)}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Faturamento líquido de custos
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Status:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {(relatorio?.lucroTotal || 0) >= 0 ? 'Resultado Positivo' : 'Prejuízo no Período'}
            </strong>
          </div>
        </div>

        {/* Card 4: Margem Média de Lucro (%) */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Margem Média (%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {(relatorio?.margemPercentual || 0).toFixed(1)}%
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Retorno sobre o faturamento
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Efetivados:</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {relatorio?.pedidosPagos || 0} pagos • {relatorio?.pedidosAprovados || 0} aprovados
            </span>
          </div>
        </div>

      </div>

      {/* 3. GRÁFICO DE EVOLUÇÃO DE VENDAS E MARGENS NO ANO */}
      {relatorio?.vendasPorMes && relatorio.vendasPorMes.length > 0 && (
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
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
                <span>Lucro</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {relatorio.vendasPorMes.map((mesData, idx) => {
              const alturaFat = maiorFaturamentoMes > 0 ? Math.max(6, (mesData.faturamento / maiorFaturamentoMes) * 100) : 6;
              const alturaLuc = maiorFaturamentoMes > 0 ? Math.max(4, (Math.max(0, mesData.lucro) / maiorFaturamentoMes) * 100) : 4;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  {/* Barras verticais */}
                  <div className="h-28 w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg flex items-end justify-center gap-1 p-1 relative">
                    {/* Tooltip ao passar mouse */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{mesData.mesAno}</p>
                      <p>Fat: {formatMoeda(mesData.faturamento)}</p>
                      <p className="text-emerald-400">Lucro: {formatMoeda(mesData.lucro)}</p>
                    </div>

                    <div 
                      style={{ height: `${alturaFat}%` }}
                      className="w-2.5 sm:w-3.5 bg-red-600 rounded-t-xs transition-all duration-300"
                      title={`Faturamento: ${formatMoeda(mesData.faturamento)}`}
                    ></div>
                    <div 
                      style={{ height: `${alturaLuc}%` }}
                      className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-xs transition-all duration-300"
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
            })}
          </div>
        </div>
      )}

      {/* 4. SEÇÃO DETALHADA: PRODUTOS MAIS VENDIDOS, CLIENTES COM MAIORES VENDAS E PEDIDOS */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        
        {/* Abas Superiores & Barra de Busca */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAbaDetalhe('produtos')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
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

    </div>
  );
}
