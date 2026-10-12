'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, BellRing, Sparkles } from 'lucide-react';

interface VendaFuturaModalProps {
  isOpen: boolean;
  pedidoId: string;
  numeroPedido: number;
  clienteNome: string;
  dataEntrega?: string;
  onSalvar: (dataVendaFutura: string) => Promise<void> | void;
  onIgnorar: () => void;
}

export function VendaFuturaModal({
  isOpen,
  pedidoId,
  numeroPedido,
  clienteNome,
  dataEntrega,
  onSalvar,
  onIgnorar,
}: VendaFuturaModalProps) {
  const [dataFutura, setDataFutura] = useState<string>('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Por padrão: 1 ano a partir da data de entrega (ou da data atual)
      try {
        const base = dataEntrega ? new Date(`${dataEntrega}T12:00:00`) : new Date();
        base.setFullYear(base.getFullYear() + 1);
        setDataFutura(base.toISOString().split('T')[0]);
      } catch {
        const base = new Date();
        base.setFullYear(base.getFullYear() + 1);
        setDataFutura(base.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, dataEntrega]);

  if (!isOpen) return null;

  const handleSalvar = async () => {
    if (!dataFutura) return;
    setSalvando(true);
    try {
      await onSalvar(dataFutura);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#18181c] w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo com destaque visual */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Agendar Venda Futura
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Renovação & Recarga de Extintores
              </p>
            </div>
          </div>
          <button
            onClick={onIgnorar}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Ignorar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
              <BellRing className="w-4 h-4 shrink-0" />
              <span>Pedido #{numeroPedido} aprovado com sucesso!</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
              Cliente: <strong className="text-zinc-900 dark:text-white">{clienteNome}</strong>.
              <br />
              Deseja salvar a data para a próxima venda/renovação no CRM de Vendas Futuras?
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Data da Venda Futura (1 ano à frente):</span>
            </label>
            <input
              type="date"
              value={dataFutura}
              onChange={(e) => setDataFutura(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-950 dark:text-white shadow-2xs"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
              Calculada automaticamente como 1 ano após a entrega. Você pode ajustar a data se preferir.
            </p>
          </div>
        </div>

        {/* Rodapé com 2 botões: Ignorar e Salvar */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onIgnorar}
            disabled={salvando}
            className="px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-xl transition cursor-pointer shadow-2xs"
          >
            Ignorar
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || !dataFutura}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
