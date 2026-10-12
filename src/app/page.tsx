'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, Cliente, ProdutoServico, CategoriaProduto, DashboardStats, Usuario } from '@/lib/types';
import { getPedidos, getClientes, getProdutos, getCategorias, getDashboardStats, getPedidoDetalhes, getUsuarioAtual } from '@/lib/actions';
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
  TrendingUp,
  Menu,
  X,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import MinhaContaModal from '@/components/MinhaContaModal';

type AbaAtiva = 'inicio' | 'pedidos' | 'clientes' | 'produtos' | 'crm' | 'financeiro' | 'dashboard';

export default function Home() {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [checandoAuth, setChecandoAuth] = useState(true);
  const [temaEscuro, setTemaEscuro] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('inicio');
  const [loading, setLoading] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [minhaContaModalAberto, setMinhaContaModalAberto] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);

  // Checa se há usuário autenticado no navegador e tema salvo
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('usuario_extintores') || sessionStorage.getItem('usuario_extintores');
      if (salvo) {
        const u = JSON.parse(salvo);
        setUsuarioLogado(u);
        // Sincroniza dados frescos do banco se foto, nome ou email mudaram
        if (u.id) {
          getUsuarioAtual(u.id).then((fresh) => {
            if (fresh && (fresh.foto_url !== u.foto_url || fresh.nome !== u.nome || fresh.email !== u.email)) {
              setUsuarioLogado(fresh);
              try {
                localStorage.setItem('usuario_extintores', JSON.stringify(fresh));
              } catch (e) {}
            }
          }).catch(console.error);
        }
      }

      const sidebarSalva = localStorage.getItem('sidebar_colapsada');
      if (sidebarSalva === 'true') {
        setSidebarColapsada(true);
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

  const alternarSidebar = () => {
    setSidebarColapsada((prev) => {
      const novo = !prev;
      try {
        localStorage.setItem('sidebar_colapsada', novo ? 'true' : 'false');
      } catch (e) {
        console.error(e);
      }
      return novo;
    });
  };

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

  const handleUsuarioAtualizado = (novoUsuario: Usuario) => {
    setUsuarioLogado(novoUsuario);
    try {
      if (localStorage.getItem('usuario_extintores')) {
        localStorage.setItem('usuario_extintores', JSON.stringify(novoUsuario));
      }
      if (sessionStorage.getItem('usuario_extintores')) {
        sessionStorage.setItem('usuario_extintores', JSON.stringify(novoUsuario));
      }
    } catch (e) {
      console.error('Erro ao atualizar usuário no armazenamento local:', e);
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

  const usuarioLogadoId = usuarioLogado?.id;
  useEffect(() => {
    if (usuarioLogadoId) {
      carregarDados();
    }
  }, [usuarioLogadoId]);

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
      <div className="min-h-screen desktop-min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
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
    <div className={`min-h-screen desktop-min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
      temaEscuro
        ? 'bg-black text-zinc-100'
        : 'bg-[#e4e7ee] text-zinc-900'
    }`}>
      
      {/* SIDEBAR DESKTOP (Fixa no topo da tela, nunca rola para fora) */}
      <aside className={`hidden md:flex flex-col h-screen desktop-h-screen sticky top-0 border-r shrink-0 select-none overflow-visible transition-all duration-300 z-30 relative ${
        sidebarColapsada ? 'w-20' : 'w-72'
      } ${
        temaEscuro
          ? 'bg-[#0f0f12] border-zinc-800 text-zinc-100 shadow-2xl'
          : 'bg-white border-zinc-300 text-zinc-900 shadow-sm'
      }`}>
        {/* Botão de colapsar / expandir o menu na borda (metade de baixo do menu) */}
        <button
          onClick={alternarSidebar}
          className={`absolute -right-3.5 top-[65%] z-40 w-7 h-7 rounded-full border shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
            temaEscuro
              ? 'bg-[#18181c] border-zinc-750 text-zinc-300 hover:text-white hover:bg-zinc-800'
              : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
          title={sidebarColapsada ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
        >
          {sidebarColapsada ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Logo / Header com toggle simplificado de Dark Mode no topo */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          temaEscuro ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30 shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            {!sidebarColapsada && (
              <div className="min-w-0">
                <h1 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white leading-tight truncate">
                  Recarga de Extintores
                </h1>
                <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold uppercase tracking-wider truncate">
                  AVCB • Lafaiete e Região
                </p>
              </div>
            )}
          </div>

          {/* Toggle de Dark Mode Simplificado no Topo */}
          {!sidebarColapsada && (
            <button
              onClick={alternarTema}
              title={temaEscuro ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className={`p-2 rounded-xl transition cursor-pointer border shrink-0 ${
                temaEscuro
                  ? 'bg-zinc-900 text-amber-400 border-zinc-750 hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              {temaEscuro ? (
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          )}
        </div>

        {/* Links de Navegação */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {sidebarColapsada && (
            <button
              onClick={alternarTema}
              title={temaEscuro ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition cursor-pointer mb-2 border ${
                temaEscuro
                  ? 'bg-zinc-900 text-amber-400 border-zinc-750 hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              {temaEscuro ? (
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          )}

          <button
            onClick={() => setAbaAtiva('inicio')}
            title="Início"
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && <span className="whitespace-nowrap font-bold">Início</span>}
          </button>

          <button
            onClick={() => setAbaAtiva('pedidos')}
            title={`Pedidos (${pedidos.length})`}
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && (
              <>
                <span className="whitespace-nowrap font-bold">Pedidos</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  temaEscuro ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {pedidos.length}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva('clientes')}
            title={`Clientes (${clientes.length})`}
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && (
              <>
                <span className="whitespace-nowrap font-bold">Clientes</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  temaEscuro ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {clientes.length}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva('crm')}
            title="CRM & Vendas Futuras"
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
              abaAtiva === 'crm'
                ? temaEscuro
                  ? 'bg-red-950/60 text-red-300 border border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-red-50 text-red-700 shadow-2xs border border-red-200'
                : temaEscuro
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
            }`}
          >
            <TrendingUp className={`w-4 h-4 shrink-0 ${abaAtiva === 'crm' ? 'text-red-500' : 'text-zinc-400'}`} />
            {!sidebarColapsada && <span className="whitespace-nowrap font-bold">CRM & Vendas Futuras</span>}
          </button>

          <button
            onClick={() => setAbaAtiva('financeiro')}
            title="Financeiro"
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && <span className="whitespace-nowrap font-bold">Financeiro</span>}
          </button>

          <button
            onClick={() => setAbaAtiva('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && <span className="whitespace-nowrap font-bold">Dashboard</span>}
          </button>

          <button
            onClick={() => setAbaAtiva('produtos')}
            title="Produtos & Serviços"
            className={`w-full flex items-center ${sidebarColapsada ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-bold transition cursor-pointer ${
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
            {!sidebarColapsada && (
              <span className="whitespace-nowrap font-bold">Produtos & Serviços</span>
            )}
          </button>
        </nav>

        {/* ÁREA INFERIOR DA SIDEBAR (Sempre visível no rodapé, sem rolagem) */}
        <div className={`p-3 border-t shrink-0 ${temaEscuro ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'}`}>
          
          {sidebarColapsada ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setMinhaContaModalAberto(true)}
                className="relative group cursor-pointer"
                title={`Minha Conta (${usuarioLogado.nome})`}
              >
                {usuarioLogado.foto_url ? (
                  <img
                    src={usuarioLogado.foto_url}
                    alt={usuarioLogado.nome}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {usuarioLogado.nome.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                title="Sair do Sistema (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* CARD UNIFICADO: MINHA CONTA + LOGOUT EM UM ÚNICO ELEMENTO */
            <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 select-none ${
              temaEscuro
                ? 'bg-zinc-950/70 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-900 shadow-2xs'
            }`}>
              <button
                onClick={() => setMinhaContaModalAberto(true)}
                className="flex items-center gap-2.5 min-w-0 flex-1 p-1 -m-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition text-left cursor-pointer group"
                title="Abrir Minha Conta (Editar foto, nome e senha)"
              >
                {usuarioLogado.foto_url ? (
                  <img
                    src={usuarioLogado.foto_url}
                    alt={usuarioLogado.nome}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-red-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm border border-red-400/30">
                    {usuarioLogado.nome.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight group-hover:text-red-500 transition-colors" title={usuarioLogado.nome}>
                    {usuarioLogado.nome}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    Minha Conta
                  </p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
                title="Sair do Sistema (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Status de Sincronização */}
          <div className={`flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 px-1 ${sidebarColapsada ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-1.5" title={loading ? 'Sincronizando dados...' : 'Sincronizado com o banco de dados'}>
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></span>
              {!sidebarColapsada && <span>{loading ? 'Sincronizando...' : 'Sincronizado'}</span>}
            </div>
            {!sidebarColapsada && (
              <button
                onClick={carregarDados}
                title="Atualizar dados"
                className="p-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAbaAtiva('inicio')}
            title="Ir para o Início"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              abaAtiva === 'inicio'
                ? 'bg-red-600 text-white shadow-sm'
                : temaEscuro
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            <HomeIcon className="w-4 h-4" />
            <span>Início</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (Expansão dinâmica total quando o menu lateral é colapsado) */}
      <main className={`flex-1 w-full pb-24 md:pb-8 transition-all duration-300 ${
        sidebarColapsada 
          ? 'max-w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6' 
          : 'max-w-[1440px] px-3 sm:px-6 lg:px-8 py-3 sm:py-6 mx-auto'
      }`}>
        
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
            pedidos={pedidos}
            clientes={clientes}
            produtos={produtos}
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

      {/* BOTÃO FLUTUANTE (FAB) MOBILE - Apenas em Pedidos e Clientes */}
      {(abaAtiva === 'pedidos' || abaAtiva === 'clientes') && (
        <button
          onClick={() => {
            if (abaAtiva === 'clientes') {
              setClienteParaEditar(null);
              setClienteModalAberto(true);
            } else {
              setPedidoParaEditar(null);
              setClienteInicialParaPedido(null);
              setPedidoModalAberto(true);
            }
          }}
          className="md:hidden fixed bottom-22 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-xl shadow-red-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/20"
          title={abaAtiva === 'clientes' ? 'Novo Cliente' : 'Novo Pedido'}
          aria-label={abaAtiva === 'clientes' ? 'Novo Cliente' : 'Novo Pedido'}
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* BOTTOM NAVIGATION MOBILE (ESTILO PLACAFY COM PEDIDOS CENTRALIZADO E DESTACADO) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 py-2 min-h-[64px] border-t transition-colors duration-200 items-end ${
        temaEscuro
          ? 'bg-[#0f0f12]/95 border-zinc-800 text-zinc-400 backdrop-blur-md'
          : 'bg-white border-zinc-300 text-zinc-600 shadow-lg'
      }`}>
        {/* 1. CRM */}
        <button
          onClick={() => setAbaAtiva('crm')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer ${
            abaAtiva === 'crm' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-semibold">CRM</span>
        </button>

        {/* 2. Clientes */}
        <button
          onClick={() => setAbaAtiva('clientes')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer ${
            abaAtiva === 'clientes' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Clientes</span>
        </button>

        {/* 3. Pedidos (DESTAQUE CENTRAL ELEVADO ESTILO PLACAFY) */}
        <button
          onClick={() => setAbaAtiva('pedidos')}
          className="flex flex-col items-center justify-center -mt-6 transition cursor-pointer group"
          title="Ordens de Serviço e Pedidos"
        >
          <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-95 border-4 ${
            temaEscuro
              ? 'border-[#0f0f12] bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-950/60'
              : 'border-white bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-600/40'
          } ${
            abaAtiva === 'pedidos' ? 'ring-2 ring-red-500 scale-105 shadow-xl' : ''
          }`}>
            <FileEdit className="w-6 h-6 text-white" />
          </div>
          <span className={`text-[10px] font-bold mt-0.5 ${
            abaAtiva === 'pedidos' ? 'text-red-600 dark:text-red-400 font-black' : 'text-zinc-700 dark:text-zinc-300'
          }`}>
            Pedidos
          </span>
        </button>

        {/* 4. Financeiro */}
        <button
          onClick={() => setAbaAtiva('financeiro')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer ${
            abaAtiva === 'financeiro' ? 'text-red-600 dark:text-red-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Financeiro</span>
        </button>

        {/* 5. Menu */}
        <button
          onClick={() => setMenuMobileAberto(true)}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer ${
            menuMobileAberto || abaAtiva === 'produtos' || abaAtiva === 'dashboard'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      </nav>

      {/* MENU LATERAL MOBILE (DRAWER DIREITO COM TRANSIÇÃO SUAVE) */}
      <div 
        className={`fixed inset-0 z-50 md:hidden flex justify-end transition-all duration-300 ${
          menuMobileAberto ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop animado com fade */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            menuMobileAberto ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuMobileAberto(false)}
        />
        
        {/* Drawer Content com slide lateral suave da direita */}
        <div className={`relative w-[85%] max-w-sm h-full flex flex-col z-10 shadow-2xl border-l transition-transform duration-300 ease-out transform ${
          menuMobileAberto ? 'translate-x-0' : 'translate-x-full'
        } ${
          temaEscuro
            ? 'bg-[#0f0f12] text-zinc-100 border-zinc-800'
            : 'bg-white text-zinc-900 border-zinc-200'
        }`}>
            {/* Drawer Header with user info and close */}
            <div className={`p-4 border-b flex items-center justify-between ${
              temaEscuro ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div className="flex items-center gap-3 overflow-hidden">
                {usuarioLogado.foto_url ? (
                  <img
                    src={usuarioLogado.foto_url}
                    alt={usuarioLogado.nome}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                    {usuarioLogado.nome.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold truncate leading-tight">{usuarioLogado.nome}</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{usuarioLogado.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMenuMobileAberto(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1">Navegação & Módulos</p>
              
              {/* 1. Início */}
              <button
                onClick={() => { setAbaAtiva('inicio'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'inicio'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <HomeIcon className="w-4 h-4 text-zinc-400" />
                <span>Início</span>
              </button>

              {/* 2. Pedidos */}
              <button
                onClick={() => { setAbaAtiva('pedidos'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'pedidos'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileEdit className="w-4 h-4 text-zinc-400" />
                  <span>Pedidos</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {pedidos.length}
                </span>
              </button>

              {/* 3. Clientes */}
              <button
                onClick={() => { setAbaAtiva('clientes'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'clientes'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>Clientes</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {clientes.length}
                </span>
              </button>

              {/* 4. CRM & Vendas Futuras */}
              <button
                onClick={() => { setAbaAtiva('crm'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'crm'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <span>CRM & Vendas Futuras</span>
              </button>

              {/* 5. Financeiro */}
              <button
                onClick={() => { setAbaAtiva('financeiro'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'financeiro'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <DollarSign className="w-4 h-4 text-zinc-400" />
                <span>Financeiro</span>
              </button>

              {/* 6. Dashboard */}
              <button
                onClick={() => { setAbaAtiva('dashboard'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'dashboard'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                <span>Dashboard</span>
              </button>

              {/* 7. Produtos & Serviços (no final e sem número) */}
              <button
                onClick={() => { setAbaAtiva('produtos'); setMenuMobileAberto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  abaAtiva === 'produtos'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Package className="w-4 h-4 text-zinc-400" />
                <span>Produtos & Serviços</span>
              </button>
            </div>

            {/* Drawer Footer */}
            <div className={`p-4 border-t space-y-2.5 ${
              temaEscuro ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
            }`}>
              {/* Toggle Dark Mode */}
              <button
                onClick={alternarTema}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  temaEscuro
                    ? 'bg-zinc-900 text-amber-400 border-zinc-700'
                    : 'bg-white text-zinc-700 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {temaEscuro ? (
                    <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  )}
                  <span>{temaEscuro ? 'Modo Escuro' : 'Modo Claro'}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {temaEscuro ? 'DARK' : 'LIGHT'}
                </span>
              </button>

              {/* Minha Conta (entre Dark Mode e Logout) */}
              <button
                onClick={() => {
                  setMenuMobileAberto(false);
                  setMinhaContaModalAberto(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  temaEscuro
                    ? 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                    : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  <span>Minha Conta</span>
                </div>
                <span className="text-[10px] text-zinc-400">Editar</span>
              </button>

              {/* Logout (último, lá embaixo) */}
              <button
                onClick={() => {
                  setMenuMobileAberto(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 transition cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta (Logout)</span>
              </button>
            </div>
          </div>
        </div>

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

      {minhaContaModalAberto && usuarioLogado && (
        <MinhaContaModal
          isOpen={minhaContaModalAberto}
          onClose={() => setMinhaContaModalAberto(false)}
          usuario={usuarioLogado}
          onUsuarioAtualizado={handleUsuarioAtualizado}
        />
      )}

    </div>
  );
}
