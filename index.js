import express from 'express';
import cors from 'cors';
import deputadosRouter from './routes/deputados.js';
import senadoresRouter from './routes/senadores.js';
import searchRouter from './routes/search.js';
import analyticsRouter from './routes/analytics.js';
import votacoesRouter from './routes/votacoes.js';
import kpisRouter from './routes/kpis.js'; // A nossa nova rota de KPIs

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Nossas rotas
app.use('/api/deputados', deputadosRouter);
app.use('/api/senadores', senadoresRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/votacoes', votacoesRouter); 
app.use('/api/kpis', kpisRouter); // Usando a nova rota

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});