require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch'); // Need to use native fetch or node-fetch

async function acceptLicense() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const aiToken = process.env.CLOUDFLARE_AI_TOKEN;

    if(!accountId || !aiToken) {
        console.error("Missing Cloudflare credentials in .env.local");
        return;
    }

    console.log("Sending 'agree' to unlock @cf/meta/llama-3.2-11b-vision-instruct...");

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: '@cf/meta/llama-3.2-11b-vision-instruct',
                    messages: [
                        { role: 'user', content: 'agree' }
                    ]
                })
            }
        );

        const data = await response.json();
        console.log("Status:", response.status);
        if (response.ok) {
            console.log("Success! License accepted. Model should now be available.");
            console.log("Response:", data.choices?.[0]?.message?.content || data);
        } else {
            console.error("Failed to accept license:", data);
        }
    } catch (e) {
        console.error("Error connecting to Cloudflare:", e);
    }
}

acceptLicense();
