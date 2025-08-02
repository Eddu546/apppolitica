import express from 'express';
import axios from 'axios';

const router = express.Router();

// ROTA 1: Listar todos os deputados (sem alterações, já estava correta)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://dadosabertos.camara.leg.br/api/v2/deputados?itens=50');
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

// ROTA 2: Detalhes de um deputado (sem alterações, já estava correta)
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

// ROTA 3: Despesas de um deputado (CORRIGIDA)
router.get('/:id/despesas', async (req, res) => {
  const { id } = req.params;
  try {
    // CORREÇÃO: Usando axios e a URL correta da API de despesas
    const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ordem=DESC&ordenarPor=dataDocumento`);
    
    // Agora 'response.data.dados' existe e o erro não acontecerá mais
    res.json(response.data.dados);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar despesas do deputado' });
  }
});

// ROTA 4: Proposições de um deputado (REFINADA)
router.get('/:id/proposicoes', async (req, res) => {
  const { id } = req.params; // O ID aqui é uma string, não precisa converter para número para a API

  try {
    const response = await axios.get('https://dadosabertos.camara.leg.br/api/v2/proposicoes', {
      params: {
        autorId: id, // Passando o ID diretamente como autorId
        itens: 100,
        ordem: 'DESC',
        ordenarPor: 'ano'
      }
    });

    // Verificação para o caso de o deputado não ter proposições
    if (!response.data || response.data.dados.length === 0) {
      return res.status(404).json({ error: 'Nenhuma proposição encontrada para este deputado.', data: [] });
    }

    res.json(response.data.dados);
  } catch (error) {
    // O erro de 'autorId' inválido da API será capturado aqui
    if (error.response?.status === 400) {
      console.error('Erro 400 da API de proposições:', error.response.data);
      return res.status(400).json({ error: `O ID '${id}' não é um autor válido na API de proposições.` });
    }
    
    // Outros erros genéricos
    console.error('Erro geral ao buscar proposições:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar proposições' });
  }
});

export default router;