import { Request, Response } from "express";
import { lancamentoAdm } from "../services/relatorios";

export async function lancamentosAdm(req: Request, res: Response) {
  try {
   
     const data = await lancamentoAdm();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
};


