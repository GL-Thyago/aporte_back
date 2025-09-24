import express, { urlencoded } from "express";
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import { mainRouter } from "./routers/main";

const app = express();
app.use(helmet());
app.use(cors());
app.use(urlencoded({ extended: true }));
app.use(express.json());
app.use(mainRouter);

const httpServer = createServer(app);


// Inicia o servidor HTTP
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    // console.log('rodando')
});