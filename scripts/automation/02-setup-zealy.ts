import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Zealy Platform Integration Automation
 * 
 * This script automates:
 * 1. Webhook configuration
 * 2. API integration setup
 * 3. Quest synchronization
 * 4. Reward automation
 */

interface ZealyWebhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface ZealyUser {
  id: string;
  name: string;
  walletAddress?: string;
  xp: number;
  level: number;
  rank?: number;
}

interface ZealyQuest {
  id: string;
  name: string;
  description: string;
  xp: number;
  type: string;
  status: string;
}

class ZealyAutomation {
  private apiKey: string;
  private subdomain: string;
  private baseUrl: string = "https://api-v2.zealy.io";
  private webhookSecret: string;
  
  constructor() {
    this.apiKey = process.env.ZEALY_API_KEY || "";
    this.subdomain = process.env.ZEALY_SUBDOMAIN || "";
    this.webhookSecret = crypto.randomBytes(32).toString("hex");
    
    if (!this.apiKey) {
      throw new Error("ZEALY_API_KEY not found in .env");
    }
    
    if (!this.subdomain) {
      throw new Error("ZEALY_SUBDOMAIN not found in .env");
    }
  }
  
  /**
   * Get headers for API requests
   */
  private getHeaders() {
    return {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json"
    };
  }
  
  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<ZealyWebhook[]> {
    console.log("\n📋 Fetching existing webhooks...");
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/communities/${this.subdomain}/webhooks`,
        { headers: this.getHeaders() }
      );
      
      const webhooks = response.data;
      console.log(`Found ${webhooks.length} webhook(s)`);
      
      webhooks.forEach((webhook: ZealyWebhook) => {
        console.log(`  - ${webhook.id}: ${webhook.url} (${webhook.isActive ? "Active" : "Inactive"})`);
      });
      
      return webhooks;
    } catch (error: any) {
      console.error("❌ Failed to list webhooks:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Create a new webhook
   */
  async createWebhook(
    url: string,
    events: string[] = ["quest.completed", "user.xp_changed", "user.level_up"]
  ): Promise<ZealyWebhook> {
    console.log(`\n🔧 Creating webhook for: ${url}`);
    
    const payload = {
      url: url,
      secret: this.webhookSecret,
      events: events
    };
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/public/communities/${this.subdomain}/webhooks`,
        payload,
        { headers: this.getHeaders() }
      );
      
      const webhook = response.data;
      console.log(`✅ Webhook created: ${webhook.id}`);
      console.log(`   Secret: ${webhook.secret ? '***' + webhook.secret.slice(-4) : 'Not provided'}`);
      console.log(`   Events: ${webhook.events.join(", ")}`);
      
      // Save webhook configuration
      await this.saveWebhookConfig(webhook);
      
      return webhook;
    } catch (error: any) {
      console.error("❌ Failed to create webhook:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    console.log(`\n🗑️ Deleting webhook: ${webhookId}`);
    
    try {
      await axios.delete(
        `${this.baseUrl}/public/communities/${this.subdomain}/webhooks/${webhookId}`,
        { headers: this.getHeaders() }
      );
      
      console.log("✅ Webhook deleted successfully");
    } catch (error: any) {
      console.error("❌ Failed to delete webhook:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Get webhook event types
   */
  async getEventTypes(): Promise<string[]> {
    console.log("\n📋 Fetching available event types...");
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/communities/${this.subdomain}/webhooks-event-types`,
        { headers: this.getHeaders() }
      );
      
      const eventTypes = response.data;
      console.log(`Available events: ${eventTypes.join(", ")}`);
      
      return eventTypes;
    } catch (error: any) {
      console.error("❌ Failed to get event types:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  /**
   * Get user information
   */
  async getUser(userId: string): Promise<ZealyUser> {
    console.log(`\n👤 Fetching user: ${userId}`);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/communities/${this.subdomain}/users/${userId}`,
        { headers: this.getHeaders() }
      );
      
      const user = response.data;
      console.log(`  Name: ${user.name}`);
      console.log(`  XP: ${user.xp}`);
      console.log(`  Level: ${user.level}`);
      console.log(`  Wallet: ${user.walletAddress ? user.walletAddress.slice(0, 6) + '...' + user.walletAddress.slice(-4) : "Not connected"}`);
      
      return user;
    } catch (error: any) {
      console.error("❌ Failed to get user:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Search users by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<ZealyUser | null> {
    console.log(`\n🔍 Searching user by wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/communities/${this.subdomain}/users/lookup`,
        {
          headers: this.getHeaders(),
          params: {
            addresses: walletAddress
          }
        }
      );
      
      const users = response.data;
      
      if (users.length > 0) {
        const user = users[0];
        console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);
        return user;
      } else {
        console.log("❌ No user found with this wallet");
        return null;
      }
    } catch (error: any) {
      console.error("❌ Failed to search user:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<ZealyUser[]> {
    console.log(`\n🏆 Fetching top ${limit} leaderboard...`);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/communities/${this.subdomain}/leaderboard`,
        {
          headers: this.getHeaders(),
          params: { limit }
        }
      );
      
      const leaderboard = response.data;
      
      console.log("Leaderboard:");
      leaderboard.forEach((user: ZealyUser, index: number) => {
        console.log(`  ${index + 1}. ${user.name} - ${user.xp} XP (Level ${user.level})`);
      });
      
      return leaderboard;
    } catch (error: any) {
      console.error("❌ Failed to get leaderboard:", error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Save webhook configuration
   */
  private async saveWebhookConfig(webhook: ZealyWebhook): Promise<void> {
    const configDir = path.join(__dirname, "../../config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      subdomain: this.subdomain,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events
      },
      createdAt: new Date().toISOString()
    };
    
    const configFile = path.join(configDir, "zealy-webhook.json");
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log(`💾 Webhook config saved to: ${configFile}`);
  }
  
  /**
   * Create webhook handler for Express
   */
  createWebhookHandler() {
    return async (req: any, res: any) => {
      const signature = req.headers["x-zealy-signature"];
      const rawBody = JSON.stringify(req.body);
      
      // Verify signature
      if (!this.verifyWebhookSignature(rawBody, signature, this.webhookSecret)) {
        console.error("❌ Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      
      const event = req.body;
      console.log(`📮 Received event: ${event.type}`);
      
      try {
        switch (event.type) {
          case "quest.completed":
            await this.handleQuestCompleted(event.data);
            break;
          
          case "user.xp_changed":
            await this.handleXPChanged(event.data);
            break;
          
          case "user.level_up":
            await this.handleLevelUp(event.data);
            break;
          
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("❌ Error handling webhook:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }
  
  /**
   * Handle quest completion event
   */
  private async handleQuestCompleted(data: any): Promise<void> {
    console.log(`🎯 Quest completed: ${data.quest.name} by ${data.user.name}`);
    
    // Here you would:
    // 1. Create EAS attestation
    // 2. Process token rewards
    // 3. Update database
    // 4. Send notifications
  }
  
  /**
   * Handle XP change event
   */
  private async handleXPChanged(data: any): Promise<void> {
    console.log(`📈 XP changed for ${data.user.name}: ${data.oldXp} → ${data.newXp}`);
  }
  
  /**
   * Handle level up event
   */
  private async handleLevelUp(data: any): Promise<void> {
    console.log(`🎊 Level up! ${data.user.name} reached level ${data.newLevel}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Zealy Integration Setup...");
  console.log("================================================");
  
  const zealy = new ZealyAutomation();
  
  // Step 1: Get available event types
  console.log("\n📋 Step 1: Checking Available Events");
  await zealy.getEventTypes();
  
  // Step 2: List existing webhooks
  console.log("\n📋 Step 2: Checking Existing Webhooks");
  const existingWebhooks = await zealy.listWebhooks();
  
  // Step 3: Create new webhook (if needed)
  const webhookUrl = process.env.ZEALY_WEBHOOK_URL || `https://your-domain.com/api/webhooks/zealy`;
  
  if (!existingWebhooks.find(w => w.url === webhookUrl)) {
    console.log("\n📋 Step 3: Creating New Webhook");
    
    const webhook = await zealy.createWebhook(webhookUrl, [
      "quest.completed",
      "user.xp_changed",
      "user.level_up",
      "user.banned"
    ]);
    
    // Update .env file
    const envPath = path.join(__dirname, "../../.env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      envContent += `\nZEALY_WEBHOOK_ID=${webhook.id}`;
      envContent += `\nZEALY_WEBHOOK_SECRET=${webhook.secret}`;
      fs.writeFileSync(envPath, envContent);
      console.log("✅ Webhook credentials added to .env");
    }
  } else {
    console.log("\n📋 Step 3: Webhook Already Exists");
  }
  
  // Step 4: Test user lookup
  console.log("\n📋 Step 4: Testing API Endpoints");
  
  // Get leaderboard
  await zealy.getLeaderboard(5);
  
  console.log("\n================================================");
  console.log("✅ ZEALY INTEGRATION COMPLETE!");
  console.log("================================================");
  console.log("\n📋 Next Steps:");
  console.log("1. Webhook has been configured");
  console.log("2. Update your server to handle webhook events");
  console.log("3. Test quest completion flow");
  console.log("4. Monitor webhook logs in Zealy dashboard");
  
  // Generate Express route example
  const exampleCode = `
// Add to your Express server:
app.post('/api/webhooks/zealy', zealy.createWebhookHandler());
`;
  
  console.log("\n📝 Example Integration Code:");
  console.log(exampleCode);
}

// Export for use in other scripts
export { ZealyAutomation };

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}