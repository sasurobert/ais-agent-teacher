import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function audit() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%State%'");
        console.log("Tables found:", res.rows);

        const currentSchema = await pool.query("SELECT current_schema()");
        console.log("Current schema:", currentSchema.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
audit();
