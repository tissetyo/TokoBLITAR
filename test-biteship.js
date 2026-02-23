const dot = require('dotenv').config({ path: '.env.local' });
async function run() {
  const params = {
    origin_area_id: "IDNP4C111K1115D111511", 
    destination_area_id: "IDNP3C28K218D2181",
    couriers: "jne,jnt,sicepat,anteraja,pos,tiki",
    items: [{ name: "Paket", weight: 1000, quantity: 1, value: 50000 }]
  };
  const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      "Authorization": process.env.BITESHIP_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
