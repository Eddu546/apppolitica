import express from 'express';
import axios from 'axios';

const router = express.Router();

// Rota para calcular o total de gastos de uma amostra de deputados
router.get('/gastos-deputados', async (req, res) => {
  console.log('Recebida requisição para /analytics/gastos-deputados');
  try {
    // 1. Busca a lista completa de deputados
    const deputadosResponse = await axios.get('http://localhost:8000/api/deputados');
    const todosDeputados = deputadosResponse.data;

    if (!todosDeputados || todosDeputados.length === 0) {
      throw new Error('Não foi possível obter a lista de deputados.');
    }

    // 2. Pega uma amostra de 10 deputados para o cálculo (para ser rápido)
    const amostraDeputados = todosDeputados.slice(0, 10);
    console.log(`Calculando gastos para uma amostra de ${amostraDeputados.length} deputados.`);

    // 3. Busca as despesas de cada deputado da amostra em paralelo
    const promessasDeDespesas = amostraDeputados.map(deputado =>
      axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/despesas?itens=100`)
    );
    const respostasDeDespesas = await Promise.all(promessasDeDespesas);

    // 4. Soma o valor líquido de todas as despesas encontradas
    let gastoTotal = 0;
    respostasDeDespesas.forEach(response => {
      const despesas = response.data.dados;
      if (despesas && despesas.length > 0) {
        const totalDeputado = despesas.reduce((soma, despesa) => soma + parseFloat(despesa.valorLiquido), 0);
        gastoTotal += totalDeputado;
      }
    });
    
    console.log(`Gasto total da amostra: ${gastoTotal}`);

    // 5. Retorna o valor total calculado
    res.json({
      totalGastos: gastoTotal,
      deputadosAnalisados: amostraDeputados.length,
      totalDeputados: todosDeputados.length
    });

  } catch (error) {
    console.error('Erro ao calcular gastos totais de deputados:', error.message);
    res.status(500).json({ error: 'Erro ao processar análise de gastos.' });
  }
});

export default router;