import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Mail, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  buildCorrectionMailto,
  isCorrectionsDatabaseConfigured,
  submitCorrection,
} from '@/services/corrections';

const initialForm = {
  nome: '',
  email: '',
  parlamentar: '',
  cargo: 'Deputado federal',
  metrica: '',
  ano: '2024',
  valor: '',
  fonte: '',
  observacoes: '',
};

const CorrectionPage = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Enviando para revisao...' });

    try {
      const result = await submitCorrection(form);
      if (result.ok) {
        setStatus({
          type: 'success',
          message: 'Correcao enviada para a fila de revisao. Obrigado por ajudar a melhorar os dados.',
        });
        setForm(initialForm);
        return;
      }

      window.location.href = buildCorrectionMailto(form);
      setStatus({
        type: 'fallback',
        message: 'Banco gratuito ainda nao configurado. Abrimos seu aplicativo de e-mail como alternativa.',
      });
    } catch (error) {
      console.error('Erro ao enviar correcao:', error);
      setStatus({
        type: 'error',
        message: 'Nao foi possivel enviar ao banco. Confira a configuracao do Supabase ou use o e-mail.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Enviar correcao - FISCALIZA</title>
        <meta name="description" content="Envie uma correcao ou evidencia para revisao manual dos indicadores do FISCALIZA." />
      </Helmet>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 mb-4">
              <ShieldCheck className="w-4 h-4" />
              Canal gratuito de verificacao
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Enviar correcao ou evidencia</h1>
            <p className="text-gray-600 leading-relaxed">
              Use este formulario para apontar dados oficiais, documentos ou fontes que ajudem a revisar um indicador.
              O envio abre um e-mail e nao altera o site automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Seu nome
                    <input required value={form.nome} onChange={(e) => updateField('nome', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Seu e-mail
                    <input required type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="md:col-span-2 space-y-2 text-sm font-semibold text-gray-700">
                    Parlamentar
                    <input required value={form.parlamentar} onChange={(e) => updateField('parlamentar', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Cargo
                    <select value={form.cargo} onChange={(e) => updateField('cargo', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal bg-white">
                      <option>Deputado federal</option>
                      <option>Senador</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Metrica
                    <input required value={form.metrica} onChange={(e) => updateField('metrica', e.target.value)} placeholder="Ex.: despesas, relatorias" className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Ano
                    <input required value={form.ano} onChange={(e) => updateField('ano', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    Valor informado
                    <input required value={form.valor} onChange={(e) => updateField('valor', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                </div>

                <label className="space-y-2 text-sm font-semibold text-gray-700 block">
                  Fonte ou evidencia
                  <input required value={form.fonte} onChange={(e) => updateField('fonte', e.target.value)} placeholder="Cole link oficial, documento ou explicacao da fonte" className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                </label>

                <label className="space-y-2 text-sm font-semibold text-gray-700 block">
                  Observacoes
                  <textarea value={form.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                </label>

                <Button type="submit" className="w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {isCorrectionsDatabaseConfigured ? 'Enviar para revisao' : 'Abrir e-mail de envio'}
                </Button>

                {status.message && (
                  <div className={`rounded-lg border p-3 text-sm ${
                    status.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : status.type === 'error'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-blue-200 bg-blue-50 text-blue-800'
                  }`}>
                    {status.message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <Mail className="w-8 h-8 text-blue-600" />
              <h2 className="font-bold text-gray-900">Sem custo mensal</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Esta pagina salva no Supabase Free quando as variaveis de ambiente existem. Sem configuracao, ela usa e-mail como alternativa.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dados enviados por parlamentares, assessorias ou cidadaos devem ser analisados manualmente antes de aparecerem no site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CorrectionPage;
