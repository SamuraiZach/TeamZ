import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { Command } from '@lib/types/Command';

const args = ['online', 'idle', 'dnd', 'invisible'***REMOVED***
export default class extends Command {

	description = `Sets ${BOT.NAME}'s status.`;
	usage = '<online|idle|dnd|invisible>';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS***REMOVED***

	options: ApplicationCommandOptionData[] = [{
		name: 'status',
		description: 'The status to give the bot (online, idle, dnd, invis).',
		type: 'STRING',
		required: true,
		choices: args.map((arg) => ({
			name: arg,
			value: arg
		}))
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const status = interaction.options.getString('status');
		const bot = interaction.client;
		//	bot.user.setStatus(status);

		return interaction.reply(`Set ${BOT.NAME}'s status to ${status}`);
	}

	async run(msg: Message, [status]: ['online' | 'idle' | 'dnd' | 'invisible']): Promise<Message> {
		const bot = msg.client;
		bot.user.setStatus(status);

		return msg.channel.send(`Set ${BOT.NAME}'s status to ${status}`);
	}

	argParser(msg: Message, input: string): [string] {
		if (input === '') {
			throw `Usage: ${this.usage}`;
		}

		const validStatuses = ['online', 'idle', 'dnd', 'invisible'***REMOVED***

		if (!validStatuses.includes(input = input.trim().toLowerCase())) {
			throw `invalid status ${input}. Status must be one of ${validStatuses.join(', ')}`;
		}

		return [input***REMOVED***
	}

}
