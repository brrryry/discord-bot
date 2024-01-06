const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const seedDB = async (callback) => {
    await db.run(`DROP TABLE IF EXISTS xp`)

    await db.run(`CREATE TABLE "xp" (
        "id"	TEXT NOT NULL,
        "level"	INTEGER NOT NULL,
        "xp"	INTEGER NOT NULL
    )`);

    callback();
}

seedDB(() => { console.log("Database successfully seeded!") })