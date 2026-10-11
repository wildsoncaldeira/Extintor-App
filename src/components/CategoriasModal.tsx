'use client';

import React, { useState } from 'react';
import { CategoriaProduto } from '@/lib/types';
import { createCategoria, updateCategoria, deleteCategoria } from '@/lib/actions';
import { X, Plus, Edit2, Trash2, Check, AlertCircle, Layers } from 'lucide-react';

interface CategoriasModalProps {
  categorias: CategoriaProduto[];
  onClose: () => void;
  onRefresh: () => void;
}

export function CategoriasModal({ categorias, onClose, onRefresh }: CategoriasModalProps) {
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;

    setLoading(true);
    setError(null);
    const res = await createCategoria(novaCategoria);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Erro ao criar categoria.');
    } else {
      setNovaCategoria('');
      onRefresh();
    }
  };

  const handleSalvarEdicao = async (id: string) => {
    if (!nomeEditando.trim()) return;
    setLoading(true);
    setError(null);
    const res = await updateCategoria(id, nomeEditando);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Erro ao salvar categoria.');
    } else {
      setCategoriaEditandoId(null);
      setNomeEditando('');
      onRefresh();
    }
  };

  const handleExcluir = async (cat: CategoriaProduto) => {
    if (confirm(`Deseja excluir a categoria "${cat.nome}"? Os produtos vinculados ficarão sem categoria definida.`)) {
      setLoading(true);
      setError(null);
      const res = await deleteCategoria(cat.id);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Erro ao excluir categoria.');
      } else {
        onRefresh();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/60 dark:border dark:border-red-800/80 text-red-700 dark:text-red-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Gerenciar Categorias
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organize os produtos e serviços do seu catálogo
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

        {/* Corpo */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Adicionar nova categoria */}
          <form onSubmit={handleCriar} className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da nova categoria (ex: EXTINTOR NOVO ABC)..."
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={loading || !novaCategoria.trim()}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-900/30 transition disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </form>

          {/* Lista de Categorias */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pb-1 border-b border-zinc-200 dark:border-zinc-800">
              <span>Categorias Existentes ({categorias.length})</span>
              <span>Qtd Produtos</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto pr-1">
              {categorias.length === 0 ? (
                <p className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
                  Nenhuma categoria cadastrada.
                </p>
              ) : (
                categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-lg transition"
                  >
                    {categoriaEditandoId === cat.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={nomeEditando}
                          onChange={(e) => setNomeEditando(e.target.value)}
                          className="flex-1 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-xs dark:bg-zinc-950 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSalvarEdicao(cat.id)}
                          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoriaEditandoId(null)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{cat.nome}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-950 dark:border dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold text-[11px]">
                            {cat.total_produtos || 0}
                          </span>

                          <button
                            onClick={() => {
                              setCategoriaEditandoId(cat.id);
                              setNomeEditando(cat.nome);
                            }}
                            title="Editar categoria"
                            className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleExcluir(cat)}
                            title="Excluir categoria"
                            className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
