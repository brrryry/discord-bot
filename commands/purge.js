exports.run = async (client, message, args, level) => {
    const amount = parseInt(args[0]) + 1;

    if(level < 5) return;

		if (isNaN(amount)) {
			return message.reply('that doesn\'t seem to be a valid number.');
		} else if (amount < 1 || amount >= 100) {
			return message.reply('you can only purge 1-100 messages at a time. Please try again!');
		}

		message.channel.bulkDelete(amount, true).catch(err => {
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
