/*
File: dellog.js
Contributors:
  -vKitsu
*/

//Get Dependencies
const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const fs = require("fs");
const {prefix} = require("../config.json"); //get config stuff
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

exports.run = (client, message, args, level) => {
  if(args[0]) { //help on a specific category
    var outputValue = `\`\`\`ARM\n===<${args[0].toUpperCase()}>===\n`;
    var cate = false;
    for(const file of commandFiles) {
      const command = require(`./${file}`); //Get command file
      if(args[0].toLowerCase() === command.config.category && command.config.permissionLevel <= level) {
        outputValue += `'${prefix}${command.config.name}': ${command.config.description}\n`;
        console.log(file);
        cate = true;
      }
    }

    outputValue += `\nUse ${prefix}usage <command name> to get more information on a specific command!`;

    //If there is no valid command by that name
    if(!cate) return message.reply("that isn't a valid category OR none of the commands are ones that you can use! Try again.");

    return message.channel.send(outputValue + "```");

  }

  //otherwise use normal help commands
  var categories = [];
  //Get all command categories
  for(const file of commandFiles) {
    const command = require(`./${file}`);
    var categoryFound = false;
    for(var i = 0; i < categories.length; i++) {
      if(categories[i] == command.config.category.toLowerCase()) categoryFound = true;
    }

    if(!categoryFound) categories.push(command.config.category);
  }

  //Create/Customize embed
  var embed = new Discord.MessageEmbed().setTitle("Help Hub!");
  var descValue = "";
  descValue += `The prefix of this bot is currently \`\`${prefix}\`\`.\n\nCurrent Categories: `;

  for(const category of categories) {
    descValue += `\`\`${category}\`\` `;
  }

  descValue += `\nDo \`\`${prefix}help <category>\`\` to get help on a specific section of the bot commands!`;
  embed.setDescription(descValue);
  embed.setColor("#D43FEB");

  return message.channel.send(embed);

}

exports.config = {
  name: "help",
  usage: "help <category (optional)>",
  description: "Get some help!",
  category: "utility",
  permissionLevel: 0,
  aliases: ['helpmepls', 'halp', 'stuck', 'oof']
};
