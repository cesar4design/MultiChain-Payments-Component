import { useWeb3Modal } from '@web3modal/wagmi/react'
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useDisconnect,
  useAccount,
  usePrepareContractWrite,
  usePrepareContractRead,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
  useSwitchNetwork,
  useNetwork,
  useSendTransaction,
  usePrepareSendTransaction
} from "wagmi";
 
import { ethers, parseEther } from 'ethers';

import USDT_ABI from "../abi/USDT_ABI.json";
import USDT_ETH_ABI from "../abi/USDT_ETH_ABI.json";
import { useWeb3ModalState } from '@web3modal/wagmi/react'

import { WalletMultiButton, WalletDisconnectButton, } from "@solana/wallet-adapter-react-ui";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

import { Web3Modal, Web3NetworkSwitch } from '@web3modal/react';

export default function HomePage() {
  const { address } = useAccount();
  const { isConnected } = useAccount();
  const { open, close } = useWeb3Modal()
  const { selectedNetworkId } = useWeb3ModalState()
  const { ethers } = require("ethers");

  const { chain } = useNetwork()
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()

  // Select Chain
  const [selectedChain, setSelectedChain] = useState(null);
  const connectToChain = async (chain) => {
    setSelectedChain(chain);
  };

  // Select token
  const [selectedCurrency, setSelectedCurrency] = useState("native");
  const getCurrencyName = (chain) => {
    switch (chain) {
      case "Ethereum":
        return "ETH";
      case "Polygon":
        return "MATIC";
      case "Binance":
        return "BNB";
      case "Solana":
        return "SOL";
      case "Tron":
        return "TRX";
      default:
        return "Native Currency";
    }
  };
  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  // Input amount
  const [amount, setAmount] = useState('0');
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const amountToWei = amount.trim() !== '' ? parseEther(amount) : parseEther('0');
  const amountToUSDT = amount * 10 ** 6;

  // USDT Tokens 
  const [USDT_ETH, setUSDT_ETH] = useState({ address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', abi: USDT_ETH_ABI });
  const [USDT_POL, setUSDT_POL] = useState({ address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', abi: USDT_ABI });
  const [USDT_BSC, setUSDT_BSC] = useState({ address: '0x55d398326f99059ff775485246999027b3197955', abi: USDT_ABI });


  // Send EVM USDT Tokens
  const { config: USDT_ETH_Config } = usePrepareContractWrite({
    ...USDT_ETH,
    functionName: 'transfer',
    args: ["0x648A95860702B1709454B0992A75f3f80EA40a28", amountToUSDT]
  });
  const { data: USDT_ETH_Data, write: USDT_ETH_Transfer, isSuccess: USDT_ETH_isSuccess } = useContractWrite(USDT_ETH_Config);

  const { config: USDT_POL_Config } = usePrepareContractWrite({
    ...USDT_POL,
    functionName: 'transfer',
    args: ["0x648A95860702B1709454B0992A75f3f80EA40a28", amountToUSDT]
  });
  const { data: USDT_POL_Data, write: USDT_POL_Transfer, isSuccess: USDT_POL_isSuccess } = useContractWrite(USDT_POL_Config);

  const { config: USDT_BSC_Config } = usePrepareContractWrite({
    ...USDT_BSC,
    functionName: 'transfer',
    args: ["0x648A95860702B1709454B0992A75f3f80EA40a28", amountToWei]
  });
  const { data: USDT_BSC_Data, write: USDT_BSC_Transfer, isSuccess: USDT_BSC_isSuccess } = useContractWrite(USDT_BSC_Config);


  // Send EVM Native Tokens
  const { data: Native_data, isLoading: sending, isSuccess: Native_isSuccess, sendTransaction } = useSendTransaction({
    to: '0x648A95860702B1709454B0992A75f3f80EA40a28',
    value: amountToWei,
  })

  // Send SOL
  const { connection } = useConnection();
  const { publicKey, sendTransaction: sendSOLTransaction } = useWallet();
  const wallet = useWallet();

  const DESTINATION_WALLET = "4Ruit94PgtaNu9Z8TvyTjnkenPrqpFEHae23NpaNG7tZ";
  const MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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

  // Send SOL USDT
  const onClickUSDT = async () => {
    const amountToLamports = parseFloat(amount) * 10 ** 6;

    try {
      let sourceAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        new PublicKey(MINT_ADDRESS),
        wallet.publicKey
      );
      let destinationAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        new PublicKey(MINT_ADDRESS),
        new PublicKey(DESTINATION_WALLET)
      );

      const tx = new Transaction();
      tx.add(
        createTransferInstruction(
          sourceAccount.address,
          destinationAccount.address,
          wallet.publicKey,
          amountToLamports
        )
      );
      const latestBlockHash = await connection.getLatestBlockhash("confirmed");

      tx.recentBlockhash = latestBlockHash.blockhash;
      tx.feePayer = wallet.publicKey;

      const signature = await sendSOLTransaction(tx, connection);

      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });
    } catch (error) {
      console.log(" ------------");
      console.log("error:", error);
      console.log(" ------------");
    }
  }


  // Send TRX
  async function sendTRX() {
    if (!window.tronWeb || !window.tronWeb.ready) {
      alert("Please, install TronLink.");
      return;
    }

    const tronWeb = window.tronWeb;
    const receiver = 'TMDKznuDWaZwfZHcM61FVFstyYNmK6Njk1';
    const amountTRON = tronWeb.toSun(amount)

    try {
      const transaction = await tronWeb.transactionBuilder.sendTrx(receiver, amountTRON);

      const signedTransaction = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

      alert("Exit " + result.txid);
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  // Send Tron USDT
 async function sendUSDT() {
  if (!window.tronWeb || !window.tronWeb.ready) {
    return { success: false, error: "Por favor, instala TronLink." };
  }

  const tronWeb = window.tronWeb;
  const receiver = 'TMDKznuDWaZwfZHcM61FVFstyYNmK6Njk1';
  const amountTRON = tronWeb.toSun(amount);
  const contractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // Dirección del contrato USDT TRC20

  try {
    // Obtener la dirección conectada actualmente
    const currentAddress = tronWeb.defaultAddress.base58;

    if (!currentAddress) {
      return { success: false, error: "No se ha encontrado una dirección conectada." };
    }

    const options = {
      feeLimit: 100000000, // límite de comisión
    };

    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      'transfer(address,uint256)',
      options,
      [
        {
          type: tronWeb.ParameterType.address,
          value: receiver,
        },
        {
          type: tronWeb.ParameterType.uint256,
          value: amountTRON,
        },
      ],
      currentAddress // Usar la dirección conectada actualmente
    );

    const signedTransaction = await tronWeb.trx.sign(transaction.transaction);
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

    return { success: true, txid: result.txid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}




  function connectTronLink() {
    if (!window.tronWeb) {
      alert("Please, install TronLink.");
      return;
    }

    if (!window.tronWeb.ready) {
      window.tronWeb.on('ready', () => {
        alert("TronLink is connected.");
      });
    } else {
      alert("TronLink is connected.");
    }
  }

  return (
    <>
      <section>
        <select onChange={(e) => connectToChain(e.target.value)}>
          <option value="">Select Chain</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Polygon">Polygon</option>
          <option value="Binance">Binance</option>
          <option value="Solana">Solana</option>
          <option value="Tron">Tron</option>
        </select>

        {(isConnected && selectedChain !== "Solana" && selectedChain !== "Tron") && (
          <button onClick={() => open()}>
            Connected.
          </button>
        )}

        {selectedChain !== null && (
          <>
            <select value={selectedCurrency} onChange={handleCurrencyChange}>
              <option value="native">{getCurrencyName(selectedChain)}</option>
              <option value="usdt">USDT</option>
            </select>

            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter Amount"
            />
          </>
        )}

        {selectedChain === "Ethereum" && (
          <>
            {isConnected ? (
              <>
                {selectedNetworkId !== 1 ? (
                  <button onClick={() => switchNetwork?.(1)}>
                    Switch to Ethereum
                  </button>
                ) : (
                  <> {selectedCurrency === "native" ? (
                    <>
                      <button disabled={!sendTransaction} onClick={() => sendTransaction?.()}>
                        Buy with ETH
                      </button> 
                      {Native_isSuccess && <div>Transaction: {JSON.stringify(Native_data)}</div>}
                    </>
                  ) : (
                    <>
                      <button onClick={() => USDT_ETH_Transfer?.()}>
                        Buy with USDT
                      </button>
                      {USDT_ETH_isSuccess && <div>Transaction: {JSON.stringify(USDT_ETH_Data)}</div>}
                    </>
                  )}
                  </>
                )}
              </>
            ) : (
              <button onClick={() => open()}>
                Connect to Etherum.
              </button>
            )}
          </>
        )}

        {selectedChain === "Binance" && (
          <>
            {isConnected ? (
              <>
                {selectedNetworkId !== 56 ? (
                  <button onClick={() => switchNetwork?.(56)}>
                    Switch to Binance.
                  </button>
                ) : (
                  <> {selectedCurrency === "native" ? (
                    <>
                      <button disabled={!sendTransaction} onClick={() => sendTransaction?.()}>
                        Buy with BNB
                      </button>
                      {Native_isSuccess && <div>Transaction: {JSON.stringify(Native_data)}</div>}
                    </>
                  ) : (
                    <>
                      <button disabled={!sendTransaction} onClick={() => USDT_BSC_Transfer?.()}>
                        Buy with USDT
                      </button>
                      {USDT_BSC_isSuccess && <div>Transaction: {JSON.stringify(USDT_BSC_Data)}</div>}
                    </>
                  )}
                  </>
                )}
              </>
            ) : (
              <button onClick={() => open()}>
                Connect to Binance.
              </button>
            )}
          </>
        )}

        {selectedChain === "Polygon" && (
          <>
            {isConnected ? (
              <>
                {selectedNetworkId !== 137 ? (
                  <button onClick={() => switchNetwork?.(137)}>
                    Switch to Polygon
                  </button>
                ) : (
                  <> {selectedCurrency === "native" ? (
                    <>
                      <button disabled={!sendTransaction} onClick={() => sendTransaction?.()}>
                        Buy with Matic
                      </button>
                      {Native_isSuccess && <div>Transaction: {JSON.stringify(Native_data)}</div>}
                    </>
                  ) : (
                    <>
                      <button disabled={!sendTransaction} onClick={() => USDT_POL_Transfer?.()}>
                        Buy with USDT
                      </button>
                      {USDT_POL_isSuccess && <div>Transaction: {JSON.stringify(USDT_POL_Data)}</div>}
                    </>
                  )}
                  </>
                )}
              </>
            ) : (
              <button onClick={() => open()}>
                Connect to Polygon
              </button>
            )}
          </>
        )}

        {selectedChain === "Solana" && (
          <>
            <WalletMultiButton /> <WalletDisconnectButton></WalletDisconnectButton>
            {selectedCurrency === "native" ? (
              <>
                <button disabled={!sendTransaction} onClick={() => onClickSOL()}>
                  Buy with SOL
                </button>
              </>
            ) : (
              <>
                <button disabled={!sendTransaction} onClick={() => onClickUSDT()}>
                  Buy with USDT
                </button>
              </>
            )}
          </>
        )}

        {selectedChain === "Tron" && (
          <>
            <button onClick={connectTronLink}>Conectar TronLink</button>
            {selectedCurrency === "native" ? (
              <>
                <button onClick={sendTRX}>
                  Buy with TRX
                </button>
              </>
            ) : (
              <>
                <button onClick={sendUSDT}>
                  Buy with USDT
                </button>
              </>
            )}

          </>
        )}
      </section>
    </>
  );

}
