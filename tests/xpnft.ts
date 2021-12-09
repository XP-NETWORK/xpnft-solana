import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Xpnft } from '../target/types/xpnft';

describe('xpnft', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Xpnft as Program<Xpnft>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
