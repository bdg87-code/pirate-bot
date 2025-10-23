require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Root route to confirm Render app is alive
app.get('/', (req, res) => {
  res.send('⚓ Pirate Bot is alive and sailing!');
});

// Slash command endpoint
app.post('/slack/commands/pirate', async (req, res) => {
  console.log('Received /pirate command:', req.body);

  const userId = req.body.user_id;
  const channelId = req.body.channel_id;
  const text = req.body.text;

  // Immediate response to Slack (prevents dispatch_failed)
  if (!text || text.trim().length === 0) {
    res.send('⚓ Ahoy! Please provide some text to translate, e.g.: `/pirate Hello world`');
    return;
  } else {
    res.send('⚓ Pirate Bot is translating your message...');
  }

  // Async: fetch translation and post to Slack
  try {
    const encodedText = encodeURIComponent(text);
    console.log('Sending to Pirate API:', text);

    const pirateResponse = await axios.get(
      `https://pirate.monkeyness.com/api/translate?english=${encodedText}`
    );

    console.log('Pirate API returned:', pirateResponse.data);

    const pirateText = pirateResponse.data || 'Arr! Something went wrong with the translation.';
    console.log('Posting to Slack channel:', channelId);

    const result = await slackClient.chat.postMessage({
      channel: channelId,
      text: `<@${userId}> says in pirate speak: ${pirateText}`
    });

    console.log('Slack postMessage result:', result);

  } catch (err) {
    console.error('Error during translation or posting:', err);

    // Attempt to notify Slack channel of failure
    try {
      await slackClient.chat.postMessage({
        channel: channelId,
        text: `☠️ Arr! Failed to translate message for <@${userId}>.`
      });
    } catch (postErr) {
      console.error('Failed to notify Slack channel of error:', postErr);
    }
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Pirate Bot running on port ${port}`));
