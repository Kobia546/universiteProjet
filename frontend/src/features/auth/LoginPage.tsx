import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { login as loginApi } from './authApi';
import { useAuthStore } from './authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setIsLoading(true);
    try {
      const { accessToken, user } = await loginApi(email, motDePasse);
      login(accessToken, user);
      navigate('/');
    } catch {
      setErreur('Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <img src="/logos/universite.png" alt="Université Félix Houphouët-Boigny" className="h-14 w-14 object-contain" />
            <img src="/logos/ufr-sjap.png" alt="UFR SJAP" className="h-14 w-14 object-contain" />
          </div>
          <p className="font-serif text-sm font-semibold tracking-wide text-slate-700">SYFIC - SJAP</p>
          <h1 className="mt-2 font-serif text-lg font-semibold leading-snug text-slate-900">
            SYSTEME DE GESTION DES FICHES COMPTABLES
            <br />
            UFR-SJAP
          </h1>
          <div className="mx-auto my-2 h-px w-10 border-t border-dashed border-brand-300" />
          <p className="text-sm text-slate-500">Espace comptabilité</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            name="motDePasse"
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Se connecter
          </Button>
        </form>

        {/* Zone réservée à la marque du propriétaire/développeur.
            Remplacez /logos/proprietaire.png par votre logo (même dossier public/logos). */}
        <div className="mt-6 flex items-center justify-center">
          <img
            src="/logos/proprietaire.png"
            alt="Logo propriétaire"
            className="h-9 max-w-[160px] object-contain opacity-90"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
