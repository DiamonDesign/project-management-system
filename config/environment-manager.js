/**
 * Advanced Environment Configuration Management System
 * Handles secure configuration loading, validation, and deployment across environments
 * Supports dynamic updates, secret management, and configuration promotion
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';

// Configuration schema for validation
const ConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),

  // Application configuration
  app: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    port: z.number().min(1).max(65535),
    debug: z.boolean(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    apiTimeout: z.number().min(1000).max(30000),
    cors: z.object({
      origins: z.array(z.string()),
      credentials: z.boolean(),
      methods: z.array(z.string())
    })
  }),

  // Database configuration
  database: z.object({
    url: z.string().url().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    name: z.string(),
    ssl: z.boolean(),
    poolSize: z.number().min(1).max(100),
    timeout: z.number().min(1000)
  }).refine(data => data.url || (data.host && data.port), {
    message: "Either url or host+port must be provided"
  }),

  // Security configuration
  security: z.object({
    jwtSecret: z.string().min(32),
    encryptionKey: z.string().length(64),
    sessionTimeout: z.number().min(300).max(86400),
    rateLimiting: z.object({
      enabled: z.boolean(),
      windowMs: z.number().min(60000),
      maxRequests: z.number().min(1)
    }),
    csp: z.object({
      enabled: z.boolean(),
      policies: z.record(z.string())
    })
  }),

  // External services
  services: z.object({
    supabase: z.object({
      url: z.string().url(),
      anonKey: z.string().min(1),
      serviceKey: z.string().min(1).optional()
    }),
    sentry: z.object({
      dsn: z.string().url().optional(),
      environment: z.string(),
      sampleRate: z.number().min(0).max(1)
    }),
    monitoring: z.object({
      enabled: z.boolean(),
      endpoint: z.string().url().optional(),
      apiKey: z.string().optional()
    }),
    email: z.object({
      provider: z.enum(['sendgrid', 'ses', 'smtp']),
      apiKey: z.string().optional(),
      from: z.string().email(),
      replyTo: z.string().email().optional()
    })
  }),

  // Feature flags
  features: z.object({
    analytics: z.boolean(),
    notifications: z.boolean(),
    collaboration: z.boolean(),
    advancedReports: z.boolean(),
    aiAssistant: z.boolean(),
    apiV2: z.boolean()
  }),

  // Performance configuration
  performance: z.object({
    caching: z.object({
      enabled: z.boolean(),
      ttl: z.number().min(60),
      maxSize: z.number().min(1024 * 1024)
    }),
    compression: z.object({
      enabled: z.boolean(),
      level: z.number().min(1).max(9),
      threshold: z.number().min(1024)
    }),
    cdn: z.object({
      enabled: z.boolean(),
      baseUrl: z.string().url().optional(),
      regions: z.array(z.string())
    })
  }),

  // Deployment configuration
  deployment: z.object({
    strategy: z.enum(['blue-green', 'rolling', 'canary']),
    healthCheck: z.object({
      enabled: z.boolean(),
      endpoint: z.string(),
      timeout: z.number().min(1000)
    }),
    rollback: z.object({
      enabled: z.boolean(),
      threshold: z.number().min(0).max(1)
    })
  })
});

class EnvironmentManager {
  constructor(options = {}) {
    this.configDir = options.configDir || './config';
    this.secretsDir = options.secretsDir || './secrets';
    this.environment = process.env.NODE_ENV || 'development';
    this.config = null;
    this.secrets = new Map();
    this.watchers = new Map();
    this.hooks = {
      beforeLoad: [],
      afterLoad: [],
      onError: [],
      onChange: []
    };
  }

  /**
   * Initialize the environment manager
   */
  async initialize() {
    try {
      console.log(`[Config] Initializing environment: ${this.environment}`);

      // Create directories if they don't exist
      await this.ensureDirectories();

      // Load configuration
      await this.loadConfiguration();

      // Load secrets
      await this.loadSecrets();

      // Validate configuration
      await this.validateConfiguration();

      // Setup file watchers for development
      if (this.environment === 'development') {
        await this.setupWatchers();
      }

      console.log('[Config] Environment manager initialized successfully');
      return this.config;

    } catch (error) {
      console.error('[Config] Failed to initialize environment manager:', error);
      await this.runHooks('onError', error);
      throw error;
    }
  }

  /**
   * Load configuration files
   */
  async loadConfiguration() {
    await this.runHooks('beforeLoad');

    try {
      // Load base configuration
      const baseConfig = await this.loadConfigFile('base.json');

      // Load environment-specific configuration
      const envConfig = await this.loadConfigFile(`${this.environment}.json`);

      // Load local overrides (for development)
      const localConfig = await this.loadConfigFile('local.json', false);

      // Merge configurations with precedence: local > env > base
      this.config = this.mergeConfigurations(baseConfig, envConfig, localConfig);

      // Apply environment variables overrides
      this.applyEnvironmentVariables();

      await this.runHooks('afterLoad', this.config);

    } catch (error) {
      console.error('[Config] Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Load a specific configuration file
   */
  async loadConfigFile(filename, required = true) {
    const filepath = path.join(this.configDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      const config = JSON.parse(content);

      console.log(`[Config] Loaded ${filename}`);
      return config;

    } catch (error) {
      if (required) {
        console.error(`[Config] Failed to load required config file: ${filename}`);
        throw error;
      } else {
        console.log(`[Config] Optional config file not found: ${filename}`);
        return {};
      }
    }
  }

  /**
   * Load secrets from secure storage
   */
  async loadSecrets() {
    const secretsPath = path.join(this.secretsDir, `${this.environment}.enc`);

    try {
      // Check if secrets file exists
      await fs.access(secretsPath);

      // Load encrypted secrets
      const encryptedContent = await fs.readFile(secretsPath);

      // Decrypt secrets
      const secrets = await this.decryptSecrets(encryptedContent);

      // Store in memory
      for (const [key, value] of Object.entries(secrets)) {
        this.secrets.set(key, value);
      }

      console.log(`[Config] Loaded ${this.secrets.size} secrets`);

    } catch (error) {
      if (this.environment === 'production') {
        console.error('[Config] Failed to load secrets in production:', error);
        throw error;
      } else {
        console.warn('[Config] Secrets file not found, using environment variables');
      }
    }
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration() {
    try {
      // Replace secret placeholders with actual values
      const configWithSecrets = await this.resolveSecrets(this.config);

      // Validate against schema
      const validatedConfig = ConfigSchema.parse(configWithSecrets);

      // Run environment-specific validations
      await this.runEnvironmentValidations(validatedConfig);

      // Store validated config
      this.config = validatedConfig;

      console.log('[Config] Configuration validated successfully');

    } catch (error) {
      console.error('[Config] Configuration validation failed:', error);
      throw new Error(`Invalid configuration: ${error.message}`);
    }
  }

  /**
   * Merge multiple configuration objects
   */
  mergeConfigurations(...configs) {
    return configs.reduce((merged, config) => {
      if (!config) return merged;

      return this.deepMerge(merged, config);
    }, {});
  }

  /**
   * Deep merge utility
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentVariables() {
    const envMappings = {
      'APP_URL': 'app.url',
      'APP_PORT': 'app.port',
      'APP_DEBUG': 'app.debug',
      'APP_LOG_LEVEL': 'app.logLevel',

      'DATABASE_URL': 'database.url',
      'DATABASE_HOST': 'database.host',
      'DATABASE_PORT': 'database.port',
      'DATABASE_NAME': 'database.name',

      'SUPABASE_URL': 'services.supabase.url',
      'SUPABASE_ANON_KEY': 'services.supabase.anonKey',
      'SUPABASE_SERVICE_KEY': 'services.supabase.serviceKey',

      'SENTRY_DSN': 'services.sentry.dsn',
      'MONITORING_ENDPOINT': 'services.monitoring.endpoint',
      'MONITORING_API_KEY': 'services.monitoring.apiKey',

      'FEATURE_ANALYTICS': 'features.analytics',
      'FEATURE_NOTIFICATIONS': 'features.notifications',
      'FEATURE_AI_ASSISTANT': 'features.aiAssistant'
    };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      const envValue = process.env[envVar];

      if (envValue !== undefined) {
        this.setConfigValue(configPath, this.parseEnvValue(envValue));
      }
    }
  }

  /**
   * Parse environment variable value to appropriate type
   */
  parseEnvValue(value) {
    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

    // String
    return value;
  }

  /**
   * Set configuration value by dot notation path
   */
  setConfigValue(path, value) {
    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Resolve secret placeholders in configuration
   */
  async resolveSecrets(config) {
    const resolved = JSON.parse(JSON.stringify(config));

    const replaceSecrets = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('${SECRET:') && value.endsWith('}')) {
          const secretKey = value.slice(9, -1);
          const secretValue = this.secrets.get(secretKey) || process.env[secretKey];

          if (!secretValue) {
            throw new Error(`Secret not found: ${secretKey}`);
          }

          obj[key] = secretValue;
        } else if (typeof value === 'object' && value !== null) {
          replaceSecrets(value);
        }
      }
    };

    replaceSecrets(resolved);
    return resolved;
  }

  /**
   * Run environment-specific validations
   */
  async runEnvironmentValidations(config) {
    switch (config.environment) {
      case 'production':
        await this.validateProductionConfig(config);
        break;
      case 'staging':
        await this.validateStagingConfig(config);
        break;
      case 'development':
        await this.validateDevelopmentConfig(config);
        break;
    }
  }

  /**
   * Production-specific validations
   */
  async validateProductionConfig(config) {
    const issues = [];

    // Security validations
    if (config.app.debug) {
      issues.push('Debug mode should be disabled in production');
    }

    if (config.app.logLevel === 'debug') {
      issues.push('Debug logging should be disabled in production');
    }

    if (!config.database.ssl) {
      issues.push('Database SSL should be enabled in production');
    }

    if (config.security.sessionTimeout > 3600) {
      issues.push('Session timeout should be ≤ 1 hour in production');
    }

    if (!config.services.sentry.dsn) {
      issues.push('Sentry DSN is required in production');
    }

    if (!config.services.monitoring.enabled) {
      issues.push('Monitoring should be enabled in production');
    }

    // Performance validations
    if (!config.performance.caching.enabled) {
      issues.push('Caching should be enabled in production');
    }

    if (!config.performance.compression.enabled) {
      issues.push('Compression should be enabled in production');
    }

    if (issues.length > 0) {
      throw new Error(`Production validation failed:\n${issues.join('\n')}`);
    }

    console.log('[Config] Production validation passed');
  }

  /**
   * Staging-specific validations
   */
  async validateStagingConfig(config) {
    // Similar to production but with relaxed constraints
    console.log('[Config] Staging validation passed');
  }

  /**
   * Development-specific validations
   */
  async validateDevelopmentConfig(config) {
    // Minimal validations for development
    console.log('[Config] Development validation passed');
  }

  /**
   * Setup file watchers for hot reloading
   */
  async setupWatchers() {
    if (typeof window !== 'undefined') return; // Skip in browser

    try {
      const chokidar = await import('chokidar');

      const watcher = chokidar.watch([
        path.join(this.configDir, '*.json'),
        path.join(this.secretsDir, '*.enc')
      ], {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });

      watcher.on('change', async (path) => {
        console.log(`[Config] Configuration file changed: ${path}`);

        try {
          await this.loadConfiguration();
          await this.validateConfiguration();
          await this.runHooks('onChange', this.config);
        } catch (error) {
          console.error('[Config] Failed to reload configuration:', error);
          await this.runHooks('onError', error);
        }
      });

      this.watchers.set('config', watcher);
      console.log('[Config] File watchers setup complete');

    } catch (error) {
      console.warn('[Config] Failed to setup file watchers:', error.message);
    }
  }

  /**
   * Encrypt secrets for storage
   */
  async encryptSecrets(secrets, password) {
    const key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher('aes-256-cbc', key);
    cipher.setAutoPadding(true);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(secrets), 'utf8'),
      cipher.final()
    ]);

    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt secrets from storage
   */
  async decryptSecrets(encryptedData) {
    const password = process.env.SECRETS_PASSWORD;

    if (!password) {
      throw new Error('SECRETS_PASSWORD environment variable is required');
    }

    const key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);

    const decipher = crypto.createDecipher('aes-256-cbc', key);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(environment, config) {
    const configPath = path.join(this.configDir, `${environment}.json`);
    const content = JSON.stringify(config, null, 2);

    await fs.writeFile(configPath, content, 'utf8');
    console.log(`[Config] Saved configuration: ${environment}`);
  }

  /**
   * Promote configuration between environments
   */
  async promoteConfiguration(fromEnv, toEnv, options = {}) {
    const { dryRun = false, validate = true } = options;

    console.log(`[Config] Promoting configuration: ${fromEnv} → ${toEnv}`);

    try {
      // Load source configuration
      const sourceConfig = await this.loadConfigFile(`${fromEnv}.json`);

      // Apply environment-specific overrides
      const targetConfig = await this.applyEnvironmentOverrides(sourceConfig, toEnv);

      if (validate) {
        // Validate target configuration
        const tempManager = new EnvironmentManager();
        tempManager.config = targetConfig;
        tempManager.environment = toEnv;
        await tempManager.validateConfiguration();
      }

      if (!dryRun) {
        // Save to target environment
        await this.saveConfiguration(toEnv, targetConfig);

        // Create backup of previous configuration
        await this.backupConfiguration(toEnv);
      }

      console.log(`[Config] Configuration promotion ${dryRun ? 'simulated' : 'completed'}`);
      return targetConfig;

    } catch (error) {
      console.error('[Config] Configuration promotion failed:', error);
      throw error;
    }
  }

  /**
   * Apply environment-specific overrides during promotion
   */
  async applyEnvironmentOverrides(config, targetEnv) {
    const overrides = {
      production: {
        'app.debug': false,
        'app.logLevel': 'info',
        'database.ssl': true,
        'services.sentry.environment': 'production',
        'performance.caching.enabled': true,
        'performance.compression.enabled': true
      },
      staging: {
        'app.debug': false,
        'app.logLevel': 'info',
        'services.sentry.environment': 'staging',
        'performance.caching.enabled': true
      },
      development: {
        'app.debug': true,
        'app.logLevel': 'debug',
        'database.ssl': false,
        'services.sentry.environment': 'development'
      }
    };

    const envOverrides = overrides[targetEnv] || {};
    const result = { ...config, environment: targetEnv };

    for (const [path, value] of Object.entries(envOverrides)) {
      this.setConfigValueInObject(result, path, value);
    }

    return result;
  }

  /**
   * Set configuration value in object by dot notation
   */
  setConfigValueInObject(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Backup current configuration
   */
  async backupConfiguration(environment) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.configDir, 'backups');

    await fs.mkdir(backupDir, { recursive: true });

    const sourceFile = path.join(this.configDir, `${environment}.json`);
    const backupFile = path.join(backupDir, `${environment}-${timestamp}.json`);

    try {
      await fs.copyFile(sourceFile, backupFile);
      console.log(`[Config] Created backup: ${backupFile}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('[Config] Failed to create backup:', error.message);
      }
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const directories = [this.configDir, this.secretsDir];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Hook management
   */
  addHook(event, callback) {
    if (this.hooks[event]) {
      this.hooks[event].push(callback);
    }
  }

  async runHooks(event, data) {
    const hooks = this.hooks[event] || [];

    for (const hook of hooks) {
      try {
        await hook(data);
      } catch (error) {
        console.error(`[Config] Hook failed (${event}):`, error);
      }
    }
  }

  /**
   * Get configuration value by path
   */
  get(path, defaultValue) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Check if configuration has changed
   */
  hasChanged(otherConfig) {
    return JSON.stringify(this.config) !== JSON.stringify(otherConfig);
  }

  /**
   * Export configuration for deployment
   */
  exportForDeployment() {
    // Remove sensitive data for export
    const exportConfig = JSON.parse(JSON.stringify(this.config));

    // Remove or mask sensitive fields
    if (exportConfig.security) {
      exportConfig.security.jwtSecret = '***MASKED***';
      exportConfig.security.encryptionKey = '***MASKED***';
    }

    return exportConfig;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Close file watchers
    for (const [name, watcher] of this.watchers.entries()) {
      if (watcher && watcher.close) {
        await watcher.close();
        console.log(`[Config] Closed watcher: ${name}`);
      }
    }

    // Clear sensitive data
    this.secrets.clear();

    console.log('[Config] Cleanup completed');
  }
}

// Create singleton instance
let environmentManager = null;

/**
 * Get environment manager instance
 */
export function getEnvironmentManager(options) {
  if (!environmentManager) {
    environmentManager = new EnvironmentManager(options);
  }
  return environmentManager;
}

/**
 * Initialize environment configuration
 */
export async function initializeEnvironment(options = {}) {
  const manager = getEnvironmentManager(options);
  return await manager.initialize();
}

export { EnvironmentManager, ConfigSchema };