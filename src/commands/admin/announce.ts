import { BOTMASTER_PERMS } from '@lib/permissions';
import { TextChannel, Message, ApplicationCommandPermissionData, CommandInteraction, ApplicationCommandOptionData } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS***REMOVED***

	options: ApplicationCommandOptionData[] = [{
		name: 'channel',
		description: 'The channel to send the announcement in.',
		type: 'CHANNEL',
		required: true
	},
	{
		name: 'content',
		description: 'The announcement content',
		type: 'STRING',
		required: true
	},
	{
		name: 'image',
		description: 'The announcement image url',
		type: 'STRING',
		required: false
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const announceChannel = interaction.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS);
		const channelOption = interaction.options.getChannel('channel');
		const content = interaction.options.getString('content');
		const image = interaction.options.getString('image');

		const channel = (channelOption || announceChannel) as TextChannel;
		await channel.send({
			content: content,
			allowedMentions: { parse: ['everyone', 'roles'] }
		});
		if (image) {
			await channel.send({
				content: image
			});
		}

		return interaction.reply(`Your announcement has been sent in ${channel}`);
	}

	run(_msg: Message): Promise<void> { return; }

}
