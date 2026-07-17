import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Instagram, Twitter, Youtube } from 'lucide-react';
import OncaLogo from '@/components/OncaLogo';

const socialLinks = [
  { label: 'YouTube', href: 'https://www.youtube.com/@eduardowilliammm', icon: Youtube },
  { label: 'Instagram', href: 'https://www.instagram.com/eduardowilliamm', icon: Instagram },
  { label: 'X', href: 'https://x.com/eduardowilliamm', icon: Twitter },
  { label: 'TikTok', href: 'https://www.tiktok.com/@eduardowilliamm' },
  { label: 'Kwai', href: 'https://k.kwai.com/u/@eduardowilliamm/wCvcQcF5' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center space-x-3">
              <div className="h-8 w-8 text-yellow-300">
                <OncaLogo />
              </div>
              <span className="text-xl font-black">FISCALIZA</span>
            </div>
            <p className="mb-4 max-w-md leading-relaxed text-zinc-300">
              Plataforma de monitoramento legislativo criada por Eduardo William, pré-candidato a deputado federal pela Paraíba,
              para defender uma política mais transparente, verificável e acessível ao cidadão.
            </p>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-zinc-500">
              Dados oficiais da Câmara dos Deputados e do Senado Federal, com leitura responsável e fontes visíveis.
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-yellow-400/20 px-3 py-2 text-sm font-bold text-zinc-200 transition-colors hover:border-yellow-300 hover:bg-yellow-400 hover:text-black"
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-yellow-300">Plataforma</h3>
            <ul className="space-y-3">
              <li><Link to="/deputados" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Deputados Federais</Link></li>
              <li><Link to="/senadores" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Senadores</Link></li>
              <li><Link to="/estatisticas" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Estatísticas</Link></li>
              <li><Link to="/rankings" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Rankings Auditáveis</Link></li>
              <li><Link to="/alertas" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Pontos de Atenção</Link></li>
              <li><Link to="/pautas" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Pautas Nacionais</Link></li>
              <li><Link to="/fornecedores" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Rede de Fornecedores</Link></li>
              <li><Link to="/meu-roteiro" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Meu Roteiro Cidadão</Link></li>
              <li><Link to="/apoie" className="text-sm font-bold text-yellow-300 transition-colors hover:text-yellow-100">Apoie o FISCALIZA</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-yellow-300">Sobre</h3>
            <ul className="space-y-3">
              <li><Link to="/sobre" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Sobre o Projeto</Link></li>
              <li><Link to="/roadmap" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Roteiro de Expansão</Link></li>
              <li><Link to="/metodologia" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Metodologia Pública</Link></li>
              <li><Link to="/apoie" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">Custos e Apoio</Link></li>
              <li><a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">API Câmara dos Deputados</a></li>
              <li><a href="https://legis.senado.leg.br/dadosabertos" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 transition-colors hover:text-yellow-200">API Senado Federal</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-yellow-400/20 pt-8 sm:flex-row">
          <p className="text-sm text-zinc-500">&copy; {currentYear} FISCALIZA. Todos os dados são de domínio público.</p>
          <p className="text-xs text-zinc-600">
            Construído com dados abertos da{' '}
            <a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Câmara</a>
            {' '}e do{' '}
            <a href="https://legis.senado.leg.br/dadosabertos" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Senado</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
