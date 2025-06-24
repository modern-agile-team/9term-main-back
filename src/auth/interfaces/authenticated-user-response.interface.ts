import { AuthenticatedUser } from './authenticated-user.interface';

export interface AuthenticatedUserResponse extends AuthenticatedUser {
  userId: number;
}
