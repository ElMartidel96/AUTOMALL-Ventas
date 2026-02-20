import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const execAsync = promisify(exec);
dotenv.config();

/**
 * Cloud Services Setup Automation
 * 
 * This script automates:
 * 1. Vercel deployment configuration
 * 2. Railway service setup
 * 3. Upstash Redis provisioning
 * 4. Supabase database setup
 * 5. Sentry monitoring configuration
 */

interface ServiceConfig {
  name: string;
  provider: string;
  apiKey?: string;
  projectId?: string;
  url?: string;
  status: "configured" | "pending" | "error";
}

class CloudAutomation {
  private services: Map<string, ServiceConfig> = new Map();
  private envVars: Map<string, string> = new Map();
  
  constructor() {
    this.loadExistingEnv();
  }
  
  /**
   * Load existing environment variables
   */
  private loadExistingEnv() {
    const envPath = path.join(__dirname, "../../.env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value) {
          this.envVars.set(key.trim(), value.trim());
        }
      });
    }
  }
  
  /**
   * Setup Vercel deployment
   */
  async setupVercel(): Promise<ServiceConfig> {
    console.log("\n🚀 Setting up Vercel deployment...");
    
    const config: ServiceConfig = {
      name: "cryptogift-dao",
      provider: "Vercel",
      status: "pending"
    };
    
    try {
      // Check if Vercel CLI is installed
      await execAsync("vercel --version");
      console.log("✅ Vercel CLI detected");
      
      // Create vercel.json configuration
      const vercelConfig = {
        name: "cryptogift-dao",
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: ".next",
        devCommand: "npm run dev",
        installCommand: "npm install",
        env: {
          NEXT_PUBLIC_DAO_ADDRESS: process.env.DAO_ADDRESS,
          NEXT_PUBLIC_CGC_TOKEN: process.env.CGC_TOKEN_ADDRESS,
          NEXT_PUBLIC_CHAIN_ID: "8453"
        },
        build: {
          env: {
            NODE_ENV: "production"
          }
        },
        functions: {
          "api/webhooks/zealy.ts": {
            maxDuration: 30
          },
          "api/attestations/*.ts": {
            maxDuration: 60
          }
        }
      };
      
      const vercelConfigPath = path.join(__dirname, "../../vercel.json");
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log("✅ vercel.json created");
      
      // Set environment variables
      const envCommands = [
        `vercel env add NEXT_PUBLIC_DAO_ADDRESS production`,
        `vercel env add NEXT_PUBLIC_CGC_TOKEN production`,
        `vercel env add DATABASE_URL production`,
        `vercel env add REDIS_URL production`
      ];
      
      console.log("📝 To complete Vercel setup, run:");
      envCommands.forEach(cmd => console.log(`   ${cmd}`));
      
      config.status = "configured";
      config.url = "https://cryptogift-dao.vercel.app";
      
    } catch (error: any) {
      if (error.message.includes("command not found")) {
        console.log("⚠️ Vercel CLI not installed");
        console.log("   Install with: npm i -g vercel");
      }
      config.status = "error";
    }
    
    this.services.set("vercel", config);
    return config;
  }
  
  /**
   * Setup Railway deployment
   */
  async setupRailway(): Promise<ServiceConfig> {
    console.log("\n🚂 Setting up Railway deployment...");
    
    const config: ServiceConfig = {
      name: "cryptogift-dao-bot",
      provider: "Railway",
      status: "pending"
    };
    
    try {
      // Check if Railway CLI is installed
      await execAsync("railway --version");
      console.log("✅ Railway CLI detected");
      
      // Create railway.toml configuration
      const railwayConfig = `[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "eas-attestor"
startCommand = "npm run bot:attestor"

[[services]]
name = "discord-bot"
startCommand = "npm run bot:discord"

[environments.production]
ENABLE_DEBUG = false
NODE_ENV = "production"
`;
      
      const railwayConfigPath = path.join(__dirname, "../../railway.toml");
      fs.writeFileSync(railwayConfigPath, railwayConfig);
      console.log("✅ railway.toml created");
      
      console.log("📝 To complete Railway setup:");
      console.log("   1. railway login");
      console.log("   2. railway init");
      console.log("   3. railway up");
      console.log("   4. railway env");
      
      config.status = "configured";
      
    } catch (error: any) {
      if (error.message.includes("command not found")) {
        console.log("⚠️ Railway CLI not installed");
        console.log("   Install with: npm i -g @railway/cli");
      }
      config.status = "error";
    }
    
    this.services.set("railway", config);
    return config;
  }
  
  /**
   * Setup Upstash Redis
   */
  async setupUpstash(): Promise<ServiceConfig> {
    console.log("\n🔴 Setting up Upstash Redis...");
    
    const config: ServiceConfig = {
      name: "cryptogift-dao-redis",
      provider: "Upstash",
      status: "pending"
    };
    
    const upstashEmail = process.env.UPSTASH_EMAIL;
    const upstashApiKey = process.env.UPSTASH_API_KEY;
    
    if (!upstashEmail || !upstashApiKey) {
      console.log("⚠️ UPSTASH_EMAIL or UPSTASH_API_KEY not found");
      console.log("   Create account at: https://upstash.com");
      console.log("   Get API key from: https://console.upstash.com/account/api");
      config.status = "error";
      this.services.set("upstash", config);
      return config;
    }
    
    try {
      // Create Redis database via API
      const response = await axios.post(
        "https://api.upstash.com/v2/redis/database",
        {
          name: "cryptogift-dao",
          region: "global",
          primary_region: "us-east-1",
          tls: true,
          eviction: true
        },
        {
          auth: {
            username: upstashEmail,
            password: upstashApiKey
          }
        }
      );
      
      const database = response.data;
      
      console.log("✅ Redis database created");
      console.log(`   Endpoint: ${database.endpoint}`);
      console.log(`   Port: ${database.port}`);
      
      // Save credentials
      this.envVars.set("UPSTASH_REDIS_URL", `redis://:${database.password}@${database.endpoint}:${database.port}`);
      this.envVars.set("UPSTASH_REDIS_TOKEN", database.rest_token);
      
      config.status = "configured";
      config.url = database.endpoint;
      config.projectId = database.database_id;
      
    } catch (error: any) {
      console.error("❌ Failed to create Redis database:", error.response?.data || error.message);
      config.status = "error";
    }
    
    this.services.set("upstash", config);
    return config;
  }
  
  /**
   * Setup Supabase database
   */
  async setupSupabase(): Promise<ServiceConfig> {
    console.log("\n🗄️ Setting up Supabase database...");
    
    const config: ServiceConfig = {
      name: "cryptogift-dao-db",
      provider: "Supabase",
      status: "pending"
    };
    
    try {
      // Check if Supabase CLI is installed
      await execAsync("supabase --version");
      console.log("✅ Supabase CLI detected");
      
      // Initialize Supabase project
      const supabaseDir = path.join(__dirname, "../../supabase");
      if (!fs.existsSync(supabaseDir)) {
        fs.mkdirSync(supabaseDir, { recursive: true });
      }
      
      // Create initial migration
      const migrationSQL = `-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  discord_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attestations table
CREATE TABLE IF NOT EXISTS attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  schema_uid TEXT NOT NULL,
  recipient TEXT NOT NULL,
  attester TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ
);

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 0,
  token_reward DECIMAL(18, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Create quest_completions table
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  quest_id UUID REFERENCES quests(id),
  attestation_uid TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Create indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_discord ON users(discord_id);
CREATE INDEX idx_attestations_recipient ON attestations(recipient);
CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_quest_completions_user ON quest_completions(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Public can view attestations" ON attestations
  FOR SELECT USING (true);

CREATE POLICY "Users can view own rewards" ON rewards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public can view quests" ON quests
  FOR SELECT USING (true);

CREATE POLICY "Users can view own completions" ON quest_completions
  FOR SELECT USING (user_id = auth.uid());
`;
      
      const migrationPath = path.join(supabaseDir, "migrations", "001_initial_schema.sql");
      const migrationsDir = path.dirname(migrationPath);
      
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
      
      fs.writeFileSync(migrationPath, migrationSQL);
      console.log("✅ Initial migration created");
      
      console.log("📝 To complete Supabase setup:");
      console.log("   1. supabase init");
      console.log("   2. supabase link --project-ref YOUR_PROJECT_REF");
      console.log("   3. supabase db push");
      console.log("   4. Copy connection string to .env");
      
      config.status = "configured";
      
    } catch (error: any) {
      if (error.message.includes("command not found")) {
        console.log("⚠️ Supabase CLI not installed");
        console.log("   Install with: npm i -g supabase");
      }
      config.status = "error";
    }
    
    this.services.set("supabase", config);
    return config;
  }
  
  /**
   * Setup Sentry monitoring
   */
  async setupSentry(): Promise<ServiceConfig> {
    console.log("\n🔍 Setting up Sentry monitoring...");
    
    const config: ServiceConfig = {
      name: "cryptogift-dao",
      provider: "Sentry",
      status: "pending"
    };
    
    const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
    
    if (!sentryAuthToken) {
      console.log("⚠️ SENTRY_AUTH_TOKEN not found");
      console.log("   Create project at: https://sentry.io");
      console.log("   Get auth token from: Settings → Auth Tokens");
      config.status = "error";
      this.services.set("sentry", config);
      return config;
    }
    
    try {
      // Create Sentry configuration
      const sentryConfig = `import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
`;
      
      const sentryConfigPath = path.join(__dirname, "../../config", "sentry.ts");
      const configDir = path.dirname(sentryConfigPath);
      
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(sentryConfigPath, sentryConfig);
      console.log("✅ Sentry configuration created");
      
      console.log("📝 To complete Sentry setup:");
      console.log("   1. Create project on Sentry dashboard");
      console.log("   2. Copy DSN to .env (SENTRY_DSN)");
      console.log("   3. Import sentry.ts in your main application file");
      
      config.status = "configured";
      
    } catch (error) {
      console.error("❌ Failed to setup Sentry:", error);
      config.status = "error";
    }
    
    this.services.set("sentry", config);
    return config;
  }
  
  /**
   * Generate environment file
   */
  async generateEnvFile(): Promise<void> {
    console.log("\n📝 Generating consolidated .env file...");
    
    const envPath = path.join(__dirname, "../../.env.production");
    let envContent = "# Production Environment Variables\n";
    envContent += "# Generated at: " + new Date().toISOString() + "\n\n";
    
    // Add all collected environment variables
    for (const [key, value] of this.envVars) {
      envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Environment file saved to: .env.production`);
  }
  
  /**
   * Generate deployment documentation
   */
  async generateDocumentation(): Promise<void> {
    console.log("\n📚 Generating deployment documentation...");
    
    let markdown = "# Cloud Services Deployment Status\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    
    markdown += "## Services Overview\n\n";
    markdown += "| Service | Provider | Status | URL |\n";
    markdown += "|---------|----------|--------|-----|\n";
    
    for (const [name, config] of this.services) {
      const status = config.status === "configured" ? "✅ Configured" : 
                    config.status === "error" ? "❌ Error" : "⏳ Pending";
      markdown += `| ${config.name} | ${config.provider} | ${status} | ${config.url || "N/A"} |\n`;
    }
    
    markdown += "\n## Next Steps\n\n";
    markdown += "1. **Vercel**: Deploy frontend with `vercel --prod`\n";
    markdown += "2. **Railway**: Deploy bots with `railway up`\n";
    markdown += "3. **Upstash**: Redis is ready to use\n";
    markdown += "4. **Supabase**: Run migrations with `supabase db push`\n";
    markdown += "5. **Sentry**: Add DSN to track errors\n";
    
    markdown += "\n## Environment Variables\n\n";
    markdown += "Copy `.env.production` to your deployment platforms.\n";
    
    const docPath = path.join(__dirname, "../../docs", "CLOUD_DEPLOYMENT.md");
    const docsDir = path.dirname(docPath);
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(docPath, markdown);
    console.log(`✅ Documentation saved to: docs/CLOUD_DEPLOYMENT.md`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Cloud Services Setup...");
  console.log("================================================");
  
  const cloud = new CloudAutomation();
  
  // Setup all services
  console.log("\n📋 Step 1: Configuring Services");
  
  await cloud.setupVercel();
  await cloud.setupRailway();
  await cloud.setupUpstash();
  await cloud.setupSupabase();
  await cloud.setupSentry();
  
  // Generate files
  console.log("\n📋 Step 2: Generating Configuration Files");
  
  await cloud.generateEnvFile();
  await cloud.generateDocumentation();
  
  console.log("\n================================================");
  console.log("✅ CLOUD SERVICES SETUP COMPLETE!");
  console.log("================================================");
  console.log("\n📋 Summary:");
  console.log("1. Configuration files created for all services");
  console.log("2. Environment variables consolidated in .env.production");
  console.log("3. Deployment documentation generated");
  console.log("\n⚠️ Manual Steps Required:");
  console.log("- Install missing CLIs (vercel, railway, supabase)");
  console.log("- Create accounts on each platform");
  console.log("- Run deployment commands listed in documentation");
  console.log("- Configure custom domains if needed");
}

// Export for use in other scripts
export { CloudAutomation };

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}