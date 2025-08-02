import express from 'express';
import axios from 'axios';

const router = express.Router();

// ROTA 1: Listar todos os deputados (CORRIGIDA)
router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Alterado de itens=50 para itens=600 para buscar TODOS os deputados
    const response = await axios.get('https://dadosabertos.camara.leg.br/api/v2/deputados?itens=600');
    
    const data = response.data.dados.map(dep => ({
      id: dep.id,
      nome: dep.nome,
      partido: dep.siglaPartido,
      uf: dep.siglaUf,
      foto: dep.urlFoto,
    }));
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar a lista de deputados:', error.message);
    res.status(500).json({ error: 'Erro ao buscar deputados' });
  }
});

// ROTA 2: Detalhes de um deputado (sem alterações)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`);
    res.json(response.data.dados);
  } catch (error) {
    console.error('Erro ao buscar dados do deputado:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados do deputado' });
  }
});

// ROTA 3: Despesas de um deputado (sem alterações)
router.get('/:id/despesas', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ordem=DESC&ordenarPor=dataDocumento`);
    res.json(response.data.dados);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar despesas do deputado' });
  }
});

// ROTA 4: Proposições de um deputado (sem alterações)
router.get('/:id/proposicoes', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get('https://dadosabertos.camara.leg.br/api/v2/proposicoes', {
      params: {
        idDeputadoAutor: id,
        itens: 100,
        ordem: 'DESC',
        ordenarPor: 'ano'
      }
    });
    if (!response.data || response.data.dados.length === 0) {
      return res.json([]);
    }
    res.json(response.data.dados);
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('Erro 400 da API de proposições:', error.response.data);
      return res.status(400).json({ error: `O ID '${id}' pode ser inválido ou não ter proposições como autor.` });
    }
    console.error('Erro geral ao buscar proposições:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar proposições' });
  }
});

export default router;