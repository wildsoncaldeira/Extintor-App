'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cliente, ProdutoServico, Pedido, StatusPedido } from '@/lib/types';
import { createPedido, updatePedido, getProximoNumeroPedido, agendarVendaFutura } from '@/lib/actions';
import { X, Plus, Trash2, Search, Check, AlertCircle, ChevronDown, Calendar, Tag } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { VendaFuturaModal } from './VendaFuturaModal';

interface PedidoModalProps {
  pedidoParaEditar?: Pedido | null;
  clientes: Cliente[];
  produtos: ProdutoServico[];
  onClose: () => void;
  onSaved: () => void;
  onOpenNovoCliente?: () => void;
  clienteInicialId?: string;
  clienteInicialNome?: string;
}

interface ItemForm {
  produto_id: string;
  descricao_item: string;
  tipo_kg?: string;
  quantidade: number;
  valor_unitario: number;
}

// 1. SELETOR DE ITEM COM BUSCA INSTANTÂNEA
function ProdutoItemPicker({
  produtos,
  produtoIdSelecionado,
  onSelect,
}: {
  produtos: ProdutoServico[];
  produtoIdSelecionado: string;
  onSelect: (produto: ProdutoServico) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const produtoSelecionado = produtos.find((p) => p.id === produtoIdSelecionado);

  const filtrados = produtos.filter((p) => {
    const termo = busca.toLowerCase();
    return (
      p.descricao.toLowerCase().includes(termo) ||
      (p.tipo_kg && p.tipo_kg.toLowerCase().includes(termo)) ||
      (p.nome_categoria && p.nome_categoria.toLowerCase().includes(termo))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputBuscaRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [aberto]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full min-w-0 text-left px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white flex items-center justify-between gap-2 hover:border-red-400 focus:ring-1 focus:ring-red-500 transition cursor-pointer shadow-2xs"
      >
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words whitespace-normal leading-tight flex-1">
          {produtoSelecionado ? (
            <>
              <span>{produtoSelecionado.descricao}</span>
              {produtoSelecionado.tipo_kg && (
                <span className="text-zinc-500 dark:text-zinc-400 font-normal"> ({produtoSelecionado.tipo_kg})</span>
              )}
              <span className="text-red-600 dark:text-red-400 font-bold ml-1">
                • R$ {Number(produtoSelecionado.valor_unitario_padrao).toFixed(2).replace('.', ',')}
              </span>
            </>
          ) : (
            <span className="text-zinc-400">Selecione um produto ou serviço...</span>
          )}
        </span>
        <div className="flex items-center gap-1 text-zinc-400 shrink-0 self-center">
          <Search className="w-3.5 h-3.5" />
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {aberto && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:min-w-[380px] max-w-md bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
          {/* Campo de Busca Rápida */}
          <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              ref={inputBuscaRef}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar item por nome, tipo/kg ou categoria..."
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista com scroll rápido */}
          <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 flex-1">
            {filtrados.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Nenhum produto ou serviço encontrado para &quot;{busca}&quot;.
              </div>
            ) : (
              filtrados.map((p) => {
                const ativo = p.id === produtoIdSelecionado;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      setAberto(false);
                      setBusca('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      ativo
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate font-semibold">{p.descricao}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        {p.tipo_kg && (
                          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono font-bold">
                            {p.tipo_kg}
                          </span>
                        )}
                        {p.nome_categoria && (
                          <span className="flex items-center gap-0.5 text-zinc-500 dark:text-zinc-400">
                            <Tag className="w-2.5 h-2.5" /> {p.nome_categoria}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-black text-zinc-900 dark:text-white">
                      R$ {Number(p.valor_unitario_padrao).toFixed(2).replace('.', ',')}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PedidoModal({
  pedidoParaEditar,
  clientes,
  produtos,
  onClose,
  onSaved,
  onOpenNovoCliente,
  clienteInicialId,
  clienteInicialNome,
}: PedidoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos do Pedido
  const [proximoNumero, setProximoNumero] = useState<number>(1281);
  const [clienteId, setClienteId] = useState<string>(pedidoParaEditar?.cliente_id || clienteInicialId || '');
  const [clienteBusca, setClienteBusca] = useState<string>(clienteInicialNome || '');
  const [clienteDropdownAberto, setClienteDropdownAberto] = useState(false);

  // Datas: Pedido e Entrega
  const [dataPedido, setDataPedido] = useState<string>(
    pedidoParaEditar?.data_pedido || new Date().toISOString().split('T')[0]
  );
  const [dataEntrega, setDataEntrega] = useState<string>(
    pedidoParaEditar?.data_entrega || pedidoParaEditar?.data_pedido || new Date().toISOString().split('T')[0]
  );

  const [status, setStatus] = useState<StatusPedido>(pedidoParaEditar?.status || 'Orçamento');
  const [observacoes, setObservacoes] = useState<string>(pedidoParaEditar?.observacoes || '');

  // Desconto
  const [descontoTipo, setDescontoTipo] = useState<'reais' | 'porcentagem'>(
    (pedidoParaEditar?.desconto_tipo as any) || 'reais'
  );
  const [descontoValor, setDescontoValor] = useState<number>(
    Number(pedidoParaEditar?.desconto_valor) || 0
  );

  // Itens do Pedido
  const [itens, setItens] = useState<ItemForm[]>([]);

  // Modal de Venda Futura (ao aprovar)
  const [vendaFuturaAberta, setVendaFuturaAberta] = useState(false);
  const [pedidoSalvoInfo, setPedidoSalvoInfo] = useState<{ id: string; numero: number; clienteNome: string } | null>(null);

  useEffect(() => {
    if (!pedidoParaEditar) {
      getProximoNumeroPedido().then(setProximoNumero);
      setDescontoTipo('reais');
      setDescontoValor(0);
      const hoje = new Date().toISOString().split('T')[0];
      setDataPedido(hoje);
      setDataEntrega(hoje);
      if (clienteInicialId) {
        setClienteId(clienteInicialId);
        const cli = clientes.find((c) => c.id === clienteInicialId || c.legacy_id === clienteInicialId);
        if (cli) {
          setClienteBusca(cli.nome_empresa);
        } else if (clienteInicialNome) {
          setClienteBusca(clienteInicialNome);
        }
      }
    } else {
      setProximoNumero(pedidoParaEditar.numero_pedido);
      setDescontoTipo((pedidoParaEditar.desconto_tipo as any) || 'reais');
      setDescontoValor(Number(pedidoParaEditar.desconto_valor) || 0);
      setDataPedido(pedidoParaEditar.data_pedido);
      setDataEntrega(pedidoParaEditar.data_entrega || pedidoParaEditar.data_pedido);
      const cli = clientes.find((c) => c.id === pedidoParaEditar.cliente_id);
      if (cli) {
        setClienteBusca(cli.nome_empresa);
      }
      if (pedidoParaEditar.itens) {
        setItens(
          pedidoParaEditar.itens.map((it) => ({
            produto_id: it.produto_id || '',
            descricao_item: it.descricao_item || '',
            tipo_kg: it.tipo_kg || undefined,
            quantidade: Number(it.quantidade) || 1,
            valor_unitario: Number(it.valor_unitario) || 0,
          }))
        );
      }
    }
  }, [pedidoParaEditar, clientes, clienteInicialId, clienteInicialNome]);

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome_empresa.toLowerCase().includes(clienteBusca.toLowerCase()) ||
      (c.nome_contato && c.nome_contato.toLowerCase().includes(clienteBusca.toLowerCase())) ||
      (c.cidade && c.cidade.toLowerCase().includes(clienteBusca.toLowerCase()))
  );

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  const adicionarItem = () => {
    if (produtos.length === 0) return;
    const primeiro = produtos[0];
    setItens([
      ...itens,
      {
        produto_id: primeiro.id,
        descricao_item: primeiro.descricao,
        tipo_kg: primeiro.tipo_kg || undefined,
        quantidade: 1,
        valor_unitario: Number(primeiro.valor_unitario_padrao) || 0,
      },
    ]);
  };

  const atualizarItem = (index: number, campo: keyof ItemForm, valor: any) => {
    const novos = [...itens];
    novos[index] = { ...novos[index], [campo]: valor };

    if (campo === 'produto_id') {
      const prod = produtos.find((p) => p.id === valor);
      if (prod) {
        novos[index].descricao_item = prod.descricao;
        novos[index].tipo_kg = prod.tipo_kg || undefined;
        novos[index].valor_unitario = Number(prod.valor_unitario_padrao) || 0;
      }
    }

    setItens(novos);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const subtotalCalculado = itens.reduce((acc, it) => acc + (it.quantidade * it.valor_unitario), 0);
  const descontoEmReais = descontoTipo === 'porcentagem'
    ? (subtotalCalculado * (Number(descontoValor) / 100))
    : Number(descontoValor);
  const valorTotalCalculado = Math.max(0, subtotalCalculado - descontoEmReais);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setError('Por favor, selecione um cliente.');
      return;
    }
    if (itens.length === 0) {
      setError('Adicione pelo menos um produto ou serviço ao pedido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let pedidoIdFinal = '';
      const itensValidados = itens.map((it) => ({
        ...it,
        quantidade: Math.max(1, Number(it.quantidade) || 1),
      }));

      if (pedidoParaEditar) {
        const res = await updatePedido(pedidoParaEditar.id, {
          cliente_id: clienteId,
          data_pedido: dataPedido,
          data_entrega: dataEntrega || dataPedido,
          status,
          observacoes,
          desconto_tipo: descontoTipo,
          desconto_valor: Number(descontoValor),
          itens: itensValidados,
        });
        if (!res.success) throw new Error(res.error);
        pedidoIdFinal = pedidoParaEditar.id;
      } else {
        const res = await createPedido({
          cliente_id: clienteId,
          data_pedido: dataPedido,
          data_entrega: dataEntrega || dataPedido,
          status,
          observacoes,
          desconto_tipo: descontoTipo,
          desconto_valor: Number(descontoValor),
          itens: itensValidados,
        });
        if (!res.success) throw new Error(res.error);
        pedidoIdFinal = res.id || '';
      }

      // Se o pedido foi salvo/definido como APROVADO, abre modal de Venda Futura (1 ano)
      if (status === 'Aprovado') {
        setPedidoSalvoInfo({
          id: pedidoIdFinal,
          numero: proximoNumero,
          clienteNome: clienteSelecionado?.nome_empresa || 'Cliente',
        });
        setVendaFuturaAberta(true);
      } else {
        onSaved();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarVendaFutura = async (dataFutura: string) => {
    if (pedidoSalvoInfo?.id) {
      await agendarVendaFutura(pedidoSalvoInfo.id, dataFutura);
    }
    setVendaFuturaAberta(false);
    onSaved();
  };

  const handleIgnorarVendaFutura = () => {
    setVendaFuturaAberta(false);
    onSaved();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {pedidoParaEditar ? `Editar Pedido #${proximoNumero}` : 'Novo Pedido / Ordem de Serviço'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Número do Pedido: <strong className="text-red-700 dark:text-red-400">#{proximoNumero}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Seletor de Cliente */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Cliente *
                </label>
                {onOpenNovoCliente && (
                  <button
                    type="button"
                    onClick={onOpenNovoCliente}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo Cliente
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por razão social, contato ou cidade..."
                  value={clienteBusca}
                  onChange={(e) => {
                    setClienteBusca(e.target.value);
                    setClienteDropdownAberto(true);
                  }}
                  onFocus={() => setClienteDropdownAberto(true)}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                {clienteId && (
                  <span className="absolute right-3 top-2.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Selecionado
                  </span>
                )}
              </div>

              {clienteDropdownAberto && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl divide-y divide-zinc-100 dark:divide-zinc-800">
                  {clientesFiltrados.map((cli) => (
                    <button
                      key={cli.id}
                      type="button"
                      onClick={() => {
                        setClienteId(cli.id);
                        setClienteBusca(cli.nome_empresa);
                        setClienteDropdownAberto(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-zinc-900 text-xs flex justify-between items-center transition cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{cli.nome_empresa}</p>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {cli.nome_contato ? `${cli.nome_contato} • ` : ''}
                          {cli.cidade || 'Conselheiro Lafaiete'}
                        </p>
                      </div>
                      {cli.telefone_whatsapp && (
                        <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">{cli.telefone_whatsapp}</span>
                      )}
                    </button>
                  ))}
                  {clientesFiltrados.length === 0 && (
                    <div className="p-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Nenhum cliente encontrado com este nome.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linha com Data do Pedido, Data de Entrega e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
              {/* Data do Pedido */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Data do Pedido</span>
                </label>
                <input
                  type="date"
                  value={dataPedido}
                  onChange={(e) => {
                    const nova = e.target.value;
                    setDataPedido(nova);
                    // Se a entrega era igual ao pedido, acompanha automaticamente
                    if (dataEntrega === dataPedido) {
                      setDataEntrega(nova);
                    }
                  }}
                  className="w-full min-w-0 max-w-full box-border px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-950 dark:text-white font-medium"
                />
              </div>

              {/* Data de Entrega (Requisito 3) */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Data de Entrega</span>
                </label>
                <input
                  type="date"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  className="w-full min-w-0 max-w-full box-border px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs dark:bg-zinc-950 dark:text-white font-medium"
                />
              </div>

              {/* Status do Pedido */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Orçamento', 'Aprovado', 'Pago'] as StatusPedido[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition cursor-pointer text-center ${
                        status === st
                          ? st === 'Orçamento'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : st === 'Aprovado'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {st === 'Orçamento' ? 'Orçamento' : st === 'Aprovado' ? 'Aprovado' : 'Pago'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção de Itens do Pedido (Requisito 1: Busca no seletor) */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/70 dark:bg-zinc-950/70">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Itens do Pedido ({itens.length})
                </h3>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg shadow-md shadow-red-900/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </button>
              </div>

              {itens.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 text-xs">
                  Nenhum item adicionado ainda. Clique em &quot;+ Adicionar Item&quot; para incluir produtos ou recargas.
                </div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-zinc-900 p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col lg:flex-row gap-2.5 lg:items-center"
                    >
                      {/* Produto com Seletor Buscável (Quebra texto longo sem empurrar colunas) */}
                      <div className="flex-1 min-w-0 w-full">
                        <ProdutoItemPicker
                          produtos={produtos}
                          produtoIdSelecionado={item.produto_id}
                          onSelect={(p) => {
                            atualizarItem(idx, 'produto_id', p.id);
                          }}
                        />
                      </div>

                      {/* Controles de Quantidade, Preço Unitário, Subtotal e Excluir */}
                      <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
                        {/* Grupo de Qtd e Unit */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quantidade */}
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Qtd:</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantidade === 0 ? '' : item.quantidade}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  atualizarItem(idx, 'quantidade', 0);
                                } else {
                                  const parsed = parseInt(val, 10);
                                  if (!isNaN(parsed)) {
                                    atualizarItem(idx, 'quantidade', Math.max(0, parsed));
                                  }
                                }
                              }}
                              onBlur={() => {
                                if (!item.quantidade || item.quantidade < 1) {
                                  atualizarItem(idx, 'quantidade', 1);
                                }
                              }}
                              className="w-12 sm:w-14 px-1.5 py-1.5 text-xs text-center border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-red-500 outline-none dark:bg-zinc-950 dark:text-white font-bold"
                            />
                          </div>

                          {/* Valor Unitário */}
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Unit:</label>
                            <div className="w-20 sm:w-24">
                              <CurrencyInput
                                value={item.valor_unitario}
                                onChange={(val) => atualizarItem(idx, 'valor_unitario', val)}
                                prefix=""
                                className="py-1 px-1.5 text-xs text-right font-semibold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Subtotal do Item e Excluir */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="block text-[9px] uppercase text-zinc-400 font-semibold lg:hidden">Subtotal</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white font-mono whitespace-nowrap">
                              R$ {(item.quantidade * item.valor_unitario).toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          {/* Excluir inline */}
                          <button
                            type="button"
                            onClick={() => removerItem(idx)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer shrink-0"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal, Campo de Desconto e Valor Final */}
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                {/* Linha do Subtotal */}
                <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider">Subtotal dos Itens:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    R$ {subtotalCalculado.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Bloco de Desconto (largura pela metade e alinhado à direita) */}
                <div className="w-full sm:w-1/2 ml-auto p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Desconto Especial
                    </label>

                    {/* Seletor R$ ou % */}
                    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-950 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDescontoTipo('reais')}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                          descontoTipo === 'reais'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescontoTipo('porcentagem')}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                          descontoTipo === 'porcentagem'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {descontoTipo === 'reais' ? (
                        <CurrencyInput
                          value={descontoValor}
                          onChange={setDescontoValor}
                          className="font-bold text-red-600 dark:text-red-400 text-xs py-1.5"
                        />
                      ) : (
                        <div className="relative flex items-center w-full">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={descontoValor}
                            onChange={(e) => setDescontoValor(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                            className="w-full pl-2.5 pr-7 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-zinc-950 dark:text-white font-bold text-red-600 dark:text-red-400"
                          />
                          <span className="absolute right-2.5 text-xs font-bold text-zinc-400">%</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                      {descontoEmReais > 0 ? (
                        <span>
                          Economia:{' '}
                          <strong className="text-red-600 dark:text-red-400 font-bold block">
                            - R$ {descontoEmReais.toFixed(2).replace('.', ',')}
                          </strong>
                        </span>
                      ) : (
                        <span>Sem desconto</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Final do Pedido */}
                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 block">
                      Valor Final do Pedido:
                    </span>
                    {descontoEmReais > 0 && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 line-through">
                        de R$ {subtotalCalculado.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-red-700 dark:text-red-400">
                      R$ {valorTotalCalculado.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Observações (Constam no Recibo impresso)
              </label>
              <textarea
                rows={3}
                placeholder="Digite observações sobre o serviço, prazos, condições especiais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs leading-relaxed dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
            </div>

            {/* Botões Salvar e Cancelar */}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg shadow-lg shadow-red-900/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Salvando...' : 'Salvar Pedido'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Modal de Venda Futura (Requisito 5) */}
      {vendaFuturaAberta && pedidoSalvoInfo && (
        <VendaFuturaModal
          isOpen={vendaFuturaAberta}
          pedidoId={pedidoSalvoInfo.id}
          numeroPedido={pedidoSalvoInfo.numero}
          clienteNome={pedidoSalvoInfo.clienteNome}
          dataEntrega={dataEntrega}
          onSalvar={handleSalvarVendaFutura}
          onIgnorar={handleIgnorarVendaFutura}
        />
      )}
    </>
  );
}
