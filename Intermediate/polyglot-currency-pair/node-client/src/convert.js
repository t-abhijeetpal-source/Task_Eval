'use strict';

/**
 * Node.js CLI client for the FastAPI currency conversion service.
 *
 * Usage:  node src/convert.js <amount> <from> <to>
 * Example: node src/convert.js 100 USD INR   ->  100 USD = 8300 INR
 *
 * The logic is split into small pure-ish functions so it can be unit-tested
 * with a mocked HTTP client (see tests/convert.test.js).
 *
 * Contract: see ../../CONTRACT.md (single locked source of truth).
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8000';

// Per-request HTTP timeout (ms). A converted-currency lookup is sub-millisecond
// server-side, so a small bound keeps a hung/black-holed server from blocking
// the CLI indefinitely. Override with API_TIMEOUT_MS.
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 5000;

// Exit codes — distinct per failure class so callers/tests can assert them.
const EXIT = { OK: 0, SERVER_ERROR: 1, BAD_ARGS: 2, API_UNAVAILABLE: 3 };

// Plain decimal notation only (money), optional sign. We deliberately do NOT
// accept scientific notation: it is ambiguous for currency and the service
// caps precision at 6 decimal places anyway.
const DECIMAL_RE = /^[+-]?(\d+(\.\d+)?|\.\d+)$/;
const ZERO_RE = /^[+-]?0*(\.0*)?$/;

/**
 * Validate the amount string WITHOUT going through a binary float.
 *
 * Returns the canonical amount as a *string* so the service can parse it as an
 * exact Decimal — `Number(amountStr)` would silently lose precision (e.g.
 * `0.1 + 0.2`) and re-introduce the float error the service layer avoids.
 * @returns {string} canonical amount (leading '+' stripped)
 * @throws {Error} on non-numeric or non-positive input.
 */
function parseAmount(raw) {
  const s = String(raw).trim();
  if (!DECIMAL_RE.test(s)) {
    throw new Error(`Amount must be a number, got "${raw}"`);
  }
  // Negative or all-zero (e.g. "0", "0.0", "-3") is rejected here — no float.
  if (s.startsWith('-') || ZERO_RE.test(s)) {
    throw new Error('Amount must be positive');
  }
  return s.replace(/^\+/, '');
}

/**
 * Parse and validate CLI arguments (the args after `node convert.js`).
 * @throws Error with a user-facing message on invalid input.
 */
function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length !== 3) {
    throw new Error('Usage: node convert.js <amount> <from> <to>  (e.g. 100 USD INR)');
  }
  const [amountStr, from, to] = argv;
  const amount = parseAmount(amountStr);
  return { amount, from: String(from).toUpperCase(), to: String(to).toUpperCase() };
}

/**
 * Call the conversion API. `client` is injectable for testing.
 * `amount` is sent as a string to preserve exact decimal precision end-to-end.
 * @returns {Promise<object>} the response body.
 */
async function convert({ amount, from, to }, client = axios) {
  const res = await client.post(
    `${API_URL}/convert`,
    { amount, from, to },
    { timeout: TIMEOUT_MS }
  );
  return res.data;
}

/** Format a successful conversion for display. */
function formatResult(amount, from, data) {
  return `${amount} ${from} = ${data.converted_amount} ${data.to}`;
}

/**
 * Orchestrate one CLI invocation. Dependencies (http client, loggers) are
 * injectable so tests can run without a real server or real stdout.
 * @returns {Promise<number>} process exit code.
 */
async function run(argv, deps = {}) {
  const client = deps.client || axios;
  const log = deps.log || console.log;
  const errOut = deps.error || console.error;

  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    errOut(`Error: ${e.message}`);
    return EXIT.BAD_ARGS;
  }

  try {
    const data = await convert(args, client);
    log(formatResult(args.amount, args.from, data));
    return EXIT.OK;
  } catch (e) {
    if (e.response) {
      // Server responded with a non-2xx status (e.g. 400 unsupported currency).
      const msg =
        e.response.data && e.response.data.error
          ? e.response.data.error
          : `Server returned status ${e.response.status}`;
      errOut(`Error: ${msg}`);
      return EXIT.SERVER_ERROR;
    }
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      // Request sent but the server did not answer within TIMEOUT_MS.
      errOut(`Error: request to ${API_URL} timed out after ${TIMEOUT_MS}ms.`);
      return EXIT.API_UNAVAILABLE;
    }
    if (e.request || e.code === 'ECONNREFUSED') {
      // Request was made but no response — backend unavailable.
      errOut(`Error: API unavailable at ${API_URL}. Is the FastAPI service running?`);
      return EXIT.API_UNAVAILABLE;
    }
    errOut(`Error: ${e.message}`);
    return EXIT.SERVER_ERROR;
  }
}

// CLI entry point (only when run directly, not when imported by tests).
if (require.main === module) {
  run(process.argv.slice(2)).then((code) => process.exit(code));
}

module.exports = { parseAmount, parseArgs, convert, formatResult, run, API_URL, TIMEOUT_MS, EXIT };
