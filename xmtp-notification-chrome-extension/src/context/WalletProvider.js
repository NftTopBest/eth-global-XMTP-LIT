import React from 'react';
import createMetaMaskProvider from 'metamask-extension-provider';
import { getNormalizeAddress } from '../utils';
import { EthereumEvents } from '../utils/events';
import storage from '../utils/storage';
import { Client } from '@xmtp/xmtp-js'
import { ethers } from 'ethers'

export const WalletContext = React.createContext();
export const useWallet = () => React.useContext(WalletContext);

export function withWallet(Component) {
    const WalletComponent = props => (
        <WalletContext.Consumer>
            {contexts => <Component {...props} {...contexts} />}
        </WalletContext.Consumer>
    );
    return WalletComponent;
}

const WalletProvider = React.memo(({ children }) => {
    const [chainId, setChainId] = React.useState(null);
    const [account, setAccount] = React.useState(null);
    const [isAuthenticated, setAuthenticated] = React.useState(false);
    const [appLoading, setAppLoading] = React.useState(false);
    const [hasOnClickListener, setHasOnClickListener] = React.useState(false);

    React.useEffect(() => {
        connectEagerly();
        return () => {
            const provider = getProvider();
            unsubscribeToEvents(provider);
        }
    }, []);

    const subscribeToEvents = (provider) => {
        if (provider && provider.on) {
            provider.on(EthereumEvents.CHAIN_CHANGED, handleChainChanged);
            provider.on(EthereumEvents.ACCOUNTS_CHANGED, handleAccountsChanged);
            provider.on(EthereumEvents.CONNECT, handleConnect);
            provider.on(EthereumEvents.DISCONNECT, handleDisconnect);
        }
    }

    const unsubscribeToEvents = (provider) => {
        if (provider && provider.removeListener) {
            provider.removeListener(EthereumEvents.CHAIN_CHANGED, handleChainChanged);
            provider.removeListener(EthereumEvents.ACCOUNTS_CHANGED, handleAccountsChanged);
            provider.removeListener(EthereumEvents.CONNECT, handleConnect);
            provider.removeListener(EthereumEvents.DISCONNECT, handleDisconnect);
        }
    }

    const connectEagerly = async () => {
        const metamask = await storage.get('metamask-connected');
        if (metamask?.connected) {
            await connectWallet();
        }
    }

    const getProvider = () => {
        if (window.ethereum) {
            return window.ethereum;
        } else {
            const provider = createMetaMaskProvider();
            return provider;
        }
    }

    const getAccounts = async (provider) => {
        if (provider) {
            const [accounts, chainId] = await Promise.all([
                provider.request({
                    method: 'eth_requestAccounts',
                }),
                provider.request({ method: 'eth_chainId' }),
            ]);
            return [accounts, chainId];
        }
        return false;
    }

    const createNotification = async (address, content) => {
        const notificationId = `${address}-${Date.now()}`

        // await storage.set('xmtpKeys', notificationId)
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: 'logo.png',
            title: `New XMTP message`,
            message: `From ${address}, Says ${content} Click to reply`,
            priority: 2
        });
        if (!hasOnClickListener) {
            setHasOnClickListener(true)
            chrome.notifications.onClicked.addListener(async (notificationId) => {
                const address = notificationId.split('-')[0]
                const url = `http://localhost:3000/dm/${address}`
                const tabs = await chrome.tabs.query({ url: ['http://localhost:3000/*'] })
                if (tabs.length === 0) {
                    chrome.tabs.create({ url });
                } else {
                    chrome.tabs.highlight({ 'tabs': tabs[0].index })
                }
            });
        }
    }

    const configXmtp = async provider => {
        const web3Provider = new ethers.providers.Web3Provider(provider)
        const signer = web3Provider.getSigner();
        let keys = await storage.get('xmtpKeys')
        try {
            // Create the client with an `ethers.Signer` from your application
            if (!keys) {
                keys = await Client.getKeys(signer)
                const keysToString = Array.from // if available
                    ? Array.from(keys) // use Array#from
                    : [].map.call(keys, (v => v)); // otherwise map()
                await storage.set('xmtpKeys', JSON.stringify(keysToString))
            } else {
                keys = new Uint8Array(JSON.parse(keys))
            }
        } catch (err) {
            console.log(`====> err :`, err)
        }
        // init xmtp
        const xmtp = await Client.create(null, { privateKeyOverride: keys })
        const conversations = xmtp.conversations

        const allConversations = await conversations.list()
        await Promise.all(allConversations.map(async (conversation, index) => {
            console.log(`====> conversation :`, conversation)
            for await (const message of await allConversations[index].streamMessages()) {
                const address = allConversations[index].peerAddress
                const content = message.content
                console.log(`====> address, content :`, address, content)
                createNotification(address, content)
            }
        }))

    }

    const connectWallet = async () => {
        console.log("connectWallet runs....")
        try {
            const provider = getProvider();
            const [accounts, chainId] = await getAccounts(provider);
            if (accounts && chainId) {
                setAppLoading(true);
                const account = getNormalizeAddress(accounts);
                setAccount(account);
                setChainId(chainId);
                setAuthenticated(true);
                storage.set('metamask-connected', { connected: true });
                console.log(`====> account, chainId :`, account, chainId)
                subscribeToEvents(provider)
                await configXmtp(provider)
            }
        } catch (e) {
            console.log("error while connect", e);
        } finally {
            setAppLoading(false);
        }
    }

    const disconnectWallet = () => {
        console.log("disconnectWallet runs")
        try {
            storage.set('metamask-connected', { connected: false });
            setAccount(null);
            setChainId(null);
            setAuthenticated(false);
        } catch (e) {
            console.log(e);
        }
    }

    const handleAccountsChanged = (accounts) => {
        setAccount(getNormalizeAddress(accounts));
        console.log("[account changes]: ", getNormalizeAddress(accounts))
    }

    const handleChainChanged = (chainId) => {
        setChainId(chainId);
        console.log("[chainId changes]: ", chainId)
    }

    const handleConnect = () => {
        setAuthenticated(true);
        console.log("[connected]")
    }

    const handleDisconnect = () => {
        console.log("[disconnected]")
        disconnectWallet();
    }

    return (
        <WalletContext.Provider
            value={{
                disconnectWallet,
                createNotification,
                connectWallet,
                isAuthenticated,
                appLoading
            }}
        >
            {children}
        </WalletContext.Provider>
    )
});

export default WalletProvider
