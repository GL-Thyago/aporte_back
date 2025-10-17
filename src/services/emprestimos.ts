// src/services/emprestimos.ts

import { prisma } from "../utils/prisma";
import { addDays } from "date-fns";

// Map com dias da semana e seus números correspondentes (0 = Domingo)
const mapDias: Record<
  "Domingo" | "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado",
  number
> = {
  Domingo: 0,
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
};

export async function criarEmprestimoService({
  cliente_id,
  tipo,
  valor,
  juros,
  parcelas,
  data_inicial,
  dias,
}: {
  cliente_id: number;
  tipo: "mensal" | "diário"; // restringe para tipos válidos
  valor: number;
  juros: number;
  parcelas: number;
  data_inicial: string; // formato "YYYY-MM-DD"
  dias: Array<keyof typeof mapDias>; // só aceita dias válidos
}) {
  // 1️⃣ Calcular valor final (com juros)
  const valorFinal = valor + valor * (juros / 100);

  // 2️⃣ Criar o empréstimo no banco
  const emprestimo = await prisma.e1_emprestimo.create({
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
      if (i > 0) dataParcela = addDays(dataParcela, 30);
    await prisma.p1_parcela.create({
  data: {
    p1_data: dataParcela,
    p1_valor: valorParcela,
    emprestimo: {
      connect: { e1_id: emprestimo.e1_id },
    },
  },
});

    }
  } else {
    // tipo diário
    const valorParcela = valorFinal / parcelas;
    let data = new Date(data_inicial);
    let count = 0;

    // converte dias em números para comparação com getDay()
    const diasNumericosSelecionados = dias.map((d) => mapDias[d]);

    while (count < parcelas) {
      const diaSemana = data.getDay();
      if (diasNumericosSelecionados.includes(diaSemana)) {
        await prisma.p1_parcela.create({
          data: {
             emprestimo: {
      connect: { e1_id: emprestimo.e1_id },
    },
            p1_data: data,
            p1_valor: valorParcela,
          },
        });
        count++;
      }
      data = addDays(data, 1);
    }
  }

  return emprestimo;
}
