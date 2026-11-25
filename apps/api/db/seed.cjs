const { Pool } = require('pg');


//docker compose exec api yarn db:seed 
const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

async function seed() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        tests JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS contests (
        id SERIAL PRIMARY KEY,
        problems JSONB NOT NULL DEFAULT '[]'::jsonb,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL
      )
    `);

    //await pool.query('DROP TABLE solutions');
    // await pool.query(`
    //   ALTER TABLE solutions
    //   ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id)
    // `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS solutions (
        id SERIAL PRIMARY KEY,
        problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        passed BOOLEAN,
        exec_ms INTEGER CHECK (exec_ms >= 0),
        language VARCHAR(100) NOT NULL,
        codeS3Url TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending_upload',
        contest_id INTEGER REFERENCES contests(id)
        )
        `);

    await pool.query(`
            CREATE INDEX idx_solutions_contest_passed_user_problem
    ON solutions (contest_id, user_id, problem_id)
    WHERE passed = TRUE;
          `);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
