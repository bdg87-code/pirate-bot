require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Slash command endpoint
app.post('/slack/commands/pirate', async (req, res) => {
  const userId = req.body.user_id;
  const channelId = req.body.channel_id;
  const text = req.body.text;

  if (!text) return res.send('Ahoy! Ye need to give me some text to translate.');

  try {
    // URL encode the text
    const encodedText = encodeURIComponent(text);

    // Call Pirate Monkeyness API
    const pirateResponse = await axios.get(`https://pirate.monkeyness.com/api/translate?english=${encodedText}`);
    const pirateText = pirateResponse.data; // API returns raw text

    // Post to Slack as Pirate Bot
    await slackClient.chat.postMessage({
      channel: channelId,
      text: `<@${userId}> says in pirate speak: ${pirateText}`
    });

    res.send('⚓ Your message has been translated and posted!');

  } catch (err) {
    console.error(err);
    res.send('☠️ Arr! Something went wrong with the translation.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Pirate Bot running on port ${port}`));
