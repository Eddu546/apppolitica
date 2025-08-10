import express from 'express';
import axios from 'axios';

const router = express.Router();

// Rota para listar todos os senadores (já a funcionar)
router.get('/', async (req, res) => {
  try {
    const url = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual';
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
    const senadores = response.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar;
    if (!Array.isArray(senadores)) {
      return res.json([]);
    }
    const dadosFormatados = senadores.map(s => ({
      id: s.IdentificacaoParlamentar.CodigoParlamentar,
      nome: s.IdentificacaoParlamentar.NomeParlamentar,
      partido: s.IdentificacaoParlamentar.SiglaPartidoParlamentar,
      uf: s.IdentificacaoParlamentar.UfParlamentar,
      foto: s.IdentificacaoParlamentar.UrlFotoParlamentar,
    }));
    res.json(dadosFormatados);
  } catch (error) {
    console.error('Erro ao buscar lista de senadores:', error.message);
    res.status(500).json({ error: 'Erro ao buscar lista de senadores' });
  }
});

// Rota para buscar detalhes de UM senador
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${id}`;
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
    res.json(response.data.DetalheParlamentar.Parlamentar);
  } catch (error) {
    console.error(`Erro ao buscar detalhes do senador ${id}:`, error.message);
    res.status(500).json({ error: 'Erro ao buscar detalhes do senador' });
  }
});

// Rota para buscar as proposições de UM senador (MAIS ROBUSTA)
router.get('/:id/proposicoes', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${id}/autorias`;
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });

    const autorias = response.data?.MateriasAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria;
    if (Array.isArray(autorias)) {
      res.json(autorias);
    } else if (autorias) {
      res.json([autorias]);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erro ao buscar proposições do senador ${id}:`, error.message);
    res.json([]);
  }
});

// Rota de despesas que retorna o link externo (VERSÃO ESTÁVEL)
router.get('/:id/despesas', (req, res) => {
  const { id } = req.params;
  const urlOficial = `https://www6g.senado.leg.br/transparencia/sen/${id}/?ano=2024`;
  res.json({ urlExterna: urlOficial });
});

export default router;