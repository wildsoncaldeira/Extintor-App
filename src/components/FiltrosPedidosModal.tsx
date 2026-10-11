'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, Check, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';

export interface FiltrosPedidos {
  status: 'Todos' | 'Orçamento' | 'Aprovado' | 'Pago';
  periodo: 'todos' | 'hoje' | '7dias' | 'mes_atual' | 'mes_anterior' | 'ano_atual';
  faixaValor: 'todos' | 'ate_200' | '200_500' | '500_1000' | 'acima_1000';
  ordenacao: 'numero_desc' | 'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc';
}

export const FILTROS_PEDIDOS_PADRAO: FiltrosPedidos = {
  status: 'Todos',
  periodo: 'todos',
  faixaValor: 'todos',
  ordenacao: 'numero_desc',
};

interface FiltrosPedidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtrosAtuais: FiltrosPedidos;
  onAplicar: (novosFiltros: FiltrosPedidos) => void;
  onLimpar: () => void;
}

export function FiltrosPedidosModal({
  isOpen,
  onClose,
  filtrosAtuais,
  onAplicar,
  onLimpar,
}: FiltrosPedidosModalProps) {
  const [filtros, setFiltros] = useState<FiltrosPedidos>(filtrosAtuais);

  useEffect(() => {
    setFiltros(filtrosAtuais);
  }, [filtrosAtuais, isOpen]);

  // Fechar com a tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSalvar = () => {
    onAplicar(filtros);
    onClose();
  };

  const handleReset = () => {
    setFiltros(FILTROS_PEDIDOS_PADRAO);
    onLimpar();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Filtrar Pedidos
              </h3>
              <p className="text-xs text-zinc-500">
                Selecione os critérios para refinar a listagem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Opções */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* 1. Status do Pedido */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
              Status do Pedido
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Todos', label: 'Todos', cor: 'border-zinc-200 hover:bg-zinc-50' },
                { id: 'Orçamento', label: '🔴 Orçamento', cor: 'border-red-200 hover:bg-red-50 text-red-700' },
                { id: 'Aprovado', label: '🔵 Aprovado', cor: 'border-blue-200 hover:bg-blue-50 text-blue-700' },
                { id: 'Pago', label: '🟢 Pago', cor: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, status: item.id as any })}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition ${
                    filtros.status === item.id
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                      : `bg-white text-zinc-700 ${item.cor}`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Período / Data */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              Período de Emissão
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'todos', label: 'Todo o Período' },
                { id: 'hoje', label: 'Hoje' },
                { id: '7dias', label: 'Últimos 7 dias' },
                { id: 'mes_atual', label: 'Este Mês' },
                { id: 'mes_anterior', label: 'Mês Anterior' },
                { id: 'ano_atual', label: 'Este Ano' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, periodo: item.id as any })}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition ${
                    filtros.periodo === item.id
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Faixa de Valor */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
              Faixa de Valor (R$)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'todos', label: 'Qualquer Valor' },
                { id: 'ate_200', label: 'Até R$ 200' },
                { id: '200_500', label: 'R$ 200 a R$ 500' },
                { id: '500_1000', label: 'R$ 500 a R$ 1.000' },
                { id: 'acima_1000', label: 'Acima de R$ 1.000' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, faixaValor: item.id as any })}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition ${
                    filtros.faixaValor === item.id
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Ordenação */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              Ordenar Por
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'numero_desc', label: 'Número do Pedido (Maior primeiro)' },
                { id: 'data_desc', label: 'Data (Mais recentes primeiro)' },
                { id: 'data_asc', label: 'Data (Mais antigos primeiro)' },
                { id: 'valor_desc', label: 'Valor (Maior valor primeiro)' },
                { id: 'valor_asc', label: 'Valor (Menor valor primeiro)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, ordenacao: item.id as any })}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition flex items-center justify-between ${
                    filtros.ordenacao === item.id
                      ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {filtros.ordenacao === item.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
