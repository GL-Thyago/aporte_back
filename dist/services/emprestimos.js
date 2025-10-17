"use strict";
// src/services/emprestimos.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarEmprestimoService = criarEmprestimoService;
const prisma_1 = require("../utils/prisma");
const date_fns_1 = require("date-fns");
// Map com dias da semana e seus números correspondentes (0 = Domingo)
const mapDias = {
    Domingo: 0,
    Segunda: 1,
    Terça: 2,
    Quarta: 3,
    Quinta: 4,
    Sexta: 5,
    Sábado: 6,
};
async function criarEmprestimoService({ cliente_id, tipo, valor, juros, parcelas, data_inicial, dias, }) {
    // 1️⃣ Calcular valor final (com juros)
    const valorFinal = valor + valor * (juros / 100);
    // 2️⃣ Criar o empréstimo no banco
    const emprestimo = await prisma_1.prisma.e1_emprestimo.create({
        data: {
            c1_id: cliente_id,
            e1_data_inicial: new Date(data_inicial),
            e1_tipo: tipo,
            e1_valor_inicial: valor,
            e1_valor_final: valorFinal,
            e1_porcentagem: juros,
        },
    });
    // 3️⃣ Gerar parcelas
    if (tipo === "mensal") {
        const valorParcela = valorFinal / parcelas;
        let dataParcela = new Date(data_inicial);
        for (let i = 0; i < parcelas; i++) {
            if (i > 0)
                dataParcela = (0, date_fns_1.addDays)(dataParcela, 30);
            await prisma_1.prisma.p1_parcela.create({
                data: {
                    p1_id_emprestimo: emprestimo.e1_id,
                    p1_data: dataParcela,
                    p1_valor: valorParcela,
                },
            });
        }
    }
    else {
        // tipo diário
        const valorParcela = valorFinal / parcelas;
        let data = new Date(data_inicial);
        let count = 0;
        // converte dias em números para comparação com getDay()
        const diasNumericosSelecionados = dias.map((d) => mapDias[d]);
        while (count < parcelas) {
            const diaSemana = data.getDay();
            if (diasNumericosSelecionados.includes(diaSemana)) {
                await prisma_1.prisma.p1_parcela.create({
                    data: {
                        p1_id_emprestimo: emprestimo.e1_id,
                        p1_data: data,
                        p1_valor: valorParcela,
                    },
                });
                count++;
            }
            data = (0, date_fns_1.addDays)(data, 1);
        }
    }
    return emprestimo;
}
