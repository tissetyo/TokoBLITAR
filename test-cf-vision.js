const fs = require('fs');

async function test() {
    const aiToken = process.env.CLOUDFLARE_AI_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    if(!aiToken || !accountId) {
        console.log("Missing env vars. Please run with CLOUDFLARE_AI_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...");
        return;
    }

    // Create a tiny 1x1 black pixel base64 jpeg for testing
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    
    const visionPrompt = "What is in this image?";
    
    console.log("Sending request to Cloudflare...");
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
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
    });
    
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", JSON.stringify(data, null, 2));
}

test();
