let isReady = false;
let client = null;

const initWhatsApp = async () => {
  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');

    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.on('qr', (qr) => {
      console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nWhatsApp > Linked Devices > Link a Device > Scan\n');
    });

    client.on('ready', () => {
      isReady = true;
      console.log('✅ WhatsApp is ready! Messages will now be sent.');
    });

    client.on('auth_failure', () => {
      console.log('❌ WhatsApp auth failed. Restart and scan again.');
    });

    await client.initialize();
  } catch (err) {
    console.log('WhatsApp init error:', err.message);
  }
};

const sendWhatsAppSOS = async (contacts, user, coordinates) => {
  if (!isReady || !client) {
    console.log('WhatsApp not ready yet');
    return;
  }

  const [lng, lat] = coordinates;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const message =
    `🚨 *EMERGENCY ALERT* 🚨\n\n` +
    `*${user.name}* needs help RIGHT NOW!\n\n` +
    `📍 *Live Location:*\n${mapsLink}\n\n` +
    `⏰ ${new Date().toLocaleString('en-IN')}\n\n` +
    `Please call them immediately!\n` +
    `_Sent by SafeNet_ 🛡️`;

  for (const contact of contacts) {
    try {
      const number = contact.phone.replace(/\D/g, '') + '@c.us';
      await client.sendMessage(number, message);
      console.log(`✅ WhatsApp sent to ${contact.name}`);
    } catch (err) {
      console.log(`❌ WhatsApp failed for ${contact.name}: ${err.message}`);
    }
  }
};

module.exports = { initWhatsApp, sendWhatsAppSOS };