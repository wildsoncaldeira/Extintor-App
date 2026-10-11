'use client';

import React, { useState } from 'react';
import { Pedido, StatusPedido } from '@/lib/types';
import { deletePedido, getPedidoDetalhes } from '@/lib/actions';
import { WhatsAppIcon } from './WhatsAppIcon';
import { PdfIcon } from './PdfIcon';
import { Search, SlidersHorizontal, Edit, Trash2, Loader2, X } from 'lucide-react';
import { downloadPedidoPdf } from '@/lib/pdfGenerator';
import { FiltrosPedidosModal, FiltrosPedidos, FILTROS_PEDIDOS_PADRAO } from './FiltrosPedidosModal';

interface PedidosViewProps {
  pedidos: Pedido[];
  onOpenNovoPedido?: () => void;
  onEditarPedido: (pedido: Pedido) => void;
  onVerRecibo: (pedido: Pedido) => void;
  onImprimirPdfDireto: (pedido: Pedido) => void;
  onAlterarStatus: (pedido: Pedido) => void;
  onRefresh: () => void;
}

export function PedidosView({
  pedidos,
  onOpenNovoPedido,
  onEditarPedido,
  onVerRecibo,
  onImprimirPdfDireto,
  onAlterarStatus,
  onRefresh,
}: PedidosViewProps) {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosPedidos>(FILTROS_PEDIDOS_PADRAO);
  const [filtrosModalAberto, setFiltrosModalAberto] = useState(false);
  const [baixandoPdfId, setBaixandoPdfId] = useState<string | null>(null);

  const filtrosAtivosCount =
    (filtros.status !== 'Todos' ? 1 : 0) +
    (filtros.periodo !== 'todos' ? 1 : 0) +
    (filtros.faixaValor !== 'todos' ? 1 : 0) +
    (filtros.ordenacao !== 'numero_desc' ? 1 : 0);

  const pedidosFiltrados = pedidos
    .filter((p) => {
      const matchBusca =
        busca.trim() === '' ||
        p.numero_pedido.toString().includes(busca.trim()) ||
        (p.nome_empresa && p.nome_empresa.toLowerCase().includes(busca.toLowerCase())) ||
        (p.nome_contato && p.nome_contato.toLowerCase().includes(busca.toLowerCase()));

      if (!matchBusca) return false;

      // Status
      if (filtros.status !== 'Todos' && p.status !== filtros.status) {
        return false;
      }

      // Período
      if (filtros.periodo !== 'todos' && p.data_pedido) {
        const [anoP, mesP, diaP] = p.data_pedido.split('-').map(Number);
        const hoje = new Date();
        const anoH = hoje.getFullYear();
        const mesH = hoje.getMonth() + 1;
        const diaH = hoje.getDate();

        if (filtros.periodo === 'hoje') {
          if (anoP !== anoH || mesP !== mesH || diaP !== diaH) return false;
        } else if (filtros.periodo === '7dias') {
          const dataP = new Date(anoP, mesP - 1, diaP);
          const hojeDate = new Date(anoH, mesH - 1, diaH);
          const diffDias = Math.floor((hojeDate.getTime() - dataP.getTime()) / (1000 * 3600 * 24));
          if (diffDias < 0 || diffDias > 7) return false;
        } else if (filtros.periodo === 'mes_atual') {
          if (anoP !== anoH || mesP !== mesH) return false;
        } else if (filtros.periodo === 'mes_anterior') {
          const mesAnt = mesH === 1 ? 12 : mesH - 1;
          const anoAnt = mesH === 1 ? anoH - 1 : anoH;
          if (anoP !== anoAnt || mesP !== mesAnt) return false;
        } else if (filtros.periodo === 'ano_atual') {
          if (anoP !== anoH) return false;
        }
      }

      // Faixa de Valor
      if (filtros.faixaValor !== 'todos') {
        const val = Number(p.valor_total) || 0;
        if (filtros.faixaValor === 'ate_200' && val > 200) return false;
        if (filtros.faixaValor === '200_500' && (val <= 200 || val > 500)) return false;
        if (filtros.faixaValor === '500_1000' && (val <= 500 || val > 1000)) return false;
        if (filtros.faixaValor === 'acima_1000' && val <= 1000) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filtros.ordenacao === 'numero_desc') return b.numero_pedido - a.numero_pedido;
      if (filtros.ordenacao === 'data_desc') return (b.data_pedido || '').localeCompare(a.data_pedido || '');
      if (filtros.ordenacao === 'data_asc') return (a.data_pedido || '').localeCompare(b.data_pedido || '');
      if (filtros.ordenacao === 'valor_desc') return (Number(b.valor_total) || 0) - (Number(a.valor_total) || 0);
      if (filtros.ordenacao === 'valor_asc') return (Number(a.valor_total) || 0) - (Number(b.valor_total) || 0);
      return 0;
    });

  const getWhatsAppUrl = (p: Pedido) => {
    if (!p.telefone_whatsapp) return '#';
    const cleanPhone = p.telefone_whatsapp.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const contato = p.nome_contato || p.nome_empresa;

    let text = '';
    if (p.status === 'Orçamento') {
      text = `Olá ${contato}, o seu orçamento já está pronto! Segue o recibo do seu pedido número ${p.numero_pedido}.`;
    } else if (p.status === 'Aprovado') {
      text = `Olá ${contato}, o seu serviço já está pronto! Segue a Chave Pix para pagamento: ml.gomesilva@gmail.com`;
    } else {
      text = `Olá ${contato}, confirmamos o pagamento do seu pedido número ${p.numero_pedido}! Segue o comprovante. Muito obrigado!`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleExcluir = async (p: Pedido, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir o pedido #${p.numero_pedido} de ${p.nome_empresa}?`)) {
      await deletePedido(p.id);
      onRefresh();
    }
  };

  const handleAbrirDetalhes = async (p: Pedido) => {
    const detalhado = await getPedidoDetalhes(p.id);
    onVerRecibo(detalhado || p);
  };

  const handlePdfClique = async (p: Pedido, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBaixandoPdfId(p.id);
      const detalhado = await getPedidoDetalhes(p.id);
      downloadPedidoPdf(detalhado || p);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o arquivo PDF do pedido.');
    } finally {
      setBaixandoPdfId(null);
    }
  };

  const getStatusBadgeStyle = (status: StatusPedido) => {
    switch (status) {
      case 'Orçamento':
        return 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
      case 'Aprovado':
        return 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100';
      case 'Pago':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Botão Filtros */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search - Pedidos (número ou cliente)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros de status rápido */}
            <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
              {(['Todos', 'Orçamento', 'Aprovado', 'Pago'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltros((prev) => ({ ...prev, status: st }))}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    filtros.status === st
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {st === 'Orçamento' ? '🔴 Orçamento' : st === 'Aprovado' ? '🔵 Aprovado' : st === 'Pago' ? '🟢 Pago' : 'Todos'}
                </button>
              ))}
            </div>

            {/* Botão de Filtros (Substitui o botão de adicionar) */}
            <button
              onClick={() => setFiltrosModalAberto(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition shrink-0 border cursor-pointer ${
                filtrosAtivosCount > 0
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs hover:bg-red-100'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300'
              }`}
              title="Abrir opções de filtro"
            >
              <SlidersHorizontal className="w-4 h-4 text-current" />
              <span>Filtros</span>
              {filtrosAtivosCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                  {filtrosAtivosCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Badges de filtros ativos */}
        {filtrosAtivosCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
            <span className="text-zinc-400 font-medium">Filtros ativos:</span>
            {filtros.status !== 'Todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold">
                Status: {filtros.status}
              </span>
            )}
            {filtros.periodo !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md font-semibold">
                Período: {filtros.periodo === 'hoje' ? 'Hoje' : filtros.periodo === '7dias' ? 'Últimos 7 dias' : filtros.periodo === 'mes_atual' ? 'Mês atual' : filtros.periodo === 'mes_anterior' ? 'Mês anterior' : 'Este ano'}
              </span>
            )}
            {filtros.faixaValor !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md font-semibold">
                Valor: {filtros.faixaValor === 'ate_200' ? 'Até R$ 200' : filtros.faixaValor === '200_500' ? 'R$ 200 - R$ 500' : filtros.faixaValor === '500_1000' ? 'R$ 500 - R$ 1.000' : 'Acima de R$ 1.000'}
              </span>
            )}
            {filtros.ordenacao !== 'numero_desc' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md font-semibold">
                Ordem: {filtros.ordenacao === 'data_desc' ? 'Data mais recente' : filtros.ordenacao === 'data_asc' ? 'Data mais antiga' : filtros.ordenacao === 'valor_desc' ? 'Maior valor' : 'Menor valor'}
              </span>
            )}
            <button
              onClick={() => setFiltros(FILTROS_PEDIDOS_PADRAO)}
              className="text-red-600 hover:text-red-700 font-bold ml-auto text-xs underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden divide-y divide-zinc-100">
        {pedidosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Nenhum pedido encontrado.
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              onClick={() => handleAbrirDetalhes(pedido)}
              className="p-4 hover:bg-zinc-50/80 transition flex items-start sm:items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Esquerda: Número, Data e Cliente (SEM observações na listagem) */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-zinc-900 group-hover:text-red-700 transition">
                    #{pedido.numero_pedido}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    {pedido.data_pedido ? pedido.data_pedido.split('-').reverse().join('/') : ''}
                  </span>
                </div>
                <p className="text-sm font-semibold text-zinc-800 leading-snug">
                  {pedido.nome_empresa}
                </p>
                {pedido.nome_contato && (
                  <p className="text-xs text-zinc-500">
                    Contato: {pedido.nome_contato}
                  </p>
                )}
              </div>

              {/* Direita: Alinhado à direita em 3 LINHAS ESTRITAS (1: Preço, 2: Status, 3: Botões de ação) */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                
                {/* LINHA 1: PREÇO */}
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-zinc-900">
                    R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* LINHA 2: STATUS (Modal ao Clicar) */}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAlterarStatus(pedido);
                    }}
                    title="Clique para alterar status"
                    className={`px-3 py-0.5 text-xs font-bold rounded-full border transition cursor-pointer ${getStatusBadgeStyle(pedido.status)}`}
                  >
                    {pedido.status === 'Orçamento' ? '🔴 Orçamento' : pedido.status === 'Aprovado' ? '🔵 Aprovado' : '🟢 Pago'}
                  </button>
                </div>

                {/* LINHA 3: BOTÕES DE AÇÃO */}
                <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                  
                  {/* WhatsApp com Contorno Verde Oficial */}
                  {pedido.telefone_whatsapp && (
                    <a
                      href={getWhatsAppUrl(pedido)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar WhatsApp dinâmico"
                      className="p-1.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center bg-white"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  )}

                  {/* PDF: Baixar arquivo PDF oficial com nome formatado (ex: pedido_00001280.pdf) */}
                  <button
                    onClick={(e) => handlePdfClique(pedido, e)}
                    disabled={baixandoPdfId === pedido.id}
                    title={`Baixar PDF (pedido_${String(pedido.numero_pedido).padStart(8, '0')}.pdf)`}
                    className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center bg-white disabled:opacity-50"
                  >
                    {baixandoPdfId === pedido.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin" />
                    ) : (
                      <PdfIcon className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </button>

                  {/* Editar Pedido */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const detalhado = await getPedidoDetalhes(pedido.id);
                      onEditarPedido(detalhado || pedido);
                    }}
                    title="Editar pedido"
                    className="p-1.5 border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={(e) => handleExcluir(pedido, e)}
                    title="Excluir pedido"
                    className="p-1.5 border border-zinc-200 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>

            </div>
          ))
        )}
      </div>

      {/* Pop-up de Filtros de Pedidos */}
      <FiltrosPedidosModal
        isOpen={filtrosModalAberto}
        onClose={() => setFiltrosModalAberto(false)}
        filtrosAtuais={filtros}
        onAplicar={(novos) => setFiltros(novos)}
        onLimpar={() => setFiltros(FILTROS_PEDIDOS_PADRAO)}
      />
    </div>
  );
}
