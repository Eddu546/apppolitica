import express from 'express';
import axios from 'axios';

const router = express.Router();

const votacoesChave = [
  { idPergunta: 'q1', idVotacao: '257161-462', votoSimRepresenta: 'sim' },
  { idPergunta: 'q2', idVotacao: '257161-465', votoSimRepresenta: 'sim' },
  { idPergunta: 'q3', idVotacao: '257161-467', votoSimRepresenta: 'nao' },
  { idPergunta: 'q4', idVotacao: '257161-481', votoSimRepresenta: 'sim' },
  { idPergunta: 'q5', idVotacao: '257161-476', votoSimRepresenta: 'sim' },
  { idPergunta: 'q6', idVotacao: '2408145-17', votoSimRepresenta: 'nao' },
  { idPergunta: 'q7', idVotacao: '2398530-73', votoSimRepresenta: 'nao' },
  { idPergunta: 'q8', idVotacao: '2500330-43', votoSimRepresenta: 'sim' },
  { idPergunta: 'q9', idVotacao: '2427139-60', votoSimRepresenta: 'sim' },
  { idPergunta: 'q10', idVotacao: '257161-454', votoSimRepresenta: 'sim' },
];

router.post('/dna-politico', async (req, res) => {
  const respostasUsuario = req.body.answers;
  if (!respostasUsuario) {
    return res.status(400).json({ error: 'Respostas não fornecidas' });
  }

  try {
    const pontuacoes = {};

    for (const votacao of votacoesChave) {
      const { idPergunta, idVotacao } = votacao;
      const respostaUsuario = respostasUsuario[idPergunta];
      if (!respostaUsuario || respostaUsuario === 'abster') continue;

      const urlVotos = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${idVotacao}/votos`;
      const responseVotos = await axios.get(urlVotos);
      const votosDeputados = responseVotos.data.dados;

      for (const votoDeputado of votosDeputados) {
        const infoDeputadoApi = votoDeputado.deputado_;
        if (!infoDeputadoApi) continue;

        const idDeputado = infoDeputadoApi.id;
        if (!pontuacoes[idDeputado]) {
          pontuacoes[idDeputado] = { pontos: 0, total: 0 };
        }

        let tipoVoto = votoDeputado.tipoVoto.trim().toLowerCase();
        if (tipoVoto === 'não') tipoVoto = 'nao';

        if (tipoVoto === 'sim' || tipoVoto === 'nao') {
          pontuacoes[idDeputado].total++;
          const votoNormalizado = (votacao.votoSimRepresenta === 'sim') ? tipoVoto : (tipoVoto === 'sim' ? 'nao' : 'sim');
          if (votoNormalizado === respostaUsuario) {
            pontuacoes[idDeputado].pontos++;
          }
        }
      }
    }

    const deputadosResponse = await axios.get('http://localhost:8000/api/deputados');
    const todosDeputadosMap = deputadosResponse.data.reduce((map, dep) => {
      map[dep.id] = dep;
      return map;
    }, {});

    const resultadosFinais = Object.entries(pontuacoes)
      .map(([idDeputado, pontuacao]) => {
        const infoCompletaDeputado = todosDeputadosMap[idDeputado];
        if (!infoCompletaDeputado) return null;

        // --- LÓGICA DE SUAVIZAÇÃO DE LAPLACE APLICADA ---
        // Adicionamos 1 aos "acertos" e 2 ao "total" para suavizar a pontuação
        const afinidade = (pontuacao.total > 0)
          ? Math.round(((pontuacao.pontos + 1) / (pontuacao.total + 2)) * 100)
          : 0; // Se não houver votos, a afinidade é 0

        return {
          ...infoCompletaDeputado,
          affinity: afinidade,
          votosConsiderados: pontuacao.total,
        };
      })
      .filter(Boolean);

    resultadosFinais.sort((a, b) => {
      if (b.affinity !== a.affinity) return b.affinity - a.affinity;
      return b.votosConsiderados - a.votosConsiderados;
    });

    res.json(resultadosFinais);

  } catch (error) {
    console.error('Erro ao calcular DNA Político:', error.message);
    res.status(500).json({ error: 'Erro ao processar o DNA Político' });
  }
});

export default router;