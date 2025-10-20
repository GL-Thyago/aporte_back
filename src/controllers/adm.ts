import { Request, Response } from "express";
import { caixaAdm, novoLancamento } from "../services/caixa";


export async function adicionarLancamentoCaixa(req: Request, res: Response) {
  try {
    const { tipo, valor, descricao } = req.body;

    if (!tipo || !valor) {
      return res.status(400).json({ error: "Tipo e valor são obrigatórios." });
    }

    const tipoEntradaSaida = tipo;

     const atualizarCaixa = await caixaAdm({
      tipoEntradaSaida,
      valor: Number(valor),
    });

    const Lancamento = await novoLancamento({
        tipo,
        valor: Number(valor),
        descricao: descricao || "",
        id: atualizarCaixa.f1_id,
        id_parcela: null
    });

    return res.status(201).json(atualizarCaixa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao adicionar lançamento" });
  }
}
