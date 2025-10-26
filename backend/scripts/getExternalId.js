const Exercise = require("../models/exercise");

async function main() {
  const idArg = process.argv[2];
  if (!idArg) {
    console.error("Usage: node getExternalId.js <exerciseId>");
    process.exitCode = 2;
    return;
  }
  const id = Number(idArg);
  if (!Number.isFinite(id)) {
    console.error("Invalid id:", idArg);
    process.exitCode = 2;
    return;
  }

  // Helpful preflight: ensure DB connection string is present
  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing DATABASE_URL environment variable.\nSet it like this (PowerShell):"
    );
    console.error(
      "$env:DATABASE_URL = 'postgres://user:password@host:5432/dbname'"
    );
    process.exitCode = 2;
    return;
  }

  try {
    const ex = await Exercise.findById(id);
    if (!ex) {
      console.log(`No exercise found with id=${id}`);
      return;
    }
    console.log(
      `id=${ex.id} external_id=${ex.external_id || null} name=${ex.name}`
    );
  } catch (err) {
    console.error("Error querying DB (ensure DATABASE_URL is set):");
    // print full error for easier debugging
    console.error(err && (err.stack || err.toString()));
    process.exitCode = 1;
  }
}

main();
