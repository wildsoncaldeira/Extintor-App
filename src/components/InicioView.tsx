'use client';

import React from 'react';
import { 
  FilePlus2, 
  FileText, 
  UserPlus, 
  Users, 
  BarChart3, 
  Package, 
  Flame, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface InicioViewProps {
  usuarioNome: string;
  stats: DashboardStats;
  onCriarPedido: () => void;
  onCriarCliente: () => void;
  onVerPedidos: (status?: string) => void;
  onVerClientes: () => void;
  onVerProdutos: () => void;
  onVerDashboard: () => void;
}

export function InicioView({
  usuarioNome,
  stats,
  onCriarPedido,
  onCriarCliente,
  onVerPedidos,
  onVerClientes,
  onVerProdutos,
  onVerDashboard,
}: InicioViewProps) {
  const primeiroNome = usuarioNome ? usuarioNome.split(' ')[0] : 'Usuário';

  const cardsAcao = [
    {
      id: 'criar-pedido',
      titulo: 'Criar Pedido',
      subtitulo: 'Novo orçamento ou OS',
      icone: FilePlus2,
      corFundoIcone: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60',
      badge: '+ Novo',
      badgeCor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800/80',
      onClick: onCriarPedido,
    },
    {
      id: 'ver-pedidos',
      titulo: 'Ver Pedidos',
      subtitulo: 'Ordens e orçamentos',
      icone: FileText,
      corFundoIcone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60',
      badge: `${stats.totalPedidos} pedidos`,
      badgeCor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80',
      onClick: () => onVerPedidos(),
    },
    {
      id: 'criar-cliente',
      titulo: 'Criar Cliente',
      subtitulo: 'Novo cadastro de cliente',
      icone: UserPlus,
      corFundoIcone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60',
      badge: '+ Novo',
      badgeCor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80',
      onClick: onCriarCliente,
    },
    {
      id: 'ver-clientes',
      titulo: 'Ver Clientes',
      subtitulo: 'Lafaiete e região',
      icone: Users,
      corFundoIcone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60',
      badge: `${stats.totalClientes} clientes`,
      badgeCor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80',
      onClick: onVerClientes,
    },
    {
      id: 'produtos-servicos',
      titulo: 'Produtos & Serviços',
      subtitulo: 'Tabela e catálogo',
      icone: Package,
      corFundoIcone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900/60',
      badge: `${stats.totalProdutos} itens`,
      badgeCor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80',
      onClick: onVerProdutos,
    },
    {
      id: 'dashboard',
      titulo: 'Dashboard',
      subtitulo: 'Métricas e faturamento',
      icone: BarChart3,
      corFundoIcone: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/60',
      badge: 'Relatórios',
      badgeCor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80',
      onClick: onVerDashboard,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto py-2 sm:py-6">
      
      {/* CABEÇALHO DE BOAS-VINDAS ESTILO PLACAFY */}
      <div className="text-center space-y-2 sm:space-y-3 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-semibold mb-1 shadow-2xs">
          <Flame className="w-3.5 h-3.5 animate-pulse text-red-600 dark:text-red-400" />
          <span>Olá, {primeiroNome}!</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          Bem-vindo(a) ao <span className="text-red-600 dark:text-red-500">EXTINTOR</span>APP
        </h1>

        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto font-medium">
          Selecione o que você deseja fazer hoje:
        </p>
      </div>

      {/* GRADE DE AÇÕES RÁPIDAS (6 CARDS - 3x2 DESKTOP / 2x3 MOBILE) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 px-1">
        {cardsAcao.map((card) => {
          const Icone = card.icone;
          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className="group bg-white dark:bg-[#18181c] dark:border-zinc-700/80 border border-zinc-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-center shadow-xs dark:shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[160px] sm:min-h-[210px] relative overflow-hidden"
            >
              {/* Badge no topo direito */}
              <span className={`absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${card.badgeCor}`}>
                {card.badge}
              </span>

              {/* Ícone Circular Centralizado */}
              <div className="w-full flex justify-center pt-2 sm:pt-3">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-black/5 dark:border-white/5 ${card.corFundoIcone}`}>
                  <Icone className="w-6 h-6 sm:w-8 h-8" />
                </div>
              </div>

              {/* Título e Subtítulo */}
              <div className="w-full mt-3 sm:mt-4 space-y-0.5 sm:space-y-1">
                <h3 className="text-sm sm:text-lg font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-tight">
                  {card.titulo}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 sm:line-clamp-none">
                  {card.subtitulo}
                </p>
              </div>

              {/* Indicador de Ação no Rodapé (Desktop) */}
              <div className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hidden sm:flex">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* RESUMO RÁPIDO DE STATUS DOS PEDIDOS */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
              Visão Rápida dos Pedidos
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Clique em um dos status abaixo para visualizar os pedidos diretamente
            </p>
          </div>

          <button
            onClick={() => onVerPedidos()}
            className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver todos os {stats.totalPedidos} pedidos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <button
            onClick={() => onVerPedidos('Orçamento')}
            className="p-3 sm:p-3.5 rounded-xl border border-red-200/80 bg-red-50/60 hover:bg-red-100/70 dark:border-red-900/60 dark:bg-red-950/40 dark:hover:bg-red-950/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase text-red-700 dark:text-red-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Orçamentos
            </span>
            <p className="text-lg sm:text-2xl font-black text-red-700 dark:text-red-400 mt-0.5 sm:mt-1">
              {stats.pedidosOrcamento}
            </p>
          </button>

          <button
            onClick={() => onVerPedidos('Aprovado')}
            className="p-3 sm:p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/60 hover:bg-blue-100/70 dark:border-blue-900/60 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Aprovados
            </span>
            <p className="text-lg sm:text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5 sm:mt-1">
              {stats.pedidosAprovado}
            </p>
          </button>

          <button
            onClick={() => onVerPedidos('Pago')}
            className="p-3 sm:p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Pagos
            </span>
            <p className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1">
              {stats.pedidosPago}
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
