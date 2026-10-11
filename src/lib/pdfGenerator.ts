import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pedido } from './types';
import { LOGO_BASE64, ASSINATURA_BASE64 } from './pdfAssets';

export function getPdfFilename(numeroPedido: number | string): string {
  const numStr = String(numeroPedido).padStart(8, '0');
  return `pedido_${numStr}.pdf`;
}

export function formatMoeda(val: number | string | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDatePtBr(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function generatePedidoPdf(pedido: Pedido): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2); // 190mm

  let yPos = 10;

  // 1. CABEÇALHO DA EMPRESA (Tabela 0 do template oficial)
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      cellPadding: 1.5,
      fontSize: 9,
      textColor: [20, 20, 20],
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    tableLineColor: [120, 120, 120],
    tableLineWidth: 0.3,
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 73 },
      2: { cellWidth: 73 },
    },
    body: [
      [
        { content: '', rowSpan: 4 },
        {
          content: 'EXECUÇÃO DE PROJETOS - AVCB\nRECARGAS DE EXTINTORES\nManutenção em Equipamentos de Combate a Incêndio',
          colSpan: 2,
          styles: { halign: 'center', fontStyle: 'bold', fontSize: 9.5 },
        },
      ],
      [
        { content: 'CNPJ: 48.080.460/0001-01', styles: { halign: 'center' } },
        { content: 'Insc. Municipal: 802539', styles: { halign: 'center' } },
      ],
      [
        { content: 'Rua Ari Nogueira, 99, Paulo VI - Cons. Lafaiete - MG', colSpan: 2, styles: { halign: 'center' } },
      ],
      [
        { content: 'CEP: 36406-161', styles: { halign: 'center' } },
        { content: 'PIX: ml.gomesilva@gmail.com', styles: { halign: 'center', fontStyle: 'bold' } },
      ],
    ],
    didDrawCell: (data) => {
      // Inserir logotipo perfeitamente centralizado vertical e horizontalmente dentro da célula
      if (data.row.index === 0 && data.column.index === 0 && LOGO_BASE64) {
        try {
          const logoW = 31;
          const logoH = 31;
          const posX = data.cell.x + (data.cell.width - logoW) / 2;
          const posY = data.cell.y + (data.cell.height - logoH) / 2;
          doc.addImage(LOGO_BASE64, 'PNG', posX, posY, logoW, logoH);
        } catch (err) {
          console.error('Erro ao renderizar logo no PDF:', err);
        }
      }
    },
  });

  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  yPos = doc.lastAutoTable.finalY + 4;

  // 2. DADOS DO PEDIDO E CLIENTE (Tabela 1 com larguras FIXAS)
  const dataFormatada = formatDatePtBr(pedido.data_pedido);
  const clienteNome = pedido.nome_empresa || 'Cliente não identificado';
  const responsavel = pedido.nome_contato ? `Responsável: ${pedido.nome_contato}` : 'Responsável:';
  const cnpj = pedido.cnpj ? `CNPJ: ${pedido.cnpj}` : 'CNPJ:';
  const endereco = pedido.endereco ? `Endereço: ${pedido.endereco}` : 'Endereço:';
  const cidadeUf = (pedido.cidade || pedido.uf) ? `Cidade/UF: ${pedido.cidade || ''} / ${pedido.uf || ''}` : 'Cidade/UF:';
  const telefone = pedido.telefone_whatsapp ? `Telefone: ${pedido.telefone_whatsapp}` : 'Telefone:';

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      cellPadding: 2,
      fontSize: 9,
      textColor: [20, 20, 20],
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    tableLineColor: [120, 120, 120],
    tableLineWidth: 0.3,
    // FIXAÇÃO RIGOROSA DAS COLUNAS: Garante que as linhas divisórias nunca se desloquem
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 70 },
    },
    body: [
      [
        { content: `Número do Pedido: ${pedido.numero_pedido}`, styles: { fontStyle: 'bold' } },
        { content: `Data: ${dataFormatada}`, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: `Cliente: ${clienteNome}`, colSpan: 2, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: responsavel },
        { content: cnpj },
      ],
      [
        { content: endereco, colSpan: 2 },
      ],
      [
        { content: cidadeUf },
        { content: telefone },
      ],
    ],
  });

  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  yPos = doc.lastAutoTable.finalY + 4;

  // 3. TABELA DE ITENS DO PEDIDO COM COLUNAS FIXAS
  const itens = pedido.itens || [];
  // Se não houver itens cadastrados, cria linha ilustrativa com o valor total
  const itensRows = itens.length > 0
    ? itens.map((item) => [
        item.descricao_item || 'Item de Serviço / Produto',
        { content: String(item.quantidade), styles: { halign: 'center' as const } },
        { content: formatMoeda(item.valor_unitario), styles: { halign: 'right' as const } },
        { content: formatMoeda(item.valor_total_item), styles: { halign: 'right' as const } },
      ])
    : [
        [
          'Serviços de Recarga e Manutenção de Extintores de Incêndio',
          { content: '1', styles: { halign: 'center' as const } },
          { content: formatMoeda(pedido.valor_total), styles: { halign: 'right' as const } },
          { content: formatMoeda(pedido.valor_total), styles: { halign: 'right' as const } },
        ],
      ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      cellPadding: 2,
      fontSize: 8.5,
      textColor: [20, 20, 20],
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    tableLineColor: [120, 120, 120],
    tableLineWidth: 0.3,
    columnStyles: {
      0: { cellWidth: 102, halign: 'left' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
    },
    head: [
      [
        { content: 'Descrição do Item', styles: { halign: 'left' } },
        { content: 'Quantidade', styles: { halign: 'center' } },
        { content: 'Valor Unitário', styles: { halign: 'right' } },
        { content: 'Total do Item', styles: { halign: 'right' } },
      ],
    ],
    body: itensRows,
  });

  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  yPos = doc.lastAutoTable.finalY + 4;

  // 4. QUADRO DE VALOR TOTAL DO PEDIDO
  // Alinhado à direita, iniciando bem próximo do começo do texto sem esticar por toda a página
  const totalTableWidth = 78;
  const totalTableLeft = (pageWidth - margin) - totalTableWidth; // Inicia em 200 - 78 = 122mm

  autoTable(doc, {
    startY: yPos,
    margin: { left: totalTableLeft, right: margin },
    tableWidth: totalTableWidth,
    theme: 'plain',
    styles: {
      cellPadding: 2.5,
      fontSize: 9.5,
      textColor: [20, 20, 20],
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    tableLineColor: [120, 120, 120],
    tableLineWidth: 0.3,
    columnStyles: {
      0: { cellWidth: 46, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [180, 0, 0] },
    },
    body: [
      [
        { content: 'Valor Total do Pedido:' },
        { content: formatMoeda(pedido.valor_total) },
      ],
    ],
  });

  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  yPos = doc.lastAutoTable.finalY + 4;

  // 5. OBSERVAÇÕES
  const obsTexto = pedido.observacoes && pedido.observacoes.trim() !== ''
    ? pedido.observacoes
    : 'Equipamentos revisados conforme normas ABNT NBR 12962. Garantia contra defeitos de fabricação.';

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    styles: {
      cellPadding: 2.5,
      fontSize: 8.5,
      textColor: [40, 40, 40],
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    tableLineColor: [120, 120, 120],
    tableLineWidth: 0.3,
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    head: [['Observações']],
    body: [[obsTexto]],
  });

  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  yPos = doc.lastAutoTable.finalY + 8;

  // 6. ÁREA DE ASSINATURA OFICIAL (Template)
  if (ASSINATURA_BASE64) {
    try {
      const sigWidth = 45;
      const sigHeight = 18;
      const sigX = (pageWidth - sigWidth) / 2;
      doc.addImage(ASSINATURA_BASE64, 'PNG', sigX, yPos, sigWidth, sigHeight);
      yPos += sigHeight + 1;
    } catch (err) {
      console.error('Erro ao renderizar assinatura no PDF:', err);
    }
  }

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line((pageWidth - 70) / 2, yPos, (pageWidth + 70) / 2, yPos);
  yPos += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('Mário Luiz Gomes da Silva', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Execução de Projetos - AVCB / Recargas de Extintores', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

/**
 * Faz o download do PDF com o nome especificado (ex: pedido_01290821.pdf)
 */
export function downloadPedidoPdf(pedido: Pedido): void {
  const doc = generatePedidoPdf(pedido);
  const filename = getPdfFilename(pedido.numero_pedido);
  doc.save(filename);
}

/**
 * Abre o PDF gerado diretamente em uma nova aba para visualização/impressão
 */
export function openPedidoPdf(pedido: Pedido): void {
  const doc = generatePedidoPdf(pedido);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
