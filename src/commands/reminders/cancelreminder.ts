import { Reminder } from '@lib/types/Reminder';
import { DB } from '@root/config';
import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Cancel any pending reminders you may have.';
	extendedHelp = 'You can only cancel one reminder at a time';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'remindernumber',
			type: 'INTEGER',
			required: true,
			description: 'ID of the reminder to cancel'
		}
***REMOVED***

	async run(interaction: CommandInteraction): Promise<unknown> {
		const remindNum = interaction.options.getInteger('remindernumber') - 1;

		const reminders: Array<Reminder> = await interaction.client.mongo.collection(DB.REMINDERS)
			.find({ owner: interaction.user.id }).toArray();
		reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());
		const reminder = reminders[remindNum***REMOVED***

		if (!reminder) {
			interaction.reply({
				content: `I couldn't find reminder **${remindNum}**. Use the \`viewremind\` command to see your current reminders.`,
				ephemeral: true
			});
		}

		interaction.client.mongo.collection(DB.REMINDERS).findOneAndDelete(reminder);

		const hidden = reminder.mode === 'private';
		return interaction.reply({
			content: `Canceled reminder: **${reminder.content}**`,
			ephemeral: hidden
		});
	}

}
