import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

export type Auth0User = {
  sub: string;
  [claim: string]: unknown;
};

function getRequiredEnv(name: 'AUTH0_AUDIENCE' | 'AUTH0_URL'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const auth0Url = getRequiredEnv('AUTH0_URL').replace(/\/+$/, '');


    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${auth0Url}/.well-known/jwks.json`,
      }),
      audience: getRequiredEnv('AUTH0_AUDIENCE'),
      issuer: `${auth0Url}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: Auth0User): Auth0User {
    return payload;
  }
}
