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
  ShoppingBag,
  LayoutDashboard
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

  // Modo de Visualização do CRM: Kanban ou Calendário
  const [visualizacao, setVisualizacao] = useState<'kanban' | 'calendario'>('kanban');
  const [calendarioModo, setCalendarioModo] = useState<'mes' | 'semana'>('mes');
  const [dataRef, setDataRef] = useState<Date>(new Date());

  const navegarAnterior = () => {
    setDataRef((prev) => {
      const d = new Date(prev);
      if (calendarioModo === 'mes') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const navegarProximo = () => {
    setDataRef((prev) => {
      const d = new Date(prev);
      if (calendarioModo === 'mes') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const formatToYMD = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const getOpDateString = (op: CrmOportunidade): string => {
    const raw = op.etapa === 'venda_futura'
      ? (op.data_venda_futura || op.data_previsao || '')
      : (op.data_previsao || (op.created_at ? op.created_at.split('T')[0] : ''));
    return raw ? raw.split('T')[0] : '';
  };

  const getChipClasses = (etapa: CrmEtapa) => {
    switch (etapa) {
      case 'potencial':
        return 'bg-purple-100 text-purple-900 border-l-2 border-purple-600 hover:bg-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-500';
      case 'orcamento':
        return 'bg-amber-100 text-amber-900 border-l-2 border-amber-600 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-500';
      case 'aprovado':
        return 'bg-blue-100 text-blue-900 border-l-2 border-blue-600 hover:bg-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-500';
      case 'pago':
        return 'bg-emerald-100 text-emerald-900 border-l-2 border-emerald-600 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-500';
      case 'venda_futura':
        return 'bg-red-100 text-red-900 border-l-2 border-red-600 hover:bg-red-200 dark:bg-red-950/70 dark:text-red-200 dark:border-red-500';
      default:
        return 'bg-zinc-100 text-zinc-900 border-l-2 border-zinc-600';
    }
  };

  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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

  // Cálculos para o Calendário
  const anoRef = dataRef.getFullYear();
  const mesRef = dataRef.getMonth();

  // Matriz Mensal
  const primeiroDiaMes = new Date(anoRef, mesRef, 1);
  const diaSemanaInicio = primeiroDiaMes.getDay(); // 0 = Domingo
  const diasNoMes = new Date(anoRef, mesRef + 1, 0).getDate();
  const diasNoMesAnterior = new Date(anoRef, mesRef, 0).getDate();

  const diasMatriz: { data: Date; noMes: boolean; ymd: string }[] = [];
  // Dias do mês anterior
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - 1, diasNoMesAnterior - i);
    diasMatriz.push({ data: d, noMes: false, ymd: formatToYMD(d) });
  }
  // Dias do mês atual
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const d = new Date(anoRef, mesRef, dia);
    diasMatriz.push({ data: d, noMes: true, ymd: formatToYMD(d) });
  }
  // Dias do próximo mês para completar grade de 35 ou 42 células
  const totalSlots = diasMatriz.length <= 35 ? 35 : 42;
  let proxDia = 1;
  while (diasMatriz.length < totalSlots) {
    const d = new Date(anoRef, mesRef + 1, proxDia++);
    diasMatriz.push({ data: d, noMes: false, ymd: formatToYMD(d) });
  }

  // Dias da Semana (Semanal)
  const inicioSemana = new Date(dataRef);
  const diaSemanaAtual = inicioSemana.getDay();
  inicioSemana.setDate(inicioSemana.getDate() - diaSemanaAtual);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return { data: d, ymd: formatToYMD(d) };
  });

  const diasNomesSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const tituloPeriodo = calendarioModo === 'mes'
    ? `${mesesNomes[mesRef]} de ${anoRef}`
    : diasSemana[0].data.getMonth() === diasSemana[6].data.getMonth()
      ? `${diasSemana[0].data.getDate()} a ${diasSemana[6].data.getDate()} de ${mesesNomes[diasSemana[6].data.getMonth()]} de ${diasSemana[6].data.getFullYear()}`
      : `${diasSemana[0].data.getDate()} de ${mesesNomes[diasSemana[0].data.getMonth()]} a ${diasSemana[6].data.getDate()} de ${mesesNomes[diasSemana[6].data.getMonth()]} de ${diasSemana[6].data.getFullYear()}`;

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. TOPO COMPACTO: BUSCA, AÇÕES E 3 CARDS DE MÉTRICAS */}
      <div className="bg-white dark:bg-[#18181c] p-3 sm:p-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-xs space-y-3">
        {/* Linha 1: Campo de Busca à esquerda e Botões à direita */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, título ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 font-medium transition"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAbrirCriar}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-sm shadow-red-900/20 transition cursor-pointer flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Oportunidade</span>
            </button>

            <button
              onClick={carregarDados}
              disabled={loading}
              title="Atualizar dados do CRM"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Linha 2: 3 Cards de Indicadores (Total Oportunidades, Valor Total, Vendas Futuras) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5">
          {/* Card 1: Total de Oportunidades */}
          <div className="bg-zinc-100/90 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-2.5 sm:p-3 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Total Oportunidades
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-base sm:text-xl font-black text-zinc-900 dark:text-white">
                {oportunidadesFiltradas.length}
              </strong>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">no pipeline</span>
            </div>
          </div>

          {/* Card 2: Valor Total em Pipeline */}
          <div className="bg-zinc-100/90 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-2.5 sm:p-3 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Valor Total
            </span>
            <div className="mt-0.5">
              <strong className="text-xs sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate block">
                {formatMoeda(totalPipeline)}
              </strong>
            </div>
          </div>

          {/* Card 3: Vendas Futuras */}
          <div className="bg-zinc-100/90 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-2.5 sm:p-3 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Vendas Futuras
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-base sm:text-xl font-black text-red-600 dark:text-red-400">
                {totalVendasFuturas}
              </strong>
              <span className="text-[10px] font-semibold text-red-700/80 dark:text-red-300/80 truncate">
                {totalVendasFuturas === 1 ? 'agendada' : 'agendadas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE CONTROLE: SELETOR KANBAN vs CALENDÁRIO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18181c] p-2.5 sm:p-3 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-xs">
        {/* Alternador de Visualização: Funil Kanban ou Calendário */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-200/80 dark:bg-zinc-900 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setVisualizacao('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              visualizacao === 'kanban'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-600" />
            <span>Funil Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setVisualizacao('calendario')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              visualizacao === 'calendario'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-red-600" />
            <span>Visualização Calendário</span>
          </button>
        </div>

        {/* Controles Específicos do Calendário */}
        {visualizacao === 'calendario' ? (
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* Alternador Mensal / Semanal */}
            <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCalendarioModo('mes')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  calendarioModo === 'mes'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setCalendarioModo('semana')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  calendarioModo === 'semana'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Semanal
              </button>
            </div>

            {/* Navegação < Anterior | Hoje | Próximo > */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={navegarAnterior}
                className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                title="Período anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDataRef(new Date())}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={navegarProximo}
                className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                title="Próximo período"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Título do Período */}
            <span className="text-xs font-black text-zinc-900 dark:text-white min-w-[130px] text-right">
              {tituloPeriodo}
            </span>
          </div>
        ) : (
          /* Legenda de cores para o Kanban */
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Potencial</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Orçamento</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Aprovado</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pago</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-red-600"></span> Venda Futura</span>
          </div>
        )}
      </div>

      {/* 2. VISUALIZAÇÃO KANBAN (FUNIL) */}
      {visualizacao === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 sm:gap-4 w-full min-w-[1050px]">
            {ETAPAS.map((etapaDef) => {
              const Icon = etapaDef.icone;
              const opsEtapa = oportunidadesFiltradas.filter((o) => o.etapa === etapaDef.key);
              const totalEtapa = opsEtapa.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

              return (
                <div
                  key={etapaDef.key}
                  className="flex-1 min-w-[210px] bg-zinc-200/80 dark:bg-[#151518] rounded-2xl p-3 border border-zinc-300 dark:border-zinc-800 flex flex-col transition-all duration-200"
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-300/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${etapaDef.corBg}`} />
                      <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        {etapaDef.titulo}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                      {opsEtapa.length}
                    </span>
                  </div>

                  {/* Subtotal da Coluna */}
                  <div className="text-[11px] bg-zinc-100 dark:bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-300/70 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 mb-2.5 flex items-center justify-between">
                    <span>Subtotal:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {formatMoeda(totalEtapa)}
                    </strong>
                  </div>

                  {/* Cards das Oportunidades */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5">
                    {opsEtapa.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/30">
                        Nenhuma oportunidade nesta etapa.
                      </div>
                    ) : (
                      opsEtapa.map((op) => (
                        <div
                          key={op.id}
                          className="bg-white dark:bg-[#1d1d22] p-3 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-xs hover:shadow-md transition space-y-2.5 group relative"
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
                              <Calendar className="w-3.5 h-3.5" />
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
      )}

      {/* 3. VISUALIZAÇÃO CALENDÁRIO (MENSAL OU SEMANAL) */}
      {visualizacao === 'calendario' && (
        <div className="space-y-4">
          {/* Legenda de Cores do Calendário */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 py-2 bg-white dark:bg-[#18181c] rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Legenda de Etapas:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">Potencial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">Orçamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">Aprovado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">Pago</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-zinc-700 dark:text-zinc-300 font-bold text-[11px]">Venda Futura</span>
            </div>
          </div>

          {/* MODO MENSAL (Grade com Chips estilo Google Calendar) */}
          {calendarioModo === 'mes' && (
            <div className="bg-white dark:bg-[#18181c] rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-xs overflow-hidden">
              {/* Dias da Semana - Cabeçalho */}
              <div className="grid grid-cols-7 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-[#121215] text-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {diasNomesSemana.map((nome, i) => (
                  <div key={nome} className="py-2.5 border-r last:border-r-0 border-zinc-300 dark:border-zinc-800">
                    <span className="hidden sm:inline">{['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i]}</span>
                    <span className="sm:hidden">{nome}</span>
                  </div>
                ))}
              </div>

              {/* Grade de Dias */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
                {diasMatriz.map((slot, index) => {
                  const hojeYMD = formatToYMD(new Date());
                  const isHoje = slot.ymd === hojeYMD;
                  const opsNoDia = oportunidadesFiltradas.filter((o) => getOpDateString(o) === slot.ymd);

                  return (
                    <div
                      key={index}
                      className={`min-h-[105px] sm:min-h-[125px] p-1.5 flex flex-col transition ${
                        slot.noMes
                          ? 'bg-white dark:bg-[#18181c]'
                          : 'bg-zinc-100/60 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {/* Topo da Célula de Data */}
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span
                          className={`text-xs font-black flex items-center justify-center ${
                            isHoje
                              ? 'w-5 h-5 rounded-full bg-red-600 text-white shadow-2xs'
                              : slot.noMes
                              ? 'text-zinc-800 dark:text-zinc-200'
                              : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
                          {slot.data.getDate()}
                        </span>
                        {opsNoDia.length > 0 && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {opsNoDia.length}
                          </span>
                        )}
                      </div>

                      {/* Lista de Chips Pequenos - Estilo Google Calendar */}
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] pr-0.5">
                        {opsNoDia.slice(0, 3).map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => handleAbrirEditar(op)}
                            title={`${op.titulo} - ${op.cliente_nome} (${formatMoeda(Number(op.valor) || 0)})`}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs transition cursor-pointer ${getChipClasses(op.etapa)}`}
                          >
                            <span className="truncate flex-1">{op.cliente_nome || op.titulo}</span>
                            <span className="shrink-0 font-extrabold text-[9px]">{formatMoeda(Number(op.valor) || 0)}</span>
                          </button>
                        ))}
                        {opsNoDia.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              setDataRef(slot.data);
                              setCalendarioModo('semana');
                            }}
                            className="w-full text-left px-1 text-[9px] font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                          >
                            +{opsNoDia.length - 3} mais...
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODO SEMANAL (7 Colunas com Cards Detalhados) */}
          {calendarioModo === 'semana' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-[1050px]">
                {diasSemana.map((dia, idx) => {
                  const hojeYMD = formatToYMD(new Date());
                  const isHoje = dia.ymd === hojeYMD;
                  const opsNoDia = oportunidadesFiltradas.filter((o) => getOpDateString(o) === dia.ymd);
                  const subtotalDia = opsNoDia.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

                  return (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[210px] rounded-2xl p-3 border flex flex-col transition ${
                        isHoje
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 ring-2 ring-red-500/20'
                          : 'bg-zinc-200/80 dark:bg-[#151518] border-zinc-300 dark:border-zinc-800'
                      }`}
                    >
                      {/* Cabeçalho do Dia */}
                      <div className="pb-2 mb-2 border-b border-zinc-300/80 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                              {diasNomesSemana[dia.data.getDay()]}
                            </span>
                            <h4 className="font-black text-sm text-zinc-900 dark:text-white leading-tight">
                              {dia.data.getDate()} de {mesesNomes[dia.data.getMonth()]}
                            </h4>
                          </div>
                          {isHoje && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-600 text-white uppercase tracking-wider">
                              Hoje
                            </span>
                          )}
                        </div>

                        {/* Subtotal */}
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          <span>{opsNoDia.length} {opsNoDia.length === 1 ? 'oportunidade' : 'oportunidades'}</span>
                          <strong className="text-zinc-900 dark:text-white font-black">{formatMoeda(subtotalDia)}</strong>
                        </div>
                      </div>

                      {/* Lista de Cards daquele Dia */}
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
                        {opsNoDia.length === 0 ? (
                          <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/20">
                            Nenhum agendamento
                          </div>
                        ) : (
                          opsNoDia.map((op) => {
                            const etapaInfo = ETAPAS.find((e) => e.key === op.etapa);
                            return (
                              <div
                                key={op.id}
                                className="bg-white dark:bg-[#1d1d22] p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-xs hover:shadow-md transition space-y-2"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <h5
                                    onClick={() => handleAbrirEditar(op)}
                                    className="font-bold text-xs text-zinc-900 dark:text-white leading-snug cursor-pointer hover:text-red-600 transition"
                                  >
                                    {op.titulo}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEditar(op)}
                                    className="p-1 text-zinc-400 hover:text-blue-600 rounded transition cursor-pointer shrink-0"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{op.cliente_nome}</span>
                                  {op.cliente_telefone && (
                                    <a
                                      href={getWhatsAppUrl(op.cliente_telefone, op.cliente_nome)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 p-0.5 shrink-0"
                                      title="Conversar no WhatsApp"
                                    >
                                      <WhatsAppIcon className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>

                                <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                  <span className="font-black text-xs text-zinc-900 dark:text-white">
                                    {formatMoeda(Number(op.valor) || 0)}
                                  </span>
                                  {etapaInfo && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${etapaInfo.corBadge}`}>
                                      {etapaInfo.titulo}
                                    </span>
                                  )}
                                </div>

                                {/* Botão Criar Pedido */}
                                {onCriarNovoPedido && op.etapa !== 'pago' && !op.pedido_id && (
                                  <button
                                    type="button"
                                    onClick={() => onCriarNovoPedido(op.cliente_id || undefined, op.cliente_nome)}
                                    className="w-full mt-1 py-1 text-[10px] font-bold text-center rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>Criar Pedido deste Cliente</span>
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
