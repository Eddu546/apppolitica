import express from 'express';
import cors from 'cors';
import deputadosRouter from './routes/deputados.js';
import senadoresRouter from './routes/senadores.js';
import searchRouter from './routes/search.js';
import analyticsRouter from './routes/analytics.js';
import votacoesRouter from './routes/votacoes.js';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use('/api/deputados', deputadosRouter);
app.use('/api/senadores', senadoresRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/votacoes', votacoesRouter); 

app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});