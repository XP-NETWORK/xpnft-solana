use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Mint, MintTo, SetAuthority, TokenAccount};
use spl_token::instruction::AuthorityType;

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

    pub fn mint_to(ctx: Context<MintTokens>) -> ProgramResult {
        // Mint the token and delete mint authority
        token::mint_to(ctx.accounts.mint_to(), 1)?;
        token::set_authority(
            ctx.accounts.null_authority(),
            AuthorityType::MintTokens,
            None,
        )?;
        Ok(())
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

impl<'info> MintTokens<'info> {
    fn mint_to(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let account = MintTo {
            mint: self.mint.to_account_info().clone(),
            to: self.token.to_account_info().clone(),
            authority: self.mint_authority.to_account_info().clone(),
        };
        let program = self.token_program.to_account_info();
        CpiContext::new(program, account)
    }

    fn null_authority(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let account = SetAuthority {
            current_authority: self.mint_authority.to_account_info().clone(),
            account_or_mint: self.mint.to_account_info().clone(),
        };
        let program = self.token_program.clone();
        CpiContext::new(program, account)
    }
}
