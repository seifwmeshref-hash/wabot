const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false })
  sock.ev.on('creds.update', saveCreds)
  if (!sock.authState.creds.registered) {
    const phone = "201069353164"
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phone)
        console.log('--- YOUR CODE IS: ' + code + ' ---')
      } catch(e) { console.log('Pairing error', e.message) }
    }, 3000)
  }
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) start()
    }
    if (connection === 'open') console.log('✅ Connected! Bot is ready')
  })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (text.toLowerCase() === 'hi' || text === 'هاي') {
      await sock.sendMessage(m.key.remoteJid, { text: 'اهلا بيك! البوت شغال ✅' })
    }
  })
}
start()
