'use client';

import React, { useState } from 'react';
import { ProdutoServico, CategoriaProduto } from '@/lib/types';
import { createProduto, updateProduto } from '@/lib/actions';
import { X, AlertCircle } from 'lucide-react';

interface ProdutoModalProps {
  produtoParaEditar?: ProdutoServico | null;
  categorias: CategoriaProduto[];
  onClose: () => void;
  onSaved: () => void;
  onOpenGerenciarCategorias?: () => void;
}

export function ProdutoModal({
  produtoParaEditar,
  categorias,
  onClose,
  onSaved,
  onOpenGerenciarCategorias,
}: ProdutoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoriaId, setCategoriaId] = useState(produtoParaEditar?.categoria_id || (categorias[0]?.id || ''));
  const [descricao, setDescricao] = useState(produtoParaEditar?.descricao || '');
  const [tipoKg, setTipoKg] = useState(produtoParaEditar?.tipo_kg || '');
  const [valor, setValor] = useState(produtoParaEditar?.valor_unitario_padrao || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se a descrição estiver vazia, usa o nome da categoria selecionada
    const cat = categorias.find((c) => c.id === categoriaId);
    const descFinal = descricao.trim() || (cat ? cat.nome : '');

    if (!descFinal) {
      setError('Por favor, informe a descrição ou selecione uma categoria.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (produtoParaEditar) {
        const res = await updateProduto(produtoParaEditar.id, {
          descricao: descFinal,
          tipo_kg: tipoKg,
          valor_unitario_padrao: Number(valor),
          categoria_id: categoriaId || undefined,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createProduto({
          descricao: descFinal,
          tipo_kg: tipoKg,
          valor_unitario_padrao: Number(valor),
          categoria_id: categoriaId || undefined,
        });
        if (!res.success) throw new Error(res.error);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar produto.');
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
        className="relative w-full max-w-md bg-white text-zinc-900 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900">
            {produtoParaEditar ? 'Editar Produto / Serviço' : 'Novo Produto / Serviço'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Categoria do Produto */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Categoria do Produto <span className="text-red-600">*</span>
              </label>
              {onOpenGerenciarCategorias && (
                <button
                  type="button"
                  onClick={onOpenGerenciarCategorias}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                >
                  + Gerenciar
                </button>
              )}
            </div>

            <select
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value);
                const sel = categorias.find((c) => c.id === e.target.value);
                if (sel && !descricao) {
                  setDescricao(sel.nome);
                }
              }}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição opcional ou personalizada */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Descrição do Item (ou repete a categoria)
            </label>
            <input
              type="text"
              placeholder="Ex: EXTINTOR NOVO ABC, RECARGA CO2..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* Produto (Tipo/Kg) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Produto (Tipo / KG)
            </label>
            <input
              type="text"
              placeholder="Ex: 4 KG, 6 KG, 8 KG, 12 KG, UNIDADE..."
              value={tipoKg}
              onChange={(e) => setTipoKg(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono"
            />
          </div>

          {/* Valor Unitário Padrão */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Valor Unitário Padrão (R$)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
