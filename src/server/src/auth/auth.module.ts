import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ClaimsGuard } from './guards/claims.guard';
import { AuthMetadataService } from './auth-metadata.service';
import { AUTH_VALIDATION_METADATA } from './auth.constants';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    AuthMetadataService,
    {
      provide: AUTH_VALIDATION_METADATA,
      useFactory: async (metadataService: AuthMetadataService) =>
        metadataService.getValidationMetadata(),
      inject: [AuthMetadataService],
    },
    JwtStrategy,
    JwtAuthGuard,
    ClaimsGuard,
  ],
  exports: [JwtAuthGuard, ClaimsGuard],
})
export class AuthModule {}
