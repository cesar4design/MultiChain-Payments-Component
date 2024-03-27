import { useWeb3Modal } from "@web3modal/wagmi/react";
import React, { useState, useEffect, useRef, useCallback } from "react";

import {
	WalletMultiButton,
	WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
	Keypair,
	SystemProgram,
	Transaction,
	PublicKey,
	Connection,
} from "@solana/web3.js";
import {
	createTransferInstruction,
	getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

export default function HomePage() {
	// Input amount
	const [amount, setAmount] = useState("0");
	const handleAmountChange = (e) => {
		setAmount(e.target.value);
	};
	const [amountUSDT, setAmountUSDT] = useState("0");
	const handleAmountChangeUSDT = (e) => {
		setAmountUSDT(e.target.value);
	};

	// Send SOL
	const { connection } = useConnection();
	const { publicKey, sendTransaction: sendSOLTransaction } = useWallet();
	const wallet = useWallet();

	const DESTINATION_WALLET = "4Ruit94PgtaNu9Z8TvyTjnkenPrqpFEHae23NpaNG7tZ";
	const MINT_ADDRESS = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

	const onClickSOL = useCallback(async () => {
		if (!publicKey) throw new WalletNotConnectedError();

		const destinoPublicKey = new PublicKey(DESTINATION_WALLET);

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
			value: { blockhash, lastValidBlockHeight },
		} = await connection.getLatestBlockhashAndContext();

		const signature = await sendSOLTransaction(transaction, connection);

		await connection.confirmTransaction({
			blockhash,
			lastValidBlockHeight,
			signature,
		});
	}, [publicKey, sendSOLTransaction, connection, amount]);

	const send = async () => {
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
					amountUSDT * Math.pow(10, 6)
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
	};

	return (
		<>
			<section>
				<WalletMultiButton />

				<input
					type="number"
					value={amount}
					onChange={handleAmountChange}
					placeholder="Enter Amount SOL"
				/>

				<button onClick={onClickSOL} disabled={!publicKey}>
					Buy with SOL
				</button>

				<input
					type="number"
					value={amountUSDT}
					onChange={handleAmountChangeUSDT}
					placeholder="Enter Amount USDT"
				/>

				<button onClick={() => send()} disabled={!publicKey}>
					Buy with USDT
				</button>
			</section>
		</>
	);
}
