'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, Cliente, ProdutoServico, CategoriaProduto, DashboardStats, Usuario } from '@/lib/types';
import { getPedidos, getClientes, getProdutos, getCategorias, getDashboardStats, getPedidoDetalhes } from '@/lib/actions';
import { PedidosView } from '@/components/PedidosView';
import { ClientesView } from '@/components/ClientesView';
import { ProdutosView } from '@/components/ProdutosView';
import { DashboardView } from '@/components/DashboardView';
import { FinanceiroView } from '@/components/FinanceiroView';
import { LoginView } from '@/components/LoginView';
import { PedidoModal } from '@/components/PedidoModal';
import { ClienteModal } from '@/components/ClienteModal';
import { ClienteDetalhesModal } from '@/components/ClienteDetalhesModal';
import { ProdutoModal } from '@/components/ProdutoModal';
import { ReciboModal } from '@/components/ReciboModal';
import { StatusModal } from '@/components/StatusModal';
import { CategoriasModal } from '@/components/CategoriasModal';
import { InicioView } from '@/components/InicioView';
import { CrmView } from '@/components/CrmView';
import { downloadPedidoPdf } from '@/lib/pdfGenerator';
import { 
  Flame, 
  Home as HomeIcon,
  FileEdit, 
  Users, 
  Package, 
  LayoutDashboard,
  DollarSign, 
  Plus, 
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

type AbaAtiva = 'inicio' | 'pedidos' | 'clientes' | 'produtos' | 'crm' | 'financeiro' | 'dashboard';

export default function Home() {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [checandoAuth, setChecandoAuth] = useState(true);
  const [temaEscuro, setTemaEscuro] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('inicio');
  const [loading, setLoading] = useState(true);

  // Checa se há usuário autenticado no navegador e tema salvo
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('usuario_extintores') || sessionStorage.getItem('usuario_extintores');
      if (salvo) {
        setUsuarioLogado(JSON.parse(salvo));
      }

      const temaSalvo = localStorage.getItem('tema_extintores');
      if (temaSalvo === 'dark' || (!temaSalvo && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTemaEscuro(true);
        document.documentElement.classList.add('dark');
      } else {
        setTemaEscuro(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Erro ao ler usuário salvo ou tema:', e);
    } finally {
      setChecandoAuth(false);
    }
  }, []);

  const alternarTema = () => {
    setTemaEscuro((prev) => {
      const novo = !prev;
      try {
        localStorage.setItem('tema_extintores', novo ? 'dark' : 'light');
        if (novo) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.error('Erro ao salvar tema:', e);
      }
      return novo;
    });
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      localStorage.removeItem('usuario_extintores');
      sessionStorage.removeItem('usuario_extintores');
      setUsuarioLogado(null);
    }
  };

  // Dados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<ProdutoServico[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    faturamentoTotal: 0,
    faturamentoMes: 0,
    totalPedidos: 0,
    pedidosOrcamento: 0,
    pedidosAprovado: 0,
    pedidosPago: 0,
    totalClientes: 0,
    totalProdutos: 0,
  });

  // Estados dos Modais
  const [pedidoModalAberto, setPedidoModalAberto] = useState(false);
  const [pedidoParaEditar, setPedidoParaEditar] = useState<Pedido | null>(null);
  const [clienteInicialParaPedido, setClienteInicialParaPedido] = useState<{ id?: string; nome?: string } | null>(null);

  const [clienteModalAberto, setClienteModalAberto] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);

  const [produtoModalAberto, setProdutoModalAberto] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<ProdutoServico | null>(null);

  const [reciboModalAberto, setReciboModalAberto] = useState(false);
  const [pedidoRecibo, setPedidoRecibo] = useState<Pedido | null>(null);
  const [autoPrintPdf, setAutoPrintPdf] = useState(false);

  const [statusModalAberto, setStatusModalAberto] = useState(false);
  const [pedidoStatus, setPedidoStatus] = useState<Pedido | null>(null);

  const [clienteDetalhesAberto, setClienteDetalhesAberto] = useState(false);
  const [clienteParaDetalhes, setClienteParaDetalhes] = useState<Cliente | null>(null);

  const [ultimoModalAberto, setUltimoModalAberto] = useState<'recibo' | 'cliente'>('recibo');

  const [categoriasModalAberto, setCategoriasModalAberto] = useState(false);

  // Carregamento inicial e refresh
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [pedidosData, clientesData, produtosData, categoriasData, statsData] = await Promise.all([
        getPedidos(),
        getClientes(),
        getProdutos(),
        getCategorias(),
        getDashboardStats(),
      ]);
      setPedidos(pedidosData);
      setClientes(clientesData);
      setProdutos(produtosData);
      setCategorias(categoriasData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuarioLogado) {
      carregarDados();
    }
  }, [usuarioLogado]);

  // Tecla ESC fecha o pop-up que estiver no topo da pilha
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      // 1. Modais de formulário / edição / status (nível superior z-[80])
      if (statusModalAberto) {
        setStatusModalAberto(false);
        setPedidoStatus(null);
        return;
      }
      if (pedidoModalAberto) {
        setPedidoModalAberto(false);
        setPedidoParaEditar(null);
        return;
      }
      if (clienteModalAberto) {
        setClienteModalAberto(false);
        setClienteParaEditar(null);
        return;
      }
      if (produtoModalAberto) {
        setProdutoModalAberto(false);
        setProdutoParaEditar(null);
        return;
      }
      if (categoriasModalAberto) {
        setCategoriasModalAberto(false);
        return;
      }

      // 2. Modais de detalhes (Recibo e Cliente)
      if (reciboModalAberto && clienteDetalhesAberto) {
        if (ultimoModalAberto === 'recibo') {
          setReciboModalAberto(false);
          setAutoPrintPdf(false);
          setUltimoModalAberto('cliente');
        } else {
          setClienteDetalhesAberto(false);
          setClienteParaDetalhes(null);
          setUltimoModalAberto('recibo');
        }
        return;
      }

      if (reciboModalAberto) {
        setReciboModalAberto(false);
        setAutoPrintPdf(false);
        return;
      }

      if (clienteDetalhesAberto) {
        setClienteDetalhesAberto(false);
        setClienteParaDetalhes(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    statusModalAberto,
    pedidoModalAberto,
    clienteModalAberto,
    produtoModalAberto,
    categoriasModalAberto,
    reciboModalAberto,
    clienteDetalhesAberto,
    ultimoModalAberto,
  ]);

  if (checandoAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Iniciando sistema...</p>
      </div>
    );
  }

  if (!usuarioLogado) {
    return <LoginView onLoginSucesso={(u) => setUsuarioLogado(u)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
      temaEscuro
        ? 'bg-black text-zinc-100'
        : 'bg-[#e4e7ee] text-zinc-900'
    }`}>
      
      {/* SIDEBAR DESKTOP (Fixa no topo da tela, nunca rola para fora) */}
      <aside className={`hidden md:flex flex-col w-72 h-screen sticky top-0 border-r shrink-0 select-none overflow-hidden transition-colors duration-200 z-30 ${
        temaEscuro
          ? 'bg-[#0f0f12] border-zinc-800 text-zinc-100 shadow-2xl'
          : 'bg-white border-zinc-300 text-zinc-900 shadow-sm'
      }`}>
        {/* Logo / Header */}
        <div className={`p-5 border-b flex items-center gap-3 shrink-0 ${
          temaEscuro ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white leading-tight truncate">
              Recarga de Extintores
            </h1>
            <p className="text-[11px] text-red-500 dark:text-red-400 font-semibold uppercase tracking-wider truncate">
              AVCB • Lafaiete e Região
            </p>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => setAbaAtiva('inicio')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'inicio'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <HomeIcon className={`w-4 h-4 shrink-0 ${abaAtiva === 'inicio' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Início</span>
          </button>

          <button
            onClick={() => setAbaAtiva('pedidos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'pedidos'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <FileEdit className={`w-4 h-4 shrink-0 ${abaAtiva === 'pedidos' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Pedidos</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              temaEscuro ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {pedidos.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('clientes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'clientes'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${abaAtiva === 'clientes' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Clientes</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              temaEscuro ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {clientes.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('produtos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'produtos'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <Package className={`w-4 h-4 shrink-0 ${abaAtiva === 'produtos' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Produtos & Serviços</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              temaEscuro ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {produtos.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('crm')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'crm'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${abaAtiva === 'crm' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">CRM & Vendas Futuras</span>
          </button>

          <button
            onClick={() => setAbaAtiva('financeiro')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'financeiro'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <DollarSign className={`w-4 h-4 shrink-0 ${abaAtiva === 'financeiro' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Financeiro</span>
          </button>

          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'dashboard'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${abaAtiva === 'dashboard' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span className="whitespace-nowrap font-bold">Dashboard</span>
          </button>
        </nav>

        {/* ÁREA INFERIOR DA SIDEBAR (Sempre visível no rodapé, sem rolagem) */}
        <div className={`p-3 space-y-2.5 border-t shrink-0 ${temaEscuro ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'}`}>
          
          {/* 1. SELETOR DE MODO DARK / LIGHT NO MENU */}
          <button
            onClick={alternarTema}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              temaEscuro
                ? 'bg-zinc-950/90 text-amber-400 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900'
                : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
            }`}
            title={temaEscuro ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            <div className="flex items-center gap-2">
              {temaEscuro ? (
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              )}
              <span>{temaEscuro ? 'Modo Escuro' : 'Modo Claro'}</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              temaEscuro ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {temaEscuro ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          {/* 2. CARD DO USUÁRIO LOGADO */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 overflow-hidden select-none ${
            temaEscuro
              ? 'bg-zinc-950/70 border-zinc-800 text-zinc-100'
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm border border-red-400/30">
              {usuarioLogado.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold truncate leading-tight" title={usuarioLogado.nome}>
                {usuarioLogado.nome}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate" title={usuarioLogado.email}>
                {usuarioLogado.email}
              </p>
            </div>
          </div>

          {/* 3. BOTÃO DE LOGOUT DEDICADO NO FIM DO MENU LATERAL */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              temaEscuro
                ? 'bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/60 hover:text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200'
            }`}
            title="Sair da Conta (Logout)"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema (Logout)</span>
          </button>

          {/* Conexão Neon Postgres */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Neon Postgres</span>
            </div>
            <button
              onClick={carregarDados}
              title="Atualizar dados"
              className="p-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className={`md:hidden p-3 flex items-center justify-between sticky top-0 z-40 border-b transition-colors duration-200 ${
        temaEscuro
          ? 'bg-[#0f0f12]/95 border-zinc-800 text-white backdrop-blur-md'
          : 'bg-white border-zinc-300 text-zinc-900 shadow-xs'
      }`}>
        <div 
          onClick={() => setAbaAtiva('inicio')}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          title="Ir para o Início"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-md border border-red-400/30 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="font-black text-xs block truncate text-zinc-900 dark:text-white">
              Recarga de Extintores
            </span>
            <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold block truncate">
              {usuarioLogado.nome.split(' ')[0]} ({usuarioLogado.cargo || 'Admin'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Seletor Dark/Light Mobile */}
          <button
            onClick={alternarTema}
            title={temaEscuro ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            className={`p-2 rounded-lg transition border cursor-pointer ${
              temaEscuro
                ? 'bg-zinc-950 text-amber-400 border-zinc-700'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
          >
            {temaEscuro ? (
              <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* Botão de Logout Mobile */}
          <button
            onClick={handleLogout}
            title="Sair do sistema (Logout)"
            className={`p-2 rounded-lg transition border cursor-pointer ${
              temaEscuro
                ? 'bg-red-950/50 text-red-400 border-red-800/60 hover:bg-red-900/60'
                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Botão Novo Pedido Mobile */}
          <button
            onClick={() => {
              if (abaAtiva === 'clientes') {
                setClienteParaEditar(null);
                setClienteModalAberto(true);
              } else if (abaAtiva === 'produtos') {
                setProdutoParaEditar(null);
                setProdutoModalAberto(true);
              } else {
                setPedidoParaEditar(null);
                setPedidoModalAberto(true);
              }
            }}
            className="p-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
        
        {/* Barra de Título Superior (visível nas abas de listagem) */}
        {abaAtiva !== 'inicio' && (
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-black tracking-tight capitalize ${temaEscuro ? 'text-white' : 'text-zinc-900'} dark:text-white`}>
                {abaAtiva === 'pedidos' && 'Ordens de Serviço / Pedidos'}
                {abaAtiva === 'clientes' && 'Gestão de Clientes'}
                {abaAtiva === 'produtos' && 'Catálogo de Produtos & Serviços'}
                {abaAtiva === 'crm' && 'CRM de Vendas & Vendas Futuras'}
                {abaAtiva === 'financeiro' && 'Gestão Financeira, Custos & Despesas'}
                {abaAtiva === 'dashboard' && 'Painel de Desempenho & Faturamento'}
              </h2>
              <p className={`text-xs mt-0.5 ${temaEscuro ? 'text-zinc-400' : 'text-zinc-500'} dark:text-zinc-400`}>
                Mário Luiz Gomes da Silva • Execução de Projetos AVCB • Conectado como <strong className={`font-semibold ${temaEscuro ? 'text-zinc-200' : 'text-zinc-800'} dark:text-zinc-200`}>{usuarioLogado.nome}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={carregarDados}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer ${
                  temaEscuro
                    ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>

              {abaAtiva === 'pedidos' && (
                <button
                  onClick={() => {
                    setPedidoParaEditar(null);
                    setPedidoModalAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Pedido</span>
                </button>
              )}

              {abaAtiva === 'clientes' && (
                <button
                  onClick={() => {
                    setClienteParaEditar(null);
                    setClienteModalAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cliente</span>
                </button>
              )}

              {abaAtiva === 'produtos' && (
                <button
                  onClick={() => {
                    setProdutoParaEditar(null);
                    setProdutoModalAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Produto</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Visualização de cada Aba */}
        {abaAtiva === 'inicio' && (
          <InicioView
            usuarioNome={usuarioLogado.nome}
            stats={stats}
            loading={loading}
            onCriarPedido={() => {
              setPedidoParaEditar(null);
              setPedidoModalAberto(true);
            }}
            onCriarCliente={() => {
              setClienteParaEditar(null);
              setClienteModalAberto(true);
            }}
            onVerPedidos={() => setAbaAtiva('pedidos')}
            onVerClientes={() => setAbaAtiva('clientes')}
            onVerProdutos={() => setAbaAtiva('produtos')}
            onVerCrm={() => setAbaAtiva('crm')}
            onVerFinanceiro={() => setAbaAtiva('financeiro')}
            onVerDashboard={() => setAbaAtiva('dashboard')}
          />
        )}
        {abaAtiva === 'pedidos' && (
          <PedidosView
            pedidos={pedidos}
            loading={loading}
            onOpenNovoPedido={() => {
              setPedidoParaEditar(null);
              setPedidoModalAberto(true);
            }}
            onEditarPedido={(p) => {
              setPedidoParaEditar(p);
              setPedidoModalAberto(true);
            }}
            onVerRecibo={(p) => {
              setUltimoModalAberto('recibo');
              setAutoPrintPdf(false);
              setPedidoRecibo(p);
              setReciboModalAberto(true);
            }}
            onImprimirPdfDireto={(p) => {
              downloadPedidoPdf(p);
            }}
            onAlterarStatus={(p) => {
              setPedidoStatus(p);
              setStatusModalAberto(true);
            }}
            onRefresh={carregarDados}
          />
        )}

        {abaAtiva === 'clientes' && (
          <ClientesView
            clientes={clientes}
            pedidos={pedidos}
            loading={loading}
            onOpenNovoCliente={() => {
              setClienteParaEditar(null);
              setClienteModalAberto(true);
            }}
            onEditarCliente={(c) => {
              setClienteParaEditar(c);
              setClienteModalAberto(true);
            }}
            onVerCliente={(c) => {
              setUltimoModalAberto('cliente');
              setClienteParaDetalhes(c);
              setClienteDetalhesAberto(true);
            }}
            onRefresh={carregarDados}
          />
        )}

        {abaAtiva === 'produtos' && (
          <ProdutosView
            produtos={produtos}
            categorias={categorias}
            loading={loading}
            onOpenNovoProduto={() => {
              setProdutoParaEditar(null);
              setProdutoModalAberto(true);
            }}
            onEditarProduto={(p) => {
              setProdutoParaEditar(p);
              setProdutoModalAberto(true);
            }}
            onOpenGerenciarCategorias={() => setCategoriasModalAberto(true)}
            onRefresh={carregarDados}
          />
        )}

        {abaAtiva === 'crm' && (
          <CrmView
            onAbrirPedido={async (pedId) => {
              const detalhado = await getPedidoDetalhes(pedId);
              if (detalhado) {
                setUltimoModalAberto('recibo');
                setPedidoRecibo(detalhado);
                setReciboModalAberto(true);
              }
            }}
            onCriarNovoPedido={(clienteId, clienteNome) => {
              setClienteInicialParaPedido({ id: clienteId, nome: clienteNome });
              setPedidoParaEditar(null);
              setPedidoModalAberto(true);
            }}
            onVerCliente={(cliId) => {
              const cli = clientes.find((c) => c.id === cliId || c.legacy_id === cliId);
              if (cli) {
                setUltimoModalAberto('cliente');
                setClienteParaDetalhes(cli);
                setClienteDetalhesAberto(true);
              }
            }}
          />
        )}

        {abaAtiva === 'financeiro' && (
          <FinanceiroView
            onVerPedido={async (pedId) => {
              const detalhado = await getPedidoDetalhes(pedId);
              if (detalhado) {
                setUltimoModalAberto('recibo');
                setPedidoRecibo(detalhado);
                setReciboModalAberto(true);
              }
            }}
            onVerCliente={(cliId) => {
              const cli = clientes.find((c) => c.id === cliId || c.legacy_id === cliId);
              if (cli) {
                setUltimoModalAberto('cliente');
                setClienteParaDetalhes(cli);
                setClienteDetalhesAberto(true);
              }
            }}
          />
        )}

        {abaAtiva === 'dashboard' && (
          <DashboardView
            stats={stats}
            loading={loading}
            onOpenNovoPedido={() => {
              setPedidoParaEditar(null);
              setPedidoModalAberto(true);
            }}
            onOpenNovoCliente={() => {
              setClienteParaEditar(null);
              setClienteModalAberto(true);
            }}
            onIrParaPedidos={() => setAbaAtiva('pedidos')}
          />
        )}

      </main>

      {/* BOTTOM NAVIGATION MOBILE */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-7 py-2 border-t transition-colors duration-200 ${
        temaEscuro
          ? 'bg-[#0f0f12]/95 border-zinc-800 text-zinc-400 backdrop-blur-md'
          : 'bg-white border-zinc-300 text-zinc-600 shadow-md'
      }`}>
        <button
          onClick={() => setAbaAtiva('inicio')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'inicio' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <HomeIcon className="w-4 h-4" />
          <span className="text-[9px]">Início</span>
        </button>

        <button
          onClick={() => setAbaAtiva('pedidos')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'pedidos' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span className="text-[9px]">Pedidos</span>
        </button>

        <button
          onClick={() => setAbaAtiva('clientes')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'clientes' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px]">Clientes</span>
        </button>

        <button
          onClick={() => setAbaAtiva('produtos')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'produtos' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9px]">Produtos</span>
        </button>

        <button
          onClick={() => setAbaAtiva('crm')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'crm' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px]">CRM</span>
        </button>

        <button
          onClick={() => setAbaAtiva('financeiro')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'financeiro' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[9px]">Financeiro</span>
        </button>

        <button
          onClick={() => setAbaAtiva('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
            abaAtiva === 'dashboard' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px]">Dashboard</span>
        </button>
      </nav>

      {/* MODAIS GLOBAIS */}
      {pedidoModalAberto && (
        <PedidoModal
          pedidoParaEditar={pedidoParaEditar}
          clienteInicialId={clienteInicialParaPedido?.id}
          clienteInicialNome={clienteInicialParaPedido?.nome}
          clientes={clientes}
          produtos={produtos}
          onClose={() => {
            setPedidoModalAberto(false);
            setPedidoParaEditar(null);
            setClienteInicialParaPedido(null);
          }}
          onSaved={async () => {
            setPedidoModalAberto(false);
            setPedidoParaEditar(null);
            setClienteInicialParaPedido(null);
            if (pedidoRecibo) {
              const detalhado = await getPedidoDetalhes(pedidoRecibo.id);
              if (detalhado) {
                setPedidoRecibo(detalhado);
              }
            }
            carregarDados();
          }}
          onOpenNovoCliente={() => {
            setClienteParaEditar(null);
            setClienteModalAberto(true);
          }}
        />
      )}

      {clienteModalAberto && (
        <ClienteModal
          clienteParaEditar={clienteParaEditar}
          onClose={() => setClienteModalAberto(false)}
          onSaved={(novoCliente) => {
            setClienteModalAberto(false);
            if (novoCliente) {
              setClienteParaDetalhes(novoCliente);
            }
            carregarDados();
          }}
        />
      )}

      {produtoModalAberto && (
        <ProdutoModal
          produtoParaEditar={produtoParaEditar}
          categorias={categorias}
          onClose={() => setProdutoModalAberto(false)}
          onSaved={() => {
            setProdutoModalAberto(false);
            carregarDados();
          }}
          onOpenGerenciarCategorias={() => {
            setProdutoModalAberto(false);
            setCategoriasModalAberto(true);
          }}
        />
      )}

      {categoriasModalAberto && (
        <CategoriasModal
          categorias={categorias}
          onClose={() => setCategoriasModalAberto(false)}
          onRefresh={carregarDados}
        />
      )}

      {statusModalAberto && pedidoStatus && (
        <StatusModal
          pedido={pedidoStatus}
          onClose={() => {
            setStatusModalAberto(false);
            setPedidoStatus(null);
          }}
          onSaved={(novoStatus) => {
            setStatusModalAberto(false);
            setPedidoStatus(null);
            if (pedidoRecibo && novoStatus) {
              setPedidoRecibo({ ...pedidoRecibo, status: novoStatus });
            }
            carregarDados();
          }}
        />
      )}

      {reciboModalAberto && (
        <ReciboModal
          pedido={pedidoRecibo}
          autoPrint={autoPrintPdf}
          zIndexClass={ultimoModalAberto === 'recibo' ? 'z-[60]' : 'z-50'}
          onClose={() => {
            setReciboModalAberto(false);
            setAutoPrintPdf(false);
          }}
          onEditarPedido={(p) => {
            setPedidoParaEditar(p);
            setPedidoModalAberto(true);
          }}
          onAlterarStatus={(p) => {
            setPedidoStatus(p);
            setStatusModalAberto(true);
          }}
          onVerCliente={(clienteId) => {
            setUltimoModalAberto('cliente');
            const cli = clientes.find((c) => c.id === clienteId || c.legacy_id === clienteId);
            if (cli) {
              setClienteParaDetalhes(cli);
              setClienteDetalhesAberto(true);
            }
          }}
        />
      )}

      {clienteDetalhesAberto && clienteParaDetalhes && (
        <ClienteDetalhesModal
          cliente={clienteParaDetalhes}
          pedidos={pedidos}
          zIndexClass={ultimoModalAberto === 'cliente' ? 'z-[60]' : 'z-50'}
          onClose={() => {
            setClienteDetalhesAberto(false);
            setClienteParaDetalhes(null);
          }}
          onEditarCliente={(c) => {
            setClienteDetalhesAberto(false);
            setClienteParaEditar(c);
            setClienteModalAberto(true);
          }}
          onVerPedido={async (ped) => {
            setUltimoModalAberto('recibo');
            const detalhado = await getPedidoDetalhes(ped.id);
            setPedidoRecibo(detalhado || ped);
            setReciboModalAberto(true);
          }}
        />
      )}

    </div>
  );
}
