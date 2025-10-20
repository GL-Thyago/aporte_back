import { RequestHandler } from "express";
import { createCliente, deleteClienteService, listClientes as listClientesService } from "../services/clientes";

// Cadastro de cliente
export const cadastrarCliente: RequestHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const cliente = await createCliente(req.body);
    return res.status(201).json(cliente);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Listar clientes
export const listClientes: RequestHandler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const clientes = await listClientesService();
    return res.status(200).json(clientes);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletClientes: RequestHandler = async (req, res) => {
  try {
    const clienteId = Number(req.params.id);
    await deleteClienteService(clienteId);
    return res.json({ message: "✅ Cliente deletado com sucesso!" });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Erro ao deletar cliente" }); 
  }
};






