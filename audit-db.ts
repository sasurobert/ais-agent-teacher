import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function audit() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Seeding a test alert manually...");
        await pool.query(`
            INSERT INTO "teacher"."StudentAlert" ("id", "studentDid", "teacherDid", "type", "severity", "message")
            VALUES ('test-alert-1', 'student-test', 'teacher-123', 'MANUAL_TYPE', 'LOW', 'Manual test alert')
            ON CONFLICT ("id") DO NOTHING
        `);

        console.log("Auditing StudentAlert table contents...");
        const res = await pool.query('SELECT * FROM "teacher"."StudentAlert"');
        console.log("Alerts found:", JSON.stringify(res.rows));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
audit();
