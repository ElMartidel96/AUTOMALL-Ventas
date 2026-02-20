# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## 🚨 REQUIRED ENVIRONMENT VARIABLES FOR VERCEL DEPLOYMENT

The following environment variables must be configured in **Vercel Dashboard** > **Project Settings** > **Environment Variables** to fix the build failures:

### 1. OpenAI API Configuration
```bash
OPENAI_API_KEY=sk-proj-[YOUR_OPENAI_API_KEY]
```
**Purpose**: Required for `/api/agent` route functionality
**Source**: OpenAI Dashboard > API Keys

### 2. Redis Configuration (Upstash)
```bash
UPSTASH_REDIS_REST_URL=https://[YOUR_REDIS_INSTANCE].upstash.io
UPSTASH_REDIS_REST_TOKEN=[YOUR_REDIS_TOKEN]
```
**Purpose**: Session management and rate limiting for AI agent
**Source**: Upstash Dashboard > Redis > REST API

### 3. DAO Contract Addresses (Already deployed)
```bash
ARAGON_DAO_ADDRESS=0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
CGC_TOKEN_ADDRESS=0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
```
**Purpose**: Contract interaction in API routes
**Source**: Base Mainnet deployment

### 4. Application URLs
```bash
NEXT_PUBLIC_DAO_URL=https://cryptogift-wallets-dao.vercel.app
MCP_AUTH_TOKEN=internal
```

### 5. Network Configuration
```bash
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
```

## 📋 HOW TO CONFIGURE IN VERCEL

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Navigate to Project**: Select "cryptogift-wallets-dao" project
3. **Go to Settings**: Click "Settings" tab
4. **Environment Variables**: Click "Environment Variables" in sidebar
5. **Add Variables**: Click "Add" and input each variable above
6. **Set Environment**: Set to "Production", "Preview", and "Development" as needed
7. **Save**: Click "Save" for each variable

## 🔧 CURRENT STATUS

- ✅ Local `.env.local` file has all required variables
- ❌ Vercel deployment missing these variables
- 🔄 Build fails at page data collection for `/api/agent`

## 🛠️ VERIFICATION AFTER SETUP

After adding the environment variables in Vercel:

1. **Trigger Redeploy**: Go to Deployments > Redeploy
2. **Check Build Log**: Verify no "missing environment variable" errors
3. **Test API Endpoint**: Visit `/api/agent?action=health`
4. **Monitor Function Log**: Check Vercel Function logs for errors

## ⚠️ SECURITY NOTES

- **Never commit real API keys**: Always use Vercel environment variables for secrets
- **Rotate keys regularly**: Update OpenAI and Redis keys every 3 months  
- **Use separate environments**: Different keys for dev/staging/production
- **Monitor usage**: Set up alerts for API key usage limits

## 🔗 DOCUMENTATION REFERENCES

- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- OpenAI API Keys: https://platform.openai.com/api-keys
- Upstash Redis: https://console.upstash.com/

---

**Last updated**: January 31, 2025  
**Status**: Environment variables needed in Vercel Dashboard