import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';
import OncaLogo from '@/components/OncaLogo';

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <OncaLogo className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold">Fiscaliza, MBL!</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Ferramenta de transparência política do MBL para empoderar cidadãos com dados e análises sobre as atividades dos políticos federais.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Navegação</span>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Início
                </Link>
              </li>
               <li>
                <Link to="/meu-dna" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Meu DNA Político
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Roteiro de Expansão
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Informações</span>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Sobre o Projeto
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500">
            © 2024 Fiscaliza, MBL!. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;