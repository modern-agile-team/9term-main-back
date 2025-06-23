// src/types/express.d.ts
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}