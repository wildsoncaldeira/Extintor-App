'use client';

import React, { useMemo } from 'react';
import { DashboardStats, Pedido, Cliente, ProdutoServico, normalizarCidade } from '@/lib/types';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  ArrowUpRight, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Activity, 
  Flame, 
  ChevronRight,
  Percent,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  pedidos?: Pedido[];
  clientes?: Cliente[];
  produtos?: ProdutoServico[];
  loading?: boolean;
  onOpenNovoPedido: () => void;
  onOpenNovoCliente: () => void;
  onIrParaPedidos: (status?: string) => void;
}

export function DashboardView({
  stats,
  pedidos = [],
  clientes = [],
  produtos = [],
  loading = false,
  onOpenNovoPedido,
  onOpenNovoCliente,
  onIrParaPedidos,
}: DashboardViewProps) {
  // Volume total de extintores / itens atendidos
  const totalItensAtendidos = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return 0;
    return pedidos.reduce((acc, p) => {
      const somaItens = p.itens?.reduce((s, it) => s + (Number(it.quantidade) || 0), 0) || 0;
      return acc + somaItens;
    }, 0);
  }, [pedidos]);

  // Ticket Médio das Ordens Efetivadas (Aprovados + Pagos)
  const ticketMedio = useMemo(() => {
    const pedidosEfetivados = (stats.pedidosAprovado + stats.pedidosPago) || (pedidos ? pedidos.filter(p => p.status !== 'Orçamento').length : 0);
    if (!pedidosEfetivados) return 0;
    return stats.faturamentoTotal / pedidosEfetivados;
  }, [stats.faturamentoTotal, stats.pedidosAprovado, stats.pedidosPago, pedidos]);

  // Taxa de Conversão de Orçamentos em Pedidos Aprovados/Pagos
  const taxaConversao = useMemo(() => {
    if (!stats.totalPedidos) return 0;
    const pedidosEfetivados = stats.pedidosAprovado + stats.pedidosPago;
    return Math.round((pedidosEfetivados / stats.totalPedidos) * 100);
  }, [stats.totalPedidos, stats.pedidosAprovado, stats.pedidosPago]);

  // Histórico dos últimos 6 meses para o Gráfico de Evolução Operacional
  const mesesHistorico = useMemo(() => {
    const hoje = new Date();
    const meses: { chave: string; rotulo: string; faturamento: number; pedidos: number }[] = [];
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rotulo = `${nomesMeses[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      meses.push({ chave, rotulo, faturamento: 0, pedidos: 0 });
    }

    if (pedidos && pedidos.length > 0) {
      pedidos.forEach((p) => {
        if (!p.data_pedido) return;
        const chave = p.data_pedido.substring(0, 7);
        const mesItem = meses.find((m) => m.chave === chave);
        if (mesItem) {
          mesItem.pedidos += 1;
          if (p.status !== 'Orçamento') {
            mesItem.faturamento += Number(p.valor_total || 0);
          }
        }
      });
    }

    const maxFat = Math.max(...meses.map((m) => m.faturamento), 1000);
    return meses.map((m) => ({
      ...m,
      percentual: Math.min(100, Math.max(12, Math.round((m.faturamento / maxFat) * 100))),
    }));
  }, [pedidos]);

  // Top 5 Itens & Serviços mais demandados na operação
  const topProdutos = useMemo(() => {
    const map = new Map<string, { nome: string; quantidade: number; faturamento: number }>();
    if (pedidos && pedidos.length > 0) {
      pedidos.forEach((p) => {
        if (p.itens && p.itens.length > 0) {
          p.itens.forEach((it) => {
            const nome = it.descricao_item || 'Item Geral';
            const exist = map.get(nome) || { nome, quantidade: 0, faturamento: 0 };
            exist.quantidade += Number(it.quantidade || 0);
            exist.faturamento += Number(it.valor_total_item || 0);
            map.set(nome, exist);
          });
        }
      });
    }
    const lista = Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    const maxQtd = Math.max(...lista.map((x) => x.quantidade), 1);
    return lista.map((p) => ({
      ...p,
      percentual: Math.min(100, Math.max(8, Math.round((p.quantidade / maxQtd) * 100))),
    }));
  }, [pedidos]);

  // Distribuição por Cidades Atendidas na Região
  const distribuicaoCidades = useMemo(() => {
    const map = new Map<string, number>();
    if (clientes && clientes.length > 0) {
      clientes.forEach((c) => {
        const cidade = normalizarCidade(c.cidade);
        map.set(cidade, (map.get(cidade) || 0) + 1);
      });
    }
    const lista = Array.from(map.entries())
      .map(([cidade, total]) => ({ cidade, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const maxTotal = Math.max(...lista.map((x) => x.total), 1);
    return lista.map((c) => ({
      ...c,
      percentual: Math.min(100, Math.max(10, Math.round((c.total / maxTotal) * 100))),
    }));
  }, [clientes]);

  // Renovações / Vendas Futuras agendadas
  const totalRenovacoesAgendadas = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return 0;
    return pedidos.filter((p) => Boolean(p.data_venda_futura)).length;
  }, [pedidos]);

  if (loading && stats.totalPedidos === 0 && stats.totalClientes === 0) {
    return (
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md py-20 px-4 rounded-xl border border-zinc-200 flex flex-col items-center justify-center text-center gap-3">
        <Loader2 className="w-8 h-8 text-red-600 dark:text-red-500 animate-spin" />
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Carregando Dashboard & Indicadores Operacionais...
        </p>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Processando histórico de recargas, vendas e faturamento
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* SEÇÃO 1: CARDS DE MÉTRICAS OPERACIONAIS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Histórico */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Faturamento Histórico
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              R$ {stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total acumulado
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 dark:border dark:border-red-800/80 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Ticket Médio Operacional */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Ticket Médio
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Por ordem aprovada
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 dark:border dark:border-blue-800/80 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Taxa de Conversão
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {taxaConversao}%
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" /> Orçamentos aprovados
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 dark:border dark:border-purple-800/80 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Extintores e Itens Atendidos */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Extintores & Itens
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {totalItensAtendidos}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Recargas e vendas
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-800/80 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SEÇÃO 2: GRÁFICO DE EVOLUÇÃO OPERACIONAL E FATURAMENTO (ÚLTIMOS 6 MESES) */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Evolução Operacional de Faturamento & Ordens
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Histórico de receita aprovada e volume de ordens nos últimos 6 meses
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-red-600 to-rose-500"></span>
              <span>Faturamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600"></span>
              <span>Volume de Pedidos</span>
            </div>
          </div>
        </div>

        {/* Visualização do Gráfico de Barras */}
        <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 pt-6 pb-2 items-end border-b border-zinc-100 dark:border-zinc-800">
          {mesesHistorico.map((mes, idx) => (
            <div key={idx} className="flex flex-col items-center h-full justify-end group">
              <div className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                R$ {mes.faturamento >= 1000 ? `${(mes.faturamento / 1000).toFixed(1)}k` : mes.faturamento.toFixed(0)}
              </div>
              <div className="w-full max-w-[48px] bg-zinc-100 dark:bg-zinc-800/60 rounded-t-lg relative flex items-end justify-center overflow-hidden h-full">
                <div
                  style={{ height: `${mes.percentual}%` }}
                  className="w-full bg-gradient-to-t from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400 transition-all rounded-t-lg shadow-sm"
                ></div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                  {mes.rotulo}
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  {mes.pedidos} OS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 3: DISTRIBUIÇÃO DE STATUS DAS ORDENS DE SERVIÇO */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Distribuição por Etapa da Operação
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Clique em qualquer etapa para filtrar instantaneamente no módulo de pedidos
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Total: {stats.totalPedidos} ordens
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div
            onClick={() => onIrParaPedidos('Orçamento')}
            className="p-4 rounded-xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:hover:bg-red-950/60 cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Orçamentos Pendentes
              </span>
              <p className="text-3xl font-black text-red-700 dark:text-red-400 mt-1">{stats.pedidosOrcamento}</p>
              <span className="text-xs text-red-600 dark:text-red-400/80">Aguardando aprovação do cliente</span>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              Ver
            </span>
          </div>

          <div
            onClick={() => onIrParaPedidos('Aprovado')}
            className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Ordens Aprovadas
              </span>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">{stats.pedidosAprovado}</p>
              <span className="text-xs text-blue-600 dark:text-blue-400/80">Em recarga, teste ou entrega</span>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              Ver
            </span>
          </div>

          <div
            onClick={() => onIrParaPedidos('Pago')}
            className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Ordens Quitadas
              </span>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.pedidosPago}</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400/80">Finalizados e recebidos</span>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              Ver
            </span>
          </div>

        </div>
      </div>

      {/* SEÇÃO 4: TOP SERVIÇOS DEMANDADOS & COBERTURA REGIONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Extintores & Serviços */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                Itens & Recargas Mais Demandados
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ranking por volume total de unidades atendidas
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              Top 5
            </span>
          </div>

          <div className="space-y-3.5">
            {topProdutos.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Nenhum item registrado nas ordens ainda.</p>
            ) : (
              topProdutos.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[240px]">
                      {idx + 1}. {item.nome}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      <strong className="text-zinc-900 dark:text-white">{item.quantidade} un</strong> (R$ {item.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${item.percentual}%` }}
                      className="bg-gradient-to-r from-red-600 to-rose-500 h-2 rounded-full"
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cobertura Regional / Cidades */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Cidades Atendidas na Região
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Concentração de clientes e empresas parceiras
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {stats.totalClientes} clientes
            </span>
          </div>

          <div className="space-y-3.5">
            {distribuicaoCidades.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Nenhum cliente cadastrado.</p>
            ) : (
              distribuicaoCidades.map((cid, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      {cid.cidade}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      <strong className="text-zinc-900 dark:text-white">{cid.total}</strong> clientes
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${cid.percentual}%` }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full"
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SEÇÃO 5: PREVISÃO DE RENOVAÇÕES & CONTROLE ANUAL */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 dark:border dark:border-rose-900/60 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Vendas Futuras & Ciclo Anual de Extintores
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Extintores requerem recarga anual obrigatória. Acompanhe as renovações agendadas no funil do CRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="text-right">
            <span className="text-xs font-semibold text-zinc-400 uppercase block">Agendamentos</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white">
              {totalRenovacoesAgendadas} futuras
            </span>
          </div>
          <button
            onClick={() => onIrParaPedidos()}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-bold rounded-xl shadow-sm hover:bg-zinc-800 transition cursor-pointer"
          >
            Acessar Pedidos &rarr;
          </button>
        </div>
      </div>

    </div>
  );
}
