use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod xpnft {
    use super::*;

    pub fn create_mint(_ctx: Context<CreateMint>) -> ProgramResult {
        Ok(())
    }

    pub fn create_token(_ctx: Context<CreateToken>) -> ProgramResult {
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>) -> ProgramResult {
        token::mint_to((&*ctx.accounts).into(), 1)
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(init, payer = payer, mint::decimals = 0, mint::authority = payer)]
    pub mint: Account<'info, Mint>,
    #[account(signer)]
    pub payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(init, payer = authority, token::mint = mint, token::authority = authority)]
    pub token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut, constraint = mint.mint_authority == COption::Some(*mint_authority.key))]
    pub mint: Account<'info, Mint>,
    #[account(signer)]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut, has_one = mint)]
    pub token: Account<'info, TokenAccount>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> From<&MintTokens<'info>> for CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
    fn from(accs: &MintTokens<'info>) -> Self {
        let cpi_program = accs.token_program.clone();
        let cpi_accounts = MintTo {
            mint: accs.mint.to_account_info(),
            to: accs.token.to_account_info(),
            authority: accs.mint_authority.to_account_info()
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}