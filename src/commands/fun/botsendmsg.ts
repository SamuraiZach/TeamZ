import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, TextChannel } from 'discord.js';
import { Command } from '@lib/types/Command';


export default class extends Command {

	description = 'send a message to a private DM or a specified server channel!';
	extendedHelp = 'using options `server` or `dm` will specify the type.';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'dest',
			description: 'mention the channel',
			type: ApplicationCommandOptionType.Channel,
			required: true
		},
		{
			name: 'msg',
			description: 'message to send',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]
	run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		let responseEmbed: EmbedBuilder;
		const dest = interaction.options.getChannel('dest');
		const msg = interaction.options.getString('msg');

		if (dest && dest.type === ChannelType.GuildText) {
			responseEmbed = new EmbedBuilder()
				.setColor('#add8e6')
				.setTitle('Message sent using Sage')
				.setDescription(msg);
			// eslint-disable-next-line no-extra-parens
			(dest as TextChannel).send({ embeds: [responseEmbed] });
		} else {
			return interaction.reply({ content: 'invalid input' });
		}
		return interaction.reply({ content: 'message sent', ephemeral: true });
	}

}
