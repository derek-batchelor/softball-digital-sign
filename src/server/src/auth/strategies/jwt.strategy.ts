import { Inject, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AUTH_VALIDATION_METADATA, AuthValidationMetadata } from '../auth.constants';
import { AuthMetadataService } from '../auth-metadata.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly metadataService: AuthMetadataService,
    @Inject(AUTH_VALIDATION_METADATA) metadata: AuthValidationMetadata,
  ) {
    const audience = metadataService.getAudience();
    const issuers = JwtStrategy.expandIssuerVariants(metadata.issuer);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: issuers.length === 1 ? issuers[0] : issuers,
      audience,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: metadata.jwksUri,
      }),
    });

    this.logger.log(
      `JWT strategy configured for issuer(s) ${issuers.join(', ')} and audience ${audience}`,
    );
  }

  async validate(payload: Record<string, unknown>) {
    return payload;
  }

  private static expandIssuerVariants(rawIssuer: string): string[] {
    const variants: string[] = [];

    const addVariant = (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !variants.includes(trimmed)) {
        variants.push(trimmed);
      }
    };

    if (!rawIssuer) {
      return variants;
    }

    const normalized = rawIssuer.trim();
    addVariant(normalized);

    const withoutTrailingSlash = normalized.replace(/\/+$/, '');
    addVariant(withoutTrailingSlash);
    addVariant(`${withoutTrailingSlash}/`);

    if (withoutTrailingSlash.endsWith('/v2.0')) {
      const base = withoutTrailingSlash.replace(/\/v2\.0$/, '');
      addVariant(base);
      addVariant(`${base}/`);
    } else {
      const withV2 = `${withoutTrailingSlash}/v2.0`;
      addVariant(withV2);
      addVariant(`${withV2}/`);
    }

    return variants;
  }
}
