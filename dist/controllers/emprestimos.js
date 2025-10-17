"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarEmprestimo = criarEmprestimo;
exports.listEmprestimosPorCliente = listEmprestimosPorCliente;
exports.listEmprestimosAtivos = listEmprestimosAtivos;
exports.pagarParcela = pagarParcela;
exports.relatorioHome = relatorioHome;
const emprestimos_1 = require("../services/emprestimos");
const prisma_1 = require("../utils/prisma"); // seu client Prisma
const library_1 = require("@prisma/client/runtime/library");
const dayjs_1 = __importDefault(require("dayjs"));
// ------------------- CRIAR EMPRÉSTIMO -------------------
async function criarEmprestimo(req, res) {
    try {
        const { cliente_id, tipo, valor, juros, parcelas, data_inicial, dias } = req.body;
        if (!cliente_id || !tipo || !valor || !juros || !parcelas || !data_inicial) {
            return res.status(400).json({ message: "Campos obrigatórios faltando" });
        }
        const emprestimo = await (0, emprestimos_1.criarEmprestimoService)({
            cliente_id: Number(cliente_id),
            tipo,
            valor: Number(valor),
            juros: Number(juros),
            parcelas: Number(parcelas),
            data_inicial,
            dias: dias || [],
        });
        return res.status(201).json({ message: "Empréstimo criado com sucesso", emprestimo });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}
// ------------------- LISTAR EMPRÉSTIMOS POR CLIENTE -------------------
async function listEmprestimosPorCliente(req, res) {
    try {
        const clienteId = Number(req.params.id);
        const emprestimos = await prisma_1.prisma.e1_emprestimo.findMany({
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
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}
// ------------------- LISTAR EMPRÉSTIMOS DE CLIENTES ATIVOS -------------------
async function listEmprestimosAtivos(req, res) {
    console.log("atualizado");
    try {
        const emprestimos = await prisma_1.prisma.e1_emprestimo.findMany({
            where: {
                cliente: { is: { c1_status: "ativo" } },
            },
            include: { cliente: true, parcelas: true },
            orderBy: { e1_data_inicial: "desc" },
        });
        const dados = emprestimos.map((e) => {
            const totalParcelasValor = e.parcelas.reduce((sum, p) => sum + Number(p.p1_valor), 0);
            // console.log(dados);
            const quitadas = e.parcelas.filter((p) => p.p1_status === "pago");
            const atrasadas = e.parcelas.filter((p) => p.p1_status === "atrasado");
            const emAberto = e.parcelas.filter((p) => p.p1_status !== "pago" && p.p1_status !== "atrasado");
            const rec_amort = quitadas.reduce((sum, p) => sum + Number(p.p1_valor), 0);
            const juros_valor = (Number(e.e1_valor_inicial) * Number(e.e1_porcentagem)) / 100;
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
                quitadas: quitadas.length, // contagem de pagas
                atrasadas: atrasadas.length, // contagem de atrasadas
                emAberto: emAberto.length, // contagem de em aberto
                rec_amort,
                rec_juros: juros_valor,
                divida_atual,
                parcelas: e.parcelas, // lista completa de parcelas
            };
        });
        return res.json(dados);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}
async function pagarParcela(req, res) {
    const { parcelaId, valorPago, juros } = req.body;
    if (!parcelaId || valorPago === undefined || juros === undefined) {
        return res.status(400).json({ error: "Parâmetros obrigatórios faltando." });
    }
    try {
        const parcela = await prisma_1.prisma.p1_parcela.findUnique({
            where: { p1_id: parcelaId },
            include: {
                emprestimo: true,
            },
        });
        if (!parcela)
            return res.status(404).json({ error: "Parcela não encontrada." });
        const valorParcela = new library_1.Decimal(parcela.p1_valor);
        const valorPagoDecimal = new library_1.Decimal(valorPago);
        const jurosDecimal = new library_1.Decimal(juros);
        await prisma_1.prisma.p1_parcela.update({
            where: { p1_id: parcelaId },
            data: {
                p1_status: "pago",
                p1_updatedAt: new Date(),
            },
        });
        if (valorPagoDecimal.lt(valorParcela)) {
            const valorDiferenca = valorParcela.minus(valorPagoDecimal);
            const jurosSobreDiferenca = valorDiferenca.mul(jurosDecimal.div(100));
            const valorNovaParcela = valorDiferenca.plus(jurosSobreDiferenca);
            const ultimaParcela = await prisma_1.prisma.p1_parcela.findFirst({
                where: { p1_id: parcela.p1_id },
                orderBy: { p1_data: "desc" },
            });
            // ➕ Calcular a nova data com base no tipo do empréstimo
            let novaDataParcela;
            const tipo = parcela.emprestimo.e1_tipo;
            if (tipo === "mensal") {
                novaDataParcela = ultimaParcela
                    ? (0, dayjs_1.default)(ultimaParcela.p1_data).add(1, "month").toDate()
                    : (0, dayjs_1.default)().add(1, "month").toDate();
            }
            else {
                // diário por padrão
                novaDataParcela = ultimaParcela
                    ? (0, dayjs_1.default)(ultimaParcela.p1_data).add(1, "day").toDate()
                    : (0, dayjs_1.default)().add(1, "day").toDate();
            }
            // ➕ Criar nova parcela
            await prisma_1.prisma.p1_parcela.create({
                data: {
                    p1_id_emprestimo: parcela.p1_id_emprestimo,
                    p1_data: novaDataParcela,
                    p1_status: "em aberto",
                    p1_valor: valorNovaParcela.toNumber(),
                },
            });
            // ➕ Atualizar valor final do empréstimo
            await prisma_1.prisma.e1_emprestimo.update({
                where: { e1_id: parcela.p1_id_emprestimo },
                data: {
                    e1_valor_final: new library_1.Decimal(parcela.emprestimo.e1_valor_final).plus(valorNovaParcela),
                },
            });
        }
        return res.status(200).json({ message: "Parcela paga com sucesso." });
    }
    catch (error) {
        console.error("Erro ao pagar parcela:", error);
        return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
    }
}
async function relatorioHome(req, res) {
    try {
        // ========================
        // CLIENTES
        // ========================
        const totalClientes = await prisma_1.prisma.c1_cliente.count({
            where: { c1_status: "ativo" },
        });
        // ========================
        // CAIXA
        // ========================
        const totalCaixa = await prisma_1.prisma.c1_cliente.aggregate({
            _sum: { c1_caixa: true },
        });
        // ========================
        // EMPRÉSTIMOS
        // ========================
        const totalEmprestimos = await prisma_1.prisma.e1_emprestimo.count();
        const emprestimosAbertos = await prisma_1.prisma.e1_emprestimo.count({
            where: { e1_status: "em aberto" },
        });
        const emprestimosAtrasados = await prisma_1.prisma.e1_emprestimo.count({
            where: { e1_status: "atrasado" },
        });
        const emprestimosPagos = await prisma_1.prisma.e1_emprestimo.count({
            where: { e1_status: "pago" },
        });
        // ========================
        // PARCELAS
        // ========================
        const parcelasAbertas = await prisma_1.prisma.p1_parcela.count({
            where: { p1_status: "em aberto" },
        });
        const parcelasPagas = await prisma_1.prisma.p1_parcela.count({
            where: { p1_status: "pago" },
        });
        const parcelasAtrasadas = await prisma_1.prisma.p1_parcela.count({
            where: { p1_status: "atrasado" },
        });
        // ========================
        // LANÇAMENTOS FINANCEIROS DO DIA
        // ========================
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        const lancamentosEntradaHoje = await prisma_1.prisma.l1_lancamento.aggregate({
            _sum: { valor: true },
            where: {
                tipo: "entrada",
                data_lancamento: {
                    gte: hoje,
                    lt: amanha,
                },
            },
        });
        const lancamentosSaidaHoje = await prisma_1.prisma.l1_lancamento.aggregate({
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
        const emprestimosUltimos7Dias = await prisma_1.prisma.e1_emprestimo.groupBy({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao gerar relatório home" });
    }
}
