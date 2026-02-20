'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { CGCAccessGate } from '@/components/auth/CGCAccessGate';
import { ApplicationGuide } from '@/components/funding/ApplicationGuide';
import { GrowthStrategy } from '@/components/funding/GrowthStrategy';
import { GrantApplicationsTracker } from '@/components/funding/GrantApplicationsTracker';
import {
  ChevronDown,
  ChevronRight,
  Check,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Users,
  Rocket,
  Star,
  Clock,
  Target,
  FileText,
  Globe,
  Briefcase,
  Award,
  Zap,
  Building,
  Coins,
  BookOpen,
  ClipboardList
} from 'lucide-react';

// ===== TIPOS =====
interface FundingOpportunity {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  type: 'F' | 'C' | 'F+C'; // Funding, Crowdfunding, Both
  amount: string;
  deadline?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url?: string;
  description: string;
  requirements: string[];
  howToApply: string[];
  tips: string[];
}

interface CrowdfundingPlatform {
  id: string;
  name: string;
  fee: string;
  minRaise?: string;
  maxRaise?: string;
  url: string;
  description: string;
  pros: string[];
  cons: string[];
  requirements: string[];
  bestFor: string;
}

// ===== DATOS: LISTA 1 - 40 OPORTUNIDADES DE FUNDING =====
const fundingOpportunities: FundingOpportunity[] = [
  // TIER 1: High Priority (>$50k potential)
  {
    id: 'base-builders',
    name: 'Base Builders Grant',
    tier: 1,
    type: 'F',
    amount: '$3k-15k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://base.org/builder-grants',
    description: 'Grants for builders shipping onchain on Base. Focus on consumer crypto and innovative use cases.',
    requirements: [
      'Building on Base mainnet or migrating',
      'Open source or verifiable code',
      'Clear milestones and deliverables',
      'Commitment to Base ecosystem'
    ],
    howToApply: [
      'Complete online application form',
      'Provide GitHub repo link',
      'Demo video or screenshots',
      'Budget breakdown with milestones'
    ],
    tips: [
      'Emphasize Base-specific features (low gas, EVM compatibility)',
      'Show traction metrics even if testnet',
      'Highlight unique innovation (ERC-6551, AA)'
    ]
  },
  {
    id: 'gitcoin-grants',
    name: 'Gitcoin Grants',
    tier: 1,
    type: 'F+C',
    amount: '$1k-50k+',
    deadline: 'Quarterly rounds',
    difficulty: 'Medium',
    url: 'https://grants.gitcoin.co',
    description: 'Quadratic funding rounds. Community donations get matched by matching pool.',
    requirements: [
      'Open source project',
      'Public good or ecosystem benefit',
      'Active development',
      'Community engagement'
    ],
    howToApply: [
      'Create Gitcoin Grants profile',
      'Apply during active round',
      'Promote to community for donations',
      'Engage with Gitcoin community'
    ],
    tips: [
      'Small donations count more (quadratic)',
      'Build community before round starts',
      'Regular updates increase trust'
    ]
  },
  {
    id: 'eth-global',
    name: 'ETHGlobal Hackathons',
    tier: 1,
    type: 'F',
    amount: '$5k-50k',
    deadline: 'Event-based',
    difficulty: 'Hard',
    url: 'https://ethglobal.com',
    description: 'Premier Web3 hackathons with significant prize pools and sponsor bounties.',
    requirements: [
      'Build during hackathon timeframe',
      'Meet sponsor track requirements',
      'Live demo at judging',
      'Team registration'
    ],
    howToApply: [
      'Register for upcoming hackathon',
      'Review sponsor bounties',
      'Build and submit on time',
      'Present to judges'
    ],
    tips: [
      'Target multiple sponsor tracks',
      'Focus on working demo over features',
      'Network with sponsors directly'
    ]
  },
  {
    id: 'alliance-dao',
    name: 'Alliance DAO',
    tier: 1,
    type: 'F',
    amount: '$250k-500k',
    deadline: 'Cohort-based',
    difficulty: 'Hard',
    url: 'https://alliance.xyz',
    description: 'Premier Web3 accelerator. Equity investment plus intensive mentorship.',
    requirements: [
      'Strong founding team',
      'Web3-native product',
      'High growth potential',
      'Full-time commitment'
    ],
    howToApply: [
      'Apply during cohort window',
      'Technical + market interviews',
      'Demo day pitch',
      '3-month accelerator program'
    ],
    tips: [
      'Network with alumni first',
      'Show clear PMF signals',
      'Have technical depth ready'
    ]
  },
  {
    id: 'optimism-rpgf',
    name: 'Optimism RetroPGF',
    tier: 1,
    type: 'F',
    amount: '$10k-500k+',
    deadline: 'Annual rounds',
    difficulty: 'Medium',
    url: 'https://optimism.io/retropgf',
    description: 'Retroactive public goods funding. Get funded for impact already created.',
    requirements: [
      'Demonstrated impact on Optimism/Ethereum',
      'Public goods orientation',
      'Verifiable contributions',
      'Active project or contributor'
    ],
    howToApply: [
      'Apply during round window',
      'Document all contributions',
      'Gather community testimonials',
      'Badgeholder outreach'
    ],
    tips: [
      'Impact over promises',
      'Multi-ecosystem contributions help',
      'Engage with badgeholders early'
    ]
  },
  {
    id: 'farcaster-frames',
    name: 'Farcaster Frames Fund',
    tier: 1,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://warpcast.com/grants',
    description: 'Grants for building innovative Farcaster Frames and integrations.',
    requirements: [
      'Farcaster Frame or integration',
      'Novel use case',
      'Working prototype',
      'Active Farcaster presence'
    ],
    howToApply: [
      'Submit via Warpcast grants channel',
      'Demo your frame live',
      'Show engagement metrics',
      'Community feedback'
    ],
    tips: [
      'Build something viral',
      'Engage with Farcaster community',
      'Iterate based on feedback'
    ]
  },
  // TIER 2: Medium Priority ($10k-$50k)
  {
    id: 'polygon-grants',
    name: 'Polygon Village Grants',
    tier: 2,
    type: 'F',
    amount: '$5k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://polygon.technology/village',
    description: 'Ecosystem grants for projects building on Polygon.',
    requirements: [
      'Building on Polygon',
      'Clear use case',
      'Technical feasibility',
      'Community benefit'
    ],
    howToApply: [
      'Submit application form',
      'Technical review',
      'Milestone agreement',
      'Ongoing reporting'
    ],
    tips: [
      'Highlight cross-chain potential',
      'Show Polygon-specific optimizations',
      'Engage with Polygon community'
    ]
  },
  {
    id: 'arbitrum-grants',
    name: 'Arbitrum Foundation Grants',
    tier: 2,
    type: 'F',
    amount: '$10k-100k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://arbitrum.foundation/grants',
    description: 'Grants for projects building on Arbitrum ecosystem.',
    requirements: [
      'Building on Arbitrum',
      'Open source preferred',
      'Clear roadmap',
      'Technical documentation'
    ],
    howToApply: [
      'Questbook application',
      'Domain review',
      'Milestone-based funding',
      'Progress reports'
    ],
    tips: [
      'Multiple domain categories',
      'Start with smaller ask',
      'Build track record'
    ]
  },
  {
    id: 'ethereum-foundation',
    name: 'Ethereum Foundation Grants',
    tier: 2,
    type: 'F',
    amount: '$10k-100k+',
    deadline: 'Rolling',
    difficulty: 'Hard',
    url: 'https://esp.ethereum.foundation',
    description: 'Ecosystem support for research, development, and public goods.',
    requirements: [
      'Ethereum ecosystem benefit',
      'Novel research or development',
      'Strong technical proposal',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit inquiry form',
      'Initial review call',
      'Full proposal',
      'Funding decision'
    ],
    tips: [
      'Focus on core infrastructure',
      'Emphasize public goods',
      'Long-term vision important'
    ]
  },
  {
    id: 'uniswap-grants',
    name: 'Uniswap Foundation Grants',
    tier: 2,
    type: 'F',
    amount: '$5k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://www.uniswapfoundation.org/grants',
    description: 'Grants for DeFi innovation and Uniswap ecosystem growth.',
    requirements: [
      'DeFi focus',
      'Uniswap integration potential',
      'Technical innovation',
      'Clear milestones'
    ],
    howToApply: [
      'Submit application',
      'Technical review',
      'Milestone agreement',
      'Funding release'
    ],
    tips: [
      'Innovate on AMM/DEX',
      'Show user benefit',
      'Engage UF team early'
    ]
  },
  {
    id: 'consensys-grants',
    name: 'ConsenSys Grants',
    tier: 2,
    type: 'F',
    amount: '$10k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://consensys.net/grants',
    description: 'Grants for MetaMask, Infura, and ConsenSys ecosystem projects.',
    requirements: [
      'ConsenSys stack integration',
      'Technical innovation',
      'Clear use case',
      'Developer experience focus'
    ],
    howToApply: [
      'Application form',
      'Technical review',
      'Demo/presentation',
      'Milestone funding'
    ],
    tips: [
      'MetaMask Snaps are hot',
      'Focus on developer tools',
      'Infura integration bonus'
    ]
  },
  {
    id: 'filecoin-grants',
    name: 'Filecoin Foundation Grants',
    tier: 2,
    type: 'F',
    amount: '$5k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://fil.org/grants',
    description: 'Grants for decentralized storage and Filecoin ecosystem.',
    requirements: [
      'Filecoin/IPFS integration',
      'Storage use case',
      'Technical feasibility',
      'Open source'
    ],
    howToApply: [
      'GitHub discussion',
      'Proposal review',
      'Milestone plan',
      'Funding approval'
    ],
    tips: [
      'NFT storage is priority',
      'Decentralized apps welcome',
      'Show storage benefits'
    ]
  },
  // TIER 3: Accessible ($5k-$20k)
  {
    id: 'thirdweb-startup',
    name: 'thirdweb Startup Program',
    tier: 3,
    type: 'F',
    amount: '$5k-25k credits',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://thirdweb.com/startup-program',
    description: 'Credits and resources for Web3 startups using thirdweb.',
    requirements: [
      'Using thirdweb SDK',
      'Early-stage startup',
      'Active development',
      'Public launch planned'
    ],
    howToApply: [
      'Apply via website',
      'Team interview',
      'Usage commitment',
      'Credits activation'
    ],
    tips: [
      'Great for early projects',
      'Infrastructure savings',
      'Access to thirdweb team'
    ]
  },
  {
    id: 'alchemy-university',
    name: 'Alchemy University Grants',
    tier: 3,
    type: 'F',
    amount: '$1k-10k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://www.alchemy.com/university',
    description: 'Grants for developers building with Alchemy infrastructure.',
    requirements: [
      'Using Alchemy',
      'Developer project',
      'Learning/building focus',
      'Community contribution'
    ],
    howToApply: [
      'Complete university course',
      'Build capstone project',
      'Submit for grant',
      'Showcase your work'
    ],
    tips: [
      'Complete courses first',
      'Build impressive capstone',
      'Network with Alchemy team'
    ]
  },
  {
    id: 'buildspace-nights',
    name: 'Buildspace Nights & Weekends',
    tier: 3,
    type: 'F',
    amount: '$3k-10k',
    deadline: 'Cohort-based',
    difficulty: 'Easy',
    url: 'https://buildspace.so',
    description: 'Build projects with community, get funded if you ship.',
    requirements: [
      'Join cohort',
      'Ship weekly updates',
      'Build in public',
      'Demo at end'
    ],
    howToApply: [
      'Apply during open window',
      'Join cohort',
      'Build and ship',
      'Demo day pitch'
    ],
    tips: [
      'Consistency over perfection',
      'Build in public',
      'Community support key'
    ]
  },
  {
    id: 'encode-accelerator',
    name: 'Encode Club Accelerator',
    tier: 3,
    type: 'F',
    amount: '$5k-15k',
    deadline: 'Cohort-based',
    difficulty: 'Medium',
    url: 'https://www.encode.club/accelerator',
    description: 'Web3 accelerator with mentorship and funding.',
    requirements: [
      'Web3 project',
      'Early-stage team',
      'Hackathon or prior work',
      'Full-time availability'
    ],
    howToApply: [
      'Apply during cohort window',
      'Interview process',
      '8-week program',
      'Demo day'
    ],
    tips: [
      'Prior hackathon wins help',
      'Strong team matters',
      'Show technical depth'
    ]
  },
  {
    id: 'superteam-grants',
    name: 'Superteam Grants',
    tier: 3,
    type: 'F',
    amount: '$1k-10k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://superteam.fun',
    description: 'Community grants for Solana and multi-chain projects.',
    requirements: [
      'Useful project',
      'Community benefit',
      'Active builder',
      'Superteam engagement'
    ],
    howToApply: [
      'Join Superteam Discord',
      'Submit grant proposal',
      'Community review',
      'Funding decision'
    ],
    tips: [
      'Join community first',
      'Build relationships',
      'Show consistent work'
    ]
  },
  // TIER 4: Niche/Specific ($2k-$10k)
  {
    id: 'safe-grants',
    name: 'Safe Grants Program',
    tier: 4,
    type: 'F',
    amount: '$5k-30k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://safe.global/grants',
    description: 'Grants for Safe (formerly Gnosis Safe) ecosystem development.',
    requirements: [
      'Safe integration',
      'Multi-sig use case',
      'Account abstraction focus',
      'Security-minded'
    ],
    howToApply: [
      'Submit proposal',
      'Technical review',
      'Milestone planning',
      'Grant award'
    ],
    tips: [
      'Account abstraction trending',
      'Show security benefits',
      'DAO tooling popular'
    ]
  },
  {
    id: 'chainlink-grants',
    name: 'Chainlink Community Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://chain.link/community/grants',
    description: 'Grants for oracle integration and Chainlink ecosystem.',
    requirements: [
      'Chainlink integration',
      'Oracle use case',
      'Technical innovation',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit application',
      'Technical assessment',
      'Integration plan',
      'Milestone funding'
    ],
    tips: [
      'CCIP is hot topic',
      'Show oracle necessity',
      'Cross-chain use cases'
    ]
  },
  {
    id: 'lens-grants',
    name: 'Lens Protocol Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-20k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://lens.xyz',
    description: 'Grants for social apps building on Lens Protocol.',
    requirements: [
      'Lens Protocol integration',
      'Social app focus',
      'User experience priority',
      'Open source preferred'
    ],
    howToApply: [
      'Apply via Lens team',
      'Project review',
      'Integration support',
      'Grant funding'
    ],
    tips: [
      'Social gaming trending',
      'Creator economy focus',
      'Unique social features'
    ]
  },
  {
    id: 'nouns-prop-house',
    name: 'Nouns Prop House',
    tier: 4,
    type: 'F+C',
    amount: '$1k-30k',
    deadline: 'Round-based',
    difficulty: 'Easy',
    url: 'https://prop.house/nouns',
    description: 'Community voting on project funding proposals.',
    requirements: [
      'Creative proposal',
      'Nouns ecosystem benefit',
      'Clear deliverables',
      'Community appeal'
    ],
    howToApply: [
      'Submit during round',
      'Community voting',
      'Winner receives funds',
      'Deliver on proposal'
    ],
    tips: [
      'Creative pitches win',
      'Community engagement key',
      'Multiple rounds available'
    ]
  },
  {
    id: 'biconomy-grants',
    name: 'Biconomy Grants',
    tier: 4,
    type: 'F',
    amount: '$2k-15k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://www.biconomy.io/grants',
    description: 'Grants for Account Abstraction and gasless transactions.',
    requirements: [
      'Biconomy SDK integration',
      'Account Abstraction use case',
      'User onboarding focus',
      'Working prototype'
    ],
    howToApply: [
      'Apply via website',
      'Technical call',
      'Integration support',
      'Grant award'
    ],
    tips: [
      'AA is priority',
      'Show UX improvement',
      'Gasless onboarding key'
    ]
  },
  {
    id: 'worldcoin-grants',
    name: 'Worldcoin Developer Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://worldcoin.org/developers',
    description: 'Grants for World ID and proof-of-personhood integrations.',
    requirements: [
      'World ID integration',
      'Proof-of-personhood use case',
      'Privacy-preserving',
      'Technical innovation'
    ],
    howToApply: [
      'Developer application',
      'Integration review',
      'Prototype demo',
      'Grant funding'
    ],
    tips: [
      'Sybil resistance trending',
      'Privacy-first approach',
      'Identity use cases'
    ]
  },
  {
    id: 'aave-grants',
    name: 'Aave Grants DAO',
    tier: 4,
    type: 'F',
    amount: '$5k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://aavegrants.org',
    description: 'Grants for Aave ecosystem and DeFi innovation.',
    requirements: [
      'Aave integration',
      'DeFi innovation',
      'Clear milestones',
      'Open source'
    ],
    howToApply: [
      'Submit proposal',
      'Committee review',
      'Milestone planning',
      'Grant award'
    ],
    tips: [
      'GHO integration trending',
      'Lending innovation',
      'Risk management focus'
    ]
  },
  // TIER 5: Long-shot/Competitive
  {
    id: 'a16z-css',
    name: 'a16z Crypto Startup School',
    tier: 5,
    type: 'F',
    amount: '$250k+',
    deadline: 'Annual',
    difficulty: 'Hard',
    url: 'https://a16zcrypto.com/crypto-startup-school',
    description: 'Premier crypto accelerator with significant investment.',
    requirements: [
      'Exceptional team',
      'Novel crypto thesis',
      'Full-time commitment',
      'High growth potential'
    ],
    howToApply: [
      'Apply during window',
      'Multiple interviews',
      'Partner meetings',
      '12-week program'
    ],
    tips: [
      'Network with alumni',
      'Strong team essential',
      'Unique market insight'
    ]
  },
  {
    id: 'paradigm-fellowship',
    name: 'Paradigm Fellowship',
    tier: 5,
    type: 'F',
    amount: '$100k+',
    deadline: 'Annual',
    difficulty: 'Hard',
    url: 'https://www.paradigm.xyz',
    description: 'Fellowship for exceptional crypto builders and researchers.',
    requirements: [
      'Technical excellence',
      'Research contribution',
      'Crypto-native thinking',
      'Novel insights'
    ],
    howToApply: [
      'Apply during fellowship window',
      'Technical interviews',
      'Research proposal',
      'Fellowship decision'
    ],
    tips: [
      'Prior research helps',
      'Technical depth key',
      'Original thinking'
    ]
  },
  {
    id: 'y-combinator',
    name: 'Y Combinator',
    tier: 5,
    type: 'F',
    amount: '$500k',
    deadline: 'Batch-based',
    difficulty: 'Hard',
    url: 'https://www.ycombinator.com',
    description: 'Premier startup accelerator, increasing crypto focus.',
    requirements: [
      'Strong founding team',
      'Scalable business',
      'Market opportunity',
      'Full-time commitment'
    ],
    howToApply: [
      'Apply during batch window',
      'Video application',
      'Partner interviews',
      '3-month program'
    ],
    tips: [
      'Team > idea',
      'Show traction',
      'Be memorable'
    ]
  },
  {
    id: 'binance-labs',
    name: 'Binance Labs',
    tier: 5,
    type: 'F',
    amount: '$100k-500k',
    deadline: 'Rolling',
    difficulty: 'Hard',
    url: 'https://labs.binance.com',
    description: 'Venture capital and incubation from Binance.',
    requirements: [
      'High-potential project',
      'Strong team',
      'Clear business model',
      'Crypto-native'
    ],
    howToApply: [
      'Submit application',
      'Due diligence',
      'Partner meetings',
      'Investment decision'
    ],
    tips: [
      'Global reach matters',
      'BNB Chain integration helps',
      'Show growth metrics'
    ]
  },
  {
    id: 'coinbase-ventures',
    name: 'Coinbase Ventures',
    tier: 5,
    type: 'F',
    amount: '$500k-5M',
    deadline: 'Rolling',
    difficulty: 'Hard',
    url: 'https://ventures.coinbase.com',
    description: 'Strategic investment from Coinbase.',
    requirements: [
      'Series A+ ready',
      'Strong traction',
      'Experienced team',
      'Coinbase synergy'
    ],
    howToApply: [
      'Warm intro preferred',
      'Partner meetings',
      'Due diligence',
      'Term sheet'
    ],
    tips: [
      'Base ecosystem priority',
      'Warm intros essential',
      'Show Coinbase alignment'
    ]
  },
  // Additional opportunities
  {
    id: 'aragon-grants',
    name: 'Aragon Grants',
    tier: 3,
    type: 'F',
    amount: '$5k-30k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://aragon.org/grants',
    description: 'Grants for DAO tooling and governance innovation.',
    requirements: [
      'DAO tooling focus',
      'Aragon ecosystem benefit',
      'Open source',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit proposal',
      'Technical review',
      'Milestone agreement',
      'Grant funding'
    ],
    tips: [
      'Governance innovation',
      'Multi-chain DAOs',
      'Modular design'
    ]
  },
  {
    id: 'graph-grants',
    name: 'The Graph Grants',
    tier: 3,
    type: 'F',
    amount: '$5k-30k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://thegraph.com/ecosystem/grants',
    description: 'Grants for indexing and subgraph development.',
    requirements: [
      'Subgraph development',
      'Data querying innovation',
      'Technical feasibility',
      'Documentation'
    ],
    howToApply: [
      'Submit proposal',
      'Technical assessment',
      'Development milestones',
      'Grant award'
    ],
    tips: [
      'Cross-chain indexing',
      'Developer tools',
      'Analytics focus'
    ]
  },
  {
    id: 'compound-grants',
    name: 'Compound Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://compoundgrants.org',
    description: 'Grants for Compound protocol and DeFi lending.',
    requirements: [
      'Compound integration',
      'DeFi innovation',
      'Technical proposal',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit application',
      'Committee review',
      'Milestone planning',
      'Grant release'
    ],
    tips: [
      'Comet (v3) focus',
      'Risk management',
      'Lending innovation'
    ]
  },
  {
    id: 'espresso-grants',
    name: 'Espresso Systems Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-20k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://www.espressosys.com',
    description: 'Grants for sequencer and rollup infrastructure.',
    requirements: [
      'Rollup/sequencer focus',
      'Infrastructure innovation',
      'Technical depth',
      'Clear use case'
    ],
    howToApply: [
      'Contact team directly',
      'Technical discussion',
      'Proposal review',
      'Grant decision'
    ],
    tips: [
      'Shared sequencing hot',
      'MEV research',
      'Cross-rollup focus'
    ]
  },
  {
    id: 'lido-grants',
    name: 'Lido Ecosystem Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-30k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://lido.fi/grants',
    description: 'Grants for liquid staking ecosystem development.',
    requirements: [
      'Lido integration',
      'Staking innovation',
      'Technical feasibility',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit proposal',
      'Technical review',
      'Milestone agreement',
      'Grant funding'
    ],
    tips: [
      'stETH integrations',
      'DeFi composability',
      'Restaking focus'
    ]
  },
  {
    id: 'eigenlayer-grants',
    name: 'EigenLayer Grants',
    tier: 3,
    type: 'F',
    amount: '$10k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://www.eigenlayer.xyz',
    description: 'Grants for restaking and AVS development.',
    requirements: [
      'AVS development',
      'Restaking innovation',
      'Technical depth',
      'Security focus'
    ],
    howToApply: [
      'Apply via website',
      'Technical review',
      'Security assessment',
      'Grant award'
    ],
    tips: [
      'AVS is hot topic',
      'Restaking composability',
      'Security-first approach'
    ]
  },
  {
    id: 'ens-grants',
    name: 'ENS Ecosystem Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://ensgrants.xyz',
    description: 'Grants for ENS integration and naming innovation.',
    requirements: [
      'ENS integration',
      'Identity/naming focus',
      'User experience',
      'Open source'
    ],
    howToApply: [
      'Small grants: Simple form',
      'Public goods track',
      'Ecosystem track',
      'Grant award'
    ],
    tips: [
      'Subname innovation',
      'Off-chain records',
      'Cross-chain names'
    ]
  },
  {
    id: 'scroll-grants',
    name: 'Scroll Grants',
    tier: 3,
    type: 'F',
    amount: '$5k-30k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://scroll.io/grants',
    description: 'Grants for zkEVM and Scroll ecosystem development.',
    requirements: [
      'Building on Scroll',
      'zkEVM innovation',
      'Technical feasibility',
      'Clear deliverables'
    ],
    howToApply: [
      'Submit application',
      'Technical review',
      'Milestone planning',
      'Grant funding'
    ],
    tips: [
      'ZK proofs focus',
      'Privacy applications',
      'Cross-rollup'
    ]
  },
  {
    id: 'zksync-grants',
    name: 'zkSync Ecosystem Grants',
    tier: 3,
    type: 'F',
    amount: '$10k-50k',
    deadline: 'Rolling',
    difficulty: 'Medium',
    url: 'https://zksync.io/grants',
    description: 'Grants for zkSync Era ecosystem development.',
    requirements: [
      'Building on zkSync',
      'ZK innovation',
      'Technical depth',
      'Ecosystem benefit'
    ],
    howToApply: [
      'Submit proposal',
      'Technical assessment',
      'Milestone agreement',
      'Grant funding'
    ],
    tips: [
      'Native AA advantage',
      'Paymaster focus',
      'ZK-native apps'
    ]
  },
  {
    id: 'mantle-grants',
    name: 'Mantle Grants',
    tier: 4,
    type: 'F',
    amount: '$5k-25k',
    deadline: 'Rolling',
    difficulty: 'Easy',
    url: 'https://www.mantle.xyz/grants',
    description: 'Grants for Mantle L2 ecosystem projects.',
    requirements: [
      'Building on Mantle',
      'Clear use case',
      'Technical feasibility',
      'Community benefit'
    ],
    howToApply: [
      'Submit application',
      'Team review',
      'Milestone planning',
      'Grant award'
    ],
    tips: [
      'New ecosystem opportunity',
      'Gaming focus',
      'BitDAO backing'
    ]
  }
];

// ===== DATOS: LISTA 2 - PLATAFORMAS DE CROWDFUNDING =====
const crowdfundingPlatforms: CrowdfundingPlatform[] = [
  {
    id: 'wefunder',
    name: 'Wefunder',
    fee: '7.9%',
    minRaise: '$50k',
    maxRaise: '$5M (Reg CF) / $75M (Reg A+)',
    url: 'https://wefunder.com',
    description: 'Leading equity crowdfunding platform. Flexible terms and founder-friendly.',
    pros: [
      'Large investor community',
      'Rolling closes possible',
      'SAFE notes supported',
      'Good crypto project acceptance'
    ],
    cons: [
      'Due diligence process',
      'SEC compliance required',
      'Time to launch campaign'
    ],
    requirements: [
      'US company (Delaware C-Corp preferred)',
      'Financial statements',
      'Cap table documentation',
      'Campaign materials'
    ],
    bestFor: 'Early-stage startups seeking community investment'
  },
  {
    id: 'republic',
    name: 'Republic',
    fee: '7% + 2% equity',
    minRaise: '$50k',
    maxRaise: '$5M (Reg CF) / $75M (Reg A+)',
    url: 'https://republic.com',
    description: 'Premium equity crowdfunding with crypto-friendly approach.',
    pros: [
      'Crypto-native platform',
      'Token offerings possible',
      'Strong deal flow',
      'Professional marketing support'
    ],
    cons: [
      'Higher fees (7% + 2%)',
      'Selective acceptance',
      'Longer approval process'
    ],
    requirements: [
      'Strong pitch deck',
      'Proven traction metrics',
      'Professional team',
      'Clear tokenomics (if applicable)'
    ],
    bestFor: 'Crypto projects with strong traction and professional teams'
  },
  {
    id: 'seedinvest',
    name: 'SeedInvest',
    fee: '7.5% + equity',
    minRaise: '$100k',
    maxRaise: '$5M (Reg CF) / $50M (Reg D)',
    url: 'https://www.seedinvest.com',
    description: 'Equity crowdfunding with strong investor network.',
    pros: [
      'Accredited investor access',
      'Strong due diligence (credibility)',
      'Professional investor relations',
      'Good success rate'
    ],
    cons: [
      'More selective',
      'Higher minimum raise',
      'Longer process'
    ],
    requirements: [
      'US company required',
      'Financial audits',
      'Professional pitch materials',
      'Board structure'
    ],
    bestFor: 'Startups ready for institutional-style fundraising'
  },
  {
    id: 'startengine',
    name: 'StartEngine',
    fee: '7-14%',
    minRaise: '$10k',
    maxRaise: '$5M (Reg CF) / $75M (Reg A+)',
    url: 'https://www.startengine.com',
    description: 'Largest equity crowdfunding platform by volume.',
    pros: [
      'Largest investor base',
      'Secondary market (StartEngine Secondary)',
      'Flexible terms',
      'Good for consumer products'
    ],
    cons: [
      'Variable fees',
      'Less curated (more competition)',
      'Marketing intensive'
    ],
    requirements: [
      'US company',
      'Basic financials',
      'Campaign materials',
      'Video pitch recommended'
    ],
    bestFor: 'Consumer-facing projects with viral potential'
  },
  {
    id: 'kickstarter',
    name: 'Kickstarter',
    fee: '5% + payment processing',
    minRaise: 'No minimum',
    maxRaise: 'No maximum (rewards-based)',
    url: 'https://www.kickstarter.com',
    description: 'Rewards-based crowdfunding. Best for product launches.',
    pros: [
      'Massive audience',
      'No equity dilution',
      'Product validation',
      'Media attention potential'
    ],
    cons: [
      'No equity investment',
      'All-or-nothing funding',
      'Delivery obligations',
      'Not ideal for software'
    ],
    requirements: [
      'Physical product or creative project',
      'Clear rewards structure',
      'Video pitch',
      'Delivery timeline'
    ],
    bestFor: 'Hardware products or creative projects with physical deliverables'
  }
];

// ===== COMPONENTE PRINCIPAL =====
export default function FundingPage() {
  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Professional Navbar */}
      <Navbar />
      <NavbarSpacer />

      {/* Background effects - Theme Aware */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-green-400 dark:bg-green-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Funding Opportunities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Confidential funding tracker for The Moon in a Box / CryptoGift DAO
          </p>
        </div>

        {/* Token Gated Content */}
        <CGCAccessGate
          requiredBalance="20000"
          title="Exclusive Access Required"
          description="This funding tracker is exclusive to core team members with 20,000+ CGC tokens. Connect your wallet to access detailed funding opportunities and progress tracking."
        >
          <FundingDashboard />
        </CGCAccessGate>
      </div>
    </div>
  );
}

// ===== DASHBOARD PRINCIPAL =====
function FundingDashboard() {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'guide' | 'growth' | 'grants' | 'crowdfunding' | 'tracker'>('guide');
  const [filterTier, setFilterTier] = useState<number | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('funding-checklist');
    if (saved) {
      setCompletedItems(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const toggleComplete = useCallback((id: string) => {
    setCompletedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('funding-checklist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Calculate progress
  const totalGrants = fundingOpportunities.length;
  const completedGrants = fundingOpportunities.filter(g => completedItems[g.id]).length;
  const totalCrowdfunding = crowdfundingPlatforms.length;
  const completedCrowdfunding = crowdfundingPlatforms.filter(p => completedItems[p.id]).length;

  // Filter grants by tier
  const filteredGrants = filterTier
    ? fundingOpportunities.filter(g => g.tier === filterTier)
    : fundingOpportunities;

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard
          title="Grants Progress"
          completed={completedGrants}
          total={totalGrants}
          icon={<Award className="w-6 h-6 text-blue-500" />}
        />
        <ProgressCard
          title="Crowdfunding Progress"
          completed={completedCrowdfunding}
          total={totalCrowdfunding}
          icon={<Users className="w-6 h-6 text-green-500" />}
        />
        <ProgressCard
          title="Total Progress"
          completed={completedGrants + completedCrowdfunding}
          total={totalGrants + totalCrowdfunding}
          icon={<Target className="w-6 h-6 text-purple-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Application Guide
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'growth'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-b-2 border-green-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Growth Strategy
        </button>
        <button
          onClick={() => setActiveTab('grants')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'grants'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Grants & Programs ({totalGrants})
        </button>
        <button
          onClick={() => setActiveTab('crowdfunding')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'crowdfunding'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-b-2 border-green-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Crowdfunding ({totalCrowdfunding})
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'tracker'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-b-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <ClipboardList className="w-4 h-4 inline mr-2" />
          My Applications
        </button>
      </div>

      {/* Content */}
      {activeTab === 'guide' ? (
        <ApplicationGuide />
      ) : activeTab === 'growth' ? (
        <GrowthStrategy />
      ) : activeTab === 'tracker' ? (
        <GrantApplicationsTracker />
      ) : activeTab === 'grants' ? (
        <div className="space-y-6">
          {/* Tier Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 py-2">Filter by Tier:</span>
            <button
              onClick={() => setFilterTier(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterTier === null ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4, 5].map(tier => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterTier === tier ? getTierColor(tier, true) : getTierColor(tier, false)
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>

          {/* Grants List */}
          <div className="space-y-4">
            {filteredGrants.map(grant => (
              <GrantCard
                key={grant.id}
                grant={grant}
                isCompleted={!!completedItems[grant.id]}
                isExpanded={!!expandedItems[grant.id]}
                onToggleComplete={() => toggleComplete(grant.id)}
                onToggleExpanded={() => toggleExpanded(grant.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {crowdfundingPlatforms.map(platform => (
            <CrowdfundingCard
              key={platform.id}
              platform={platform}
              isCompleted={!!completedItems[platform.id]}
              isExpanded={!!expandedItems[platform.id]}
              onToggleComplete={() => toggleComplete(platform.id)}
              onToggleExpanded={() => toggleExpanded(platform.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTES AUXILIARES =====

function ProgressCard({
  title,
  completed,
  total,
  icon
}: {
  title: string;
  completed: number;
  total: number;
  icon: React.ReactNode;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 glass-bubble">{icon}</div>
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{percentage}%</span>
      </div>
      <h3 className="font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{completed} of {total} completed</p>
      <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function GrantCard({
  grant,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpanded
}: {
  grant: FundingOpportunity;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpanded: () => void;
}) {
  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4" />}
        </button>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-gray-800 dark:text-gray-100 ${isCompleted ? 'line-through' : ''}`}>
              {grant.name}
            </h3>
            <TierBadge tier={grant.tier} />
            <TypeBadge type={grant.type} />
            <DifficultyBadge difficulty={grant.difficulty} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {grant.amount}
            </span>
            {grant.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {grant.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {grant.url && (
            <a
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={onToggleExpanded}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{grant.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailSection title="Requirements" items={grant.requirements} icon={<FileText className="w-4 h-4" />} />
            <DetailSection title="How to Apply" items={grant.howToApply} icon={<Rocket className="w-4 h-4" />} />
            <DetailSection title="Tips" items={grant.tips} icon={<Star className="w-4 h-4" />} />
          </div>
        </div>
      )}
    </div>
  );
}

function CrowdfundingCard({
  platform,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpanded
}: {
  platform: CrowdfundingPlatform;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpanded: () => void;
}) {
  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4" />}
        </button>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-gray-800 dark:text-gray-100 ${isCompleted ? 'line-through' : ''}`}>
              {platform.name}
            </h3>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
              Fee: {platform.fee}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
            {platform.minRaise && (
              <span>Min: {platform.minRaise}</span>
            )}
            {platform.maxRaise && (
              <span>Max: {platform.maxRaise}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={onToggleExpanded}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{platform.description}</p>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              <Zap className="w-4 h-4 inline mr-1" />
              Best For: {platform.bestFor}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailSection title="Pros" items={platform.pros} icon={<Check className="w-4 h-4 text-green-500" />} />
            <DetailSection title="Cons" items={platform.cons} icon={<Target className="w-4 h-4 text-red-500" />} />
            <DetailSection title="Requirements" items={platform.requirements} icon={<FileText className="w-4 h-4" />} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  items,
  icon
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 | 4 | 5 }) {
  const colors: Record<number, string> = {
    1: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    2: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    3: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    4: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    5: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tier]}`}>
      T{tier}
    </span>
  );
}

function TypeBadge({ type }: { type: 'F' | 'C' | 'F+C' }) {
  const config = {
    'F': { label: 'Grant', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    'C': { label: 'Crowd', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
    'F+C': { label: 'Both', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' }
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config[type].color}`}>
      {config[type].label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  const colors = {
    'Easy': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'Medium': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    'Hard': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

function getTierColor(tier: number, active: boolean): string {
  const colors: Record<number, { active: string; inactive: string }> = {
    1: { active: 'bg-red-500 text-white', inactive: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60' },
    2: { active: 'bg-orange-500 text-white', inactive: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60' },
    3: { active: 'bg-yellow-500 text-white', inactive: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60' },
    4: { active: 'bg-green-500 text-white', inactive: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60' },
    5: { active: 'bg-blue-500 text-white', inactive: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60' }
  };

  return active ? colors[tier].active : colors[tier].inactive;
}
