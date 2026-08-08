import { Download, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';

const MANUEL_URL = '/documents/guide-utilisateur-syfic-sjap.pdf';

export function AidePage() {
  return (
    <div>
      <PageHeader title="Aide" description="Manuel utilisateur et ressources d'assistance" />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-[15px] font-semibold text-slate-900">
              Guide utilisateur SYFIC-SJAP
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Le manuel complet d'utilisation de l'application, au format PDF.
            </p>
          </div>
          <div className="flex gap-2">
            <a href={MANUEL_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            </a>
            <a href={MANUEL_URL} download>
              <Button>
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            </a>
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        <iframe
          src={MANUEL_URL}
          title="Manuel utilisateur SYFIC-SJAP"
          className="h-[75vh] w-full"
        />
      </Card>
    </div>
  );
}
