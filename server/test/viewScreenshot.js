import fs from 'fs';

const SERVER_URL = 'http://localhost:2000'; // ← your port is 2000
const TEST_URL = 'https://github.com/Kowshik-Poojary';    // simple sanity check first

async function test() {
  console.log(`\n🔍 Testing screenshot for: ${TEST_URL}\n`);

  try {
    const res = await fetch(`${SERVER_URL}/api/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: TEST_URL }),
    });

    const data = await res.json();

    console.log('Page Title:', data.pageTitle);
    console.log('Success:', data.success);
    console.log('Error:', data.error);
    console.log('Screenshot captured:', !!data.screenshot);

    if (data.screenshot) {
      if (!fs.existsSync('./test')) fs.mkdirSync('./test');
      const buffer = Buffer.from(data.screenshot, 'base64');
      fs.writeFileSync('./test/screenshot.jpg', buffer);
      console.log('\n📸 Done! Open test/screenshot.jpg to view it.');
    }

  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }
}

test();