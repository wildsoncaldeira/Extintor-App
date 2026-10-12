'use client';

import React, { useState, useEffect } from 'react';
import { CrmOportunidade, CrmEtapa, Cliente } from '@/lib/types';
import { 
  getCrmOportunidades, 
  createCrmOportunidade, 
  updateCrmEtapa, 
  updateCrmOportunidade, 
  deleteCrmOportunidade,
  getClientes
} from '@/lib/actions';
import { CurrencyInput } from './CurrencyInput';
import { WhatsAppIcon } from './WhatsAppIcon';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  FileText, 
  Phone, 
  Building2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  X,
  Loader2,
  CalendarDays,
  ShoppingBag
} from 'lucide-react';

interface CrmViewProps {
  onAbrirPedido?: (pedidoId: string) => void;
  onCriarNovoPedido?: (clienteId?: string, clienteNome?: string) => void;
  onVerCliente?: (clienteId: string) => void;
}

const ETAPAS: { key: CrmEtapa; titulo: string; corBadge: string; corBorda: string; corBg: string; icone: any }[] = [
  {
    key: 'potencial',
    titulo: 'Potencial Cliente',
    corBadge: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
    corBorda: 'border-purple-200 dark:border-purple-900/50',
    corBg: 'bg-purple-500',
    icone: Sparkles,
  },
  {
    key: 'orcamento',
    titulo: 'Orçamento em Aberto',
    corBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    corBorda: 'border-amber-200 dark:border-amber-900/50',
    corBg: 'bg-amber-500',
    icone: AlertCircle,
  },
  {
    key: 'aprovado',
    titulo: 'Aprovado',
    corBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
    corBorda: 'border-blue-200 dark:border-blue-900/50',
    corBg: 'bg-blue-500',
    icone: Clock,
  },
  {
    key: 'pago',
    titulo: 'Pago',
    corBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    corBorda: 'border-emerald-200 dark:border-emerald-900/50',
    corBg: 'bg-emerald-500',
    icone: CheckCircle2,
  },
  {
    key: 'venda_futura',
    titulo: 'Venda Futura',
    corBadge: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80',
    corBorda: 'border-red-200 dark:border-red-900/50',
    corBg: 'bg-red-600',
    icone: CalendarDays,
  },
];

export function CrmView({ onAbrirPedido, onCriarNovoPedido, onVerCliente }: CrmViewProps) {
  const [oportunidades, setOportunidades] = useState<CrmOportunidade[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [oportunidadeParaEditar, setOportunidadeParaEditar] = useState<CrmOportunidade | null>(null);

  // Form State
  const [formTitulo, setFormTitulo] = useState('');
  const [formClienteId, setFormClienteId] = useState('');
  const [formClienteNome, setFormClienteNome] = useState('');
  const [formClienteTelefone, setFormClienteTelefone] = useState('');
  const [formClienteEmail, setFormClienteEmail] = useState('');
  const [formValor, setFormValor] = useState<number>(0);
  const [formEtapa, setFormEtapa] = useState<CrmEtapa>('potencial');
  const [formDataPrevisao, setFormDataPrevisao] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [ops, clis] = await Promise.all([
        getCrmOportunidades(),
        getClientes(),
      ]);
      setOportunidades(ops);
      setClientes(clis);
    } catch (err) {
      console.error('Erro ao carregar CRM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const formatMoeda = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getWhatsAppUrl = (telefone?: string | null, nomeCliente?: string) => {
    if (!telefone) return '#';
    const cleanPhone = telefone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${nomeCliente || ''}, tudo bem? Falamos sobre sua manutenção/recarga de extintores.`)}`;
  };

  // Abrir Modal para Criar
  const handleAbrirCriar = () => {
    setOportunidadeParaEditar(null);
    setFormTitulo('');
    setFormClienteId('');
    setFormClienteNome('');
    setFormClienteTelefone('');
    setFormClienteEmail('');
    setFormValor(0);
    setFormEtapa('potencial');
    setFormDataPrevisao('');
    setFormObservacoes('');
    setErroForm(null);
    setModalNovaAberto(true);
  };

  // Abrir Modal para Editar
  const handleAbrirEditar = (op: CrmOportunidade) => {
    setOportunidadeParaEditar(op);
    setFormTitulo(op.titulo);
    setFormClienteId(op.cliente_id || '');
    setFormClienteNome(op.cliente_nome);
    setFormClienteTelefone(op.cliente_telefone || '');
    setFormClienteEmail(op.cliente_email || '');
    setFormValor(Number(op.valor) || 0);
    setFormEtapa(op.etapa);
    setFormDataPrevisao(op.data_venda_futura?.split('T')[0] || op.data_previsao?.split('T')[0] || '');
    setFormObservacoes(op.observacoes || '');
    setErroForm(null);
    setModalNovaAberto(true);
  };

  const handleClienteSelectChange = (id: string) => {
    setFormClienteId(id);
    const cli = clientes.find((c) => c.id === id);
    if (cli) {
      setFormClienteNome(cli.nome_empresa);
      setFormClienteTelefone(cli.telefone_whatsapp || '');
      if (!formTitulo) {
        setFormTitulo(`Oportunidade - ${cli.nome_empresa}`);
      }
    }
  };

  const handleSalvarOportunidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setErroForm('O título da oportunidade é obrigatório.');
      return;
    }
    if (!formClienteNome.trim()) {
      setErroForm('O nome do cliente é obrigatório.');
      return;
    }

    setSalvando(true);
    setErroForm(null);

    try {
      if (oportunidadeParaEditar) {
        const res = await updateCrmOportunidade(oportunidadeParaEditar.id, {
          titulo: formTitulo.trim(),
          cliente_nome: formClienteNome.trim(),
          cliente_telefone: formClienteTelefone.trim() || undefined,
          cliente_email: formClienteEmail.trim() || undefined,
          valor: formValor,
          etapa: formEtapa,
          data_previsao: formDataPrevisao || undefined,
          data_venda_futura: formEtapa === 'venda_futura' ? formDataPrevisao || undefined : undefined,
          observacoes: formObservacoes.trim() || undefined,
        });
        if (!res.success) throw new Error(res.error || 'Erro ao atualizar oportunidade');
      } else {
        const res = await createCrmOportunidade({
          titulo: formTitulo.trim(),
          cliente_id: formClienteId || undefined,
          cliente_nome: formClienteNome.trim(),
          cliente_telefone: formClienteTelefone.trim() || undefined,
          cliente_email: formClienteEmail.trim() || undefined,
          valor: formValor,
          etapa: formEtapa,
          data_previsao: formDataPrevisao || undefined,
          data_venda_futura: formEtapa === 'venda_futura' ? formDataPrevisao || undefined : undefined,
          observacoes: formObservacoes.trim() || undefined,
        });
        if (!res.success) throw new Error(res.error || 'Erro ao criar oportunidade');
      }

      setModalNovaAberto(false);
      await carregarDados();
    } catch (err: any) {
      setErroForm(err?.message || 'Erro ao salvar oportunidade.');
    } finally {
      setSalvando(false);
    }
  };

  const handleMudarEtapa = async (id: string, novaEtapa: CrmEtapa) => {
    try {
      // Otimisticamente atualiza
      setOportunidades((prev) =>
        prev.map((op) => (op.id === id ? { ...op, etapa: novaEtapa } : op))
      );
      await updateCrmEtapa(id, novaEtapa);
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
      await carregarDados();
    }
  };

  const handleExcluirOportunidade = async (id: string, titulo: string) => {
    if (!confirm(`Deseja realmente excluir a oportunidade "${titulo}"?`)) return;

    try {
      setOportunidades((prev) => prev.filter((op) => op.id !== id));
      await deleteCrmOportunidade(id);
    } catch (err) {
      console.error('Erro ao excluir oportunidade:', err);
      await carregarDados();
    }
  };

  // Filtragem
  const oportunidadesFiltradas = oportunidades.filter((op) => {
    const q = busca.toLowerCase();
    return (
      op.titulo.toLowerCase().includes(q) ||
      op.cliente_nome.toLowerCase().includes(q) ||
      (op.cliente_telefone && op.cliente_telefone.includes(q)) ||
      (op.numero_pedido && String(op.numero_pedido).includes(q))
    );
  });

  // Métricas
  const totalPipeline = oportunidadesFiltradas.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);
  const totalVendasFuturas = oportunidadesFiltradas.filter((o) => o.etapa === 'venda_futura').length;

  return (
    <div className="space-y-6">
      
      {/* 1. TOPO: TÍTULO, ESTATÍSTICAS E CONTROLES */}
      <div className="bg-white dark:bg-[#18181c] dark:border-zinc-700/80 dark:shadow-md p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                CRM de Vendas & Oportunidades Futuras
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Acompanhe potenciais clientes, orçamentos, fechamentos e renovações anuais de extintores
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleAbrirCriar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Oportunidade</span>
            </button>

            <button
              onClick={carregarDados}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Mini-Cards */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, título ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Total Oportunidades:</span>
              <strong className="font-bold text-zinc-900 dark:text-white">
                {oportunidadesFiltradas.length}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Volume Total em Pipeline:</span>
              <strong className="font-black text-emerald-600 dark:text-emerald-400">
                {formatMoeda(totalPipeline)}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Vendas Futuras:</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                {totalVendasFuturas} agendadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KANBAN COM AS 5 ETAPAS */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {ETAPAS.map((etapaDef) => {
            const Icon = etapaDef.icone;
            const opsEtapa = oportunidadesFiltradas.filter((o) => o.etapa === etapaDef.key);
            const totalEtapa = opsEtapa.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

            return (
              <div
                key={etapaDef.key}
                className="flex-1 min-w-[240px] max-w-[320px] bg-zinc-100/70 dark:bg-[#151518] rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 flex flex-col"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${etapaDef.corBg}`} />
                    <h3 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                      {etapaDef.titulo}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-2xs">
                    {opsEtapa.length}
                  </span>
                </div>

                {/* Subtotal da Coluna */}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 flex items-center justify-between px-1">
                  <span>Subtotal:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                    {formatMoeda(totalEtapa)}
                  </strong>
                </div>

                {/* Cards das Oportunidades */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                  {opsEtapa.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
                      Nenhuma oportunidade nesta etapa.
                    </div>
                  ) : (
                    opsEtapa.map((op) => (
                      <div
                        key={op.id}
                        className="bg-white dark:bg-[#1d1d22] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-md transition space-y-2.5 group relative"
                      >
                        {/* Título & Ações Rápidas */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            className="font-bold text-xs text-zinc-900 dark:text-white leading-tight cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition"
                            onClick={() => handleAbrirEditar(op)}
                          >
                            {op.titulo}
                          </h4>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(op)}
                              className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition cursor-pointer"
                              title="Editar oportunidade"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirOportunidade(op.id, op.titulo)}
                              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition cursor-pointer"
                              title="Excluir oportunidade"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Cliente & Telefone */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                            <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span 
                              className="truncate hover:underline cursor-pointer"
                              onClick={() => op.cliente_id && onVerCliente && onVerCliente(op.cliente_id)}
                            >
                              {op.cliente_nome}
                            </span>
                          </div>

                          {op.cliente_telefone && (
                            <div className="flex items-center gap-2">
                              <a
                                href={getWhatsAppUrl(op.cliente_telefone, op.cliente_nome)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Abrir conversa no WhatsApp"
                              >
                                <WhatsAppIcon className="w-3 h-3" />
                                <span>{op.cliente_telefone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Pedido Vinculado (se houver) */}
                        {op.numero_pedido && (
                          <div className="text-[11px] flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400">Pedido Gerado:</span>
                            <button
                              type="button"
                              onClick={() => op.pedido_id && onAbrirPedido && onAbrirPedido(op.pedido_id)}
                              className="font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                              #{op.numero_pedido}
                            </button>
                          </div>
                        )}

                        {/* Data de Venda Futura ou Previsão */}
                        {op.etapa === 'venda_futura' ? (
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Renovação: <strong className="font-bold">{formatDate(op.data_venda_futura || op.data_previsao) || 'A definir'}</strong>
                            </span>
                          </div>
                        ) : op.data_previsao ? (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Previsão: {formatDate(op.data_previsao)}</span>
                          </div>
                        ) : null}

                        {/* Observações */}
                        {op.observacoes && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic line-clamp-2">
                            "{op.observacoes}"
                          </p>
                        )}

                        {/* Rodapé do Card: Valor e Movimentação */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <span className="font-black text-xs text-zinc-900 dark:text-white">
                            {formatMoeda(Number(op.valor) || 0)}
                          </span>

                          {/* Seletor rápido de Etapa */}
                          <select
                            value={op.etapa}
                            onChange={(e) => handleMudarEtapa(op.id, e.target.value as CrmEtapa)}
                            className="text-[10px] font-bold py-0.5 px-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
                          >
                            <option value="potencial">Potencial</option>
                            <option value="orcamento">Orçamento</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="pago">Pago</option>
                            <option value="venda_futura">Venda Futura</option>
                          </select>
                        </div>

                        {/* Botão rápido: Criar Pedido */}
                        {onCriarNovoPedido && op.etapa !== 'pago' && !op.pedido_id && (
                          <button
                            type="button"
                            onClick={() => onCriarNovoPedido(op.cliente_id || undefined, op.cliente_nome)}
                            className="w-full mt-1 py-1 text-[11px] font-bold text-center rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Criar Pedido deste Cliente</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: CRIAR OU EDITAR OPORTUNIDADE */}
      {modalNovaAberto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-modal-backdrop"
          onClick={() => setModalNovaAberto(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#18181c] text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121214]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {oportunidadeParaEditar ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Cadastre uma nova negociação ou renovação futura
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaAberto(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSalvarOportunidade} className="p-6 space-y-4 text-xs">
              {erroForm && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 rounded-lg">
                  {erroForm}
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título da Negociação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Recarga anual 10 extintores, Manutenção condomínio..."
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              {/* Cliente existente ou manual */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vincular a Cliente Cadastrado (Opcional):
                </label>
                <select
                  value={formClienteId}
                  onChange={(e) => handleClienteSelectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 font-semibold mb-2"
                >
                  <option value="">Cliente Avulso / Novo (Digitar abaixo)</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                      {c.nome_empresa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome do Cliente e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome do Cliente / Empresa *
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da empresa ou pessoa"
                    value={formClienteNome}
                    onChange={(e) => setFormClienteNome(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(31) 99999-9999"
                    value={formClienteTelefone}
                    onChange={(e) => setFormClienteTelefone(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Valor e Etapa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Valor Estimado (R$)
                  </label>
                  <CurrencyInput
                    value={formValor}
                    onChange={setFormValor}
                    className="w-full font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Etapa no Funil *
                  </label>
                  <select
                    value={formEtapa}
                    onChange={(e) => {
                      const nova = e.target.value as CrmEtapa;
                      setFormEtapa(nova);
                      if (nova === 'venda_futura' && !formDataPrevisao) {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setFormDataPrevisao(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  >
                    <option value="potencial">Potencial Cliente</option>
                    <option value="orcamento">Orçamento em Aberto</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="pago">Pago</option>
                    <option value="venda_futura">Venda Futura (Renovação)</option>
                  </select>
                </div>
              </div>

              {/* Data Previsão / Renovação */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formEtapa === 'venda_futura' ? 'Data da Venda Futura (Renovação em 1 ano) *' : 'Data de Previsão'}</span>
                </label>
                <input
                  type="date"
                  value={formDataPrevisao}
                  onChange={(e) => setFormDataPrevisao(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Anotações sobre a negociação</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Histórico da conversa, tipos de extintores necessários, etc."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalNovaAberto(false)}
                  disabled={salvando}
                  className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{oportunidadeParaEditar ? 'Atualizar Oportunidade' : 'Criar Oportunidade'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
