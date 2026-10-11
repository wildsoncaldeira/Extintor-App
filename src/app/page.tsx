'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, Cliente, ProdutoServico, CategoriaProduto, DashboardStats } from '@/lib/types';
import { getPedidos, getClientes, getProdutos, getCategorias, getDashboardStats, getPedidoDetalhes } from '@/lib/actions';
import { PedidosView } from '@/components/PedidosView';
import { ClientesView } from '@/components/ClientesView';
import { ProdutosView } from '@/components/ProdutosView';
import { DashboardView } from '@/components/DashboardView';
import { PedidoModal } from '@/components/PedidoModal';
import { ClienteModal } from '@/components/ClienteModal';
import { ClienteDetalhesModal } from '@/components/ClienteDetalhesModal';
import { ProdutoModal } from '@/components/ProdutoModal';
import { ReciboModal } from '@/components/ReciboModal';
import { StatusModal } from '@/components/StatusModal';
import { CategoriasModal } from '@/components/CategoriasModal';
import { downloadPedidoPdf } from '@/lib/pdfGenerator';
import { 
  Flame, 
  FileEdit, 
  Users, 
  Package, 
  LayoutDashboard, 
  Plus, 
  RefreshCw,
} from 'lucide-react';

type AbaAtiva = 'pedidos' | 'clientes' | 'produtos' | 'dashboard';

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('pedidos');
  const [loading, setLoading] = useState(true);

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
    carregarDados();
  }, []);

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

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row text-zinc-900">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 shrink-0 select-none">
        {/* Logo / Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-900 leading-tight">
              Recarga de Extintores
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              AVCB • Lafaiete e Região
            </p>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="p-3 space-y-1 flex-1">
          <button
            onClick={() => setAbaAtiva('pedidos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition ${
              abaAtiva === 'pedidos'
                ? 'bg-red-50 text-red-700 shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <FileEdit className="w-4 h-4 text-red-600" />
            <span>Pedidos</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              {pedidos.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('clientes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition ${
              abaAtiva === 'clientes'
                ? 'bg-red-50 text-red-700 shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4 text-zinc-500" />
            <span>Clientes</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              {clientes.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('produtos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition ${
              abaAtiva === 'produtos'
                ? 'bg-red-50 text-red-700 shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <Package className="w-4 h-4 text-zinc-500" />
            <span>Produtos & Serviços</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              {produtos.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition ${
              abaAtiva === 'dashboard'
                ? 'bg-red-50 text-red-700 shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-zinc-500" />
            <span>Dashboard</span>
          </button>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Neon Postgres Conectado</span>
          </div>
          <button
            onClick={carregarDados}
            title="Atualizar dados"
            className="p-1 text-zinc-400 hover:text-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-zinc-200 p-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-2xs">
            <Flame className="w-5 h-5" />
          </div>
          <span className="font-black text-sm text-zinc-900">
            Recarga de Extintores
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            className="p-1.5 bg-red-600 text-white rounded-lg shadow-2xs hover:bg-red-700 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
        
        {/* Barra de Título Superior */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight capitalize">
              {abaAtiva === 'pedidos' && 'Ordens de Serviço / Pedidos'}
              {abaAtiva === 'clientes' && 'Gestão de Clientes'}
              {abaAtiva === 'produtos' && 'Catálogo de Produtos & Serviços'}
              {abaAtiva === 'dashboard' && 'Painel de Desempenho & Faturamento'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mário Luiz Gomes da Silva • Execução de Projetos AVCB
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarDados}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg shadow-2xs transition"
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

        {/* Visualização de cada Aba */}
        {abaAtiva === 'pedidos' && (
          <PedidosView
            pedidos={pedidos}
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

        {abaAtiva === 'dashboard' && (
          <DashboardView
            stats={stats}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40 grid grid-cols-4 py-2">
        <button
          onClick={() => setAbaAtiva('pedidos')}
          className={`flex flex-col items-center justify-center gap-1 ${
            abaAtiva === 'pedidos' ? 'text-red-600 font-bold' : 'text-zinc-500'
          }`}
        >
          <FileEdit className="w-5 h-5" />
          <span className="text-[10px]">Pedidos</span>
        </button>

        <button
          onClick={() => setAbaAtiva('clientes')}
          className={`flex flex-col items-center justify-center gap-1 ${
            abaAtiva === 'clientes' ? 'text-red-600 font-bold' : 'text-zinc-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setAbaAtiva('produtos')}
          className={`flex flex-col items-center justify-center gap-1 ${
            abaAtiva === 'produtos' ? 'text-red-600 font-bold' : 'text-zinc-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Produtos</span>
        </button>

        <button
          onClick={() => setAbaAtiva('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 ${
            abaAtiva === 'dashboard' ? 'text-red-600 font-bold' : 'text-zinc-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>
      </nav>

      {/* MODAIS GLOBAIS */}
      {pedidoModalAberto && (
        <PedidoModal
          pedidoParaEditar={pedidoParaEditar}
          clientes={clientes}
          produtos={produtos}
          onClose={() => {
            setPedidoModalAberto(false);
            setPedidoParaEditar(null);
          }}
          onSaved={async () => {
            setPedidoModalAberto(false);
            setPedidoParaEditar(null);
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
          zIndexClass={ultimoModalAberto === 'recibo' ? 'z-[70]' : 'z-50'}
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
          zIndexClass={ultimoModalAberto === 'cliente' ? 'z-[70]' : 'z-50'}
          onClose={() => {
            setClienteDetalhesAberto(false);
            setClienteParaDetalhes(null);
          }}
          onEditarCliente={(c) => {
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
