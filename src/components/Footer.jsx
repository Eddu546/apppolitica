import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';
import OncaLogo from '@/components/OncaLogo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center space-x-3">
              <div className="h-8 w-8 text-blue-400">
                <OncaLogo />
              </div>
              <span className="text-xl font-bold">FISCALIZA</span>
            </div>
            <p className="mb-6 max-w-md leading-relaxed text-gray-400">
              Plataforma independente de monitoramento legislativo. Dados oficiais da Câmara dos Deputados e do Senado Federal, com leitura responsável e fontes visíveis.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/Eddu546/TESTE2V1" target="_blank" rel="noopener noreferrer" className="text-gray-400 transition-colors hover:text-white" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 transition-colors hover:text-white" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:contato@fiscaliza.app" className="text-gray-400 transition-colors hover:text-white" aria-label="E-mail">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Plataforma</h3>
            <ul className="space-y-3">
              <li><Link to="/deputados" className="text-sm text-gray-400 transition-colors hover:text-white">Deputados Federais</Link></li>
              <li><Link to="/senadores" className="text-sm text-gray-400 transition-colors hover:text-white">Senadores</Link></li>
              <li><Link to="/estatisticas" className="text-sm text-gray-400 transition-colors hover:text-white">Estatísticas</Link></li>
              <li><Link to="/rankings" className="text-sm text-gray-400 transition-colors hover:text-white">Rankings Auditáveis</Link></li>
              <li><Link to="/alertas" className="text-sm text-gray-400 transition-colors hover:text-white">Pontos de Atenção</Link></li>
              <li><Link to="/pautas" className="text-sm text-gray-400 transition-colors hover:text-white">Pautas Nacionais</Link></li>
              <li><Link to="/meu-roteiro" className="text-sm text-gray-400 transition-colors hover:text-white">Meu Roteiro Cidadão</Link></li>
              <li><Link to="/dados-validados" className="text-sm text-gray-400 transition-colors hover:text-white">Dados Validados</Link></li>
              <li><Link to="/corrigir" className="text-sm text-gray-400 transition-colors hover:text-white">Enviar Correção</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Sobre</h3>
            <ul className="space-y-3">
              <li><Link to="/sobre" className="text-sm text-gray-400 transition-colors hover:text-white">Sobre o Projeto</Link></li>
              <li><Link to="/roadmap" className="text-sm text-gray-400 transition-colors hover:text-white">Roteiro de Expansão</Link></li>
              <li><a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 transition-colors hover:text-white">API Câmara dos Deputados</a></li>
              <li><a href="https://legis.senado.leg.br/dadosabertos" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 transition-colors hover:text-white">API Senado Federal</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-700 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">&copy; {currentYear} FISCALIZA. Todos os dados são de domínio público.</p>
          <p className="text-xs text-gray-600">
            Construído com dados abertos da{' '}
            <a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Câmara</a>
            {' '}e do{' '}
            <a href="https://legis.senado.leg.br/dadosabertos" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Senado</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
