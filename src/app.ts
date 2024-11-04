import puppeteer from 'puppeteer';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Hi! This bot created only for personal use. Find another one!'));

async function getTikTokVideoBuffer(url: string) {
	const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
	const page = await browser.newPage();

	let videoBuffer: Buffer = null;

	page.on('response', async (response) => {
		const videoUrl = response.url();
		if (response.headers()['content-type'] === 'video/mp4' && !videoUrl.includes('playback1.mp4')) {
			videoBuffer = await response.buffer();
		}
	});

	await page.goto(url, { waitUntil: 'networkidle2' });

	await browser.close();

	return videoBuffer;
}

bot.command('v', async (ctx) => {
	const b = await getTikTokVideoBuffer('https://vm.tiktok.com/ZMhX3XRxq/');
	ctx.replyWithVideo({ source: b });
});

bot.hears(/https:\/\/vm.tiktok.com\/(\w+)\//, async (ctx) => {
	const message = await ctx.reply('Processing...', {
		reply_parameters: {
			message_id: ctx.message.message_id,
		},
	});

	const videoBuffer = await getTikTokVideoBuffer(ctx.match[0]);

	await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, undefined, 'Loading...');

	await ctx.telegram.editMessageMedia(ctx.chat.id, message.message_id, undefined, {
		type: 'video',
		media: { source: videoBuffer },
	});
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
