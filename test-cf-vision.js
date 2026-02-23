const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        let value = values.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        acc[key.trim()] = value;
    }
    return acc;
}, {});

const accountId = envVars.CLOUDFLARE_ACCOUNT_ID;
const aiToken = envVars.CLOUDFLARE_AI_TOKEN;

const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const visionPrompt = "Describe this image.";

async function runTest() {
    console.log("Testing with accountId:", accountId ? "Set" : "Missing");
    console.log("Testing with aiToken:", aiToken ? "Set" : "Missing");

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
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: visionPrompt },
                                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                            ]
                        }
                    ],
                    max_tokens: 256
                })
            }
        );

        console.log("Response Status:", response.status);
        const text = await response.text();
        console.log("Response Body:", text);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

runTest();
