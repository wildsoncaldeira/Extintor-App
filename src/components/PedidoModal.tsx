'use client';

import React, { useState, useEffect } from 'react';
import { Cliente, ProdutoServico, Pedido, StatusPedido } from '@/lib/types';
import { createPedido, updatePedido, getProximoNumeroPedido } from '@/lib/actions';
import { X, Plus, Trash2, Search, Check, AlertCircle } from 'lucide-react';

interface PedidoModalProps {
  pedidoParaEditar?: Pedido | null;
  clientes: Cliente[];
  produtos: ProdutoServico[];
  onClose: () => void;
  onSaved: () => void;
  onOpenNovoCliente?: () => void;
}

interface ItemForm {
  produto_id: string;
  descricao_item: string;
  tipo_kg?: string;
  quantidade: number;
  valor_unitario: number;
}

export function PedidoModal({
  pedidoParaEditar,
  clientes,
  produtos,
  onClose,
  onSaved,
  onOpenNovoCliente,
}: PedidoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos do Pedido
  const [proximoNumero, setProximoNumero] = useState<number>(1281);
  const [clienteId, setClienteId] = useState<string>(pedidoParaEditar?.cliente_id || '');
  const [clienteBusca, setClienteBusca] = useState<string>('');
  const [clienteDropdownAberto, setClienteDropdownAberto] = useState(false);

  const [dataPedido, setDataPedido] = useState<string>(
    pedidoParaEditar?.data_pedido || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<StatusPedido>(pedidoParaEditar?.status || 'Orçamento');
  const [observacoes, setObservacoes] = useState<string>(pedidoParaEditar?.observacoes || '');

  // Itens do Pedido
  const [itens, setItens] = useState<ItemForm[]>([]);

  useEffect(() => {
    if (!pedidoParaEditar) {
      getProximoNumeroPedido().then(setProximoNumero);
    } else {
      setProximoNumero(pedidoParaEditar.numero_pedido);
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
  }, [pedidoParaEditar, clientes]);

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

  const valorTotalCalculado = itens.reduce((acc, it) => acc + (it.quantidade * it.valor_unitario), 0);

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
      if (pedidoParaEditar) {
        const res = await updatePedido(pedidoParaEditar.id, {
          cliente_id: clienteId,
          data_pedido: dataPedido,
          status,
          observacoes,
          itens,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createPedido({
          cliente_id: clienteId,
          data_pedido: dataPedido,
          status,
          observacoes,
          itens,
        });
        if (!res.success) throw new Error(res.error);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {pedidoParaEditar ? `Editar Pedido #${proximoNumero}` : 'Novo Pedido / Ordem de Serviço'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Número sugerido: <strong className="text-red-700 dark:text-red-400">#{proximoNumero}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seleção do Cliente com Busca */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Cliente <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              {onOpenNovoCliente && (
                <button
                  type="button"
                  onClick={onOpenNovoCliente}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Novo Cliente
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Digite para buscar empresa, contato ou cidade..."
                value={clienteBusca}
                onChange={(e) => {
                  setClienteBusca(e.target.value);
                  setClienteDropdownAberto(true);
                }}
                onFocus={() => setClienteDropdownAberto(true)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm outline-none bg-white dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
            </div>

            {clienteSelecionado && (
              <div className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{clienteSelecionado.nome_empresa}</span>
                  {clienteSelecionado.nome_contato && <span> • Contato: {clienteSelecionado.nome_contato}</span>}
                  {clienteSelecionado.cidade && <span> ({clienteSelecionado.cidade})</span>}
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <Check className="w-3.5 h-3.5" /> Selecionado
                </span>
              </div>
            )}

            {clienteDropdownAberto && (
              <div className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl divide-y divide-zinc-100 dark:divide-zinc-800">
                {clientesFiltrados.slice(0, 15).map((cli) => (
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

          {/* Linha com Data e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Data do Pedido
              </label>
              <input
                type="date"
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Status do Pedido
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Orçamento', 'Aprovado', 'Pago'] as StatusPedido[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      status === st
                        ? st === 'Orçamento'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : st === 'Aprovado'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {st === 'Orçamento' ? '🔴 Orçamento' : st === 'Aprovado' ? '🔵 Aprovado' : '🟢 Pago'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção de Itens do Pedido */}
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
                Nenhum item adicionado ainda. Clique em "+ Adicionar Item" para incluir produtos ou recargas.
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row gap-2.5 items-start sm:items-center"
                  >
                    {/* Produto select */}
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={item.produto_id}
                        onChange={(e) => atualizarItem(idx, 'produto_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 dark:text-white focus:ring-1 focus:ring-red-500 outline-none"
                      >
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id} className="dark:bg-zinc-900">
                            {p.descricao} {p.tipo_kg ? `(${p.tipo_kg})` : ''} - R$ {Number(p.valor_unitario_padrao).toFixed(2).replace('.', ',')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div className="w-24 flex items-center gap-1">
                      <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Qtd:</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(idx, 'quantidade', Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-2 py-1.5 text-xs text-center border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-red-500 outline-none dark:bg-zinc-950 dark:text-white"
                      />
                    </div>

                    {/* Valor Unitário */}
                    <div className="w-32 flex items-center gap-1">
                      <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Unit:</label>
                      <input
                        type="number"
                        step="0.5"
                        value={item.valor_unitario}
                        onChange={(e) => atualizarItem(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs text-right border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-red-500 outline-none dark:bg-zinc-950 dark:text-white"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-24 text-right font-bold text-zinc-800 dark:text-white text-xs">
                      R$ {(item.quantidade * item.valor_unitario).toFixed(2).replace('.', ',')}
                    </div>

                    {/* Excluir inline */}
                    <button
                      type="button"
                      onClick={() => removerItem(idx)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Geral da Caixa */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">Total do Pedido:</span>
              <span className="text-xl font-black text-red-700 dark:text-red-400">
                R$ {valorTotalCalculado.toFixed(2).replace('.', ',')}
              </span>
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
  );
}
