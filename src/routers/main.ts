import { Router } from "express";
import * as pingController from '../controllers/ping';
import * as clienteController from '../controllers/clientes';
import * as emprestimosController from '../controllers/emprestimos';
import * as relatoriosController from '../controllers/relatorios';
import * as admController from '../controllers/adm';
// import { verifyJWT } from "../utils/jwt";

export const mainRouter = Router(); 

mainRouter.post('/cad/clientes', clienteController.cadastrarCliente);
mainRouter.get('/list/clientes', clienteController.listClientes);
mainRouter.delete('/deletar/cliente/:id', clienteController.deletClientes);

mainRouter.post('/emprestar', emprestimosController.criarEmprestimo);

// Listar empréstimos de um cliente específico
mainRouter.get("/cliente/:id/emprestimos", emprestimosController.listEmprestimosPorCliente);

// Listar empréstimos de todos clientes ativos
mainRouter.get("/emprestimos/ativos", emprestimosController.listEmprestimosAtivos);
mainRouter.post('/emprestimos/pagarParcela', emprestimosController.pagarParcela);

// mainRouter.get('/privatePing',verifyJWT , pingController.privatePing);
mainRouter.get('/relatorio/home', emprestimosController.relatorioHome);

mainRouter.get("/lancamentos/adm", relatoriosController.lancamentosAdm);
mainRouter.post('/lancamentos/caixaAdm', admController.adicionarLancamentoCaixa);










