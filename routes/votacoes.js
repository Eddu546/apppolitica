import express from 'express';
import axios from 'axios';

const router = express.Router();

const votacoesChave = [
  { idPergunta: 'q1', idVotacao: '257161-462', votoSimRepresenta: 'sim' },
  { idPergunta: 'q2', idVotacao: '257161-465', votoSimRepresenta: 'sim' },
  { idPergunta: 'q3', idVotacao: '257161-467', votoSimRepresenta: 'nao' },
  { idPergunta: 'q5', idVotacao: '257161-476', votoSimRepresenta: 'sim' },
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
      if (!respostaUsuario || respostaUsuario === 'abster') continue;

      const urlVotos = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${idVotacao}/votos`;
      const responseVotos = await axios.get(urlVotos);
      const votosDeputados = responseVotos.data.dados;

      for (const votoDeputado of votosDeputados) {
        const infoDeputado = votoDeputado.deputado_;
        if (!infoDeputado) continue;

        const idDeputado = infoDeputado.id;
        if (!pontuacoes[idDeputado]) {
          pontuacoes[idDeputado] = { pontos: 0, total: 0 };
        }

        let tipoVoto = votoDeputado.tipoVoto.trim().toLowerCase();
        if (tipoVoto === 'não') tipoVoto = 'nao';

        if (tipoVoto === 'sim' || tipoVoto === 'nao') {
          pontuacoes[idDeputado].total++;
          let votoNormalizado = (votoSimRepresenta === 'sim') ? tipoVoto : (tipoVoto === 'sim' ? 'nao' : 'sim');
          if (votoNormalizado === respostaUsuario) {
            pontuacoes[idDeputado].pontos++;
          }
        }
      }
    }

    const deputadosResponse = await axios.get('http://localhost:8000/api/deputados');
    const infoTodosDeputados = deputadosResponse.data.reduce((map, dep) => {
      map[dep.id] = dep;
      return map;
    }, {});

    const resultadosFinais = Object.entries(pontuacoes)
      .map(([idDeputado, pontuacao]) => {
        const infoDeputado = infoTodosDeputados[idDeputado];

        // --- CORREÇÃO FINAL E MAIS IMPORTANTE ---
        // Se o deputado que votou não está na nossa lista principal, ignoramo-lo.
        if (!infoDeputado) {
          return null;
        }

        const afinidade = (pontuacao.total > 0)
          ? Math.round((pontuacao.pontos / pontuacao.total) * 100)
          : 0;

        return {
          id: idDeputado,
          nome: infoDeputado.nome,
          partido: infoDeputado.partido,
          uf: infoDeputado.uf,
          foto: infoDeputado.foto,
          affinity: afinidade,
          votosConsiderados: pontuacao.total,
        };
      })
      .filter(Boolean); // Remove qualquer entrada nula (os "fantasmas")

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