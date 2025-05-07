import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordEncoderService {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async compare(rawPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(rawPassword, hashedPassword);
  }
}
