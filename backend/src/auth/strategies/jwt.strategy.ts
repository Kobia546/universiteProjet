import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) {
      // On refuse de démarrer plutôt que de tourner avec un secret faible ou absent.
      // Une appli qui gère de l'argent ne doit jamais avoir de repli silencieux ici.
      throw new Error(
        'JWT_SECRET manquant ou trop court (16 caractères minimum). ' +
          'Configurez une valeur forte et aléatoire dans backend/.env avant de démarrer.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Ce qui est retourné ici est injecté dans `request.user`
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
