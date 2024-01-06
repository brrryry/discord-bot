/*
File: leaderboard.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require("discord.js");

const { AsyncDatabase } = require("promised-sqlite3");

exports.run = async (client, message, args, level) => {
  const db = await AsyncDatabase.open("db.sqlite");
  //Enter Database, sort by XP count
  const rows = await db.all(`SELECT * FROM xp ORDER BY xp DESC LIMIT 15`);

  let embed = new Discord.EmbedBuilder()
    .setTitle("Most Active Members")
    .setColor(0x6a5b8e)
    .setFooter({ text: "Our most active members!" });
  var value = "";
  var count = 0;
  rows.forEach((row) => {
    count++;
    value += `**${count}**. <@!${row.id}>: ${row.xp} XP (Level ${row.level})\n`;
  });
  embed.setDescription(value);
  //send embed .-.
  await db.close();
  return message.channel.send({ embeds: [embed] });
};

exports.config = {
  name: "leaderboard",
  usage: "leaderboard",
  description: "The most active people in the server.",
  category: "misc",
  permissionLevel: 0,
  aliases: ["lb"],
};
