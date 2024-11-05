import { Command } from '@lib/types/Command';
import { CHANNELS, MAINTAINERS } from '@root/config';
import { EmbedBuilder, TextChannel, ChatInputCommandInteraction, ApplicationCommandOptionData,
	ApplicationCommandOptionType, InteractionResponse, Message } from 'discord.js';

export default class extends Command {

	description = 'Command that allows users to vote on public feedback messages';
	reactionYes = [];
	reactionNo = [];

	options: ApplicationCommandOptionData[] = [
		{
			name: 'feedback',
			description: 'feedback to be sent to the public feedback review channel',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'file',
			description: 'A file to be posted with the feedback',
			type: ApplicationCommandOptionType.Attachment,
			required: false
		}
	]

	// need to apply an error if the user uses the command outside of the feedback channels
	async run(interaction:ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
		function delay(ms: number): Promise<void> {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		console.log('PublicFeedbackVote command executed');
		const feedback = interaction.options.getString('feedback');
		const file = interaction.options.getAttachment('file');
		const feedbackChannel = await interaction.guild.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;

		const embed = new EmbedBuilder()
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
			.setTitle('New Feedback')
			.setDescription(feedback)
			.setColor('DarkGreen')
			.setTimestamp();

		if (file) embed.setImage(file.url);
		// react to the sent embed with the thumbs up and thumbs down emojis
		const message = await feedbackChannel.send({ embeds: [embed] }) as Message;
		await message.react('👍');
		await message.react('👎');
		console.log('Just a breakpoint');

		await new Promise(resolve => setTimeout(resolve, 60000));

		console.log('Breakpoint 2');
		// wait 10 minutes for users to vote on the feedback
		// await delay(60000);
		console.log('Waited for 10 minutes');

		// await new Promise(resolve => setTimeout(resolve, 600000));

		// Listen for reactions from other users.
		// message.awaitReactions({ filter: (reaction) => ['👍', '👎'].includes(reaction.emoji.name) });
		/*
		message.awaitReactions({ filter: (reaction) => ['👍', '👎'].includes(reaction.emoji.name), max: 1, time: 600000, errors: ['time'] })
			.then(collected => {
				const reaction = collected.first();
				if (reaction.emoji.name === '👍') {
					this.reactionYes.push(reaction);
					// message.reply('Thanks for voting yes!');
					console.log('Yes votes: ', this.reactionYes.length);
				} else {
					this.reactionNo.push(reaction);
					// message.reply('Thanks for voting no!');
					console.log('No votes: ', this.reactionNo.length);
				}
			});
		*/
		console.log('Yes votes: ', this.reactionYes.length);
		return interaction.reply({ content: `Thanks! I've sent your feedback to ${MAINTAINERS}.`, ephemeral: true });
	}

}
