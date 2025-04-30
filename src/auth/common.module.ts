import { Module } from '@nestjs/common';
import { PasswordEncoderService } from './password-encoder.service';

@Module({
  providers: [PasswordEncoderService],
  exports: [PasswordEncoderService],
})
export class CommonModule {}
