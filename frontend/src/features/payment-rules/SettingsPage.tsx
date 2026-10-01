import { useState } from 'react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { NiveauxTab } from './tabs/NiveauxTab';
import { FilieresTab } from './tabs/FilieresTab';
import { MatieresTab } from './tabs/MatieresTab';
import { AnneesTab } from './tabs/AnneesTab';
import { ReglesTab } from './tabs/ReglesTab';
import { CarnetsRecuTab } from './tabs/CarnetsTab';
import { UtilisateursTab } from './tabs/UtilisateursTab';
import { ProfilsTab } from './tabs/ProfilsTab';

type Onglet =
  | 'niveaux'
  | 'filieres'
  | 'matieres'
  | 'annees'
  | 'regles'
  | 'carnets'
  | 'utilisateurs'
  | 'profils';

export function SettingsPage() {
  const [onglet, setOnglet] = useState<Onglet>('niveaux');

  return (
    <div>
      <PageHeader title="Administration" description="Configuration académique et financière" />

      <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'niveaux', label: 'Niveaux (L1-M2)' },
            { key: 'filieres', label: 'Filières' },
            { key: 'matieres', label: 'Matières' },
            { key: 'annees', label: 'Années universitaires' },
            { key: 'regles', label: 'Règles de paiement' },
            { key: 'carnets', label: 'Carnets de reçu' },
            { key: 'utilisateurs', label: 'Utilisateurs' },
            { key: 'profils', label: 'Profils' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOnglet(tab.key)}
            className={`rounded-md whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
              onglet === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {onglet === 'niveaux' && <NiveauxTab />}
      {onglet === 'filieres' && <FilieresTab />}
      {onglet === 'matieres' && <MatieresTab />}
      {onglet === 'annees' && <AnneesTab />}
      {onglet === 'regles' && <ReglesTab />}
      {onglet === 'carnets' && <CarnetsRecuTab />}
      {onglet === 'utilisateurs' && <UtilisateursTab />}
      {onglet === 'profils' && <ProfilsTab />}
    </div>
  );
}
