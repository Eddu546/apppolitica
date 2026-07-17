import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, Link2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfileReportTools = () => {
  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div className="print-hidden flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copyLink} title="Copiar o endereço deste relatório">
        <Link2 className="mr-2 h-4 w-4" /> Compartilhar
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()} title="Imprimir ou salvar como PDF">
        <Printer className="mr-2 h-4 w-4" /> Salvar relatório
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/metodologia"><BookOpenCheck className="mr-2 h-4 w-4" /> Metodologia</Link>
      </Button>
    </div>
  );
};

export default ProfileReportTools;

