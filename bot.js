import fs from "fs";
import fetch from "node-fetch";
import Twitter from "twitter-lite";

const API_URL = "https://polytariastatus.ziadn6b.workers.dev/api/status";
const STATUS_FILE = "./last_status.json";

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

// Function to send a tweet
async function sendTweet(message) {
  await twitter.post("statuses/update", { status: message });
  console.log("Tweet sent:", message);
}

async function main() {
  // Ensure status file exists
  if (!fs.existsSync(STATUS_FILE)) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: "unknown" }, null, 2));

    // First-run / startup tweet
    await sendTweet(
      "Polytoria Status Bot started! Monitoring status now. https://polysts.surge.sh"
    );
  }

  const apiRes = await fetch(API_URL);
  const data = await apiRes.json();

  const last = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
  const previousStatus = last.status;
  const currentStatus = data.status;

  if (currentStatus !== previousStatus) {
    let tweet = null;

    if (currentStatus === "down") {
      tweet =
        `Polytoria appears to be DOWN.\n\n` +
        `HTTP status: ${data.httpStatus}\n` +
        `Detected at: ${new Date(data.time).toUTCString()}\n\n` +
        `Status page: https://polysts.surge.sh`;
    }

    if (currentStatus === "up" && previousStatus === "down") {
      tweet =
        `Polytoria is BACK UP.\n\n` +
        `Confirmed at: ${new Date(data.time).toUTCString()}\n\n` +
        `Status page: https://polysts.surge.sh`;
    }

    if (tweet) {
      await sendTweet(tweet);
    }

    // Update status file
    fs.writeFileSync(
      STATUS_FILE,
      JSON.stringify({ status: currentStatus }, null, 2)
    );
  } else {
    console.log("No status change. No tweet.");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
