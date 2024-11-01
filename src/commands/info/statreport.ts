import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import { SageUser } from '@root/src/lib/types/SageUser';
import { DB } from '@root/config';


// WILL SEND A DM STRAIGHT TO THE USER AND WILL SHOW A TOTAL OF THEIR COMMAND USAGE IN A NICE FORMAT (HOPEFULLY)
export default class extends Command {

	description = 'Generate report of user data!';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		let responseEmbed: EmbedBuilder;
		// console.log(interaction.user.globalName);
		// console.log(interaction.user);
		// const user = interaction.options.getUser(interaction.user.globalName);
		// console.log(user);
		const sender: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });
		let info
		= `Hello ${interaction.user}! 
			
		A couple of info we have on you!
		`;
		if (sender.commandUsage === null) {
			info += `Unfortunately you havent used any commands yet! If you want to utilize commands, please use the /help to find help on commands`;
		} else {
			const usageMap = sender.commandUsage.map((obj) => `${obj.commandName} `);
			info += `Wow! Seems like you do utilize commands! Here are some stats of your command use:
				${usageMap}
			`;
		}
		if (interaction.user) {
			responseEmbed = new EmbedBuilder()
				.setColor('#add8e6')
				.setTitle('Generated Report:')
				.setDescription(info);
			interaction.user.send({ embeds: [responseEmbed] });
		} else {
			return interaction.reply({ content: interaction.user.username });
		}
		return interaction.reply({ content: 'generated report!', ephemeral: true });
	}

}
