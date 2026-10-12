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
  DollarSign
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface InicioViewProps {
  usuarioNome: string;
  stats: DashboardStats;
  loading?: boolean;
  onCriarPedido: () => void;
  onCriarCliente: () => void;
  onVerPedidos: (status?: string) => void;
  onVerClientes: () => void;
  onVerProdutos: () => void;
  onVerDashboard: () => void;
  onVerFinanceiro?: () => void;
  onVerCrm?: () => void;
}

export function InicioView({
  usuarioNome,
  stats,
  loading = false,
  onCriarPedido,
  onCriarCliente,
  onVerPedidos,
  onVerClientes,
  onVerProdutos,
  onVerDashboard,
  onVerFinanceiro,
  onVerCrm,
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
      id: 'crm',
      titulo: 'CRM & Vendas Futuras',
      subtitulo: 'Funil e renovações anuais',
      icone: Users,
      corFundoIcone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60',
      badge: 'Renovações',
      badgeCor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80',
      onClick: () => (onVerCrm ? onVerCrm() : onVerPedidos()),
    },
    {
      id: 'financeiro',
      titulo: 'Financeiro',
      subtitulo: 'Margens, custos e vendas',
      icone: DollarSign,
      corFundoIcone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60',
      badge: 'Vendas & Lucro',
      badgeCor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80',
      onClick: onVerFinanceiro || onVerDashboard,
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
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto py-2 sm:py-4">
      
      {/* CABEÇALHO DE BOAS-VINDAS ESTILO PLACAFY */}
      <div className="text-center space-y-1.5 sm:space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-semibold shadow-2xs">
          <Flame className="w-3.5 h-3.5 animate-pulse text-red-600 dark:text-red-400" />
          <span>Olá, {primeiroNome}!</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Bem-vindo(a) ao <span className="text-red-600 dark:text-red-500">EXTINTOR</span>APP
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto font-medium">
          Selecione o que você deseja fazer hoje:
        </p>
      </div>

      {/* GRADE DE AÇÕES RÁPIDAS (2 LINHAS DE 4 CARDS NO DESKTOP) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5 px-1">
        {cardsAcao.map((card) => {
          const Icone = card.icone;
          const isCriarPedido = card.id === 'criar-pedido';

          if (isCriarPedido) {
            return (
              <button
                key={card.id}
                onClick={card.onClick}
                className="group bg-gradient-to-br from-red-600 to-rose-600 text-white border-2 border-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-md shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/35 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[160px] sm:min-h-[175px] lg:min-h-[188px] relative overflow-hidden"
              >
                {/* Badge no topo direito */}
                <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  {card.badge}
                </span>

                {/* Ícone Circular Branco com ícone Vermelho */}
                <div className="w-full flex justify-center pt-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-md bg-white text-red-600">
                    <Icone className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                  </div>
                </div>

                {/* Título e Subtítulo em Branco */}
                <div className="w-full mt-2.5 space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    {card.titulo}
                  </h3>
                  <p className="text-xs text-red-100 font-medium line-clamp-1">
                    {card.subtitulo}
                  </p>
                </div>
              </button>
            );
          }

          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className="group bg-white dark:bg-[#18181c] dark:border-zinc-700/80 border border-zinc-200/90 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-xs dark:shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[160px] sm:min-h-[175px] lg:min-h-[188px] relative overflow-hidden"
            >
              {/* Badge no topo direito */}
              <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeCor}`}>
                {card.badge}
              </span>

              {/* Ícone Circular Centralizado */}
              <div className="w-full flex justify-center pt-2">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs border border-black/5 dark:border-white/5 ${card.corFundoIcone}`}>
                  <Icone className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>

              {/* Título e Subtítulo */}
              <div className="w-full mt-2.5 space-y-1">
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-tight">
                  {card.titulo}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1">
                  {card.subtitulo}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
