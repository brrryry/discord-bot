const Discord = require("discord.js");

exports.run = (client, message, args, level) => {

    message.delete(); //Supposed to delete message

    if(!args[0]) return message.reply('you must include the channel to announce in! Try again.');

    const channel = message.mentions.channels.first();
    var message;

    try {
    } catch (error) {
      return message.reply("I couldn't find that channel!");
    }

    const announcement = args.slice(1).join(" ");

    if(!args[1]) return message.reply('you need to type out your announcement! Try again.');

    const user = message.author;


    let sendChannel = message.guild.channels.cache.get(channel.id);
    sendChannel.send(announcement);
    //message.reply("announcement was successful.");

}

exports.config = {
  name: "announce",
  usage: "announce <channel> <message>",
  description: "THE BOT SHALL SPEAK!",
  category: "misc",
  permissionLevel: 10,
  guildLevel: 1,
  aliases: ['thelordshallspeak']
};
