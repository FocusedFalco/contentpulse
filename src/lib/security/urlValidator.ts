/**
 * Security URL Validation & SSRF Prevention Utilities
 */

const PRIVATE_IP_REGEXES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 127.0.0.0/8 (loopback)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // 10.0.0.0/8 (private)
  /^192\.168\.\d{1,3}\.\d{1,3}$/,               // 192.168.0.0/16 (private)
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 (private)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,              // 169.254.0.0/16 (link-local / AWS metadata)
  /^0\.0\.0\.0$/,                               // 0.0.0.0
  /^::1$/,                                      // IPv6 loopback
  /^fe80:/i,                                    // IPv6 link-local
  /^fc00:/i,                                    // IPv6 unique local
  /^fd00:/i                                     // IPv6 unique local
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
  'internal'
]);

/**
 * Validates a user-provided URL against SSRF and protocol manipulation
 */
export function validatePublicUrl(rawUrl: string): { valid: boolean; error?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(rawUrl);

    // Protocol check: Only HTTP & HTTPS allowed
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.corp')) {
      return { valid: false, error: 'Access to local or private network hostnames is prohibited.' };
    }

    // Check private/loopback/cloud metadata IP ranges
    for (const regex of PRIVATE_IP_REGEXES) {
      if (regex.test(hostname)) {
        return { valid: false, error: 'Access to private, loopback, or cloud-metadata IP addresses is prohibited.' };
      }
    }

    return { valid: true, parsedUrl: parsed };
  } catch (e) {
    return { valid: false, error: 'Malformed or invalid URL format.' };
  }
}

/**
 * Validates that an incoming webhook URL is a genuine Slack endpoint
 */
export function validateSlackWebhookUrl(rawUrl: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Slack Webhook URLs must use HTTPS.' };
    }

    const host = parsed.hostname.toLowerCase();
    if (host !== 'hooks.slack.com') {
      return { valid: false, error: 'Webhook URL domain must be hooks.slack.com.' };
    }

    if (!parsed.pathname.startsWith('/services/') && !parsed.pathname.startsWith('/workflows/')) {
      return { valid: false, error: 'Invalid Slack Webhook path.' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid Slack Webhook URL structure.' };
  }
}
