import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  Info,
  Menu,
  Scale,
  Search,
  Send,
  ShieldAlert,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import OncaLogo from '@/components/OncaLogo';

const primaryNavigation = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Deputados', href: '/deputados', icon: Users },
  { name: 'Senadores', href: '/senadores', icon: Building2 },
  { name: 'Estatísticas', href: '/estatisticas', icon: BarChart3, activePaths: ['/estatisticas', '/analytics'] },
  { name: 'Rankings', href: '/rankings', icon: Trophy },
  { name: 'Pautas', href: '/pautas', icon: FileText },
];

const toolNavigation = [
  { name: 'Alertas', href: '/alertas', icon: ShieldAlert },
  { name: 'Meu roteiro', href: '/meu-roteiro', icon: ClipboardList, activePaths: ['/meu-roteiro', '/meu-dna'] },
  { name: 'Comparar', href: '/comparar', icon: Scale },
  { name: 'Validados', href: '/dados-validados', icon: CheckCircle2 },
  { name: 'Corrigir', href: '/corrigir', icon: Send },
  { name: 'Sobre', href: '/sobre', icon: Info },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item) => (item.activePaths || [item.href]).includes(location.pathname);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const renderDesktopLink = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
          isActive(item)
            ? 'bg-yellow-400 text-black'
            : 'text-zinc-200 hover:bg-white/10 hover:text-yellow-200'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.name}</span>
      </Link>
    );
  };

  const renderMobileLink = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center space-x-3 rounded-md px-3 py-3 text-base font-medium transition-colors ${
          isActive(item)
            ? 'bg-yellow-400 text-black'
            : 'text-zinc-100 hover:bg-white/10 hover:text-yellow-200'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-yellow-400/20 bg-black shadow-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex min-w-[220px] shrink-0 items-center space-x-3">
            <div className="h-8 w-8 text-yellow-300">
              <OncaLogo />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              FISCALIZA
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex">
            {primaryNavigation.map(renderDesktopLink)}

            <div className="group relative">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  toolNavigation.some(isActive)
                    ? 'bg-yellow-400 text-black'
                    : 'text-zinc-200 hover:bg-white/10 hover:text-yellow-200'
                }`}
              >
                <span>Ferramentas</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full hidden w-56 pt-2 group-hover:block group-focus-within:block">
                <div className="rounded-lg border border-yellow-400/20 bg-zinc-950 p-2 shadow-xl">
                  {toolNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive(item)
                            ? 'bg-yellow-400 text-black'
                            : 'text-zinc-200 hover:bg-white/10 hover:text-yellow-200'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative ml-2 hidden 2xl:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar político..."
              className="w-48 rounded-md border border-yellow-400/30 bg-zinc-900 py-2 pl-4 pr-10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 xl:w-56"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-300">
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-yellow-400/20 bg-black lg:hidden"
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              <form onSubmit={handleSearch} className="relative p-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar político..."
                  className="w-full rounded-md border border-yellow-400/30 bg-zinc-900 py-2 pl-4 pr-10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Search className="h-5 w-5" />
                </button>
              </form>

              <p className="px-3 pt-3 text-xs font-bold uppercase tracking-wide text-yellow-300">Principal</p>
              {primaryNavigation.map(renderMobileLink)}

              <p className="px-3 pt-4 text-xs font-bold uppercase tracking-wide text-yellow-300">Ferramentas</p>
              {toolNavigation.map(renderMobileLink)}
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;
