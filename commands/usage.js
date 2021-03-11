const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id
const fs = require("fs");
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

exports.run = (client, message, args, level) => {

    if(!args[0]) return message.reply("you need to input a command name to get the usage! Try again.");

    for(const file of commandFiles) {
      const command = require(`./${file}`);

      if(command.config.name === args[0].toLowerCase() && command.config.level <= level) return message.channel.send(`${prefix}${command.config.name}: ${command.config.description}\n${prefix}${command.config.usage}`);
    }

    return message.reply("this command doesn't exist!");


}

exports.config = {
  name: "usage",
  usage: "usage <command name>",
  description: "Learn how to use a command!",
  category: "utility",
  permissionLevel: 0
};
