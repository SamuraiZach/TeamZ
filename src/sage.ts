import 'module-alias/register';
import { MongoClient } from 'mongodb';
import { Client } from 'discord.js';
import { readdirRecursive } from '@lib/utils';
import { DB, BOT, PREFIX } from '@root/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('console-stamp')(console, {
	pattern: 'dd/mm/yy hh:MM:ss.L tt',
	label: false
});

const bot = new Client();

MongoClient.connect(DB.CONNECTION, { useUnifiedTopology: true }).then((client) => {
	bot.mongo = client.db(BOT.NAME);
});

bot.login(BOT.TOKEN);

bot.once('ready', async () => {
	const pieceFiles = readdirRecursive('./dist/src/pieces');
	for (const file of pieceFiles) {
		const piece = await import(`@root/../${file}`);
		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0***REMOVED***
		if (typeof piece.default !== 'function') throw `Invalid piece: ${name}`;
		piece.default(bot);
		console.log(`${name} piece loaded.`);
	}

	console.log(`${BOT.NAME} online`);
	console.log(`${bot.ws.ping}ms WS ping`);
	console.log(`Logged into ${bot.guilds.cache.size} guilds`);
	console.log(`Serving ${bot.users.cache.size} users`);
	bot.user.setActivity(`${PREFIX}help`, { type: 'PLAYING' });
});
