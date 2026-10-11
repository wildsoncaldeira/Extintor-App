'use client';

import React from 'react';
import { Cliente, Pedido } from '@/lib/types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Edit, 
  X, 
  Calendar, 
  FileText, 
  Receipt,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ClienteDetalhesModalProps {
  cliente: Cliente | null;
  pedidos?: Pedido[];
  zIndexClass?: string;
  onClose: () => void;
  onEditarCliente: (cliente: Cliente) => void;
  onVerPedido?: (pedido: Pedido) => void;
}

export function ClienteDetalhesModal({
  cliente,
  pedidos = [],
  zIndexClass = 'z-[60]',
  onClose,
  onEditarCliente,
  onVerPedido,
}: ClienteDetalhesModalProps) {
  if (!cliente) return null;

  // Filtrar pedidos desse cliente
  const pedidosDoCliente = pedidos.filter(
    (p) => p.cliente_id === cliente.id || (p.legacy_id && p.legacy_id === cliente.legacy_id)
  );

  const totalGasto = pedidosDoCliente.reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

  const getWhatsAppUrl = () => {
    if (!cliente.telefone_whatsapp) return '#';
    const cleanPhone = cliente.telefone_whatsapp.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${cliente.nome_contato || cliente.nome_empresa}, tudo bem?`)}`;
  };

  const getMapsUrl = () => {
    const query = [cliente.endereco, cliente.cidade, cliente.uf, 'Brasil'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || cliente.nome_empresa)}`;
  };

  const formatMoeda = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Orçamento':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Aprovado':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pago':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barra superior de controle */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-900 leading-tight">
                {cliente.nome_empresa}
              </h3>
              <p className="text-xs text-zinc-500">
                Cadastro de Cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Editar Cliente */}
            <button
              onClick={() => onEditarCliente(cliente)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-2xs transition"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              <span>Editar</span>
            </button>

            {/* Botão WhatsApp Contorno Verde Oficial */}
            {cliente.telefone_whatsapp && (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                title="Conversar no WhatsApp"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-white hover:bg-emerald-50 border-2 border-emerald-500 rounded-full shadow-2xs transition"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          
          {/* Grid com Informações do Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Dados Cadastrais */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Informações de Contato
                </span>
                {cliente.cnpj && (
                  <span className="text-[11px] font-mono text-zinc-500">
                    CNPJ: {cliente.cnpj}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-400">Nome / Razão Social:</span>
                  <p className="text-sm font-bold text-zinc-800">{cliente.nome_empresa}</p>
                </div>

                {cliente.nome_contato && (
                  <div>
                    <span className="text-xs text-zinc-400">Responsável:</span>
                    <p className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {cliente.nome_contato}
                    </p>
                  </div>
                )}

                {cliente.telefone_whatsapp && (
                  <div>
                    <span className="text-xs text-zinc-400">Telefone / WhatsApp:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a 
                        href={`tel:${cliente.telefone_whatsapp.replace(/\D/g, '')}`}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {cliente.telefone_whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Localização e Endereço */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Endereço & Localização
                </span>
                <a
                  href={getMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-400">Logradouro:</span>
                  <p className="text-xs font-semibold text-zinc-800">
                    {cliente.endereco || 'Endereço não informado'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400">Cidade / UF:</span>
                    <p className="text-xs font-semibold text-zinc-800">
                      {cliente.cidade || 'Conselheiro Lafaiete'} / {cliente.uf || 'MG'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Resumo Financeiro / Histórico de Pedidos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Histórico de Pedidos ({pedidosDoCliente.length})
                </h4>
              </div>
              <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full">
                Total Faturado: <strong className="text-red-700">{formatMoeda(totalGasto)}</strong>
              </span>
            </div>

            {pedidosDoCliente.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                Nenhum pedido registrado para este cliente até o momento.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden shadow-2xs">
                {pedidosDoCliente.map((ped) => (
                  <div
                    key={ped.id}
                    onClick={() => onVerPedido && onVerPedido(ped)}
                    className="p-3.5 hover:bg-zinc-50/80 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-red-700 group-hover:underline">
                            #{ped.numero_pedido}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(ped.status)}`}>
                            {ped.status}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formatDate(ped.data_pedido)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-zinc-900">
                        {formatMoeda(ped.valor_total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={() => onEditarCliente(cliente)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-2xs transition"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Editar Cadastro</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-lg transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
