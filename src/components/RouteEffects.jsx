import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteEffects = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const main = document.getElementById('conteudo-principal');
    window.requestAnimationFrame(() => main?.focus({ preventScroll: true }));
  }, [pathname]);

  return null;
};

export default RouteEffects;
