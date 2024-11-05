import { ButtonInteraction, Client, Message, MessageComponentInteraction, MessageReaction, User } from 'discord.js';
import { handleRpsOptionSelect } from '../commands/fun/rockpaperscissors';
import { handlePollOptionSelect } from '../commands/fun/poll';
import { SageInteractionType } from '@lib/types/InteractionType';

async function register(bot: Client): Promise<void> {
	bot.on('interactionCreate', i => {
		if (i.isMessageComponent()) routeComponentInteraction(bot, i);
	});
	// When creating a message this portion will run because it see's that message Reactions have been added and will trigger on the initial add of thumbs up and down
	// need an if statement to verify the interaction just how the one above says i.isMessageComponent it could be the same but try different options
	bot.on('messageReactionAdd', (reaction, user) => handleUserReaction(bot, reaction.message.embeds[0].description, reaction.emoji.name, user.id));
}

async function routeComponentInteraction(bot: Client, i: MessageComponentInteraction) {
	if (i.isButton()) handleBtnPress(bot, i);
}

export default register;
function handleBtnPress(bot: Client, i: ButtonInteraction) {
	console.log('enter maybe');
	switch (i.customId.split('_')[0] as SageInteractionType) {
		case SageInteractionType.POLL:
			handlePollOptionSelect(bot, i);
			break;
		case SageInteractionType.RPS:
			handleRpsOptionSelect(i);
			break;
	}
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleUserReaction(bot: Client, description: string, choice: string, user: string) {
	if (user !== '1285236709780619395') {
		console.log('enter maybe');
		console.log(description, '   ', choice, '  ', user);
	}
}
