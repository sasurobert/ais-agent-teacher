import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Setting up teacher schema tables...");
        await pool.query('CREATE SCHEMA IF NOT EXISTS teacher');
        await pool.query('SET search_path TO teacher');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS "TeacherState" (
                "teacherDid" TEXT NOT NULL,
                "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "preferences" JSONB,
                CONSTRAINT "TeacherState_pkey" PRIMARY KEY ("teacherDid")
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS "ClassAnalytics" (
                "id" TEXT NOT NULL,
                "teacherDid" TEXT NOT NULL,
                "className" TEXT NOT NULL,
                "summary" TEXT NOT NULL,
                "alertCount" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ClassAnalytics_pkey" PRIMARY KEY ("id")
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS "StudentAlert" (
                "id" TEXT NOT NULL,
                "studentDid" TEXT NOT NULL,
                "teacherDid" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "severity" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "resolved" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "StudentAlert_pkey" PRIMARY KEY ("id")
            )
        `);

        console.log("Teacher schema tables created successfully.");
    } catch (err) {
        console.error("Setup failed:", err);
    } finally {
        await pool.end();
    }
}
setup();
