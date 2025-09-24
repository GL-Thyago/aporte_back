"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarEmprestimo = criarEmprestimo;
exports.listEmprestimosPorCliente = listEmprestimosPorCliente;
exports.listEmprestimosAtivos = listEmprestimosAtivos;
const emprestimos_1 = require("../services/emprestimos");
const prisma_1 = require("../utils/prisma"); // seu client Prisma
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
    try {
        const emprestimos = await prisma_1.prisma.e1_emprestimo.findMany({
            where: { cliente: { c1_status: "ativo" } },
            include: { cliente: true, parcelas: true },
            orderBy: { e1_data_inicial: "desc" },
        });
        const dados = emprestimos.map((e) => {
            const quitadas = e.parcelas.filter(p => p.p1_status === "pago").length;
            const rec_amort = e.parcelas.filter(p => p.p1_status === "pago").reduce((sum, p) => sum + Number(p.p1_valor), 0);
            const atrasado = e.parcelas.filter(p => p.p1_status === "atrasado").reduce((sum, p) => sum + Number(p.p1_valor), 0);
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
            };
        });
        return res.json(dados);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}
