#!/usr/bin/env node

/**
 * Performance Validation Script
 * Validates Lighthouse results against defined thresholds
 * Integrates with CI/CD pipeline for automated performance gating
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds (Core Web Vitals + Custom)
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  'first-contentful-paint': { max: 1800, unit: 'ms', critical: true },
  'largest-contentful-paint': { max: 2500, unit: 'ms', critical: true },
  'total-blocking-time': { max: 300, unit: 'ms', critical: true },
  'cumulative-layout-shift': { max: 0.1, unit: 'score', critical: true },
  'speed-index': { max: 3000, unit: 'ms', critical: true },
  'interactive': { max: 3800, unit: 'ms', critical: true },

  // Category scores (0-1)
  'performance-score': { min: 0.90, unit: 'score', critical: true },
  'accessibility-score': { min: 0.95, unit: 'score', critical: true },
  'best-practices-score': { min: 0.90, unit: 'score', critical: true },
  'seo-score': { min: 0.90, unit: 'score', critical: false },

  // Resource optimization
  'unused-css-rules': { max: 50, unit: 'kb', critical: false },
  'unused-javascript': { max: 100, unit: 'kb', critical: false },
  'render-blocking-resources': { max: 3, unit: 'count', critical: false },

  // Advanced metrics
  'server-response-time': { max: 600, unit: 'ms', critical: false },
  'dom-size': { max: 1500, unit: 'nodes', critical: false }
};

/**
 * Load Lighthouse results from JSON report
 */
function loadLighthouseResults() {
  const reportsDir = './lighthouse-reports';

  if (!fs.existsSync(reportsDir)) {
    console.error('❌ Lighthouse reports directory not found');
    process.exit(1);
  }

  // Find the latest Lighthouse report
  const reportFiles = fs.readdirSync(reportsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(reportsDir, file),
      mtime: fs.statSync(path.join(reportsDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (reportFiles.length === 0) {
    console.error('❌ No Lighthouse reports found');
    process.exit(1);
  }

  const latestReport = reportFiles[0];
  console.log(`📊 Loading Lighthouse report: ${latestReport.name}`);

  try {
    const reportData = JSON.parse(fs.readFileSync(latestReport.path, 'utf8'));
    return reportData;
  } catch (error) {
    console.error(`❌ Failed to parse Lighthouse report: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract performance metrics from Lighthouse data
 */
function extractMetrics(lighthouseData) {
  const audits = lighthouseData.audits;
  const categories = lighthouseData.categories;

  return {
    // Core Web Vitals
    'first-contentful-paint': audits['first-contentful-paint']?.numericValue || 0,
    'largest-contentful-paint': audits['largest-contentful-paint']?.numericValue || 0,
    'total-blocking-time': audits['total-blocking-time']?.numericValue || 0,
    'cumulative-layout-shift': audits['cumulative-layout-shift']?.numericValue || 0,
    'speed-index': audits['speed-index']?.numericValue || 0,
    'interactive': audits['interactive']?.numericValue || 0,

    // Category scores
    'performance-score': categories.performance?.score || 0,
    'accessibility-score': categories.accessibility?.score || 0,
    'best-practices-score': categories['best-practices']?.score || 0,
    'seo-score': categories.seo?.score || 0,

    // Resource optimization
    'unused-css-rules': audits['unused-css-rules']?.details?.overallSavingsBytes || 0,
    'unused-javascript': audits['unused-javascript']?.details?.overallSavingsBytes || 0,
    'render-blocking-resources': audits['render-blocking-resources']?.details?.items?.length || 0,

    // Advanced metrics
    'server-response-time': audits['server-response-time']?.numericValue || 0,
    'dom-size': audits['dom-size']?.numericValue || 0
  };
}

/**
 * Validate metrics against thresholds
 */
function validateMetrics(metrics) {
  console.log('\n🔍 Performance Validation Results:');
  console.log('=' .repeat(50));

  let totalIssues = 0;
  let criticalIssues = 0;

  Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
    const value = metrics[metric];
    let status = '✅';
    let message = '';
    let isIssue = false;

    if (value === undefined) {
      status = '⚠️ ';
      message = 'Not measured';
      if (threshold.critical) criticalIssues++;
      totalIssues++;
      isIssue = true;
    } else {
      // Check thresholds
      if (threshold.max && value > threshold.max) {
        status = threshold.critical ? '❌' : '⚠️ ';
        message = `Exceeds max ${threshold.max}${threshold.unit}`;
        if (threshold.critical) criticalIssues++;
        totalIssues++;
        isIssue = true;
      } else if (threshold.min && value < threshold.min) {
        status = threshold.critical ? '❌' : '⚠️ ';
        message = `Below min ${threshold.min}${threshold.unit}`;
        if (threshold.critical) criticalIssues++;
        totalIssues++;
        isIssue = true;
      } else {
        message = 'Within threshold';
      }
    }

    // Format value for display
    let displayValue = value;
    if (threshold.unit === 'score' && typeof value === 'number') {
      displayValue = `${(value * 100).toFixed(1)}%`;
    } else if (threshold.unit === 'kb') {
      displayValue = `${(value / 1024).toFixed(1)}kb`;
    } else if (threshold.unit === 'ms') {
      displayValue = `${Math.round(value)}ms`;
    }

    console.log(`${status} ${metric.padEnd(30)} ${displayValue.toString().padEnd(12)} ${message}`);
  });

  console.log('=' .repeat(50));
  console.log(`📊 Summary: ${totalIssues} issues (${criticalIssues} critical)`);

  return { totalIssues, criticalIssues };
}

/**
 * Generate performance report
 */
function generateReport(metrics, validation) {
  const report = {
    timestamp: new Date().toISOString(),
    metrics: metrics,
    validation: validation,
    coreWebVitals: {
      fcp: metrics['first-contentful-paint'],
      lcp: metrics['largest-contentful-paint'],
      tbt: metrics['total-blocking-time'],
      cls: metrics['cumulative-layout-shift']
    },
    scores: {
      performance: Math.round(metrics['performance-score'] * 100),
      accessibility: Math.round(metrics['accessibility-score'] * 100),
      bestPractices: Math.round(metrics['best-practices-score'] * 100),
      seo: Math.round(metrics['seo-score'] * 100)
    }
  };

  // Save detailed report
  fs.writeFileSync('./performance-report.json', JSON.stringify(report, null, 2));

  // Generate markdown summary for GitHub
  const markdownSummary = generateMarkdownSummary(report);
  fs.writeFileSync('./performance-summary.md', markdownSummary);

  console.log('\n📄 Performance report saved to ./performance-report.json');
  console.log('📋 Markdown summary saved to ./performance-summary.md');
}

/**
 * Generate markdown summary for GitHub PR comments
 */
function generateMarkdownSummary(report) {
  return `# 📊 Performance Report

## Core Web Vitals
| Metric | Value | Threshold | Status |
|--------|--------|-----------|---------|
| First Contentful Paint | ${Math.round(report.coreWebVitals.fcp)}ms | ≤1800ms | ${report.coreWebVitals.fcp <= 1800 ? '✅' : '❌'} |
| Largest Contentful Paint | ${Math.round(report.coreWebVitals.lcp)}ms | ≤2500ms | ${report.coreWebVitals.lcp <= 2500 ? '✅' : '❌'} |
| Total Blocking Time | ${Math.round(report.coreWebVitals.tbt)}ms | ≤300ms | ${report.coreWebVitals.tbt <= 300 ? '✅' : '❌'} |
| Cumulative Layout Shift | ${report.coreWebVitals.cls.toFixed(3)} | ≤0.1 | ${report.coreWebVitals.cls <= 0.1 ? '✅' : '❌'} |

## Lighthouse Scores
- 🚀 **Performance**: ${report.scores.performance}% ${report.scores.performance >= 90 ? '✅' : '❌'}
- ♿ **Accessibility**: ${report.scores.accessibility}% ${report.scores.accessibility >= 95 ? '✅' : '❌'}
- 🔧 **Best Practices**: ${report.scores.bestPractices}% ${report.scores.bestPractices >= 90 ? '✅' : '❌'}
- 🔍 **SEO**: ${report.scores.seo}% ${report.scores.seo >= 90 ? '✅' : '❌'}

## Summary
- **Issues**: ${report.validation.totalIssues} (${report.validation.criticalIssues} critical)
- **Build Quality**: ${report.validation.criticalIssues === 0 ? '🎉 Production Ready' : '⚠️  Needs Optimization'}

*Report generated: ${report.timestamp}*`;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Performance Validation...\n');

  try {
    // Load Lighthouse results
    const lighthouseData = loadLighthouseResults();

    // Extract metrics
    const metrics = extractMetrics(lighthouseData);

    // Validate against thresholds
    const validation = validateMetrics(metrics);

    // Generate reports
    generateReport(metrics, validation);

    // Set exit code based on critical issues
    if (validation.criticalIssues > 0) {
      console.log('\n❌ Performance validation failed due to critical issues');
      process.exit(1);
    } else if (validation.totalIssues > 0) {
      console.log('\n⚠️  Performance validation passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Performance validation passed - all metrics within thresholds');
      process.exit(0);
    }

  } catch (error) {
    console.error(`❌ Performance validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateMetrics, extractMetrics, PERFORMANCE_THRESHOLDS };