const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testInpainting() {
    const accId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_AI_TOKEN;

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: "a green apple on a wooden table",
            image: [], // we will just test if it returns a format error or 404
            mask: []
        })
    });
    
    console.log(res.status, await res.text());
}
testInpainting();
