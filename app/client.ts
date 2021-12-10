import * as anchor from '@project-serum/anchor'
import { Program, Provider } from '@project-serum/anchor'
import { TokenInstructions } from '@project-serum/serum'
import * as dotenv from 'dotenv'
import idl from '../target/idl/xpnft.json'

dotenv.config()

const provider = anchor.Provider.env()
anchor.setProvider(provider)

const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()
);

async function createMintInstructions(provider: Provider, authority: any, mint: anchor.web3.PublicKey) {
  let instructions = [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeMint({
      mint,
      decimals: 0,
      mintAuthority: authority
    })
  ]
  return instructions
}

async function createMint(provider: Provider, authority?: anchor.web3.PublicKey) {
  if (authority == undefined) {
    authority = provider.wallet.publicKey
  }

  const mint = anchor.web3.Keypair.generate();
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey
  )

  const tx = new anchor.web3.Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint])

  return mint.publicKey
}

async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: anchor.web3.PublicKey,
  mint: any,
  owner: any,
  lamports?: number
) {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: newAccountPubkey,
      mint,
      owner,
    }),
  ];
}

async function createTokenAccount(provider: anchor.Provider, mint: any, owner: anchor.web3.PublicKey) {
  const vault = anchor.web3.Keypair.generate();
  const tx = new anchor.web3.Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
  )
  await provider.send(tx, [vault])
  return vault.publicKey
}

async function main() {
  const programId = new anchor.web3.PublicKey(idl.metadata.address)

  const program = new Program(idl, programId)

  let mint = await createMint(provider);
  let from = await createTokenAccount(provider, mint, provider.wallet.publicKey);

  const tx = await program.rpc.mintTokens({
    accounts: {
      mintAuthority: provider.wallet.publicKey,
      mint,
      token: from,
      tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID
    }
  })
  console.log("Your transaction signature", tx)
}

console.log('Running client.');
main().then(() => console.log('Success'))