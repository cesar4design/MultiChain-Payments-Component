
import { useEffect, useState } from "react";
import "../styles.css";
import { Helmet } from 'react-helmet';

// ------- Start Solana Config ------- //
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

const endpoint = "https://mainnet.helius-rpc.com/?api-key=0aaf81c2-2c4a-40f2-9168-c3ebd7539138";
const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  }
);
// ------- End Solana Config ------- //


// ------- Start EVM Config ------- //
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { walletConnectProvider, EIP6963Connector } from '@web3modal/wagmi'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { mainnet, polygon, sepolia, bsc } from 'viem/chains'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const projectId = '6b3b6a75fab4c023e92097eab4b3c923'

// 2. Create wagmiConfig
const { chains, publicClient } = configureChains(
  [polygon, sepolia, mainnet, bsc],
  [walletConnectProvider({ projectId }), publicProvider()]
)

const metadata = {
  name: '',
  description: '',
  url: '',
  icons: ['']
}

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({ chains, options: { projectId, showQrModal: false, metadata } }),
    new EIP6963Connector({ chains }),

  ],
  publicClient
})

createWeb3Modal({
  wagmiConfig, projectId, includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'
  ],
  themeMode: 'light', chains
})
// ------- End EVM Config ------- //




export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      <Helmet>
        <title>Buy multi chain</title>
        <link rel="icon" href="/Logo.png" />
      </Helmet>

      {ready ? (
        <WagmiConfig config={wagmiConfig}>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider>
              <Component {...pageProps} />
            </WalletProvider>
          </ConnectionProvider>
        </WagmiConfig>
      ) : null}

    </>
  );
}
