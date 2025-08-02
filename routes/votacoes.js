import express from 'express';
import axios from 'axios';

const router = express.Router();

// --- CONFIGURAÇÃO DO QUIZ ---
const votacoesChave = [
  { idPergunta: 'q1', idVotacao: '257161-462', votoSimRepresenta: 'sim' },
  { idPergunta: 'q2', idVotacao: '257161-465', votoSimRepresenta: 'sim' },
  { idPergunta: 'q3', idVotacao: '257161-467', votoSimRepresenta: 'nao' },
  { idPergunta: 'q5', idVotacao: '257161-476', votoSimRepresenta: 'sim' },
  // Para a pergunta 4, usaremos uma votação simbólica como exemplo
  { idPergunta: 'q4', idVotacao: '257161-481', votoSimRepresenta: 'sim' },
];

router.post('/dna-politico', async (req, res) => {
  const respostasUsuario = req.body.answers;
  if (!respostasUsuario) {
    return res.status(400).json({ error: 'Respostas não fornecidas' });
  }

  try {
    const pontuacoes = {};

    for (const votacao of votacoesChave) {
      const { idPergunta, idVotacao, votoSimRepresenta } = votacao;
      const respostaUsuario = respostasUsuario[idPergunta];

      if (!respostaUsuario || respostaUsuario === 'abster') {
        continue;
      }

      const urlVotos = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${idVotacao}/votos`;
      const responseVotos = await axios.get(urlVotos);
      const votosDeputados = responseVotos.data.dados;

      for (const votoDeputado of votosDeputados) {
        // --- A CORREÇÃO ESTÁ AQUI ---
        // Se a entrada de voto não tiver um deputado associado, ignora e continua.
        if (!votoDeputado.deputado) {
          continue;
        }

        const idDeputado = votoDeputado.deputado.id;
        
        if (!pontuacoes[idDeputado]) {
          pontuacoes[idDeputado] = { pontos: 0, total: 0 };
        }

        const tipoVoto = votoDeputado.tipoVoto.toLowerCase();
        
        let votoNormalizado;
        if (votoSimRepresenta === 'sim') {
          votoNormalizado = tipoVoto;
        } else {
          votoNormalizado = tipoVoto === 'sim' ? 'nao' : 'sim';
        }

        if (votoNormalizado === respostaUsuario) {
          pontuacoes[idDeputado].pontos++;
        }
        pontuacoes[idDeputado].total++;
      }
    }

    const deputadosResponse = await axios.get('http://localhost:8000/api/deputados');
    const todosDeputados = deputadosResponse.data;

    const resultadosFinais = todosDeputados.map(deputado => {
      const pontuacao = pontuacoes[deputado.id];
      const afinidade = (pontuacao && pontuacao.total > 0)
        ? Math.round((pontuacao.pontos / pontuacao.total) * 100)
        : 0;

      return {
        ...deputado,
        affinity: afinidade,
      };
    }).sort((a, b) => b.affinity - a.affinity);

    res.json(resultadosFinais);

  } catch (error) {
    console.error('Erro ao calcular DNA Político:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao processar o DNA Político' });
  }
});

export default router;