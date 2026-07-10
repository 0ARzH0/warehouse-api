import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from '../AppModule';
import { UsersService } from '../users/UsersService';
import { Role } from '../users/enum/RoleEnum';
import { loadEnvFile } from '../config/loadEnvFile';

const logger = new Logger('SeedAdmin');

export async function seedAdmin(
  usersService: UsersService,
  email: string,
  password: string,
): Promise<void> {
  const existing = await usersService.findByEmail(email);
  if (existing) {
    logger.log(`User ${email} already exists — skipping seed.`);
    return;
  }

  await usersService.create({ email, password, role: Role.Admin });
  logger.log(`Admin user ${email} created.`);
}

async function bootstrap() {
  loadEnvFile(join(__dirname, '..', '..', 'environment', 'local.env'));

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    logger.error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed an admin user.',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  await seedAdmin(app.get(UsersService), email, password);
  await app.close();
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
