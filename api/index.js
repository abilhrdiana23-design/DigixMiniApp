const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const app = express();

// Inisialisasi Bot Tanpa Polling (Gunakan Webhook)
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper: Kirim Pesan Telegram
async function sendTelegramMessage(chatId, message) {
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error Send Telegram:', error.message);
  }
}

// 1. WEBHOOK TELEGRAM BOT (Menerima Pesan /start & Callback Button)
app.post('/api/telegram-webhook', (req, res) => {
  const update = req.body;

  if (update.message && update.message.text === '/start') {
    const chatId = update.message.chat.id;
    const firstName = update.message.from.first_name || 'Pelanggan';

    const captionText = 
      `<blockquote><tg-emoji emoji-id="5436351771125494452">❤️‍🔥</tg-emoji> <b>Halo, ${firstName}!</b>
      Selamat Datang di <b>DIGIXSHOP</b>
      Kami Menyediakan Berbagai Kebutuhan Kamu
      <b>Silahkan Pilih Menu Dibawah</b></blockquote>`;

    const options = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Buka Mini App', web_app: { url: config.WEBAPP_URL } }],
          [{ text: '💰 Cek Saldo', callback_data: 'menu_cek_saldo' }],
          [
            { text: '📦 Pesanan Saya', callback_data: 'menu_pesanan' },
            { text: 'ℹ️ Information', callback_data: 'menu_info' }
          ],
          [{ text: '👤 Owner', url: `https://t.me/${config.OWNER_USERNAME}` }],
          [{ text: '🤖 Chat CS AI', callback_data: 'menu_cs_ai' }]
        ]
      }
    };

    bot.sendMessage(chatId, captionText, options);
  } else if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'menu_cek_saldo') {
      bot.sendMessage(chatId, `💰 <b>Informasi Saldo Anda:</b>\n\nSilakan cek di MiniApp.`, { parse_mode: 'HTML' });
    } else if (data === 'menu_pesanan') {
      bot.sendMessage(chatId, "📦 <b>Riwayat Pesanan:</b>\n\nSistem siap memproses transaksi Anda.", { parse_mode: 'HTML' });
    } else if (data === 'menu_info') {
      bot.sendMessage(chatId, "ℹ️ <b>Informasi DIGIXSHOP:</b>\n\nLayanan digital serba otomatis 24/7 via QRIS Pakasir.", { parse_mode: 'HTML' });
    } else if (data === 'menu_cs_ai') {
      bot.sendMessage(chatId, "🤖 <b>Halo! Saya CS AI Assistant.</b>\nAda yang bisa saya bantu?", { parse_mode: 'HTML' });
    }
  }

  res.status(200).send('OK');
});

// 2. ENDPOINT SET WEBHOOK & MENU BUTTON (Dijalankan sekali saat deploy)
app.get('/api/setup-webhook', async (req, res) => {
  try {
    const webhookUrl = `${config.WEBAPP_URL}/api/telegram-webhook`;
    await bot.setWebHook(webhookUrl);
    
    await bot.setChatMenuButton({
      menu_button: JSON.stringify({
        type: "web_app",
        text: "💳 Buka Toko",
        web_app: { url: config.WEBAPP_URL }
      })
    });

    res.json({ status: 'success', message: `Webhook berhasil di-set ke ${webhookUrl}` });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. API USER SALDO
app.get('/api/user/:telegramId', (req, res) => {
  res.json({ status: 'success', data: { balance: 0 } });
});

// 4. API CREATE PAKASIR ORDER
app.post('/api/pakasir/create-order', async (req, res) => {
  const { amount } = req.body;
  const orderId = `DIGIX-${Date.now()}`;
  res.json({
    status: 'success',
    data: { order_id: orderId, payment_url: `https://pakasir.com/pay/${orderId}` }
  });
});

module.exports = app;
             
