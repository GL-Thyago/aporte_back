import { prisma } from "../utils/prisma";

export const createCliente = async (data: any) => {
  const cliente = await prisma.c1_cliente.create({
    data: {
      c1_nome: data.c1_nome,
      c1_telefone: data.c1_telefone || null,
      c1_telefone2: data.c1_telefone2 || null,
      c1_email: data.c1_email || null,
      c1_tipo_do_comercio: data.c1_tipo_do_comercio || null,
      c1_endereco_comercio: data.c1_endereco_comercio || null,
      c1_endereco_residencial: data.c1_endereco_residencial || null,
      c1_status: "ativo", // status padrão
      c1_caixa: 0,        // valor inicial
    },
  });
  return cliente;
};

export const listClientes = async () => {
  const clientes = await prisma.c1_cliente.findMany({
    orderBy: { c1_createdAt: "desc" },
  });
  return clientes;
};
