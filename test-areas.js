const dot = require('dotenv').config({ path: '.env.local' });
async function run() {
  const params = new URLSearchParams({
    countries: 'ID',
    input: 'Sananwetan',
    type: 'single'
  });
  const res = await fetch(`https://api.biteship.com/v1/maps/areas?${params}`, {
    headers: { 'Authorization': process.env.BITESHIP_API_KEY },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
