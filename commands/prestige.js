const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, currencyname, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id


exports.run = async (client, message, args, level) => {
  /*
  1) Find the person's prestige
  100000 * 1.5^x where x = prestige level + 1
  */

  var currency = 0;
  var prestigelevel = 0;

  let getPrestigePromise = new Promise(resolve => {
    db.all(`SELECT * FROM currency WHERE id = ${message.member.id} AND guild = ${message.guild.id}`, (err, rows) => {
      rows.forEach(row => {
        currency = row.currency;
        prestigelevel = row.prestige;
      });
    });
    setTimeout(() => resolve("sgjlksdjklgkjgld"), 500);
  });

  let getPrestigeResult = await getPrestigePromise;

  var prestigecost = Math.pow(1.5, prestigelevel + 1) * 100000;

  if(currency < prestigecost) return message.channel.send(`You can't afford to prestige! (The cost is ${prestigecost} ${currencyname})`);

  const filter = response => {
    return (response.content.toLowerCase() === "yes" || response.content.toLowerCase() === "no");
  };

  message.channel.send(`Are you sure that you'd like to prestige? (You will lose ${prestigecost} ${currencyname})\n[REQUIRED INPUT: YES/NO]\n[MAX TIME: 15s]`).then((msg) => {
    msg.channel.awaitMessages(filter, {max: 1, time: 15000})
      .then(collected => {
        if(collected.first().content.toLowerCase() === "yes") {
          //prestige
          updatePrestigeRoles(message.member, prestigelevel + 1);
          db.run(`UPDATE currency SET currency = ${currency} - ${prestigecost} WHERE id = ${message.member.id} AND guild = ${message.guild.id}`);
          db.run(`UPDATE currency SET prestige = ${prestigelevel} + 1 WHERE id = ${message.member.id} AND guild = ${message.guild.id}`);
          return message.channel.send("Congratulations! You are now prestige level " + (prestigelevel + 1) + "!");

        } else {
          return message.channel.send("Cancelled.");
        }
      }).catch(collected => {
        return message.channel.send("No response was given.");
      });
  })


}


function updatePrestigeRoles(member, prestige) {
  var prestigeRoleIDs = ["818671806441455628", "818671880843165747", "818671960137269279", "818672014608695328", "818672107000823840"];
  var prestigeRoles = [];

  for(const id of prestigeRoleIDs) {
    var rolePush = member.guild.roles.cache.get(id);
    member.roles.remove(rolePush);
  }

  for(var i = 1; i <= prestigeRoleIDs.length; i++) {
    if(prestige == i) {
      member.roles.add(member.guild.roles.cache.get(prestigeRoleIDs[i - 1]));
      return;
    }
  }
}

exports.config = {
  name: "prestige",
  usage: "prestige",
  description: "Prestige to the next level!",
  category: "currency",
  permissionLevel: 0
};
