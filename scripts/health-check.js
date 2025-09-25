#!/usr/bin/env node

/**
 * Production Health Check System
 * Comprehensive health monitoring with alerting capabilities
 * Integrates with monitoring services and provides detailed system status
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Health check configuration
const HEALTH_CONFIG = {
  checks: {
    // Application endpoints
    app: {
      url: process.env.HEALTH_CHECK_URL || 'http://localhost:80',
      timeout: 5000,
      expectedStatus: 200,
      critical: true
    },

    // API health endpoint
    api: {
      url: process.env.API_HEALTH_URL || 'http://localhost:80/api/health',
      timeout: 3000,
      expectedStatus: 200,
      critical: true
    },

    // Database connectivity (via health endpoint)
    database: {
      url: process.env.DATABASE_HEALTH_URL || 'http://localhost:80/api/health/database',
      timeout: 5000,
      expectedStatus: 200,
      critical: true
    },

    // External dependencies
    supabase: {
      url: 'https://supabase.com',
      timeout: 10000,
      expectedStatus: 200,
      critical: false
    },

    // CDN/Static assets
    cdn: {
      url: process.env.CDN_HEALTH_URL || 'http://localhost:80/favicon.ico',
      timeout: 5000,
      expectedStatus: 200,
      critical: false
    }
  },

  // Alerting configuration
  alerting: {
    webhook: process.env.ALERT_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    slack: process.env.SLACK_WEBHOOK_URL,
    thresholds: {
      consecutive_failures: 3,
      response_time_warning: 2000,
      response_time_critical: 5000
    }
  },

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // ms between retries
    backoff: 2.0 // exponential backoff multiplier
  }
};

class HealthChecker {
  constructor() {
    this.results = new Map();
    this.history = [];
    this.alertsSent = new Set();
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    console.log('🔍 Starting health check cycle...\n');

    const results = {};
    let overallStatus = 'healthy';
    let criticalIssues = 0;

    // Run all checks in parallel
    const checkPromises = Object.entries(HEALTH_CONFIG.checks).map(async ([name, config]) => {
      const result = await this.performHealthCheck(name, config);
      results[name] = result;

      if (result.status !== 'healthy') {
        if (config.critical) {
          overallStatus = 'unhealthy';
          criticalIssues++;
        } else if (overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }

      return { name, result };
    });

    await Promise.all(checkPromises);

    // Overall system status
    const overallResult = {
      status: overallStatus,
      timestamp: Date.now(),
      criticalIssues,
      totalChecks: Object.keys(HEALTH_CONFIG.checks).length,
      checks: results
    };

    // Store results
    this.results = results;
    this.history.push(overallResult);

    // Keep only last 100 results
    if (this.history.length > 100) {
      this.history.shift();
    }

    // Generate report
    this.generateReport(overallResult);

    // Handle alerting
    await this.handleAlerting(overallResult);

    return overallResult;
  }

  /**
   * Perform individual health check
   */
  async performHealthCheck(name, config) {
    let attempt = 1;
    let lastError = null;

    while (attempt <= HEALTH_CONFIG.retry.attempts) {
      try {
        console.log(`  🔍 Checking ${name} (attempt ${attempt}/${HEALTH_CONFIG.retry.attempts})`);

        const result = await this.makeHttpRequest(config.url, config.timeout);

        // Validate response
        if (result.statusCode === config.expectedStatus) {
          const status = this.evaluatePerformance(result.responseTime);

          console.log(`  ✅ ${name}: ${status} (${result.responseTime}ms)`);

          return {
            status,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            timestamp: Date.now(),
            attempt,
            message: `Response time: ${result.responseTime}ms`
          };
        } else {
          throw new Error(`Unexpected status code: ${result.statusCode}`);
        }

      } catch (error) {
        lastError = error;
        console.log(`  ❌ ${name}: Failed (attempt ${attempt}) - ${error.message}`);

        if (attempt < HEALTH_CONFIG.retry.attempts) {
          const delay = HEALTH_CONFIG.retry.delay * Math.pow(HEALTH_CONFIG.retry.backoff, attempt - 1);
          await this.sleep(delay);
        }
        attempt++;
      }
    }

    // All attempts failed
    return {
      status: 'unhealthy',
      responseTime: null,
      statusCode: null,
      timestamp: Date.now(),
      attempt: HEALTH_CONFIG.retry.attempts,
      error: lastError.message,
      message: `Failed after ${HEALTH_CONFIG.retry.attempts} attempts: ${lastError.message}`
    };
  }

  /**
   * Make HTTP request with timeout
   */
  makeHttpRequest(url, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'VisionDay-HealthChecker/1.0',
          'Accept': 'text/html,application/json,*/*'
        }
      };

      const req = client.request(options, (res) => {
        const responseTime = Date.now() - startTime;

        // Consume response body (required for cleanup)
        res.on('data', () => {});
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Evaluate performance based on response time
   */
  evaluatePerformance(responseTime) {
    const thresholds = HEALTH_CONFIG.alerting.thresholds;

    if (responseTime > thresholds.response_time_critical) {
      return 'unhealthy';
    } else if (responseTime > thresholds.response_time_warning) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Generate health check report
   */
  generateReport(result) {
    console.log('\n📊 Health Check Report:');
    console.log('=' .repeat(50));

    console.log(`Overall Status: ${this.getStatusEmoji(result.status)} ${result.status.toUpperCase()}`);
    console.log(`Timestamp: ${new Date(result.timestamp).toISOString()}`);
    console.log(`Critical Issues: ${result.criticalIssues}/${result.totalChecks}`);

    console.log('\nDetailed Results:');
    Object.entries(result.checks).forEach(([name, check]) => {
      const emoji = this.getStatusEmoji(check.status);
      const critical = HEALTH_CONFIG.checks[name].critical ? ' [CRITICAL]' : '';
      console.log(`  ${emoji} ${name.padEnd(15)} ${check.status.padEnd(10)} ${check.responseTime || 'N/A'}ms${critical}`);
      if (check.error) {
        console.log(`    └─ ${check.error}`);
      }
    });

    console.log('=' .repeat(50));

    // Save report to file
    this.saveReport(result);
  }

  /**
   * Get status emoji
   */
  getStatusEmoji(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️ ';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  }

  /**
   * Save report to file
   */
  saveReport(result) {
    const reportPath = './health-check-report.json';
    const summaryPath = './health-check-summary.md';

    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    // Generate markdown summary
    const markdown = this.generateMarkdownSummary(result);
    fs.writeFileSync(summaryPath, markdown);

    console.log(`\n📄 Reports saved:`);
    console.log(`  - JSON: ${reportPath}`);
    console.log(`  - Markdown: ${summaryPath}`);
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(result) {
    const date = new Date(result.timestamp).toISOString();

    let markdown = `# Health Check Report\n\n`;
    markdown += `**Generated:** ${date}\n`;
    markdown += `**Overall Status:** ${this.getStatusEmoji(result.status)} **${result.status.toUpperCase()}**\n`;
    markdown += `**Critical Issues:** ${result.criticalIssues}/${result.totalChecks}\n\n`;

    markdown += `## Service Status\n\n`;
    markdown += `| Service | Status | Response Time | Critical |\n`;
    markdown += `|---------|--------|---------------|----------|\n`;

    Object.entries(result.checks).forEach(([name, check]) => {
      const critical = HEALTH_CONFIG.checks[name].critical ? '✅' : '❌';
      const responseTime = check.responseTime ? `${check.responseTime}ms` : 'N/A';
      markdown += `| ${name} | ${this.getStatusEmoji(check.status)} ${check.status} | ${responseTime} | ${critical} |\n`;
    });

    if (result.criticalIssues > 0) {
      markdown += `\n## Issues Detected\n\n`;
      Object.entries(result.checks).forEach(([name, check]) => {
        if (check.status !== 'healthy' && HEALTH_CONFIG.checks[name].critical) {
          markdown += `- **${name}**: ${check.message}\n`;
        }
      });
    }

    markdown += `\n## Historical Trend\n\n`;
    if (this.history.length > 1) {
      const recent = this.history.slice(-5);
      markdown += `| Timestamp | Status | Critical Issues |\n`;
      markdown += `|-----------|--------|----------------|\n`;
      recent.forEach(h => {
        const time = new Date(h.timestamp).toLocaleString();
        markdown += `| ${time} | ${this.getStatusEmoji(h.status)} ${h.status} | ${h.criticalIssues} |\n`;
      });
    } else {
      markdown += `No historical data available yet.\n`;
    }

    return markdown;
  }

  /**
   * Handle alerting based on results
   */
  async handleAlerting(result) {
    if (result.status === 'healthy') {
      // Clear any existing alerts
      this.alertsSent.clear();
      return;
    }

    // Check if we should send alerts
    const alertKey = `${result.status}_${result.criticalIssues}`;
    if (this.alertsSent.has(alertKey)) {
      console.log('⏩ Alert already sent for this issue, skipping...');
      return;
    }

    console.log('\n🚨 Sending alerts for system issues...');

    const alertData = {
      status: result.status,
      criticalIssues: result.criticalIssues,
      timestamp: result.timestamp,
      checks: result.checks,
      environment: process.env.NODE_ENV || 'production',
      hostname: process.env.HOSTNAME || 'unknown'
    };

    // Send to multiple channels
    const alertPromises = [];

    if (HEALTH_CONFIG.alerting.slack) {
      alertPromises.push(this.sendSlackAlert(alertData));
    }

    if (HEALTH_CONFIG.alerting.webhook) {
      alertPromises.push(this.sendWebhookAlert(alertData));
    }

    try {
      await Promise.all(alertPromises);
      this.alertsSent.add(alertKey);
      console.log('✅ Alerts sent successfully');
    } catch (error) {
      console.error('❌ Failed to send alerts:', error);
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alertData) {
    const color = alertData.status === 'unhealthy' ? 'danger' : 'warning';
    const emoji = alertData.status === 'unhealthy' ? '🚨' : '⚠️';

    const payload = {
      text: `${emoji} System Health Alert - ${alertData.status.toUpperCase()}`,
      attachments: [{
        color: color,
        fields: [
          {
            title: 'Status',
            value: alertData.status,
            short: true
          },
          {
            title: 'Critical Issues',
            value: `${alertData.criticalIssues}`,
            short: true
          },
          {
            title: 'Environment',
            value: alertData.environment,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(alertData.timestamp).toISOString(),
            short: true
          }
        ],
        footer: 'VisionDay Health Monitor',
        ts: Math.floor(alertData.timestamp / 1000)
      }]
    };

    return this.makeHttpPostRequest(HEALTH_CONFIG.alerting.slack, payload);
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alertData) {
    return this.makeHttpPostRequest(HEALTH_CONFIG.alerting.webhook, alertData);
  }

  /**
   * Make HTTP POST request
   */
  makeHttpPostRequest(url, data) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const postData = JSON.stringify(data);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'VisionDay-HealthChecker/1.0'
        },
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        res.on('data', () => {}); // Consume response
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.statusCode);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function main() {
  const checker = new HealthChecker();

  try {
    const result = await checker.runHealthChecks();

    // Exit with appropriate code
    if (result.status === 'healthy') {
      console.log('\n✅ All systems healthy!');
      process.exit(0);
    } else if (result.status === 'degraded') {
      console.log('\n⚠️  Some systems degraded but operational');
      process.exit(1);
    } else {
      console.log('\n❌ Critical systems unhealthy!');
      process.exit(2);
    }

  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(3);
  }
}

// Run health checks if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, HEALTH_CONFIG };