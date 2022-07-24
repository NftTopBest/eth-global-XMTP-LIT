# XMTP Message Notification

## dev && build scripts

```bash
yarn dev # start your development
yarn build # build this extension code
```

## Tech

* [Chrome extension dev MV3](https://developer.chrome.com/docs/extensions/mv3/intro/)
  * [chrome.storage](https://developer.chrome.com/docs/extensions/reference/storage/) store xmtp keys
  * [chrome.notifications](https://developer.chrome.com/docs/extensions/reference/notifications/) create notifications while receive new message from xmtp
* [xmtp](https://github.com/xmtp/xmtp-js) the lib to start the xtmp new message listener
  * [Listen for new messages in a conversation](https://github.com/xmtp/xmtp-js#listen-for-new-messages-in-a-conversation)
  * [List existing conversations](https://github.com/xmtp/xmtp-js#list-existing-conversations)
  
## Features

* user can login with metamask: [code](https://github.com/NftTopBest/eth-global-XMTP-LIT-img-gating-chat/blob/main/xmtp-notification-chrome-extension/src/context/WalletProvider.js#L144)
* user can login into xmtp to get the xmtp keys: [code](https://github.com/NftTopBest/eth-global-XMTP-LIT-img-gating-chat/blob/main/xmtp-notification-chrome-extension/src/context/WalletProvider.js#L109)
* user can receive notification while get new xmtp message: [code](https://github.com/NftTopBest/eth-global-XMTP-LIT-img-gating-chat/blob/main/xmtp-notification-chrome-extension/src/context/WalletProvider.js#L83)

## Future Implement

* make the XMTP listener work in the background service worker
  * I have spend over 10+ hours try to make it work in the background service worker, but it has some issues
    * xmtp package has some kind of `fs` call that can not work in browser
    * that I can not compile it to work in the background.js
* use [plasmo extension framework](https://www.plasmo.com/) to re-build the extension
  * I try before over 20 hours, but still, the same as the xmtp compile problem
  * Need more digging for this problem
