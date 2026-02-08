import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Setting up teacher schema (SNAKE_CASE fresh start)...");
        await pool.query('CREATE SCHEMA IF NOT EXISTS teacher');

        await pool.query('DROP TABLE IF EXISTS "teacher"."student_alert"');
        await pool.query('DROP TABLE IF EXISTS "teacher"."class_analytics"');
        await pool.query('DROP TABLE IF EXISTS "teacher"."teacher_state"');

        await pool.query(`
            CREATE TABLE "teacher"."teacher_state" (
                "teacher_did" TEXT NOT NULL,
                "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "preferences" JSONB,
                CONSTRAINT "teacher_state_pkey" PRIMARY KEY ("teacher_did")
            )
        `);

        await pool.query(`
            CREATE TABLE "teacher"."class_analytics" (
                "id" TEXT NOT NULL,
                "teacher_did" TEXT NOT NULL,
                "class_name" TEXT NOT NULL,
                "summary" TEXT NOT NULL,
                "alert_count" INTEGER NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "class_analytics_pkey" PRIMARY KEY ("id")
            )
        `);

        await pool.query(`
            CREATE TABLE "teacher"."student_alert" (
                "id" TEXT NOT NULL,
                "student_did" TEXT NOT NULL,
                "teacher_did" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "severity" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "resolved" BOOLEAN NOT NULL DEFAULT false,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "student_alert_pkey" PRIMARY KEY ("id")
            )
        `);

        // Seed
        await pool.query(`
            INSERT INTO "teacher"."class_analytics" ("id", "teacher_did", "class_name", "summary")
            VALUES ('class-001', 'teacher-123', 'Integration Test Class', 'Seeded for integration testing')
        `);

        await pool.query(`
            INSERT INTO "teacher"."teacher_state" ("teacher_did")
            VALUES ('teacher-123')
        `);

        console.log("Teacher schema setup completed successfully.");
    } catch (err) {
        console.error("Setup failed:", err);
    } finally {
        await pool.end();
    }
}
setup();
