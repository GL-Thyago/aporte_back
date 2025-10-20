import { prisma } from "../utils/prisma";
import dayjs from "dayjs";

interface LancamentoData {
  tipo: "entrada" | "saida" | "pagamento_cliente";
  valor: number;
  descricao: string;
  id: number
  id_parcela: number | null;
}

interface LancamentoCaixAdm {
  tipoEntradaSaida: "entrada" | "saida";
  valor: number;
}

export const caixaAdm = async (data: LancamentoCaixAdm) => {
  const adm = await prisma.f1_colaborador.findFirst({
    where: { f1_cargo: "adm" },
  });

  if (!adm) {
    throw new Error("Nenhum colaborador com cargo ADM encontrado.");
  }

  const valorAtual = Number(adm.f1_caixa);

  if (data.tipoEntradaSaida === "saida" && valorAtual < data.valor) {
    throw new Error("Dinheiro em caixa insuficiente para realizar esta operação.");
  }

  const novoValorCaixa =
    data.tipoEntradaSaida === "entrada"
      ? valorAtual + data.valor
      : valorAtual - data.valor;

  await prisma.f1_colaborador.update({
    where: { f1_id: adm.f1_id },
    data: {
      f1_caixa: novoValorCaixa,
    },
  });

  return { novoValorCaixa, f1_id: adm.f1_id };
};


export const novoLancamento = async (data: LancamentoData) => {

  const lancamento = await prisma.l1_lancamento.create({
    data: {
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      data_lancamento: dayjs().toDate(),
      f1_id: data.id,
      id_parcela: data.id_parcela
    },
  });

  return lancamento;
};
