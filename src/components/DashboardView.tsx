'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { DollarSign, FileText, Users, Package, Plus, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  onOpenNovoPedido: () => void;
  onOpenNovoCliente: () => void;
  onIrParaPedidos: (status?: string) => void;
}

export function DashboardView({
  stats,
  onOpenNovoPedido,
  onOpenNovoCliente,
  onIrParaPedidos,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Total */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
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

        {/* Total de Pedidos */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Ordens de Serviço
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {stats.totalPedidos}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Pedidos registrados
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 dark:border dark:border-blue-800/80 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Clientes Ativos
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {stats.totalClientes}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Lafaiete e região
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 dark:border dark:border-purple-800/80 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Produtos & Serviços */}
        <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Produtos & Serviços
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {stats.totalProdutos}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Itens no catálogo
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-800/80 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Divisão por Status de Pedidos */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-6 rounded-xl border border-zinc-200 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-4">
          Distribuição de Status dos Pedidos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div
            onClick={() => onIrParaPedidos('Orçamento')}
            className="p-4 rounded-xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:hover:bg-red-950/60 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Orçamentos
              </span>
              <p className="text-3xl font-black text-red-700 dark:text-red-400 mt-1">{stats.pedidosOrcamento}</p>
              <span className="text-xs text-red-600 dark:text-red-400/80">Aguardando aprovação</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded-md shadow-sm">Ver</span>
          </div>

          <div
            onClick={() => onIrParaPedidos('Aprovado')}
            className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Aprovados
              </span>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">{stats.pedidosAprovado}</p>
              <span className="text-xs text-blue-600 dark:text-blue-400/80">Prontos / Em execução</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-blue-600 text-white rounded-md shadow-sm">Ver</span>
          </div>

          <div
            onClick={() => onIrParaPedidos('Pago')}
            className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Pagos
              </span>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.pedidosPago}</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400/80">Finalizados e quitados</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded-md shadow-sm">Ver</span>
          </div>

        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-[#18181c] dark:to-[#141418] dark:border dark:border-zinc-700/80 text-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold">Acesso Rápido para Atendimento</h4>
          <p className="text-xs text-zinc-300 dark:text-zinc-400 mt-0.5">
            Abra ordens de serviço e gere orçamentos instantaneamente no celular ou computador.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenNovoCliente}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:border dark:border-zinc-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Users className="w-4 h-4" /> + Cliente
          </button>

          <button
            onClick={onOpenNovoPedido}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-900/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Novo Pedido
          </button>
        </div>
      </div>

    </div>
  );
}
