const { Client } = require('./xmtp.js')

const createNotification = async address => {
  const notificationId = `${address}-${Date.now()}`
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'logo.png',
    title: `New XMTP message`,
    message: `From ${address}, Click to reply`,
    priority: 2
  });
  if (!hasOnClickListener) {
    setHasOnClickListener(true)
    chrome.notifications.onClicked.addListener(async (notificationId) => {
      const address = notificationId.split('-')[0]
      const url = `http://localhost:3000/dm/${address}`
      const tabs = await chrome.tabs.query({ url: ['http://localhost:3000/*'] })
      console.log(`====> tabs :`, tabs)
      if (tabs.length === 0) {
        chrome.tabs.create({ url });
      } else {
        chrome.tabs.highlight({ 'tabs': tabs[0].index })
      }
    });
  }
}

const startXmtp = async (keys) => {
  if (!keys) return
  console.log(`====>background keys :`, keys)
  const xmtp = await Client.create(null, { privateKeyOverride: keys })
  const conversations = xmtp.conversations

  const allConversations = await conversations.list()
  console.log(`====> start Smtp with :`, Date.now(), keys)
  await Promise.all(allConversations.map(async (conversation, index) => {
    console.log(`====> conversation :`, conversation)
    for await (const message of await allConversations[index].streamMessages()) {
      createNotification(message.senderAddress)
    }
  }))
}


chrome.notifications.onButtonClicked.addListener(async () => {
  const item = await chrome.storage.sync.get(['minutes']);
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.alarms.create({ delayInMinutes: item.minutes });
});

chrome.storage.sync.onChanged.addListener(changes => {
  const keys = Object.keys(changes)
  keys.forEach(key => {
    if (key === 'xmtpKeys') {
      const { newValue } = changes[key]
      console.log(`====>background newValue :`, newValue)
      startXmtp(newValue)
    }
  })
});

const key = 'xmtpKeys'
chrome.storage.sync.get([key], function (result) {
  if (result.xmtpKeys) {
    let keys = result.xmtpKeys
    keys = new Uint8Array(JSON.parse(keys))
    startXmtp(keys)
  }
  return result;
});