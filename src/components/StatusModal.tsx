'use client';

import React, { useState } from 'react';
import { Pedido, StatusPedido } from '@/lib/types';
import { updatePedidoStatus } from '@/lib/actions';
import { X, Check, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface StatusModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onSaved: (novoStatus: StatusPedido) => void;
}

export function StatusModal({ pedido, onClose, onSaved }: StatusModalProps) {
  const [statusSelecionado, setStatusSelecionado] = useState<StatusPedido>(pedido?.status || 'Orçamento');
  const [loading, setLoading] = useState(false);

  if (!pedido) return null;

  const handleSalvar = async () => {
    setLoading(true);
    await updatePedidoStatus(pedido.id, statusSelecionado);
    setLoading(false);
    onSaved(statusSelecionado);
  };

  const statusOptions: {
    status: StatusPedido;
    label: string;
    descricao: string;
    corBorda: string;
    corBg: string;
    corTexto: string;
    icone: any;
  }[] = [
    {
      status: 'Orçamento',
      label: 'Orçamento',
      descricao: 'Em elaboração ou aguardando aprovação do cliente',
      corBorda: 'border-red-300 dark:border-red-800/80',
      corBg: 'bg-red-50 dark:bg-red-950/50',
      corTexto: 'text-red-700 dark:text-red-300',
      icone: AlertCircle,
    },
    {
      status: 'Aprovado',
      label: 'Aprovado',
      descricao: 'Serviço autorizado pelo cliente ou pronto para entrega',
      corBorda: 'border-blue-300 dark:border-blue-800/80',
      corBg: 'bg-blue-50 dark:bg-blue-950/50',
      corTexto: 'text-blue-700 dark:text-blue-300',
      icone: Clock,
    },
    {
      status: 'Pago',
      label: 'Pago',
      descricao: 'Pagamento recebido (PIX/Dinheiro) e pedido finalizado',
      corBorda: 'border-emerald-300 dark:border-emerald-800/80',
      corBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      corTexto: 'text-emerald-700 dark:text-emerald-300',
      icone: CheckCircle2,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Alterar Status do Pedido
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pedido <strong className="text-red-700 dark:text-red-400">#{pedido.numero_pedido}</strong> • {pedido.nome_empresa}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com opções */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Selecione o novo status:
          </p>

          {statusOptions.map((opt) => {
            const Icon = opt.icone;
            const selecionado = statusSelecionado === opt.status;

            return (
              <div
                key={opt.status}
                onClick={() => setStatusSelecionado(opt.status)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                  selecionado
                    ? `${opt.corBorda} ${opt.corBg} ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-600`
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${opt.corBg} ${opt.corTexto}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${opt.corTexto}`}>
                      {opt.label}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {opt.descricao}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    selecionado
                      ? 'border-zinc-800 dark:border-white bg-zinc-800 dark:bg-white text-white dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selecionado && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com botões */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg shadow-lg shadow-red-900/30 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Salvando...' : 'Confirmar Status'}
          </button>
        </div>

      </div>
    </div>
  );
}
