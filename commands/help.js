const Discord = require('discord.js');
const sql = require('sqlite3').verbose();
var db = new sql.Database("db.sqlite");
const {prefix, token, status, gatewaychannelid, modlogchannelid, messagechannelid} = require("../config.json"); //get the prefix, token, status and welcome channel id
const fs = require("fs");
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

exports.run = (client, message, args, level) => {

    if(args[0]) { //help on a specific category
      var outputValue = `\`\`\`ARM\n===<${args[0].toUpperCase()}>===\n`;
      for(const file of commandFiles) {
        const command = require(`./${file}`);
        if(args[0].toLowerCase() === command.config.category && command.config.permissionLevel <= level) {
          outputValue += `'${prefix}${command.config.name}': ${command.config.description}\n`;
        }
      }

      if(outputValue == `\`\`\`ARM===<${args[0].toUpperCase()}>===\n`) return message.reply("that isn't a valid category OR none of the commands are ones that you can use! Try again.");

      return message.channel.send(outputValue + "```");

    }

    //otherwise use normal help commands
    var categories = [];
    for(const file of commandFiles) {
      const command = require(`./${file}`);
      var categoryFound = false;
      for(var i = 0; i < categories.length; i++) {
        if(categories[i] == command.config.category.toLowerCase()) categoryFound = true;
      }

      if(!categoryFound) categories.push(command.config.category);
    }

    var embed = new Discord.MessageEmbed().setTitle("Help Hub!");
    var descValue = "";
    for(const category of categories) {
      descValue += `${prefix}help ${category}\n\n`;
    }
    embed.setDescription("Use these commands to help you!\n\n" + descValue);

    return message.channel.send(embed);

}

exports.config = {
  name: "help",
  usage: "help <category (optional)>",
  description: "Get some help!",
  category: "utility",
  permissionLevel: 0
};
