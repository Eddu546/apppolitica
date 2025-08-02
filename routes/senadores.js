import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const url = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual';

    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' }
    });

    // --- CORREÇÃO FINAL COM O CAMINHO CERTO ---
    // Usando o caminho que descobrimos na investigação: ListaParlamentarEmExercicio
    const senadores = response.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar;

    // Se 'senadores' não for uma lista (array), envia uma lista vazia para proteger o frontend.
    if (!Array.isArray(senadores)) {
      console.warn("A API do Senado não retornou uma lista de parlamentares válida. Enviando array vazio.");
      return res.json([]);
    }

    // Mapeia os dados para o formato que nosso frontend precisa.
    const dadosFormatados = senadores.map(senador => {
      const infoBasicas = senador.IdentificacaoParlamentar;
      return {
        id: infoBasicas.CodigoParlamentar,
        nome: infoBasicas.NomeParlamentar,
        partido: infoBasicas.SiglaPartidoParlamentar,
        uf: infoBasicas.UfParlamentar,
        foto: infoBasicas.UrlFotoParlamentar,
      };
    });

    res.json(dadosFormatados);

  } catch (error) {
    console.error('Erro detalhado ao buscar senadores:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar dados dos senadores' });
  }
});

export default router;