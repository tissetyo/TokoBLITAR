require('dotenv').config({ path: '.env.local' });

async function testCF() {
    const accId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_AI_TOKEN;

    // A tiny red pixel base64 image
    const tinyRedPixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(tinyRedPixelBase64, 'base64');

    console.log("Testing detr-resnet-50...");
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accId}/ai/run/@cf/facebook/detr-resnet-50`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: Array.from(new Uint8Array(imageBuffer))
        })
    });

    console.log(res.status, await res.text());
}
testCF();
