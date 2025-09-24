"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClientes = exports.cadastrarCliente = void 0;
const clientes_1 = require("../services/clientes");
// Cadastro de cliente
const cadastrarCliente = async (req, res) => {
    console.log(12);
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método não permitido" });
    }
    try {
        const cliente = await (0, clientes_1.createCliente)(req.body);
        return res.status(201).json(cliente);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.cadastrarCliente = cadastrarCliente;
// Listar clientes
const listClientes = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Método não permitido" });
    }
    try {
        const clientes = await (0, clientes_1.listClientes)();
        return res.status(200).json(clientes);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.listClientes = listClientes;
