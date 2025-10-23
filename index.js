require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// ------------------------------
// Root route (for testing Render)
// ------------------------------
app.get('/', (req, res) => {
  res.send('⚓ Pirate Bot is alive and sailing!');
});

// ------------------------------
// Slash command endpoint
// ------------------------------
app.post('/slack/commands/pirate', (req, res) => {
  console.log('Received /pirate command:', req.body);

  const userId = req.body.user_id;
  const channelId = req.body.channel_id;
  const text = req.body.text;

  // Respond immediately to Slack
  if (!text || text.trim().length === 0) {
    return res.send('⚓ Ahoy! Please provide some text to translate, e.g.: `/pirate Hello world`');
  } else {
    res.send('⚓ Pirate Bot is translating your message...');
  }

  // Async translation and posting
  try {
    const encodedText = encodeURIComponent(text);
    const pirateResponse = await axios.get(
      `https://pirate.monkeyness.com/api/translate?english=${encodedText}`
    );
    const pirateText = pirateResponse.data || "Arr! Something went wrong with me translation.";

    // Post translation as bot
    await slackClient.chat.postMessage({
      channel: channelId,
      text: `<@${userId}> says in pirate speak: ${pirateText}`
    });

    console.log(`Posted translation for <@${userId}>: ${pirateText}`);
  } catch (err) {
    console.error('Error posting pirate translation:', err);
    // Optional: notify channel of error
    try {
      await slackClient.chat.postMessage({
        channel: channelId,
        text: `☠️ Arr! Failed to translate message for <@${userId}>.`
      });
    } catch (postErr) {
      console.error('Failed to notify channel of error:', postErr);
    }
  }
});

// ------------------------------
// Start server
// ------------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Pirate Bot running on port ${port}`));
