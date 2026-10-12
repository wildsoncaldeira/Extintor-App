'use client';

import React, { useState } from 'react';
import { CategoriaDespesa } from '@/lib/types';
import { createCategoriaDespesa, deleteCategoriaDespesa } from '@/lib/actions';
import { X, Tag, Plus, Trash2, Loader2, Check } from 'lucide-react';

interface CategoriasDespesasModalProps {
  categorias: CategoriaDespesa[];
  onClose: () => void;
  onCategoriasAtualizadas: () => void;
}

const PALETA_CORES = [
  '#ef4444', // Vermelho
  '#f97316', // Laranja
  '#f59e0b', // Âmbar
  '#10b981', // Verde
  '#06b6d4', // Ciano
  '#3b82f6', // Azul
  '#6366f1', // Índigo
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#64748b', // Slate
];

export function CategoriasDespesasModal({
  categorias,
  onClose,
  onCategoriasAtualizadas,
}: CategoriasDespesasModalProps) {
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState('#ef4444');
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    setSalvando(true);
    setErro(null);
    try {
      const res = await createCategoriaDespesa(novoNome.trim(), novaCor);
      if (!res.success) {
        setErro(res.error || 'Erro ao criar categoria.');
      } else {
        setNovoNome('');
        onCategoriasAtualizadas();
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro inesperado.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir a categoria "${nome}"? As despesas associadas não serão apagadas, mas ficarão sem categoria.`)) {
      return;
    }

    setExcluindoId(id);
    try {
      const res = await deleteCategoriaDespesa(id);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir categoria.');
      } else {
        onCategoriasAtualizadas();
      }
    } catch (err) {
      alert('Erro ao excluir categoria.');
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#18181c] text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Categorias de Despesas
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organize seus custos por tipo
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

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {erro && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 rounded-lg">
              {erro}
            </div>
          )}

          {/* Formulário para Nova Categoria */}
          <form onSubmit={handleCriar} className="space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Nova Categoria
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Combustível, Impostos, etc."
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <button
                type="submit"
                disabled={salvando || !novoNome.trim()}
                className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Adicionar</span>
              </button>
            </div>

            {/* Paleta de Cores */}
            <div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                Cor de identificação:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PALETA_CORES.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNovaCor(cor)}
                    style={{ backgroundColor: cor }}
                    className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition-transform ${
                      novaCor === cor ? 'scale-110 ring-2 ring-offset-2 ring-zinc-900 dark:ring-white' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {novaCor === cor && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Lista de Categorias Cadastradas */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Categorias Existentes ({categorias.length})
            </label>

            {categorias.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-3 text-center">
                Nenhuma categoria cadastrada.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-white dark:bg-zinc-950">
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.cor || '#ef4444' }}
                      />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {cat.nome}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExcluir(cat.id, cat.nome)}
                      disabled={excluindoId === cat.id}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition cursor-pointer disabled:opacity-50"
                      title="Excluir categoria"
                    >
                      {excluindoId === cat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
