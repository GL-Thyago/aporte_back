import { Request, Response } from "express";
import { criarEmprestimoService } from "../services/emprestimos";
import { prisma } from "../utils/prisma"; // seu client Prisma
import { Decimal } from "@prisma/client/runtime/library";
import dayjs from "dayjs";

// ------------------- CRIAR EMPRÉSTIMO -------------------
export async function criarEmprestimo(req: Request, res: Response) {
  try {
    const { cliente_id, tipo, valor, juros, parcelas, data_inicial, dias } = req.body;

    if (!cliente_id || !tipo || !valor || !juros || !parcelas || !data_inicial) {
      return res.status(400).json({ message: "Campos obrigatórios faltando" });
    }

    const emprestimo = await criarEmprestimoService({
      cliente_id: Number(cliente_id),
      tipo,
      valor: Number(valor),
      juros: Number(juros),
      parcelas: Number(parcelas),
      data_inicial,
      dias: dias || [],
    });

    return res.status(201).json({ message: "Empréstimo criado com sucesso", emprestimo });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

// ------------------- LISTAR EMPRÉSTIMOS POR CLIENTE -------------------
export async function listEmprestimosPorCliente(req: Request, res: Response) {
  try {
    const clienteId = Number(req.params.id);

    const emprestimos = await prisma.e1_emprestimo.findMany({
      where: { c1_id: clienteId },
      include: { cliente: true, parcelas: true },
      orderBy: { e1_data_inicial: "desc" },
    });
    
    const dados = emprestimos.map((e) => {
  const quitadas = e.parcelas.filter(p => p.p1_status === "pago").length;
  const rec_amort = e.parcelas
    .filter(p => p.p1_status === "pago")
    .reduce((sum, p) => sum + Number(p.p1_valor), 0);
  const atrasado = e.parcelas
    .filter(p => p.p1_status === "atrasado")
    .reduce((sum, p) => sum + Number(p.p1_valor), 0);

  const juros_valor = (Number(e.e1_valor_inicial) * Number(e.e1_porcentagem)) / 100;
  const divida_atual = Number(e.e1_valor_final) - rec_amort;

  return {
    id: e.e1_id,
    data: e.e1_data_inicial,
    nome_cliente: e.cliente.c1_nome,
    valor_emprestimo: Number(e.e1_valor_inicial),
    juros: Number(e.e1_porcentagem),
    juros_valor,
    divida_total: Number(e.e1_valor_final),
    multa: 0,
    parcelas: e.parcelas.length,
    quitadas,
    rec_amort,
    rec_juros: juros_valor,
    atrasado,
    divida_atual,
    // devolve as parcelas individuais:
    lista_parcelas: e.parcelas.map(p => ({
      id: p.p1_id,
      valor: Number(p.p1_valor),
      status: p.p1_status,
      data_vencimento: p.p1_data
    }))
  };
});
    
    return res.json(dados);
} catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
}
}

// ------------------- LISTAR EMPRÉSTIMOS DE CLIENTES ATIVOS -------------------
export async function listEmprestimosAtivos(req: Request, res: Response) {
  console.log("atualizado")
  try {
    const emprestimos = await prisma.e1_emprestimo.findMany({
      where: {
        cliente: { is: { c1_status: "ativo" } },
      },
      include: { cliente: true, parcelas: true },
      orderBy: { e1_data_inicial: "desc" },
    });

    const dados = emprestimos.map((e) => {
      const totalParcelasValor = e.parcelas.reduce(
        (sum, p) => sum + Number(p.p1_valor),
        0
      );
  // console.log(dados);

      const quitadas = e.parcelas.filter((p) => p.p1_status === "pago");
      const atrasadas = e.parcelas.filter((p) => p.p1_status === "atrasado");
      const emAberto = e.parcelas.filter(
        (p) => p.p1_status !== "pago" && p.p1_status !== "atrasado"
      );

      const rec_amort = quitadas.reduce((sum, p) => sum + Number(p.p1_valor), 0);
      const juros_valor =
        (Number(e.e1_valor_inicial) * Number(e.e1_porcentagem)) / 100;
      const divida_atual = totalParcelasValor - rec_amort;

      return {
        id: e.e1_id,
        data: e.e1_data_inicial,
        nome_cliente: e.cliente.c1_nome,
        valor_emprestimo: Number(e.e1_valor_inicial),
        juros: Number(e.e1_porcentagem),
        juros_valor,
        divida_total: totalParcelasValor,
        multa: 0,
        total_parcelas: e.parcelas.length,
        quitadas: quitadas.length,        // contagem de pagas
        atrasadas: atrasadas.length,      // contagem de atrasadas
        emAberto: emAberto.length,        // contagem de em aberto
        rec_amort,
        rec_juros: juros_valor,
        divida_atual,
        parcelas: e.parcelas,             // lista completa de parcelas
      };
    });

    return res.json(dados);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

export async function pagarParcela(req: Request, res: Response) {
  const { parcelaId, valorPago, juros } = req.body;

  if (!parcelaId || valorPago === undefined || juros === undefined) {
    return res.status(400).json({ error: "Parâmetros obrigatórios faltando." });
  }

  try {
    const parcela = await prisma.p1_parcela.findUnique({
      where: { p1_id: parcelaId },
      include: {
        emprestimo: true,
      },
    });

    if (!parcela) return res.status(404).json({ error: "Parcela não encontrada." });

    const valorParcela = new Decimal(parcela.p1_valor);
    const valorPagoDecimal = new Decimal(valorPago);
    const jurosDecimal = new Decimal(juros);

    // Atualiza a parcela original como paga
    await prisma.p1_parcela.update({
      where: { p1_id: parcelaId },
      data: {
        p1_status: "pago",
        p1_updatedAt: new Date(),
      },
    });

    // Se o valor pago for menor que o valor da parcela, cria nova parcela com juros
    if (valorPagoDecimal.lt(valorParcela)) {
      const valorDiferenca = valorParcela.minus(valorPagoDecimal);

      const jurosSobreDiferenca = valorDiferenca.mul(jurosDecimal.div(100));
      const valorNovaParcela = valorDiferenca.plus(jurosSobreDiferenca);

      // ➕ Encontrar a última parcela do empréstimo
      const ultimaParcela = await prisma.p1_parcela.findFirst({
        where: { p1_id_empretimo: parcela.e1_id },
        orderBy: { p1_data: "desc" },
      });

      // ➕ Calcular a nova data com base no tipo do empréstimo
      let novaDataParcela: Date;
      const tipo = parcela.emprestimo.e1_tipo;

      if (tipo === "mensal") {
        novaDataParcela = ultimaParcela
          ? dayjs(ultimaParcela.p1_data).add(1, "month").toDate()
          : dayjs().add(1, "month").toDate();
      } else {
        // diário por padrão
        novaDataParcela = ultimaParcela
          ? dayjs(ultimaParcela.p1_data).add(1, "day").toDate()
          : dayjs().add(1, "day").toDate();
      }

      // ➕ Criar nova parcela
      await prisma.p1_parcela.create({
        data: {
          p1_id_emprestimo: parcela.e1_id,
          p1_data: novaDataParcela,
          p1_status: "em aberto",
          p1_valor: valorNovaParcela.toNumber(),
        },
      });

      // ➕ Atualizar valor final do empréstimo
      await prisma.e1_emprestimo.update({
        where: { e1_id: parcela.e1_id },
        data: {
          e1_valor_final: new Decimal(parcela.emprestimo.e1_valor_final).plus(valorNovaParcela),
        },
      });
    }

    return res.status(200).json({ message: "Parcela paga com sucesso." });

  } catch (error) {
    console.error("Erro ao pagar parcela:", error);
    return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
  }
}

export async function relatorioHome(req: Request, res: Response) {
  try {
    // ========================
    // CLIENTES
    // ========================
    const totalClientes = await prisma.c1_cliente.count({
      where: { c1_status: "ativo" },
    });

    // ========================
    // CAIXA
    // ========================
    const totalCaixa = await prisma.c1_cliente.aggregate({
      _sum: { c1_caixa: true },
    });

    // ========================
    // EMPRÉSTIMOS
    // ========================
    const totalEmprestimos = await prisma.e1_emprestimo.count();
    const emprestimosAbertos = await prisma.e1_emprestimo.count({
      where: { e1_status: "em aberto" },
    });
    const emprestimosAtrasados = await prisma.e1_emprestimo.count({
      where: { e1_status: "atrasado" },
    });
    const emprestimosPagos = await prisma.e1_emprestimo.count({
      where: { e1_status: "pago" },
    });

    // ========================
    // PARCELAS
    // ========================
    const parcelasAbertas = await prisma.p1_parcela.count({
      where: { p1_status: "em aberto" },
    });
    const parcelasPagas = await prisma.p1_parcela.count({
      where: { p1_status: "pago" },
    });
    const parcelasAtrasadas = await prisma.p1_parcela.count({
      where: { p1_status: "atrasado" },
    });

    // ========================
    // LANÇAMENTOS FINANCEIROS DO DIA
    // ========================
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const lancamentosEntradaHoje = await prisma.l1_lancamento.aggregate({
      _sum: { valor: true },
      where: {
        tipo: "entrada",
        data_lancamento: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    const lancamentosSaidaHoje = await prisma.l1_lancamento.aggregate({
      _sum: { valor: true },
      where: {
        tipo: "saida",
        data_lancamento: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    // ========================
    // EMPRÉSTIMOS DOS ÚLTIMOS 7 DIAS (para gráfico)
    // ========================
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);

    const emprestimosUltimos7Dias = await prisma.e1_emprestimo.groupBy({
      by: ["e1_data_inicial"],
      _count: { e1_id: true },
      where: {
        e1_data_inicial: {
          gte: seteDiasAtras,
        },
      },
      orderBy: {
        e1_data_inicial: "asc",
      },
    });

    res.json({
      clientes: {
        total: totalClientes,
      },
      caixa: {
        total: totalCaixa._sum.c1_caixa ?? 0,
      },
      emprestimos: {
        total: totalEmprestimos,
        abertos: emprestimosAbertos,
        atrasados: emprestimosAtrasados,
        pagos: emprestimosPagos,
      },
      parcelas: {
        abertas: parcelasAbertas,
        pagas: parcelasPagas,
        atrasadas: parcelasAtrasadas,
      },
      lancamentosHoje: {
        entrada: lancamentosEntradaHoje._sum.valor ?? 0,
        saida: lancamentosSaidaHoje._sum.valor ?? 0,
      },
      graficoEmprestimos: emprestimosUltimos7Dias.map(item => ({
        data: item.e1_data_inicial,
        quantidade: item._count.e1_id,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao gerar relatório home" });
  }
}