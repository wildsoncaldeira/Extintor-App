'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, Check, MapPin, Phone, Building2, ArrowUpDown, Receipt } from 'lucide-react';

export interface FiltrosClientes {
  cidade: string;
  apenasComWhatsapp: boolean;
  apenasComCnpj: boolean;
  temPedidos: 'todos' | 'com_pedidos' | 'sem_pedidos';
  ordenacao: 'nome_asc' | 'nome_desc' | 'cidade_asc';
}

export const FILTROS_CLIENTES_PADRAO: FiltrosClientes = {
  cidade: 'Todas',
  apenasComWhatsapp: false,
  apenasComCnpj: false,
  temPedidos: 'todos',
  ordenacao: 'nome_asc',
};

interface FiltrosClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cidadesDisponiveis: string[];
  filtrosAtuais: FiltrosClientes;
  onAplicar: (novosFiltros: FiltrosClientes) => void;
  onLimpar: () => void;
}

export function FiltrosClientesModal({
  isOpen,
  onClose,
  cidadesDisponiveis,
  filtrosAtuais,
  onAplicar,
  onLimpar,
}: FiltrosClientesModalProps) {
  const [filtros, setFiltros] = useState<FiltrosClientes>(filtrosAtuais);

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
    setFiltros(FILTROS_CLIENTES_PADRAO);
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
                Filtrar Clientes
              </h3>
              <p className="text-xs text-zinc-500">
                Selecione os critérios para refinar seus contatos
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
          
          {/* 1. Cidade do Cliente */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              Filtrar por Cidade
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setFiltros({ ...filtros, cidade: 'Todas' })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                  filtros.cidade === 'Todas'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Todas ({cidadesDisponiveis.length} cidades)
              </button>
              {cidadesDisponiveis.map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, cidade: cid })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    filtros.cidade === cid
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {cid}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dados de Contato e Documentação */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              Documento e WhatsApp
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFiltros({ ...filtros, apenasComWhatsapp: !filtros.apenasComWhatsapp })}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-between transition ${
                  filtros.apenasComWhatsapp
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span>Apenas com WhatsApp</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  filtros.apenasComWhatsapp ? 'bg-emerald-600 text-white border-emerald-600' : 'border-zinc-300'
                }`}>
                  {filtros.apenasComWhatsapp && <Check className="w-3 h-3" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltros({ ...filtros, apenasComCnpj: !filtros.apenasComCnpj })}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-between transition ${
                  filtros.apenasComCnpj
                    ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span>Apenas com CNPJ</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  filtros.apenasComCnpj ? 'bg-blue-600 text-white border-blue-600' : 'border-zinc-300'
                }`}>
                  {filtros.apenasComCnpj && <Check className="w-3 h-3" />}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Histórico de Pedidos */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-zinc-500" />
              Histórico de Pedidos
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'com_pedidos', label: 'Com Pedidos' },
                { id: 'sem_pedidos', label: 'Sem Pedidos' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, temPedidos: item.id as any })}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition ${
                    filtros.temPedidos === item.id
                      ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-2xs'
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
              Ordenar Clientes Por
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'nome_asc', label: 'Nome (A - Z)' },
                { id: 'nome_desc', label: 'Nome (Z - A)' },
                { id: 'cidade_asc', label: 'Cidade (A - Z)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltros({ ...filtros, ordenacao: item.id as any })}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition flex items-center justify-between ${
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
