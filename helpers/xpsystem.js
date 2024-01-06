const { AsyncDatabase } = require("promised-sqlite3");

module.exports = {
  async incrementXP(memberId) {
    const db = await AsyncDatabase.open("db.sqlite");
    db.inner.on("trace", (sql) => console.log("[TRACE]", sql));
    //this function will just increment xp.
    let levelMessage = "";
    let level;

    let randomXP = Math.floor(Math.random() * 15) + 10;

    let row = await db.get(`SELECT * FROM xp WHERE id=${memberId}`);
    if (!row)
      await db.run(
        `INSERT INTO xp (id, level, xp) VALUES ("${memberId}", 0, 0)`
      );
    else {
      await db.run(
        `UPDATE xp SET xp=${row.xp + randomXP} WHERE id=${memberId}`
      );

      level = row.level;

      if (row.xp >= 5 * Math.pow(row.level, 2) + 75 * row.level + 100) {
        //in this case, level up.
        levelMessage = `Let's congratulate <@!${memberId}> for reaching level ${
          row.level + 1
        }! :DDD`;
        await db.run(
          `UPDATE xp SET level=${row.level + 1} WHERE id=${memberId}`
        );
        level++;
      }
    }

    return {
      message: levelMessage,
      level: level,
    };
  },
};
