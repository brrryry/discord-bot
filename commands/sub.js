const Discord = require("discord.js");

const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");

const {prefix, token, currencyname, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id


exports.run = async (client, message, args, level) => {
  //@YouLikeCats 1000

  if(!message.mentions.members.first()) return message.channel.send("You need to ping the person! Try again.");
  if(message.mentions.members.first().id === message.member.id && level < 10) return message.channel.send("You can't give money to yourself! Try again.");

  var currencyamount = args[1];
  if(isNaN(currencyamount)) return message.channel.send("You need to input a number! Try again.");

  let addCurrencyPromise = new Promise(resolve => {

    db.all(`SELECT * FROM currency WHERE id = ${message.mentions.members.first().id} AND guild = ${message.guild.id}`, (err, rows) => {
      if(rows.length == 0) {
        db.run(`INSERT INTO currency (id, guild, currency, prestige) VALUES (?, ?, ?, ?)`, [message.mentions.members.first().id, message.guild.id, -1 * currencyamount, 0]);
      } else {
        rows.forEach(row => {
            db.run(`UPDATE currency SET currency = ${row.currency} - ${currencyamount} WHERE id = ${message.mentions.members.first().id} AND guild = ${message.guild.id}`);
        })
      }
    });

    setTimeout(() => resolve("SUBTRACTED"), 500);
  });

  message.channel.send("Currency succesfully subtracted!");


}

exports.config = {
  name: "sub",
  usage: "sub <user ping> <amount>",
  description: "Subtract currency from an account!",
  category: "currency",
  permissionLevel: 5
};
