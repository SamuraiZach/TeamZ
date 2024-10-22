import { Command } from '@lib/types/Command';
import { Client } from 'discord.js';

export default class extends Command {

	client: Client;

	constructor(client: Client) {
		super();
		this.client = client;
	}

	description = 'Provide feedback buttons for users to use on the feedback channel.';

	async run(): Promise<void> {
		const feedbackChannel = '1290313285630951588';
		this.client.on('messageCreate', async (message) => {
			if (message.channel.id === feedbackChannel) {
				try {
					await message.react('👍');
					await message.react('👎');
				} catch (error) {
					console.error('Failed to react with emoji: ', error);
				}
			}
		});
	}

}
