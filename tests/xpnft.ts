import assert from 'assert'
import * as anchor from '@project-serum/anchor';
import * as serumCmn from '@project-serum/common';
import { Program, Provider } from '@project-serum/anchor';
import { TokenInstructions } from '@project-serum/serum';
import { Xpnft } from '../target/types/xpnft';

describe('xpnft', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.Xpnft as Program<Xpnft>;

  let mint = null;
  let from = null;
  let to = null;

  it('Initializes test state', async () => {
    mint = await createMint(provider);
    from = await createTokenAccount(provider, mint, provider.wallet.publicKey);
    to = await createTokenAccount(provider, mint, provider.wallet.publicKey);
  });

  it("Mints a token", async () => {
    await program.rpc.mintTokens({
      accounts: {
        mintAuthority: provider.wallet.publicKey,
        mint,
        token: from,
        tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
      },
    });

    const fromAccount = await getTokenAccount(provider, from);

    assert.ok(fromAccount.amount.eq(new anchor.BN(1)));
  });
});

const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()
);

async function getTokenAccount(provider: Provider, addr: anchor.web3.PublicKey) {
  return await serumCmn.getTokenAccount(provider, addr);
}

async function getMintInfo(provider: Provider, mintAddr: anchor.web3.PublicKey) {
  return await serumCmn.getMintInfo(provider, mintAddr);
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

async function createTokenAccount(provider: anchor.Provider, mint: any, owner: anchor.web3.PublicKey) {
  const vault = anchor.web3.Keypair.generate();
  const tx = new anchor.web3.Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
  )
  await provider.send(tx, [vault])
  return vault.publicKey
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