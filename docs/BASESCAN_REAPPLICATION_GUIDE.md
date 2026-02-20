# BASESCAN TOKEN UPDATE RE-APPLICATION GUIDE

**Created**: December 12, 2025
**Status**: READY TO RE-APPLY (after completing LinkedIn steps)
**Token**: CGC (CryptoGift Coin)
**Contract**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`

Made by mbxarts.com The Moon in a Box property

---

## SUMMARY OF REJECTION

**Email received**: December 12, 2025
**Reason**: "lack of information about the token/project"

### Root Cause Analysis

Based on the official Etherscan/BaseScan token update guidelines, the rejection was likely caused by:

| Issue | Status Before | Status Now |
|-------|---------------|------------|
| Team visibility on homepage | Hidden in /docs | **FIXED** - Team section on homepage |
| LinkedIn of founder | Exists but may not show project | **ACTION NEEDED** |
| LinkedIn of other members | Not listed on website | **ACTION NEEDED** |
| Footer identity confusion | "The Moon in a Box" first | **FIXED** - "CryptoGift Wallets DAO" first |
| Email typo | admin@mbxart.com | **FIXED** - admin@mbxarts.com |
| Promotional language | "revolutionary", "first" | **FIXED** - Neutralized |

---

## MANDATORY MANUAL ACTIONS (YOU MUST DO THESE)

### ACTION 1: UPDATE RAFAEL'S LINKEDIN (CRITICAL)

BaseScan verifies LinkedIn profiles to confirm team legitimacy. Your LinkedIn MUST show:

**Steps:**
1. Go to https://www.linkedin.com/in/rafael-gonzalez-iautomallink
2. Click "Add profile section" → "Add position"
3. Add this experience:

```
Title: Founder & Engineering Lead
Company: CryptoGift Wallets DAO
Location: [Your location or "Remote"]
Start date: [When you started the project]
End date: Present (check "I currently work here")
Description:
Building CryptoGift Wallets DAO, a decentralized education platform on Base.
Leading development of ERC-6551 NFT-wallet technology and DAO governance.
Key achievements:
- Deployed verified smart contracts on Base Mainnet
- Built multi-level referral system with automated CGC distribution
- Integrated Aragon OSx for DAO governance
Technologies: Solidity, Next.js, TypeScript, Base L2, Aragon OSx
```

4. **IMPORTANT**: Make sure your profile is set to **Public**
5. Save changes

### ACTION 2: DECIDE ABOUT ROBERTO AND LEODANNI'S LINKEDINS

**Option A (Recommended)**: Add their LinkedIn links
- If they have LinkedIn profiles, add their links to the website
- Make sure their profiles mention involvement with CryptoGift

**Option B**: Remove them from public team listing
- If they don't have LinkedIn or can't update it, consider showing only Rafael as the verified founder
- BaseScan prefers fewer team members with verified profiles over many unverifiable ones

**If adding their LinkedIns**, they should also update their profiles to show:
- Job title with CryptoGift Wallets DAO
- "Currently working here" checked
- Brief description of their role

### ACTION 3: WAIT 24-48 HOURS AFTER LINKEDIN UPDATES

BaseScan may cache LinkedIn data. Wait at least 24 hours after updating LinkedIn before re-applying.

---

## WHAT HAS BEEN FIXED (NO ACTION NEEDED)

### Code Changes Made

| File | Change |
|------|--------|
| `app/page.tsx` | Added Team section visible on homepage |
| `components/layout/Footer.tsx` | Fixed email typo (mbxart → mbxarts) |
| `src/locales/en.json` | Updated copyright to "CryptoGift Wallets DAO. A project by The Moon in a Box Inc." |
| `src/locales/es.json` | Same copyright update in Spanish |
| `public/CRYPTOGIFT_WHITEPAPER_v1.2.md` | Removed "revolutionary" and "first" claims |
| `public/CRYPTOGIFT_WHITEPAPER_v1.2.html` | Regenerated from updated markdown |

### Verification Checklist

- [x] Contract verified on BaseScan (green badge)
- [x] Logo SVG 32x32 accessible via GitHub RAW URL
- [x] Website functional (mbxarts.com)
- [x] Team visible on homepage
- [x] Official email uses domain (admin@mbxarts.com)
- [x] Footer clearly identifies project
- [x] Whitepaper has neutral language
- [x] Contact email correct in footer
- [x] Social links complete (Twitter, Discord, GitHub, Farcaster, YouTube)

---

## RE-APPLICATION FORM DATA

Use this exact information when re-applying to BaseScan:

### Basic Information

| Field | Value |
|-------|-------|
| **Contract Address** | `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` |
| **Token Name** | CryptoGift Coin |
| **Token Symbol** | CGC |
| **Decimals** | 18 |
| **Project Name** | CryptoGift Wallets DAO |

### Logo

| Field | Value |
|-------|-------|
| **Logo Format** | SVG 32x32 |
| **Logo URL** | `https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/cgc-logo-32x32.svg` |

### Project Links

| Field | Value |
|-------|-------|
| **Website** | https://mbxarts.com |
| **Whitepaper** | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html |
| **GitHub** | https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO |
| **Twitter** | https://x.com/cryptogiftdao |
| **Discord** | https://discord.gg/XzmKkrvhHc |
| **Documentation** | https://mbxarts.com/docs |
| **Team Page** | https://mbxarts.com/docs?tab=verification |

### Contact

| Field | Value |
|-------|-------|
| **Email** | admin@mbxarts.com |
| **Contact Name** | Rafael Gonzalez |
| **Role** | Founder & Engineering Lead |
| **LinkedIn** | https://www.linkedin.com/in/rafael-gonzalez-iautomallink |

### Project Description (Neutral Language)

```
CryptoGift Wallets DAO is a Web3 education platform built on Base (Ethereum L2)
that converts learning effort into governance power. Users earn CGC tokens by
completing educational tasks, which grant voting rights in the decentralized
autonomous organization.

The DAO governs CryptoGift Wallets, a platform that converts NFTs into functional
wallets using ERC-6551 token-bound accounts. Key features include gasless
onboarding, multi-level referrals, and milestone-based token emission.

Technical Stack:
- Blockchain: Base Mainnet (Chain ID: 8453)
- Governance: Aragon OSx v1.4.0
- Token Standard: ERC-20
- Smart Contracts: Verified on BaseScan

The project has an active Discord community, verified smart contracts, and
a functional task reward system.
```

### Additional Information (Optional)

```
All smart contracts are verified on BaseScan with source code available.

Contract Addresses:
- CGC Token: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
- MilestoneEscrow: 0x8346CFcaECc90d678d862319449E5a742c03f109
- Aragon DAO: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31

Team verification available at: https://mbxarts.com (homepage) and
https://mbxarts.com/docs?tab=verification (full profiles)
```

---

## RE-APPLICATION TIMELINE

| Day | Action |
|-----|--------|
| **Today** | Deploy code changes, update LinkedIn |
| **Day 1-2** | Wait for Vercel deployment and LinkedIn cache |
| **Day 3** | Re-apply to BaseScan with updated information |
| **Day 4-7** | Wait for BaseScan review |
| **Day 8+** | Expect response (approval or request for more info) |

---

## POST-APPROVAL CHECKLIST

Once approved, verify:

- [ ] Logo appears on BaseScan token page
- [ ] Token name shows correctly
- [ ] Links work from BaseScan page
- [ ] Update CLAUDE.md with approval status
- [ ] Announce on Twitter/Discord
- [ ] Proceed with CoinGecko application

---

## TROUBLESHOOTING

### If rejected again

1. **Read the rejection reason carefully**
2. Check if LinkedIn profiles are public
3. Verify all URLs are accessible (no 404s)
4. Contact BaseScan support with specific questions
5. Consider adding more social proof (more followers, activity)

### Common rejection reasons

| Reason | Solution |
|--------|----------|
| "Insufficient information" | Add more project details, verify LinkedIn |
| "Unable to verify team" | Make LinkedIn profiles public, add project experience |
| "Logo not accessible" | Use GitHub RAW URL instead of Vercel |
| "Website issues" | Ensure no broken links, all pages load |

---

## CONTACT BASESCAN

If you need clarification:

- **Support**: https://basescan.org/contactus
- **Token Update Form**: https://basescan.org/tokenupdate

---

**READY TO RE-APPLY?**

1. Complete LinkedIn updates (ACTION 1 above)
2. Wait 24-48 hours
3. Deploy code changes: `git push origin main`
4. Go to: https://basescan.org/tokenupdate
5. Fill form with data above
6. Submit and wait for review

---

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22
