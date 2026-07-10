import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startInMemoryMongo(): Promise<MongoMemoryServer> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  return mongod;
}
