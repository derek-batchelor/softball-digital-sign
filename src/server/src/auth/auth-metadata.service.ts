import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { URL } from 'node:url';
import { AuthValidationMetadata } from './auth.constants';

@Injectable()
export class AuthMetadataService {
  private readonly logger = new Logger(AuthMetadataService.name);
  private metadataPromise?: Promise<AuthValidationMetadata>;

  constructor(private readonly configService: ConfigService) {}

  async getValidationMetadata(): Promise<AuthValidationMetadata> {
    this.metadataPromise ??= this.loadValidationMetadata();

    return this.metadataPromise;
  }

  getAudience(): string {
    const audience = this.configService.get<string>('AUTH_AUDIENCE');

    if (!audience) {
      throw new Error('AUTH_AUDIENCE environment variable is required for JWT validation.');
    }

    return audience;
  }

  private async loadValidationMetadata(): Promise<AuthValidationMetadata> {
    const metadataUrl = this.configService.get<string>('AUTH_METADATA_URL');

    if (!metadataUrl) {
      throw new Error('AUTH_METADATA_URL environment variable is required for JWT validation.');
    }

    const metadata = await this.fetchOpenIdMetadata(metadataUrl);

    if (!metadata.issuer || !metadata.jwks_uri) {
      throw new Error('OIDC metadata response missing issuer or jwks_uri fields.');
    }

    this.logger.log(`Loaded issuer and JWKS URI from ${metadataUrl}`);

    // Preserve values for components that still read from process.env
    process.env.AUTH_ISSUER = process.env.AUTH_ISSUER || metadata.issuer;
    process.env.AUTH_JWKS_URI = process.env.AUTH_JWKS_URI || metadata.jwks_uri;

    return {
      issuer: metadata.issuer,
      jwksUri: metadata.jwks_uri,
    };
  }

  private fetchOpenIdMetadata(
    url: string,
  ): Promise<{ issuer?: string; jwks_uri?: string } & Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      try {
        const targetUrl = new URL(url);
        const client = targetUrl.protocol === 'http:' ? httpRequest : httpsRequest;

        const request = client(
          {
            method: 'GET',
            hostname: targetUrl.hostname,
            port: targetUrl.port,
            path: `${targetUrl.pathname}${targetUrl.search}`,
            headers: {
              Accept: 'application/json',
            },
          },
          (response) => {
            const statusCode = response.statusCode ?? 0;

            if (statusCode >= 400) {
              reject(new Error(`Failed to load OIDC metadata (${statusCode}).`));
              response.resume();
              return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk: Buffer) => chunks.push(chunk));
            response.on('end', () => {
              try {
                const payload = Buffer.concat(chunks).toString('utf8');
                resolve(JSON.parse(payload));
              } catch (parseError) {
                const reason =
                  parseError instanceof Error ? parseError.message : 'Unknown parse failure.';
                this.logger.error(`Unable to parse OIDC metadata JSON response: ${reason}`);
                reject(new Error('Unable to parse OIDC metadata JSON response.'));
              }
            });
          },
        );

        request.on('error', (error) => reject(error));
        request.end();
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error('Failed to construct request for OIDC metadata.'),
        );
      }
    });
  }
}
