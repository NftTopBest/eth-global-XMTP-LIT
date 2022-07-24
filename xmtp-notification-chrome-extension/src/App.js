import React from 'react';
import './App.css';
import { useWallet } from './context/WalletProvider';

function App() {
  const { isAuthenticated, connectWallet, disconnectWallet, createNotification } = useWallet();
  return (
    <div className="App">
      <header className="App-header">
        <h3>XMTP Message Notification</h3>
        <button onClick={isAuthenticated ? disconnectWallet : connectWallet} id="wallet-connect">
          {isAuthenticated ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
      </header>
      <div className="App-body">
        <button onClick={() => createNotification('0x91368aCCD2B7c9807CD9Dc889158e5294F4105f0')}>talk with bruce</button>
      </div>
    </div>
  );
}

export default App;
