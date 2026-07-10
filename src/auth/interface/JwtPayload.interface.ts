import { Role } from '../../users/enum/RoleEnum';

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
