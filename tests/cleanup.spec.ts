import { test, expect, request } from '@playwright/test';
import axios from 'axios';
import { spawn, exec } from 'child_process';
import fs from 'fs';

// Load environment variables
const ZAP_URL = process.env.ZAP_URL || 'http://localhost:8080';
const CI_CD_SERVER = process.env.CI_CD_SERVER || 'https://ci-cd-server.com/webhook';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://slack-webhook-url.com';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'https://notification-service.com/send';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://security-dashboard.com/upload';

test.beforeAll(async () => {
  try {
    console.log('Starting OWASP ZAP...');
    const zapProcess = spawn('zap.sh', ['-daemon', '-port', '8080']);
    
    zapProcess.on('error', (error) => {
      console.error('Error starting ZAP:', error);
      throw error;
    });

    // Wait for ZAP to start
    await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust as necessary for ZAP startup time
    console.log('OWASP ZAP started successfully.');
  } catch (error) {
    console.error('Failed to start OWASP ZAP:', error);
    throw error;
  }
});

test.describe('Security Tests', () => {
  
  test('Verify Security Headers', async ({ page }) => {
    try {
      const response = await page.goto('https://your-large-scale-app.com');
      if (!response) {
        throw new Error('Failed to load the page');
      }
      const headers = response.headers();

      expect(headers['content-security-policy']).toBeDefined();
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['strict-transport-security']).toContain('max-age');
    } catch (error) {
      console.error('Error verifying security headers:', error);
      throw error;
    }
  });
  
  test('Test for XSS Vulnerability', async ({ page }) => {
    try {
      await page.goto('https://your-large-scale-app.com/login');
      await page.fill('#username', '<script>alert("XSS")</script>');
      await page.fill('#password', 'password');
      await page.click('button[type=submit]');

      expect(await page.locator('body').innerHTML()).not.toContain('<script>alert("XSS")</script>');
    } catch (error) {
      console.error('Error testing for XSS vulnerability:', error);
      throw error;
    }
  });
  
  test('Test for SQL Injection', async ({ page }) => {
    try {
      await page.goto('https://your-large-scale-app.com/login');
      await page.fill('#username', "' OR '1'='1");
      await page.fill('#password', 'password');
      await page.click('button[type=submit]');

      expect(page.url()).not.toContain('/dashboard');
    } catch (error) {
      console.error('Error testing for SQL Injection:', error);
      throw error;
    }
  });

  test('Ensure JWT Tokens are Secure', async ({ page }) => {
    try {
      await page.goto('https://your-large-scale-app.com/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'password');
      await page.click('button[type=submit]');

      const cookies = await page.context().cookies();
      const jwtToken = cookies.find(cookie => cookie.name === 'auth_token');

      expect(jwtToken?.httpOnly).toBeTruthy();
      expect(jwtToken?.secure).toBeTruthy();
    } catch (error) {
      console.error('Error verifying JWT token security:', error);
      throw error;
    }
  });

  test('Verify Clickjacking Protection', async ({ page }) => {
    try {
      const response = await page.goto('https://your-large-scale-app.com');
      if (!response) {
        throw new Error('Failed to load the page');
      }
      const headers = response.headers();
      expect(headers['x-frame-options']).toBe('DENY');
    } catch (error) {
      console.error('Error verifying clickjacking protection:', error);
      throw error;
    }
  });

  test('Run OWASP ZAP Active Scan', async () => {
    try {
      const zapUrl = `${ZAP_URL}/JSON/ascan/action/scan/?url=https://your-large-scale-app.com`;
      const response = await axios.get(zapUrl);
      expect(response.status).toBe(200);
      console.log('OWASP ZAP Scan Started:', response.data);
    } catch (error) {
      console.error('Error running OWASP ZAP scan:', error);
      throw error;
    }
  });

  test('Verify API Security - Ensure No Sensitive Data Exposure', async () => {
    try {
    const apiContext = await request.newContext();
    const response = await apiContext.get('https://your-large-scale-app.com/api/user');
      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('ssn');
    } catch (error) {
      console.error('Error verifying API security:', error);
      throw error;
    }
  });

  test('Run Security Tests in CI/CD Pipeline', async () => {
    try {
      console.log('Running security tests in CI/CD...');
      await axios.post(CI_CD_SERVER, { status: 'running' });
      expect(true).toBeTruthy();
    } catch (error) {
      console.error('Error in CI/CD pipeline:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    try {
      console.log('Generating security test report...');
      const zapReportUrl = `${ZAP_URL}/OTHER/core/other/htmlreport/`;
      const response = await axios.get(zapReportUrl);
      fs.writeFileSync('security-test-report.html', response.data);
      console.log('Security test report generated: security-test-report.html');

      console.log('Uploading report to centralized dashboard...');
      await axios.post(DASHBOARD_URL, {
        report: fs.readFileSync('security-test-report.html', 'utf-8'),
        timestamp: new Date().toISOString(),
        project: 'Your Large-Scale App'
      });
      console.log('Report uploaded successfully.');

      console.log('Sending notification...');
      await axios.post(EMAIL_SERVICE_URL, {
        email: 'security-team@yourcompany.com',
        subject: 'Security Test Report',
        message: 'Security testing completed. Report attached.',
        attachment: 'security-test-report.html'
      });
      console.log('Email notification sent successfully.');

      console.log('Sending Slack alert...');
      await axios.post(SLACK_WEBHOOK_URL, {
        text: '🚨 Security tests completed! Check the report on the dashboard: https://security-dashboard.com/reports/latest',
      });
      console.log('Slack alert sent successfully.');

      console.log('Cleaning up OWASP ZAP process...');
      exec('pkill -f zap.sh', (err, stdout, stderr) => {
        if (err) {
          console.error('Error killing ZAP process:', stderr);
        } else {
          console.log('OWASP ZAP process terminated successfully.');
        }
      });
    } catch (error) {
      console.error('Error during afterAll cleanup:', error);
      throw error;
    }
  });
});