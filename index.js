import express from 'express';
import cors from 'cors';
import deputadosRouter from './routes/deputados.js';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use('/api/deputados', deputadosRouter);

app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});
