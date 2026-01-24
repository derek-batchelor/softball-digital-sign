export const AUTH_VALIDATION_METADATA = Symbol('AUTH_VALIDATION_METADATA');

export interface AuthValidationMetadata {
  issuer: string;
  jwksUri: string;
}
