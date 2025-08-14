import express from 'express';
import axios from 'axios';

const router = express.Router();

// API Câmara e Senado para deputados e senadores

// Função para buscar dados de atividade legislativa do deputado
async function buscarAtividadeDeputado(idDeputado) {
  // API correta: usar votacoes endpoint para deputado
  const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/votacoes`;
  try {
    const response = await axios.get(url);
    return response.data.dados || [];
  } catch (error) {
    throw new Error(`Erro atividade deputado: ${error.response?.status || error.message}`);
  }
}

// Função para buscar gastos do deputado
async function buscarGastosDeputado(idDeputado) {
  const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/despesas`;
  try {
    const response = await axios.get(url);
    return response.data.dados || [];
  } catch (error) {
    throw new Error(`Erro gastos deputado: ${error.response?.status || error.message}`);
  }
}

// Função para buscar presença do deputado
async function buscarPresencaDeputado(idDeputado) {
  const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/presencas`;
  try {
    const response = await axios.get(url);
    return response.data.dados || [];
  } catch (error) {
    throw new Error(`Erro presença deputado: ${error.response?.status || error.message}`);
  }
}

// Função para buscar lealdade do deputado
async function buscarLealdadeDeputado(idDeputado) {
  // A API da Câmara não possui endpoint direto para lealdade, pode ser calculado manualmente com votações
  // Aqui só retornamos vazio ou implementar lógica personalizada
  return [];
}

// Função para buscar dados de senador - similar, porém endpoints Senado são diferentes

async function buscarAtividadeSenador(idSenador) {
  const url = `https://legis.senado.leg.br/dadosabertos/senador/${idSenador}/votacoes`;
  try {
    const response = await axios.get(url, { headers: { Accept: 'application/json' } });
    return response.data.dados || [];
  } catch (error) {
    throw new Error(`Erro atividade senador: ${error.response?.status || error.message}`);
  }
}

async function buscarGastosSenador(idSenador) {
  // Senado não fornece API pública de despesas; retorna URL externa
  return { urlExterna: `https://www6g.senado.leg.br/transparencia/sen/${idSenador}/` };
}

async function buscarPresencaSenador(idSenador) {
  const url = `https://legis.senado.leg.br/dadosabertos/senador/${idSenador}/presencas`;
  try {
    const response = await axios.get(url, { headers: { Accept: 'application/json' } });
    return response.data.dados || [];
  } catch (error) {
    throw new Error(`Erro presença senador: ${error.response?.status || error.message}`);
  }
}

async function buscarLealdadeSenador(idSenador) {
  // Sem endpoint oficial, retorna vazio
  return [];
}

// Rota principal para KPIs
router.get('/:tipo/:id/:kpi', async (req, res) => {
  const { tipo, id, kpi } = req.params;

  try {
    if (tipo === 'deputado') {
      if (kpi === 'atividade') {
        const dados = await buscarAtividadeDeputado(id);
        return res.json({ atividade: dados.length, dados });
      }
      if (kpi === 'gastos') {
        const gastos = await buscarGastosDeputado(id);
        return res.json({ gastos: gastos.length, gastos });
      }
      if (kpi === 'presenca') {
        const presencas = await buscarPresencaDeputado(id);
        return res.json({ presencas: presencas.length, presencas });
      }
      if (kpi === 'lealdade') {
        const lealdade = await buscarLealdadeDeputado(id);
        return res.json({ lealdade });
      }
    } else if (tipo === 'senador') {
      if (kpi === 'atividade') {
        const dados = await buscarAtividadeSenador(id);
        return res.json({ atividade: dados.length, dados });
      }
      if (kpi === 'gastos') {
        const gastos = await buscarGastosSenador(id);
        return res.json({ gastos });
      }
      if (kpi === 'presenca') {
        const presencas = await buscarPresencaSenador(id);
        return res.json({ presencas: presencas.length, presencas });
      }
      if (kpi === 'lealdade') {
        const lealdade = await buscarLealdadeSenador(id);
        return res.json({ lealdade });
      }
    }

    res.status(404).json({ error: 'KPI ou tipo inválido' });
  } catch (error) {
    console.error(`Erro ao calcular ${kpi} para ${tipo} ID ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
