import express from 'express';
import axios from 'axios';

const router = express.Router();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ROTA 1: PRESENÇA INDIVIDUAL EM VOTAÇÕES
router.get('/:tipo/:id/presenca', async (req, res) => {
  const { id } = req.params;
  try {
    const votacoesUrl = 'https://dadosabertos.camara.leg.br/api/v2/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro&itens=100';
    const votacoesResponse = await axios.get(votacoesUrl);
    const ultimasVotacoes = votacoesResponse.data.dados;

    let totalVotacoes = ultimasVotacoes.length;
    let presencas = 0;
    
    const promessasVotos = ultimasVotacoes.map(v => axios.get(v.uri + '/votos'));
    const respostasVotos = await Promise.all(promessasVotos);

    for (const resposta of respostasVotos) {
      const votos = resposta.data.dados;
      if (votos.some(voto => voto.deputado_?.id.toString() === id)) {
        presencas++;
      }
    }

    const percentualPresenca = totalVotacoes > 0 ? (presencas / totalVotacoes) * 100 : 0;
    res.json({ presenca: percentualPresenca });

  } catch (error) {
    console.error(`Erro ao calcular presença para o ID ${id}:`, error.message);
    res.status(500).json({ presenca: 0, error: 'Erro ao processar dados' });
  }
});


// ROTA 2: LEALDADE PARTIDÁRIA INDIVIDUAL
router.get('/:tipo/:id/lealdade', async (req, res) => {
  const { id, tipo } = req.params;
  try {
    const politicoUrl = `http://localhost:8000/api/${tipo}s/${id}`;
    const politicoRes = await axios.get(politicoUrl);
    const partidoDoPolitico = politicoRes.data.ultimoStatus.siglaPartido;

    const votacoesUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro&itens=100`;
    const votacoesResponse = await axios.get(votacoesUrl);
    const ultimasVotacoes = votacoesResponse.data.dados;

    let totalVotosConsiderados = 0;
    let totalVotosAlinhados = 0;

    for (const votacao of ultimasVotacoes) {
      const detalhesRes = await axios.get(votacao.uri);
      const orientacoes = detalhesRes.data.dados?.orientacoesBancadas?.bancada;
      if (!orientacoes) continue;

      const orientacaoDoMeuPartido = orientacoes.find(o => o.sigla === partidoDoPolitico);

      if (!orientacaoDoMeuPartido) continue;

      const votosRes = await axios.get(votacao.uri + '/votos');
      const votoDoPolitico = votosRes.data.dados.find(v => v.deputado_?.id.toString() === id);

      if (votoDoPolitico && (votoDoPolitico.tipoVoto === "Sim" || votoDoPolitico.tipoVoto === "Não")) {
        totalVotosConsiderados++;
        if (votoDoPolitico.tipoVoto === orientacaoDoMeuPartido.orientacao) {
          totalVotosAlinhados++;
        }
      }
      await sleep(100);
    }

    const percentualLealdade = totalVotosConsiderados > 0 ? (totalVotosAlinhados / totalVotosConsiderados) * 100 : 0;
    res.json({ lealdade: percentualLealdade });

  } catch (error) {
    console.error(`Erro ao calcular lealdade para o ID ${id}:`, error.message);
    res.status(500).json({ lealdade: 0, error: 'Erro ao processar dados' });
  }
});

export default router;