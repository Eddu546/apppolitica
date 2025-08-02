import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // Agora pegamos tanto o 'pathname' quanto o 'search' da URL
  const { pathname, search } = useLocation();

  // O useEffect agora depende de MUDANÇAS em qualquer um dos dois
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]); // <-- A MUDANÇA ESTÁ AQUI

  return null;
};

export default ScrollToTop;