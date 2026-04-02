import 'dotenv/config';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database...');
    
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ Extension "vector" enabled successfully.');
  } catch (err: any) {
    console.error('Error enabling extension:', err.message);
  } finally {
    await client.end();
  }
}

main();
