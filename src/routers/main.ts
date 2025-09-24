import { Router } from "express";
import * as pingController from '../controllers/ping';
import * as clienteController from '../controllers/clientes';
import * as emprestimosController from '../controllers/emprestimos';


// import { verifyJWT } from "../utils/jwt";

export const mainRouter = Router(); 

mainRouter.post('/cad/clientes', clienteController.cadastrarCliente);
mainRouter.get('/list/clientes', clienteController.listClientes);
mainRouter.post('/emprestar', emprestimosController.criarEmprestimo);

// Listar empréstimos de um cliente específico
mainRouter.get("/cliente/:id/emprestimos", emprestimosController.listEmprestimosPorCliente);

// Listar empréstimos de todos clientes ativos
mainRouter.get("/emprestimos/ativos", emprestimosController.listEmprestimosAtivos);


// mainRouter.get('/privatePing',verifyJWT , pingController.privatePing);












