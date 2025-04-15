require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const telegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { time } = require('console');
// 初始化
const twitterClinet = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const bot = new telegramBot(process.env.TELEGRAM_BOT_TOKEN);
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const sendFilePath = path.basename(__dirname, 'send.js');
//初始化 已发送的推文记录
let sendTwitterIds = [];
if (fs.existsSync(sendFilePath)) {
	sendTwitterIds = JSON.parse(fs.readFileSync(sendFilePath));
}
//指定监听id
const twitterUserId = '44196397';
//定时函数
setInterval(async () => {
	try {
		bot.sendMessage('-1001576539375', '开始抓取');
		//拉取最近五条
		const tweets = await twitterClinet.v2.userTimeline(twitterUserId, {
			max_results: 5,
			'tweet.fields': ['created_at'],
			exclude: ['retweets', 'replies'] // 只看原推文
		});
		//拿到数据
		for (const tweet of tweets.data.data) {
			const tweetId = tweet.id;
			const tweetText = tweet.text;
			//未推送过才推送  如何判断有没有推送这就需要一个存储历史记录的ids 就是 sendFile
			if (!sendTwitterIds.includes(tweetId)) {
				const tweetUrl = 'http://twitter.com/i/web/status/${tweetId}';
				const message = `📢 新推文发布：\n\n${tweetText}\n\n🔗 [查看原文](${tweetUrl})`;
				//发送 Markdown 格式消息到 Telegram 频道
				await bot.sendMessage(channelId, message, { parse_mode: 'Markdown', disable_web_page_preview: false });
				console.log('已发送' + tweetId);
				//同时保存到历史list中
				sendTwitterIds.push(tweetId);
				// 保存记录
				fs.writeFileSync(sentFilePath, JSON.stringify(sentTweetIds, null, 2));
			}
		}
	} catch (error) {
		console.error('抓取或发送失败!!!', error.message);
	}
}, 60 * 1000); // 每 60 秒执行一次
