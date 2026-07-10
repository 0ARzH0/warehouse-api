import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as request from 'supertest';
import { startInMemoryMongo } from './utils/mongoMemoryServer';
import { createTestApp } from './utils/createTestApp';
import { UsersService } from '../src/users/UsersService';
import { Role } from '../src/users/enum/Role.enum';

describe('Users & Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let usersService: UsersService;

  let adminToken: string;
  let supervisorToken: string;
  let userToken: string;
  let supervisorId: string;
  let userId: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    app = await createTestApp();
    usersService = app.get(UsersService);

    await usersService.create({
      email: 'admin@warehouse.com',
      password: 'AdminPass123',
      role: Role.Admin,
    });

    const adminLogin = await login('admin@warehouse.com', 'AdminPass123');
    adminToken = adminLogin.body.accessToken;

    const supervisorRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'supervisor@warehouse.com',
        password: 'SupervisorPass123',
        role: Role.Supervisor,
      });
    supervisorId = supervisorRes.body._id;

    const userRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'user@warehouse.com',
        password: 'UserPass123',
        role: Role.User,
      });
    userId = userRes.body._id;

    supervisorToken = (
      await login('supervisor@warehouse.com', 'SupervisorPass123')
    ).body.accessToken;
    userToken = (await login('user@warehouse.com', 'UserPass123')).body
      .accessToken;
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await login('admin@warehouse.com', 'AdminPass123');
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects an invalid password', async () => {
      const res = await login('admin@warehouse.com', 'WrongPassword');
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email', async () => {
      const res = await login('missing@warehouse.com', 'AdminPass123');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /users', () => {
    it('rejects creation without a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'nope@warehouse.com', password: 'password123' });
      expect(res.status).toBe(401);
    });

    it('rejects creation from a non-admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'nope@warehouse.com', password: 'password123' });
      expect(res.status).toBe(403);
    });

    it('never returns the password field', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'fresh@warehouse.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.password).toBeUndefined();
    });

    it('rejects a duplicate email with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'user@warehouse.com', password: 'password123' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /users', () => {
    it('allows admin to list all users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('allows supervisor read-only access', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('rejects a plain user', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /users/:id', () => {
    it('allows a user to view their own record', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('user@warehouse.com');
    });

    it('rejects a user viewing another user record', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${supervisorId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /users/:id', () => {
    it('allows a user to change their own password', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'NewUserPass123' });
      expect(res.status).toBe(200);

      const relogin = await login('user@warehouse.com', 'NewUserPass123');
      expect(relogin.status).toBe(200);
    });

    it('rejects a user attempting to change their own role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: Role.Admin });
      expect(res.status).toBe(403);
    });

    it('rejects a user editing another user record', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${supervisorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'HackedPass123' });
      expect(res.status).toBe(403);
    });

    it('allows admin to change another user role/email', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${supervisorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.User });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe(Role.User);
    });
  });

  describe('DELETE /users/:id', () => {
    it('rejects deletion from a non-admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to delete a user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const followUp = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(followUp.status).toBe(404);
    });
  });
});
