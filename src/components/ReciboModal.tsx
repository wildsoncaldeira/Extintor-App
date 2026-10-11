'use client';

import React, { useEffect } from 'react';
import { Pedido } from '@/lib/types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { PdfIcon } from './PdfIcon';
import { Edit, Plus, X, MapPin, Phone, Building2, User, Calendar, FileText, Eye } from 'lucide-react';
import { downloadPedidoPdf, openPedidoPdf, getPdfFilename } from '@/lib/pdfGenerator';

interface ReciboModalProps {
  pedido: Pedido | null;
  autoPrint?: boolean;
  zIndexClass?: string;
  onClose: () => void;
  onEditarPedido?: (pedido: Pedido) => void;
  onAdicionarItem?: (pedido: Pedido) => void;
  onAlterarStatus?: (pedido: Pedido) => void;
  onVerCliente?: (clienteId: string) => void;
}

export function ReciboModal({
  pedido,
  autoPrint = false,
  zIndexClass = 'z-50',
  onClose,
  onEditarPedido,
  onAdicionarItem,
  onAlterarStatus,
  onVerCliente,
}: ReciboModalProps) {
  useEffect(() => {
    if (autoPrint && pedido) {
      downloadPedidoPdf(pedido);
    }
  }, [autoPrint, pedido]);

  if (!pedido) return null;

  const handleBaixarPdf = () => {
    if (pedido) {
      downloadPedidoPdf(pedido);
    }
  };

  const getWhatsAppUrl = () => {
    if (!pedido.telefone_whatsapp) return '#';
    const cleanPhone = pedido.telefone_whatsapp.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const contato = pedido.nome_contato || pedido.nome_empresa;

    let text = '';
    if (pedido.status === 'Orçamento') {
      text = `Olá ${contato}, o seu orçamento já está pronto! Segue o recibo do seu pedido número ${pedido.numero_pedido}.`;
    } else if (pedido.status === 'Aprovado') {
      text = `Olá ${contato}, o seu serviço já está pronto! Segue a Chave Pix para pagamento: ml.gomesilva@gmail.com`;
    } else {
      text = `Olá ${contato}, confirmamos o pagamento do seu pedido número ${pedido.numero_pedido}! Segue o comprovante quitado. Muito obrigado pela confiança!`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = () => {
    switch (pedido.status) {
      case 'Orçamento':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80';
      case 'Aprovado':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80';
      case 'Pago':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80';
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl border border-transparent dark:border-zinc-800 overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barra superior de controle */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 print:hidden gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white truncate">
              Pedido #{pedido.numero_pedido}
            </span>
            <button
              onClick={() => onAlterarStatus && onAlterarStatus(pedido)}
              title="Clique para alterar status"
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border transition hover:opacity-80 cursor-pointer shrink-0 ${getStatusBadge()}`}
            >
              {pedido.status === 'Orçamento' ? '🔴 Orçamento' : pedido.status === 'Aprovado' ? '🔵 Aprovado' : '🟢 Pago'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botão Editar Pedido (Apenas Ícone) */}
            {onEditarPedido && (
              <button
                onClick={() => onEditarPedido(pedido)}
                title="Editar pedido"
                className="p-2 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xs transition cursor-pointer flex items-center justify-center"
              >
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}

            {/* Botão WhatsApp (Apenas Ícone) */}
            {pedido.telefone_whatsapp && (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                title="Conversar no WhatsApp"
                className="p-2 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500 rounded-lg shadow-2xs transition cursor-pointer flex items-center justify-center"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </a>
            )}

            {/* Botão PDF (Apenas Ícone) */}
            <button
              onClick={handleBaixarPdf}
              title={`Baixar ${getPdfFilename(pedido.numero_pedido)}`}
              className="p-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-zinc-950 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg shadow-2xs transition cursor-pointer flex items-center justify-center"
            >
              <PdfIcon className="w-4 h-4" />
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              title="Fechar"
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Detalhamento do Pedido */}
        <div className="p-3.5 sm:p-6 sm:p-8 overflow-y-auto space-y-4 sm:space-y-6 text-sm" id="recibo-print-area">
          
          {/* Card com Informações do Pedido e Cliente (Nova UX Limpa) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco do Pedido */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Dados da Ordem
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(pedido.data_pedido)}
                </span>
              </div>
              
              <div className="pt-1 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Número do Pedido:</span>
                  <p className="text-xl font-black text-red-700 dark:text-red-400">#{pedido.numero_pedido}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Status:</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{pedido.status}</p>
                </div>
              </div>
            </div>

            {/* Bloco do Cliente */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Cliente
                </span>
                {onVerCliente && pedido.cliente_id && (
                  <button
                    onClick={() => onVerCliente(pedido.cliente_id)}
                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-zinc-800 border border-red-200 dark:border-red-900/60 rounded-lg shadow-2xs transition shrink-0 cursor-pointer"
                    title="Ver cadastro completo do cliente"
                  >
                    <Eye className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Ver Cliente</span>
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {pedido.nome_empresa}
                </h4>
                {pedido.cnpj && (
                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                    CNPJ: {pedido.cnpj}
                  </p>
                )}
                {pedido.nome_contato && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-zinc-400" /> Contato: {pedido.nome_contato}
                  </p>
                )}
                {pedido.telefone_whatsapp && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-zinc-400" /> WhatsApp: {pedido.telefone_whatsapp}
                  </p>
                )}
                {pedido.endereco && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" /> {pedido.endereco} • {pedido.cidade}/{pedido.uf}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Seção e Tabela de Itens */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-zinc-100/80 dark:bg-zinc-950 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                Itens e Serviços Faturados ({pedido.itens?.length || 0})
              </h3>

              {onAdicionarItem && (
                <button
                  onClick={() => onAdicionarItem(pedido)}
                  className="print:hidden text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar itens
                </button>
              )}
            </div>

            <div className="w-full">
              <table className="w-full text-left border-collapse text-xs sm:text-sm table-fixed">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 text-[10px] sm:text-[11px] uppercase font-semibold">
                    <th className="py-2.5 px-2 sm:px-4 w-[46%] sm:w-auto">Item</th>
                    <th className="py-2.5 px-1 sm:px-4 text-center w-[14%] sm:w-20 whitespace-nowrap">Qtd</th>
                    <th className="py-2.5 px-1 sm:px-4 text-right w-[20%] sm:w-28 whitespace-nowrap">Unit.</th>
                    <th className="py-2.5 px-2 sm:px-4 text-right w-[20%] sm:w-32 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {pedido.itens && pedido.itens.length > 0 ? (
                    pedido.itens.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                        <td className="py-2 px-2 sm:px-4 break-words">
                          <div className="font-semibold text-zinc-900 dark:text-white leading-tight">
                            {item.descricao_item}
                          </div>
                          {item.tipo_kg && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {item.tipo_kg}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-1 sm:px-4 text-center font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                          {item.quantidade}
                        </td>
                        <td className="py-2 px-1 sm:px-4 text-right text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-[11px] sm:text-xs">
                          R$ {Number(item.valor_unitario).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-right font-bold text-zinc-900 dark:text-white whitespace-nowrap text-[11px] sm:text-xs">
                          R$ {Number(item.valor_total_item).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                        Nenhum item adicionado a este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total do Pedido */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Valor Total do Pedido:
              </span>
              <span className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400">
                R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Observações */}
          {pedido.observacoes && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl">
              <strong className="text-xs uppercase tracking-wider text-amber-900 dark:text-amber-400 block mb-1">
                Observações do Pedido:
              </strong>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                {pedido.observacoes}
              </p>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            {onEditarPedido && (
              <button
                onClick={() => onEditarPedido(pedido)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg transition cursor-pointer"
              >
                Editar Pedido Completo
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
