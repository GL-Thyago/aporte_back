"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClientes = exports.createCliente = void 0;
exports.deleteClienteService = deleteClienteService;
const prisma_1 = require("../utils/prisma");
const dayjs_1 = __importDefault(require("dayjs"));
const createCliente = async (data) => {
    const cliente = await prisma_1.prisma.c1_cliente.create({
        data: {
            c1_nome: data.c1_nome,
            c1_telefone: data.c1_telefone || null,
            c1_telefone2: data.c1_telefone2 || null,
            c1_email: data.c1_email || null,
            c1_tipo_do_comercio: data.c1_tipo_do_comercio || null,
            c1_endereco_comercio: data.c1_endereco_comercio || null,
            c1_endereco_residencial: data.c1_endereco_residencial || null,
            c1_status: "ativo",
            c1_caixa: 0,
        },
    });
    return cliente;
};
exports.createCliente = createCliente;
const listClientes = async () => {
    const hoje = (0, dayjs_1.default)().startOf("day").toDate();
    const clientes = await prisma_1.prisma.c1_cliente.findMany({
        include: {
            emprestimos: {
                include: {
                    parcelas: true,
                },
            },
        },
        orderBy: { c1_createdAt: "desc" },
    });
    return clientes.map((cliente) => {
        const parcelas = cliente.emprestimos.flatMap((e) => e.parcelas);
        const temAtrasadas = parcelas.some((p) => p.p1_status === "em aberto" && p.p1_data < hoje);
        const temHoje = parcelas.some((p) => p.p1_status === "em aberto" && (0, dayjs_1.default)(p.p1_data).isSame(hoje, "day"));
        const temEmAberto = parcelas.some((p) => p.p1_status === "em aberto");
        let statusGeral;
        if (temAtrasadas)
            statusGeral = "atrasado";
        else if (temHoje)
            statusGeral = "pagamento hoje";
        else if (temEmAberto)
            statusGeral = "em aberto";
        else
            statusGeral = "sem parcelas abertas";
        return {
            ...cliente,
            statusGeral,
        };
    });
};
exports.listClientes = listClientes;
async function deleteClienteService(clienteId) {
    // 1. verifica se cliente existe
    const cliente = await prisma_1.prisma.c1_cliente.findUnique({
        where: { c1_id: clienteId },
    });
    if (!cliente) {
        const error = new Error("Cliente não encontrado");
        error.statusCode = 404;
        throw error;
    }
    // 2. verifica se o cliente tem empréstimos em aberto
    const emprestimosAbertos = await prisma_1.prisma.e1_emprestimo.count({
        where: {
            c1_id: clienteId,
            e1_status: "em aberto", // status dos empréstimos
        },
    });
    if (emprestimosAbertos > 0) {
        const error = new Error("Não é possível deletar: o cliente possui empréstimos em aberto.");
        error.statusCode = 400;
        throw error;
    }
    // 3. verifica se existem parcelas em aberto (de qualquer empréstimo dele)
    const parcelasAbertas = await prisma_1.prisma.p1_parcela.count({
        where: {
            emprestimo: { c1_id: clienteId }, // usando relação para achar as parcelas do cliente
            p1_status: "em aberto",
        },
    });
    if (parcelasAbertas > 0) {
        const error = new Error("Não é possível deletar: o cliente possui parcelas em aberto.");
        error.statusCode = 400;
        throw error;
    }
    // 4. se passou nas verificações, deleta o cliente
    await prisma_1.prisma.c1_cliente.delete({
        where: { c1_id: clienteId },
    });
    return { message: "Cliente deletado com sucesso." };
}
