'use client';

import React, { useState } from 'react';
import { ProdutoServico, CategoriaProduto } from '@/lib/types';
import { deleteProduto } from '@/lib/actions';
import { Search, Plus, Edit, Trash2, Layers, ChevronDown, ChevronRight } from 'lucide-react';

interface ProdutosViewProps {
  produtos: ProdutoServico[];
  categorias: CategoriaProduto[];
  onOpenNovoProduto: () => void;
  onEditarProduto: (produto: ProdutoServico) => void;
  onOpenGerenciarCategorias: () => void;
  onRefresh: () => void;
}

export function ProdutosView({
  produtos,
  categorias,
  onOpenNovoProduto,
  onEditarProduto,
  onOpenGerenciarCategorias,
  onRefresh,
}: ProdutosViewProps) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({});

  const produtosFiltrados = produtos.filter((p) => {
    const q = busca.toLowerCase();
    const matchBusca =
      p.descricao.toLowerCase().includes(q) ||
      (p.tipo_kg && p.tipo_kg.toLowerCase().includes(q)) ||
      (p.nome_categoria && p.nome_categoria.toLowerCase().includes(q));

    const catNome = p.nome_categoria || p.descricao;
    const matchCat = categoriaFiltro === 'Todas' || catNome === categoriaFiltro;

    return matchBusca && matchCat;
  });

  // Agrupa produtos por Categoria
  const produtosPorCategoria = produtosFiltrados.reduce((acc, p) => {
    const cat = p.nome_categoria || p.descricao || 'Diversos';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, ProdutoServico[]>);

  const toggleSecao = (cat: string, index: number) => {
    setSecoesAbertas((prev) => {
      const atualmenteAberta =
        prev[cat] !== undefined ? prev[cat] : index === 0;
      return {
        ...prev,
        [cat]: !atualmenteAberta,
      };
    });
  };

  const handleExcluir = async (p: ProdutoServico) => {
    if (confirm(`Deseja excluir o produto "${p.descricao} ${p.tipo_kg || ''}"?`)) {
      const res = await deleteProduto(p.id);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir produto.');
      } else {
        onRefresh();
      }
    }
  };

  const listaCategorias = Object.keys(produtosPorCategoria).sort();

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Botões Superiores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-4 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Produtos & Serviços (descrição, categoria ou peso kg)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none dark:bg-[#121214] dark:text-white dark:placeholder-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Gerenciar Categorias */}
          <button
            onClick={onOpenGerenciarCategorias}
            title="Adicionar, editar e excluir categorias"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-[#121214] dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span>Categorias ({categorias.length})</span>
          </button>

          {/* Botão + Add Novo Produto */}
          <button
            onClick={onOpenNovoProduto}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-red-900/30 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Lista Agrupada por Categoria */}
      <div className="space-y-3">
        {listaCategorias.length === 0 ? (
          <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-8 rounded-xl border border-zinc-200 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Nenhum produto cadastrado com este critério de busca.
          </div>
        ) : (
          listaCategorias.map((catNome, index) => {
            const itens = produtosPorCategoria[catNome];
            // Se o usuário estiver pesquisando por termo, expande as categorias correspondentes;
            // caso contrário, apenas a primeira categoria inicia aberta.
            const estaAberta = busca.trim()
              ? true
              : secoesAbertas[catNome] !== undefined
              ? secoesAbertas[catNome]
              : index === 0;

            return (
              <div
                key={catNome}
                className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md rounded-xl border border-zinc-200 shadow-2xs overflow-hidden transition"
              >
                {/* Cabeçalho da Categoria */}
                <div
                  onClick={() => toggleSecao(catNome, index)}
                  className="px-4 py-3 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-[#121214] dark:hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 select-none transition"
                >
                  <div className="flex items-center gap-2.5">
                    {estaAberta ? (
                      <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      {catNome}
                    </h3>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700 font-mono">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Itens da Categoria */}
                {estaAberta && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {itens.map((produto) => (
                      <div
                        key={produto.id}
                        className="px-4 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="space-y-0.5 pl-6">
                          <p className="font-semibold text-zinc-900 dark:text-white">
                            {produto.tipo_kg ? produto.tipo_kg : produto.descricao}
                          </p>
                          {produto.tipo_kg && produto.descricao !== catNome && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {produto.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            R$ {Number(produto.valor_unitario_padrao).toFixed(2).replace('.', ',')}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditarProduto(produto)}
                              title="Editar produto"
                              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleExcluir(produto)}
                              title="Excluir produto"
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
