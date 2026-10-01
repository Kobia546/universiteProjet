import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';
import { messageErreur } from '../../../shared/lib/erreurs';
import {
  fetchCarnetsRecu,
  createCarnetRecu,
  updateCarnetRecu,
  fermerCarnetRecu,
  rouvrirCarnetRecu,
  deleteCarnetRecu,
  ajouterNumerosSupprimes,
  retirerNumeroSupprime,
  type CarnetRecu,
} from '../api/carnetRecuApi';
import { formatDate } from '../../../shared/lib/format';

/**
 * Transforme « 92, 94-96  101 » en [92, 94, 95, 96, 101].
 * Retourne une erreur lisible si le texte est invalide.
 */
function analyserNumeros(texte: string): { numeros: number[]; erreur?: string } {
  const morceaux = texte
    .split(/[,;\s]+/)
    .map((m) => m.trim())
    .filter(Boolean);
  const numeros = new Set<number>();
  for (const m of morceaux) {
    const plage = m.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (plage) {
      const a = Number(plage[1]);
      const b = Number(plage[2]);
      if (b < a) return { numeros: [], erreur: `Plage invalide : ${m}` };
      if (b - a + 1 > 500) return { numeros: [], erreur: 'Une plage ne peut dépasser 500 numéros.' };
      for (let n = a; n <= b; n++) numeros.add(n);
    } else if (/^\d+$/.test(m)) {
      numeros.add(Number(m));
    } else {
      return { numeros: [], erreur: `« ${m} » n'est pas un numéro valide.` };
    }
  }
  if (numeros.size > 500) return { numeros: [], erreur: 'Maximum 500 numéros à la fois.' };
  return { numeros: [...numeros].sort((x, y) => x - y) };
}

export function CarnetsRecuTab() {
  const [numeroDebut, setNumeroDebut] = useState('');
  const [numeroFin, setNumeroFin] = useState('');
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<CarnetRecu | null>(null);
  const queryClient = useQueryClient();

  const { data: carnets, isLoading } = useQuery({
    queryKey: ['carnets-recu'],
    queryFn: fetchCarnetsRecu,
  });
  const page = usePagination(carnets ?? []);

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['carnets-recu'] });
  }

  const creerMutation = useMutation({
    mutationFn: createCarnetRecu,
    onSuccess: () => {
      invalider();
      setNumeroDebut('');
      setNumeroFin('');
    },
  });
  const fermerMutation = useMutation({ mutationFn: fermerCarnetRecu, onSuccess: invalider });
  const rouvrirMutation = useMutation({ mutationFn: rouvrirCarnetRecu, onSuccess: invalider });
  const supprimerMutation = useMutation({
    mutationFn: deleteCarnetRecu,
    onSuccess: () => {
      invalider();
      setASupprimer(null);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
          Nouveau carnet (plage de numéros)
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Définis la plage de numéros que couvre un carnet physique (ex : 90 à 95). Au moment d'un
          paiement, le comptable saisit le numéro exact du reçu papier utilisé — l'app vérifie
          qu'il appartient bien à une plage configurée ici, qu'il n'a pas déjà servi et qu'il n'a
          pas été déclaré supprimé.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Numéro de début"
            type="number"
            min="1"
            value={numeroDebut}
            onChange={(e) => setNumeroDebut(e.target.value)}
          />
          <Input
            label="Numéro de fin"
            type="number"
            min="1"
            value={numeroFin}
            onChange={(e) => setNumeroFin(e.target.value)}
          />
        </div>
        {creerMutation.isError && (
          <p className="mt-3 text-sm text-red-600">{messageErreur(creerMutation.error)}</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!numeroDebut || !numeroFin}
            isLoading={creerMutation.isPending}
            onClick={() =>
              creerMutation.mutate({
                numeroDebut: Number(numeroDebut),
                numeroFin: Number(numeroFin),
              })
            }
          >
            <Plus className="h-4 w-4" />
            Créer le carnet
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !carnets || carnets.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun carnet configuré — un paiement ne pourra pas être enregistré tant qu'aucune plage
            n'existe.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {page.pageItems.map((carnet) => (
              <LigneCarnet
                key={carnet.id}
                carnet={carnet}
                ouvert={ouvertId === carnet.id}
                onToggle={() => setOuvertId(ouvertId === carnet.id ? null : carnet.id)}
                onFermer={() => fermerMutation.mutate(carnet.id)}
                onRouvrir={() => rouvrirMutation.mutate(carnet.id)}
                onSupprimer={() => setASupprimer(carnet)}
                erreur={
                  (fermerMutation.variables === carnet.id && fermerMutation.isError
                    ? messageErreur(fermerMutation.error)
                    : null) ??
                  (rouvrirMutation.variables === carnet.id && rouvrirMutation.isError
                    ? messageErreur(rouvrirMutation.error)
                    : null)
                }
              />
            ))}
          </div>
        )}
        <div className="px-5 pb-4">
          <Pagination p={page} />
        </div>
      </Card>

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer ce carnet ?"
        message={
          <>
            Le carnet {aSupprimer?.numeroDebut}–{aSupprimer?.numeroFin} et ses numéros déclarés
            supprimés seront effacés. Impossible si des reçus ont déjà été émis dessus (fermez-le
            alors).
          </>
        }
        isLoading={supprimerMutation.isPending}
        error={supprimerMutation.isError ? messageErreur(supprimerMutation.error) : null}
        onConfirm={() => aSupprimer && supprimerMutation.mutate(aSupprimer.id)}
        onCancel={() => {
          setASupprimer(null);
          supprimerMutation.reset();
        }}
      />
    </div>
  );
}

function LigneCarnet({
  carnet,
  ouvert,
  onToggle,
  onFermer,
  onRouvrir,
  onSupprimer,
  erreur,
}: {
  carnet: CarnetRecu;
  ouvert: boolean;
  onToggle: () => void;
  onFermer: () => void;
  onRouvrir: () => void;
  onSupprimer: () => void;
  erreur: string | null;
}) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState(false);
  const [debut, setDebut] = useState(String(carnet.numeroDebut));
  const [fin, setFin] = useState(String(carnet.numeroFin));
  const [saisie, setSaisie] = useState('');
  const [motif, setMotif] = useState('');

  const parse = analyserNumeros(saisie);

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['carnets-recu'] });
  }

  const modifierMutation = useMutation({
    mutationFn: (input: { numeroDebut: number; numeroFin: number }) =>
      updateCarnetRecu(carnet.id, input),
    onSuccess: () => {
      invalider();
      setEdition(false);
    },
  });

  const declarerMutation = useMutation({
    mutationFn: () =>
      ajouterNumerosSupprimes(carnet.id, { numeros: parse.numeros, motif: motif.trim() || undefined }),
    onSuccess: () => {
      invalider();
      setSaisie('');
      setMotif('');
    },
  });

  const retirerMutation = useMutation({
    mutationFn: (exclusionId: string) => retirerNumeroSupprime(carnet.id, exclusionId),
    onSuccess: invalider,
  });

  const horsPlage = parse.numeros.filter((n) => n < carnet.numeroDebut || n > carnet.numeroFin);
  const peutDeclarer =
    parse.numeros.length > 0 && !parse.erreur && horsPlage.length === 0 && saisie.trim() !== '';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <div className="min-w-[140px]">
          <p className="font-mono text-sm font-medium text-slate-900">
            {carnet.numeroDebut} — {carnet.numeroFin}
          </p>
          <p className="text-xs text-slate-400">Créé le {formatDate(carnet.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          <span>
            Total <b className="tabular-nums">{carnet.total}</b>
          </span>
          <span>
            Utilisés <b className="tabular-nums">{carnet.nbUtilises}</b>
          </span>
          <span>
            Supprimés <b className="tabular-nums text-amber-700">{carnet.nbExclus}</b>
          </span>
          <span>
            Restants <b className="tabular-nums text-emerald-700">{carnet.nbRestants}</b>
          </span>
          <span>
            Prochain n° <b className="tabular-nums">{carnet.prochainNumero ?? '—'}</b>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {carnet.actif ? <Badge variant="success">Actif</Badge> : <Badge variant="default">Fermé</Badge>}
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs font-medium text-brand-700"
          >
            Numéros supprimés
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${ouvert ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
              setDebut(String(carnet.numeroDebut));
              setFin(String(carnet.numeroFin));
              setEdition((e) => !e);
            }}
            className="text-xs text-brand-700 underline"
          >
            Modifier la plage
          </button>
          {carnet.actif ? (
            <button onClick={onFermer} className="text-xs text-slate-600 underline">
              Fermer
            </button>
          ) : (
            <button onClick={onRouvrir} className="text-xs text-slate-600 underline">
              Rouvrir
            </button>
          )}
          <button onClick={onSupprimer} className="text-xs text-red-600 underline">
            Supprimer
          </button>
        </div>
      </div>

      {erreur && <p className="px-5 pb-2 text-sm text-red-600">{erreur}</p>}

      {edition && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-36">
              <Input
                label="Début"
                type="number"
                min="1"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Input
                label="Fin"
                type="number"
                min="1"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>
            <Button
              disabled={!debut || !fin}
              isLoading={modifierMutation.isPending}
              onClick={() =>
                modifierMutation.mutate({ numeroDebut: Number(debut), numeroFin: Number(fin) })
              }
            >
              Enregistrer
            </Button>
            <Button variant="secondary" onClick={() => setEdition(false)}>
              Annuler
            </Button>
          </div>
          {modifierMutation.isError && (
            <p className="mt-2 text-sm text-red-600">{messageErreur(modifierMutation.error)}</p>
          )}
        </div>
      )}

      {ouvert && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="mb-3 text-xs text-slate-500">
            Déclare ici les reçus physiquement arrachés, déchirés ou perdus dans ce carnet : ils ne
            pourront plus être utilisés pour un paiement ou une inscription. Sépare les numéros par
            une virgule ; utilise un tiret pour une plage (ex : <code className="font-mono">92, 94-96, 101</code>).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                label="Numéros supprimés"
                placeholder="92, 94-96, 101"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <Input
                label="Motif (optionnel)"
                placeholder="Reçus déchirés"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              />
            </div>
            <Button
              disabled={!peutDeclarer}
              isLoading={declarerMutation.isPending}
              onClick={() => declarerMutation.mutate()}
            >
              Déclarer
            </Button>
          </div>
          {saisie.trim() !== '' && parse.erreur && (
            <p className="mt-2 text-sm text-red-600">{parse.erreur}</p>
          )}
          {!parse.erreur && horsPlage.length > 0 && (
            <p className="mt-2 text-sm text-red-600">
              Hors du carnet {carnet.numeroDebut}–{carnet.numeroFin} : {horsPlage.slice(0, 10).join(', ')}
              {horsPlage.length > 10 ? '…' : ''}
            </p>
          )}
          {!parse.erreur && horsPlage.length === 0 && parse.numeros.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {parse.numeros.length} numéro(s) seront déclarés supprimés.
            </p>
          )}
          {declarerMutation.isError && (
            <p className="mt-2 text-sm text-red-600">{messageErreur(declarerMutation.error)}</p>
          )}
          {declarerMutation.isSuccess && declarerMutation.data.dejaDeclares > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {declarerMutation.data.dejaDeclares} numéro(s) étaient déjà déclarés.
            </p>
          )}

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Déjà déclarés ({carnet.exclusions.length})
            </p>
            {carnet.exclusions.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun numéro déclaré supprimé sur ce carnet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {carnet.exclusions.map((ex) => (
                  <span
                    key={ex.id}
                    title={ex.motif ?? undefined}
                    className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-mono text-xs font-medium text-amber-800"
                  >
                    {ex.numero}
                    <button
                      onClick={() => retirerMutation.mutate(ex.id)}
                      className="text-amber-500 hover:text-amber-800"
                      title="Retirer (le numéro redevient utilisable)"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {retirerMutation.isError && (
              <p className="mt-2 text-sm text-red-600">{messageErreur(retirerMutation.error)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
