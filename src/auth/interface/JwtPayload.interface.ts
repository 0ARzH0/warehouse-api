import { Role } from '../../users/enum/Role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RequestUser {
  userId: string;
  email: string;
  role: Role;
}
