import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building2, FileText, Loader2, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MAJOR_AGENDAS } from '@/lib/major-agendas';
import { filterAndSortByFields, normalizeSearchText } from '@/lib/search';
import { getAllDeputadosList } from '@/services/camara';
import { getSenadoresAtuais } from '@/services/senado';

let peoplePromise;

const loadPeople = () => {
  if (!peoplePromise) {
    peoplePromise = Promise.allSettled([getAllDeputadosList(), getSenadoresAtuais()]).then(([deputies, senators]) => ({
      deputies: deputies.status === 'fulfilled' ? deputies.value : [],
      senators: senators.status === 'fulfilled' ? senators.value : [],
    }));
  }
  return peoplePromise;
};

const variants = {
  header: {
    form: 'relative w-56',
    input: 'w-full rounded-md border border-yellow-400/30 bg-zinc-900 py-2 pl-4 pr-10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400',
    button: 'absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-300',
  },
  mobile: {
    form: 'relative w-full',
    input: 'w-full rounded-md border border-yellow-400/30 bg-zinc-900 py-2 pl-4 pr-10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400',
    button: 'absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-300',
  },
  hero: {
    form: 'relative mx-auto mb-7 max-w-xl',
    input: 'w-full rounded-full border border-yellow-300/30 bg-white py-4 pl-14 pr-32 text-base text-gray-950 shadow-2xl shadow-yellow-950/20 focus:outline-none focus:ring-4 focus:ring-yellow-400/40 sm:text-lg',
    button: 'absolute bottom-2 right-2 top-2 rounded-full bg-yellow-400 px-5 text-sm font-black text-black hover:bg-yellow-300',
  },
};

const itemIcon = {
  deputado: User,
  senador: Building2,
  pauta: FileText,
};

const GlobalSearchBox = ({ variant = 'header', placeholder = 'Buscar político ou pauta...', onNavigate }) => {
  const navigate = useNavigate();
  const suggestionId = useId();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState({ deputies: [], senators: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const style = variants[variant] || variants.header;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const ensurePeople = () => {
    if (people.deputies.length || people.senators.length || loading) return;
    setLoading(true);
    loadPeople()
      .then(setPeople)
      .finally(() => setLoading(false));
  };

  const suggestions = useMemo(() => {
    if (normalizeSearchText(query).length < 2) return [];

    const deputies = filterAndSortByFields(people.deputies, query, [
      (item) => item.nome,
      (item) => item.siglaPartido,
      (item) => item.siglaUf,
    ]).slice(0, 4).map((item) => ({
      id: `deputado-${item.id}`,
      type: 'deputado',
      title: item.nome,
      subtitle: `${item.siglaPartido || 'Sem partido'} / ${item.siglaUf || 'UF não informada'}`,
      href: `/politico/${item.id}`,
    }));

    const senators = filterAndSortByFields(people.senators, query, [
      (item) => item.nome,
      (item) => item.partido,
      (item) => item.uf,
    ]).slice(0, 3).map((item) => ({
      id: `senador-${item.id}`,
      type: 'senador',
      title: item.nome,
      subtitle: `${item.partido || 'Sem partido'} / ${item.uf || 'UF não informada'}`,
      href: `/senador/${item.id}`,
    }));

    const normalized = normalizeSearchText(query);
    const agendas = MAJOR_AGENDAS.filter((agenda) => normalizeSearchText([
      agenda.apelido_pauta,
      agenda.numero_proposicao.join(' '),
      agenda.tema,
    ].join(' ')).includes(normalized)).slice(0, 3).map((agenda) => ({
      id: `pauta-${agenda.id}`,
      type: 'pauta',
      title: agenda.apelido_pauta,
      subtitle: agenda.numero_proposicao.join(' e '),
      href: `/pauta/${agenda.id}`,
    }));

    return [...deputies, ...senators, ...agendas].slice(0, 8);
  }, [people, query]);

  const goTo = (href) => {
    navigate(href);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
  };

  const submit = (event) => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goTo(suggestions[activeIndex].href);
      return;
    }
    if (query.trim()) goTo(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (event) => {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={style.form}>
      <form onSubmit={submit} role="search">
        {variant === 'hero' && <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />}
        <input
          type="search"
          value={query}
          onFocus={() => { ensurePeople(); setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={style.input}
          autoComplete="off"
          aria-label={placeholder}
          aria-expanded={open && suggestions.length > 0}
          aria-controls={suggestionId}
        />
        <button type="submit" className={style.button} aria-label="Buscar">
          {variant === 'hero' ? 'Buscar' : <Search className="h-5 w-5" aria-hidden="true" />}
        </button>
      </form>

      {open && query.trim().length >= 2 && (
        <div id={suggestionId} className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 text-left shadow-2xl">
          {loading && !suggestions.length ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Consultando listas oficiais...</div>
          ) : suggestions.length ? suggestions.map((item, index) => {
            const Icon = itemIcon[item.type];
            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goTo(item.href)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left ${index === activeIndex ? 'bg-yellow-100' : 'hover:bg-gray-50'}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-black text-yellow-300"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-gray-950">{item.title}</span>
                  <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>
                </span>
              </button>
            );
          }) : (
            <button type="button" onClick={() => goTo(`/search?q=${encodeURIComponent(query.trim())}`)} className="w-full rounded-md px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Buscar “{query.trim()}” em todo o FISCALIZA
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBox;
