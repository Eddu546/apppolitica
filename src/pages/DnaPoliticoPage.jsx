import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Dna, ArrowRight, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';


const DnaPoliticoPage = () => {
  const [step, setStep] = useState('intro'); // intro, quiz, loading, results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const { toast } = useToast();

  const questions = [
    { id: 'q1', text: 'Você é a favor da privatização de empresas estatais?' },
    { id: 'q2', text: 'O porte de armas para cidadãos comuns deveria ser ampliado?' },
    { id: 'q3', text: 'Você concorda com a redução da maioridade penal?' },
    { id: 'q4', text: 'O agronegócio deve ter menos restrições ambientais para expandir?' },
    { id: 'q5', text: 'Você apoia uma reforma tributária que unifique impostos?' },
  ];

  const handleAnswer = (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = async (finalAnswers) => {
    setStep('loading');
    try {
      const response = await fetch('http://localhost:8000/api/votacoes/dna-politico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível calcular os resultados.');
      }

      const data = await response.json();
      setResults(data);
      setStep('results');

    } catch (error) {
      console.error("Erro ao buscar resultados do DNA Político:", error);
      toast({
        title: "Erro no Cálculo",
        description: "Não foi possível conectar ao servidor para calcular a afinidade. Tente novamente.",
        variant: "destructive",
      });
      setStep('quiz');
    }
  };

  const restartQuiz = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResults([]);
    setStep('intro');
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <>
      <Helmet>
        <title>Meu DNA Político - Fiscaliza, MBL!</title>
        <meta name="description" content="Descubra quais políticos votam como você. Responda ao quiz e veja seu nível de afinidade." />
      </Helmet>

      <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
        {step === 'intro' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl">
            <Dna className="w-20 h-20 mx-auto text-yellow-500 mb-6" />
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Descubra o seu DNA Político</h1>
            <p className="text-lg text-gray-600 mb-8">Responda a algumas perguntas-chave e revelaremos quais parlamentares têm o histórico de votação mais alinhado com as suas opiniões.</p>
            <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold" onClick={() => setStep('quiz')}>
              Começar o Quiz <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div key={currentQuestion} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl border">
            <div className="mb-6">
              <p className="text-yellow-500 font-bold mb-2">Pergunta {currentQuestion + 1} de {questions.length}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">{questions[currentQuestion].text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAnswer(questions[currentQuestion].id, 'sim')}>Sim</Button>
              <Button className="py-6 text-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => handleAnswer(questions[currentQuestion].id, 'nao')}>Não</Button>
              <Button variant="outline" className="py-6 text-lg" onClick={() => handleAnswer(questions[currentQuestion].id, 'abster')}>Abster-se</Button>
            </div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-20 h-20 mx-auto text-yellow-500 mb-6 animate-spin" />
            <h1 className="text-3xl font-bold">A calcular a sua afinidade...</h1>
            <p className="text-gray-600 mt-2">Estamos a comparar as suas respostas com milhares de votos. Isto pode levar alguns segundos.</p>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl">
            <div className="text-center mb-10">
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">O seu Resultado!</h1>
              <p className="text-lg text-gray-600">Com base nas suas respostas, estes são os deputados mais (e menos) alinhados consigo.</p>
            </div>
            <div className="space-y-4">
              {results.slice(0, 10).map((politician, index) => (
                <motion.div key={politician.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white p-4 rounded-lg shadow-md border flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-400 w-8 text-center">{index + 1}</span>
                  <img className="w-16 h-16 rounded-full object-cover" alt={`Foto de ${politician.nome}`} src={politician.foto} />
                  <div className="flex-grow">
                    <Link to={`/politico/${politician.id}`} className="text-lg font-bold hover:text-yellow-500">{politician.nome}</Link>
                    <p className="text-sm text-gray-500">{politician.partido}-{politician.uf}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Afinidade</p>
                    {/* --- CORREÇÃO FINAL AQUI --- */}
                    <p className={`text-2xl font-bold ${politician.affinity > 70 ? 'text-green-500' : politician.affinity < 30 ? 'text-red-500' : 'text-yellow-500'}`}>
                      {/* Adicionámos "|| 0" para garantir que, se a afinidade for nula, mostra 0% */}
                      {politician.affinity || 0}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button size="lg" variant="outline" className="border-yellow-400 text-yellow-500 hover:bg-yellow-400 hover:text-black font-bold" onClick={restartQuiz}>
                <RefreshCw className="mr-2 w-5 h-5" /> Refazer o Quiz
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default DnaPoliticoPage;