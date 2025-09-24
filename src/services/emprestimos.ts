import { prisma } from "../utils/prisma"; // ajuste caminho
import { addDays, format, } from "date-fns";
import { ptBR } from "date-fns/locale";

const mapDias = {
  "Domingo": 0,
  "Segunda": 1,
  "Terça": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
  "Sábado": 6,
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
  tipo: string;
  valor: number;
  juros: number;
  parcelas: number;
  data_inicial: string; // "YYYY-MM-DD"
  dias: string[];
}) {
  // 1. calcular valor final (juros)
  const valorFinal = valor + (valor * (juros / 100));

  // 2. criar o empréstimo
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

  // 3. gerar parcelas
  if (tipo === "mensal") {
    // simplesmente +30 dias para cada parcela
    const valorParcela = valorFinal / parcelas;
    let dataParcela = new Date(data_inicial);

    for (let i = 0; i < parcelas; i++) {
      if (i > 0) dataParcela = addDays(dataParcela, 30);
      await prisma.p1_parcela.create({
        data: {
          e1_id: emprestimo.e1_id,
          p1_data: dataParcela,
          p1_valor: valorParcela,
        },
      });
    }
  } else {
    // tipo diário – usa dias da semana selecionados
    const valorParcela = valorFinal / parcelas;
    let data = new Date(data_inicial);
    let count = 0;

    while (count < parcelas) {
      const diaSemana = data.getDay(); // 0=Dom,1=Seg,...
      // verifica se diaSemana está no array dias
      const diasNumericosSelecionados = dias.map((d) => mapDias[d]);
      if (diasNumericosSelecionados.includes(diaSemana)) {
        await prisma.p1_parcela.create({
          data: {
            e1_id: emprestimo.e1_id,
            p1_data: data,
            p1_valor: valorParcela,
          },
        });
        count++;
      }
      data = addDays(data, 1); // vai para próximo dia
    }
  }

  return emprestimo;
}
