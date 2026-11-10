require("dotenv").config();

const Database = require("better-sqlite3");
const { Client } = require("pg");

const tables = [
  "Admin",
  "Exam",
  "Student",
  "Exam",
  "Test",
  "Question",
  "ExamResult",
  "QuestionReport",
];

async function main() {
  const sqlite = new Database("dev-backup.db", { readonly: true });
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pg.connect();

    for (const table of [...new Set(tables)]) {
      const result = await pg.query(
        `SELECT COUNT(*) FROM "${table}"`
      );

      if (Number(result.rows[0].count) !== 0) {
        throw new Error(`${table} is not empty. Transfer stopped.`);
      }
    }

    await pg.query("BEGIN");

    for (const table of [...new Set(tables)]) {
      const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();

      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const columnSQL = columns.map(c => `"${c}"`).join(", ");
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

      for (const row of rows) {
        const values = columns.map(c => row[c]);

        await pg.query(
          `INSERT INTO "${table}" (${columnSQL}) VALUES (${placeholders})`,
          values
        );
      }

      console.log(`${table}: copied ${rows.length} records`);
    }

    for (const table of [...new Set(tables)]) {
      await pg.query(
        `SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE(MAX(id), 1),
          COUNT(*) > 0
        ) FROM "${table}"`
      );
    }

    await pg.query("COMMIT");
    console.log("\nSUCCESS: All records transferred.");
  } catch (error) {
    await pg.query("ROLLBACK").catch(() => {});
    console.error("\nTRANSFER FAILED:", error.message);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

main();