/*
File: usage.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const {prefix} = require("../config.json");
const fs = require("fs");
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

exports.run = (client, message, args, level) => {
    //Check if command name is even inputted
    if(!args[0]) return message.reply("you need to input a command name to get the usage! Try again.");

    //Look for specific command file
    for(const file of commandFiles) {
      const command = require(`./${file}`);

      if(command.config.name === args[0].toLowerCase() && command.config.permissionLevel <= level) {
        let stringofaliases = "";

        if(command.config.aliases) { //fetch aliases
          for(i = 0; i < command.config.aliases.length; i++) { //aliases!
            stringofaliases += `\`${prefix}${command.config.aliases[i]}\` `; //Add command data
          }
        }
        return message.channel.send(`${prefix}${command.config.name}: ${command.config.description}\n${prefix}${command.config.usage}\n\nAliases: ${stringofaliases}`);

      }
    }
    //Otherwise, the command doesn't exist (err)
    return message.reply("this command doesn't exist!");
}

exports.config = {
  name: "usage",
  usage: "usage <command name>",
  description: "Learn how to use a command!",
  category: "utility",
  permissionLevel: 0,
  aliases: ['u']
};
