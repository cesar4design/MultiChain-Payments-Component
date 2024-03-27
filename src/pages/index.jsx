import { useWeb3Modal } from '@web3modal/wagmi/react'
import React, { useState, useEffect, useRef, useCallback } from "react";

import { WalletMultiButton, WalletDisconnectButton, } from "@solana/wallet-adapter-react-ui";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';

export default function HomePage() {

  // Input amount
  const [amount, setAmount] = useState('0');
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  // Send SOL
  const { connection } = useConnection();
  const { publicKey, sendTransaction: sendSOLTransaction } = useWallet();

  const onClickSOL = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const { SystemProgram, Transaction, PublicKey, Keypair } = require('@solana/web3.js');
    const destinoPublicKey = new PublicKey('4Ruit94PgtaNu9Z8TvyTjnkenPrqpFEHae23NpaNG7tZ');

    const amountToLamports = parseFloat(amount) * 10 ** 9;
   
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: destinoPublicKey,
        lamports: amountToLamports,
      })
    );

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight }
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendSOLTransaction(transaction, connection);

    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
  }, [publicKey, sendSOLTransaction, connection, amount]);


  return (
    <>
      <section>
           <WalletMultiButton />
       
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter Amount"
            />
                
            <button onClick={onClickSOL} disabled={!publicKey}>
              Buy with SOL
            </button>

            <button disabled={!publicKey}>
              Buy with USDT
            </button>
          
      </section>
    </>
  );

}
