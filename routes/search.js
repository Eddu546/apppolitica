import express from 'express';
import axios from 'axios';

const router = express.Router();

// A rota aceitará uma query, ex: /api/search?q=Moro
router.get('/', async (req, res) => {
  const { q } = req.query; // Pega o termo de busca da URL

  // Se não houver termo de busca, retorna um array vazio.
  if (!q) {
    return res.json([]);
  }

  try {
    // 1. Define as URLs das nossas próprias APIs locais
    const deputadosUrl = 'http://localhost:8000/api/deputados';
    const senadoresUrl = 'http://localhost:8000/api/senadores';

    // 2. Faz as duas chamadas ao mesmo tempo para ser mais rápido
    const [deputadosResponse, senadoresResponse] = await Promise.all([
      axios.get(deputadosUrl),
      axios.get(senadoresUrl)
    ]);

    // 3. Adiciona um campo 'tipo' para sabermos quem é quem no frontend
    const deputados = deputadosResponse.data.map(d => ({ ...d, tipo: 'Deputado' }));
    const senadores = senadoresResponse.data.map(s => ({ ...s, tipo: 'Senador' }));
    
    // 4. Junta as duas listas em uma só
    const todosPoliticos = [...deputados, ...senadores];

    // 5. Filtra a lista completa pelo termo de busca (ignorando maiúsculas/minúsculas)
    const termoBusca = q.toLowerCase();
    const resultados = todosPoliticos.filter(politico => 
      politico.nome.toLowerCase().includes(termoBusca)
    );

    // 6. Retorna os resultados encontrados
    res.json(resultados);

  } catch (error) {
    console.error('Erro ao realizar a busca:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar a busca' });
  }
});

export default router;