'use client';

import React, { useState, useEffect } from 'react';
import { Despesa, CategoriaDespesa } from '@/lib/types';
import { createDespesa, updateDespesa } from '@/lib/actions';
import { CurrencyInput } from './CurrencyInput';
import { X, Receipt, Calendar, Tag, FileText, Loader2, Plus, Settings } from 'lucide-react';

interface DespesaModalProps {
  despesaParaEditar?: Despesa | null;
  categorias: CategoriaDespesa[];
  onClose: () => void;
  onSalvo: () => void;
  onAbrirGerenciadorCategorias?: () => void;
}

export function DespesaModal({
  despesaParaEditar,
  categorias,
  onClose,
  onSalvo,
  onAbrirGerenciadorCategorias,
}: DespesaModalProps) {
  const [descricao, setDescricao] = useState(despesaParaEditar?.descricao || '');
  const [valor, setValor] = useState<number>(despesaParaEditar?.valor || 0);
  const [dataDespesa, setDataDespesa] = useState(
    despesaParaEditar?.data_despesa?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [categoriaId, setCategoriaId] = useState(despesaParaEditar?.categoria_id || '');
  const [observacoes, setObservacoes] = useState(despesaParaEditar?.observacoes || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!categoriaId && categorias.length > 0 && !despesaParaEditar) {
      setCategoriaId(categorias[0].id);
    }
  }, [categorias, categoriaId, despesaParaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErro('A descrição é obrigatória.');
      return;
    }
    if (valor <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      if (despesaParaEditar) {
        const res = await updateDespesa(despesaParaEditar.id, {
          descricao: descricao.trim(),
          valor,
          data_despesa: dataDespesa,
          categoria_id: categoriaId || undefined,
          observacoes: observacoes.trim() || undefined,
        });
        if (!res.success) {
          throw new Error(res.error || 'Erro ao atualizar despesa.');
        }
      } else {
        const res = await createDespesa({
          descricao: descricao.trim(),
          valor,
          data_despesa: dataDespesa,
          categoria_id: categoriaId || undefined,
          observacoes: observacoes.trim() || undefined,
        });
        if (!res.success) {
          throw new Error(res.error || 'Erro ao registrar despesa.');
        }
      }

      onSalvo();
    } catch (err: any) {
      console.error('Erro ao salvar despesa:', err);
      setErro(err?.message || 'Erro ao salvar despesa.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18181c] text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {despesaParaEditar ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {despesaParaEditar ? 'Atualize as informações do custo' : 'Registre custos operacionais ou compras'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 rounded-lg">
              {erro}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              placeholder="Ex: Abastecimento Fiat Strada, Compra de Pós Químicos, Almoço..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Valor e Data em 2 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Valor (R$) *
              </label>
              <CurrencyInput
                value={valor}
                onChange={setValor}
                className="w-full font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Data da Despesa *</span>
              </label>
              <input
                type="date"
                value={dataDespesa}
                onChange={(e) => setDataDespesa(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>Categoria</span>
              </label>
              {onAbrirGerenciadorCategorias && (
                <button
                  type="button"
                  onClick={onAbrirGerenciadorCategorias}
                  className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Gerenciar Categorias</span>
                </button>
              )}
            </div>

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 font-semibold"
            >
              <option value="">Sem Categoria (Outros)</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id} className="dark:bg-zinc-900">
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Observações (Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Número de nota fiscal, fornecedor, placa de veículo, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{despesaParaEditar ? 'Atualizar Despesa' : 'Salvar Despesa'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
