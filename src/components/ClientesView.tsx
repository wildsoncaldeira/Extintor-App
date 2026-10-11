'use client';

import React, { useState, useMemo } from 'react';
import { Cliente, Pedido, normalizarCidade } from '@/lib/types';
import { deleteCliente } from '@/lib/actions';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Search, SlidersHorizontal, Phone, MapPin, Edit, Trash2, Loader2 } from 'lucide-react';
import { FiltrosClientesModal, FiltrosClientes, FILTROS_CLIENTES_PADRAO } from './FiltrosClientesModal';

interface ClientesViewProps {
  clientes: Cliente[];
  pedidos?: Pedido[];
  onOpenNovoCliente?: () => void;
  onEditarCliente: (cliente: Cliente) => void;
  onVerCliente: (cliente: Cliente) => void;
  onRefresh: () => void;
}

export function ClientesView({
  clientes,
  pedidos = [],
  onOpenNovoCliente,
  onEditarCliente,
  onVerCliente,
  onRefresh,
}: ClientesViewProps) {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosClientes>(FILTROS_CLIENTES_PADRAO);
  const [filtrosModalAberto, setFiltrosModalAberto] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null);
  const [limiteExibicao, setLimiteExibicao] = useState(10);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setLimiteExibicao(10);
  }, [busca, filtros]);

  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach((c) => {
      if (c.cidade && c.cidade.trim()) {
        set.add(normalizarCidade(c.cidade));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clientes]);

  const clienteIdsComPedidos = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => {
      if (p.cliente_id) set.add(p.cliente_id);
    });
    return set;
  }, [pedidos]);

  const filtrosAtivosCount =
    (filtros.cidade !== 'Todas' ? 1 : 0) +
    (filtros.apenasComWhatsapp ? 1 : 0) +
    (filtros.apenasComCnpj ? 1 : 0) +
    (filtros.temPedidos !== 'todos' ? 1 : 0) +
    (filtros.ordenacao !== 'nome_asc' ? 1 : 0);

  const clientesFiltrados = useMemo(() => {
    return clientes
      .filter((c) => {
        const q = busca.toLowerCase().trim();
        const matchBusca =
          !q ||
          c.nome_empresa.toLowerCase().includes(q) ||
          (c.nome_contato && c.nome_contato.toLowerCase().includes(q)) ||
          (c.cidade && c.cidade.toLowerCase().includes(q)) ||
          (c.cnpj && c.cnpj.toLowerCase().includes(q));

        if (!matchBusca) return false;

        // Cidade (com normalização para garantir match perfeito)
        if (filtros.cidade !== 'Todas') {
          const cidadeCliente = normalizarCidade(c.cidade).toLowerCase();
          if (cidadeCliente !== filtros.cidade.toLowerCase()) {
            return false;
          }
        }

        // WhatsApp
        if (filtros.apenasComWhatsapp) {
          if (!c.telefone_whatsapp || c.telefone_whatsapp.trim() === '') {
            return false;
          }
        }

        // CNPJ
        if (filtros.apenasComCnpj) {
          if (!c.cnpj || c.cnpj.trim() === '') {
            return false;
          }
        }

        // Histórico de pedidos
        if (filtros.temPedidos !== 'todos') {
          const temPedido = clienteIdsComPedidos.has(c.id) || (c.legacy_id ? clienteIdsComPedidos.has(c.legacy_id) : false);
          if (filtros.temPedidos === 'com_pedidos' && !temPedido) return false;
          if (filtros.temPedidos === 'sem_pedidos' && temPedido) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filtros.ordenacao === 'nome_asc') {
          return a.nome_empresa.localeCompare(b.nome_empresa);
        }
        if (filtros.ordenacao === 'nome_desc') {
          return b.nome_empresa.localeCompare(a.nome_empresa);
        }
        if (filtros.ordenacao === 'cidade_asc') {
          return (a.cidade || '').localeCompare(b.cidade || '');
        }
        return 0;
      });
  }, [clientes, busca, filtros, clienteIdsComPedidos]);

  const clientesVisiveis = useMemo(() => {
    return clientesFiltrados.slice(0, limiteExibicao);
  }, [clientesFiltrados, limiteExibicao]);

  const temMais = limiteExibicao < clientesFiltrados.length;

  React.useEffect(() => {
    if (!sentinelRef.current || !temMais) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimiteExibicao((prev) => Math.min(prev + 10, clientesFiltrados.length));
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [temMais, clientesFiltrados.length]);

  const getWhatsAppUrl = (telefone?: string | null) => {
    if (!telefone) return '#';
    const cleanPhone = telefone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phone}`;
  };

  const getMapsUrl = (c: Cliente) => {
    const query = [c.endereco, c.cidade, c.uf, 'Brasil'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || c.nome_empresa)}`;
  };

  const handleExcluir = async (c: Cliente) => {
    if (confirm(`Deseja realmente excluir o cliente ${c.nome_empresa}?`)) {
      setLoadingAcao(c.id);
      const res = await deleteCliente(c.id);
      setLoadingAcao(null);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir cliente.');
      } else {
        onRefresh();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Botão Filtros */}
      <div className="bg-white dark:bg-zinc-900/90 dark:border-zinc-800 dark:shadow-2xl p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Clientes (empresa, contato, cidade, cnpj)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Botão Filtros (Substitui o botão Add) */}
          <button
            onClick={() => setFiltrosModalAberto(true)}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-sm transition shrink-0 border cursor-pointer ${
              filtrosAtivosCount > 0
                ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
            }`}
            title="Abrir opções de filtro"
          >
            <SlidersHorizontal className="w-4 h-4 text-current" />
            <span>Filtros</span>
            {filtrosAtivosCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                {filtrosAtivosCount}
              </span>
            )}
          </button>
        </div>

        {/* Badges de filtros ativos */}
        {filtrosAtivosCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Filtros ativos:</span>
            {filtros.cidade !== 'Todas' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80 rounded-md font-semibold">
                Cidade: {filtros.cidade}
              </span>
            )}
            {filtros.apenasComWhatsapp && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:border dark:border-zinc-800 rounded-md font-semibold">
                Com WhatsApp
              </span>
            )}
            {filtros.apenasComCnpj && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:border dark:border-zinc-800 rounded-md font-semibold">
                Com CNPJ
              </span>
            )}
            {filtros.temPedidos !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:border dark:border-zinc-800 rounded-md font-semibold">
                {filtros.temPedidos === 'com_pedidos' ? 'Com pedidos feitos' : 'Sem pedidos'}
              </span>
            )}
            {filtros.ordenacao !== 'nome_asc' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:border dark:border-zinc-800 rounded-md font-semibold">
                Ordem: {filtros.ordenacao === 'nome_desc' ? 'Nome (Z - A)' : 'Por Cidade'}
              </span>
            )}
            <button
              onClick={() => setFiltros(FILTROS_CLIENTES_PADRAO)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold ml-auto text-xs underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-zinc-900/90 dark:border-zinc-800 dark:shadow-2xl rounded-xl border border-zinc-200 shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          clientesVisiveis.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => onVerCliente(cliente)}
              className="p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
            >
              {/* Informações do Cliente */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition">
                    {cliente.nome_empresa}
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase sm:hidden">
                    {cliente.cidade || 'Conselheiro Lafaiete'}
                  </span>
                </div>

                {cliente.nome_contato && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {cliente.nome_contato}
                  </p>
                )}

                {cliente.endereco && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">
                    {cliente.endereco}
                  </p>
                )}
              </div>

              {/* Cidade no Desktop e Barra de Ações com Ícones */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase hidden sm:block mr-2">
                  {cliente.cidade || 'Conselheiro Lafaiete'}
                </span>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Ligar */}
                  {cliente.telefone_whatsapp && (
                    <a
                      href={`tel:${cliente.telefone_whatsapp.replace(/\D/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Ligar para o cliente"
                      className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-zinc-800 rounded-lg transition"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  {/* WhatsApp com Contorno Verde */}
                  {cliente.telefone_whatsapp && (
                    <a
                      href={getWhatsAppUrl(cliente.telefone_whatsapp)}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Conversar no WhatsApp"
                      className="p-1.5 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:bg-zinc-950 dark:border-emerald-500/80 dark:hover:bg-emerald-950/40 rounded-xl transition flex items-center justify-center bg-white shadow-2xs"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </a>
                  )}

                  {/* Google Maps / Localização */}
                  <a
                    href={getMapsUrl(cliente)}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver no Google Maps"
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>

                  {/* Editar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditarCliente(cliente);
                    }}
                    title="Editar cliente"
                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExcluir(cliente);
                    }}
                    title="Excluir cliente"
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Sentinela de Infinite Scroll (Carregamento de 10 em 10) */}
      {temMais && (
        <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 gap-1.5">
          <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
          <span>Carregando mais clientes ({clientesVisiveis.length} de {clientesFiltrados.length})...</span>
        </div>
      )}
      {!temMais && clientesFiltrados.length > 10 && (
        <div className="py-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Todos os {clientesFiltrados.length} clientes foram listados.
        </div>
      )}

      {/* Pop-up de Filtros de Clientes */}
      <FiltrosClientesModal
        isOpen={filtrosModalAberto}
        onClose={() => setFiltrosModalAberto(false)}
        cidadesDisponiveis={cidadesDisponiveis}
        filtrosAtuais={filtros}
        onAplicar={(novos) => setFiltros(novos)}
        onLimpar={() => setFiltros(FILTROS_CLIENTES_PADRAO)}
      />
    </div>
  );
}
