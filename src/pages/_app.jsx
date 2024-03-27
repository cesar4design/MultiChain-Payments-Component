
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

export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      <Helmet>
        <title>Solana transfer</title>
        <link rel="icon" href="/Logo.png" />
      </Helmet>

      {ready ? (
        
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider>
              <Component {...pageProps} />
            </WalletProvider>
          </ConnectionProvider>
        
      ) : null}

    </>
  );
}
