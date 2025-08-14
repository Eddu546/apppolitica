import express from 'express';
import axios from 'axios';

const router = express.Router();

// Rota para busca de deputados e senadores por nome parcial (case insensitive)
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.json([]);
  }

  try {
    // URLs do backend local para deputados e senadores
    const deputadosUrl = 'http://localhost:8000/api/deputados';
    const senadoresUrl = 'http://localhost:8000/api/senadores';

    // Buscar deputados e senadores ao mesmo tempo
    const [deputadosResp, senadoresResp] = await Promise.all([
      axios.get(deputadosUrl),
      axios.get(senadoresUrl),
    ]);

    // Mapear deputados
    const deputados = deputadosResp.data.map(dep => ({
      id: dep.id,
      nome: dep.nome,
      partido: dep.partido,
      uf: dep.uf,
      foto: dep.foto,
      tipo: 'Deputado',
    }));

    // Mapear senadores
    const senadores = senadoresResp.data.map(sen => ({
      id: sen.id,
      nome: sen.nome,
      partido: sen.partido,
      uf: sen.uf,
      foto: sen.foto,
      tipo: 'Senador',
    }));

    const termoBusca = q.toLowerCase();

    // Filtrar deputados e senadores que contenham o termo no nome (includes parcial)
    const resultados = [...deputados, ...senadores].filter(p =>
      p.nome.toLowerCase().includes(termoBusca)
    );

    res.json(resultados);
  } catch (error) {
    console.error('Erro ao realizar busca:', error.message);
    res.status(500).json({ error: 'Erro interno na busca' });
  }
});

export default router;
