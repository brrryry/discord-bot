/*
File: purge.js
Contributors:
  -vKitsu
*/

exports.run = async (client, message, args, level) => {
	if(!args[0]) return message.reply("you need to enter a number of messages to purge! Try again.");
    const amount = parseInt(args[0]) + 1; //this is used in order to account for the command itself

		if (isNaN(amount)) { //If the input value is not a number
			return message.reply('that doesn\'t seem to be a valid number.');
		} else if (amount < 1 || amount >= 100) {
			return message.reply('you can only purge 1-100 messages at a time. Please try again!');
		}

		message.channel.bulkDelete(amount, true).catch(err => { //Delete amount messages in bulk
			console.error(err);
			message.channel.send('there was an error trying to prune messages in this channel!');
		});
}


exports.config = {
  name: "purge",
  usage: "purge <number>",
  description: "Purge 1-100 messages!",
  category: "moderation",
  permissionLevel: 5
};
