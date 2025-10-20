import { prisma } from "../utils/prisma";

export const lancamentoAdm = async () => {
   const data = await prisma.l1_lancamento.findMany({
      orderBy: { data_lancamento: 'desc' },
    });

  return data
};