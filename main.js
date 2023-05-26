const { Gpio } = require( 'onoff' );
const player = require('play-sound')(opts = {});
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

require('dotenv').config()

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID;
const gpioPinNum = parseInt(process.env.GPIO_PIN_NUMBER);

let playRing = false;
let playing = false;
let gpioPinStatus;

const bot = new TelegramBot(telegramBotToken, {polling: true});
const button = new Gpio(gpioPinNum, 'in');

const enableRing = async () => {
	playRing = true;
	await bot.sendMessage(chatId, 'Ring enabled');
}

const disableRing = async () => {
	playRing = false;
	bot.sendMessage(chatId, 'Ring disabled');
}

bot.on('message', (msg) => {
	if(msg.text.startsWith('/ring')) {
		const newStatus = msg.text.split(' ')[1];
		if(parseInt(newStatus) === 1 || newStatus === 'on') {
			enableRing()
		}
		else if(parseInt(newStatus) === 0 || newStatus === 'off') {
			disableRing()
		}
	}
});

setInterval( () => {
	gpioPinStatus = button.readSync();
	if(parseInt(gpioPinStatus) === 1 && !playing) {
		bot.sendMessage(chatId, 'Ring Ring!');

		if(playRing) {
			playing = true;
			player.play('bell.mp3', () => {
				playing = false
			})
		}
	}
}, 1000 );

cron.schedule('0 9,21 * * *', () => {
	const date = new Date();
	const hours = date.getHours();

	if (hours === 9) {
		enableRing()
	} else if (hours === 21) {
		disableRing()
	}
});
