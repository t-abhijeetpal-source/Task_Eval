'use strict';

const {
  parseAmount,
  parseArgs,
  formatResult,
  convert,
  run,
  TIMEOUT_MS,
  EXIT,
} = require('../src/convert');

describe('parseAmount', () => {
  test('returns the canonical string (no float coercion)', () => {
    expect(parseAmount('100')).toBe('100');
    expect(parseAmount('  12.50 ')).toBe('12.50');
    expect(parseAmount('+7')).toBe('7');
    expect(parseAmount('.5')).toBe('.5');
  });
  test('preserves precision that Number() would destroy', () => {
    // 0.1 + 0.2 worth of digits must survive verbatim to the Decimal service.
    expect(parseAmount('0.30000000000000004')).toBe('0.30000000000000004');
  });
  test('rejects non-numeric input', () => {
    expect(() => parseAmount('abc')).toThrow(/number/);
    expect(() => parseAmount('1e5')).toThrow(/number/); // scientific notation rejected
    expect(() => parseAmount('NaN')).toThrow(/number/);
    expect(() => parseAmount('Infinity')).toThrow(/number/);
  });
  test('rejects non-positive amounts', () => {
    expect(() => parseAmount('0')).toThrow(/positive/);
    expect(() => parseAmount('0.00')).toThrow(/positive/);
    expect(() => parseAmount('-5')).toThrow(/positive/);
  });
});

describe('parseArgs', () => {
  test('parses valid args, keeps amount as string, uppercases currencies', () => {
    expect(parseArgs(['100', 'usd', 'inr'])).toEqual({ amount: '100', from: 'USD', to: 'INR' });
  });
  test('rejects wrong arg count', () => {
    expect(() => parseArgs(['100', 'USD'])).toThrow(/Usage/);
  });
  test('rejects non-numeric amount', () => {
    expect(() => parseArgs(['abc', 'USD', 'INR'])).toThrow(/number/);
  });
  test('rejects non-positive amount', () => {
    expect(() => parseArgs(['-5', 'USD', 'INR'])).toThrow(/positive/);
  });
});

describe('formatResult', () => {
  test('formats as "<amount> <from> = <converted> <to>"', () => {
    expect(formatResult('100', 'USD', { converted_amount: 8300, to: 'INR' })).toBe(
      '100 USD = 8300 INR'
    );
  });
  test('renders fractional converted amounts verbatim', () => {
    expect(formatResult('100', 'INR', { converted_amount: 1.2, to: 'USD' })).toBe(
      '100 INR = 1.2 USD'
    );
  });
});

describe('convert', () => {
  test('sends amount as a string and applies the request timeout', async () => {
    const client = {
      post: jest.fn().mockResolvedValue({ data: { converted_amount: 8300, from: 'USD', to: 'INR' } }),
    };
    await convert({ amount: '100', from: 'USD', to: 'INR' }, client);
    expect(client.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/convert$/),
      { amount: '100', from: 'USD', to: 'INR' },
      { timeout: TIMEOUT_MS }
    );
  });
});

describe('run', () => {
  // --- Test 1: successful API call --------------------------------------
  test('prints the conversion and exits 0 on success', async () => {
    const client = {
      post: jest.fn().mockResolvedValue({ data: { converted_amount: 8300, from: 'USD', to: 'INR' } }),
    };
    const logs = [];
    const code = await run(['100', 'USD', 'INR'], { client, log: (m) => logs.push(m), error: () => {} });
    expect(code).toBe(EXIT.OK);
    expect(logs[0]).toBe('100 USD = 8300 INR');
    expect(client.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/convert$/),
      { amount: '100', from: 'USD', to: 'INR' },
      { timeout: TIMEOUT_MS }
    );
  });

  // --- Test 2: invalid currency handling (API 400) ----------------------
  test('reports unsupported currency and exits 1', async () => {
    const err = new Error('Request failed with status code 400');
    err.response = { status: 400, data: { error: 'Unsupported currency' } };
    const client = { post: jest.fn().mockRejectedValue(err) };
    const errs = [];
    const code = await run(['100', 'USD', 'GBP'], { client, log: () => {}, error: (m) => errs.push(m) });
    expect(code).toBe(EXIT.SERVER_ERROR);
    expect(errs[0]).toMatch(/Unsupported currency/);
  });

  // --- Test 3: backend unavailable (connection refused) -----------------
  test('reports API unavailable and exits 3 on connection refused', async () => {
    const err = new Error('connect ECONNREFUSED 127.0.0.1:8000');
    err.code = 'ECONNREFUSED';
    err.request = {};
    const client = { post: jest.fn().mockRejectedValue(err) };
    const errs = [];
    const code = await run(['100', 'USD', 'INR'], { client, log: () => {}, error: (m) => errs.push(m) });
    expect(code).toBe(EXIT.API_UNAVAILABLE);
    expect(errs[0]).toMatch(/API unavailable/);
  });

  // --- Test 4: backend hangs -> timeout ---------------------------------
  test('reports a timeout and exits 3 when the request is aborted', async () => {
    const err = new Error('timeout of 5000ms exceeded');
    err.code = 'ECONNABORTED';
    err.request = {};
    const client = { post: jest.fn().mockRejectedValue(err) };
    const errs = [];
    const code = await run(['100', 'USD', 'INR'], { client, log: () => {}, error: (m) => errs.push(m) });
    expect(code).toBe(EXIT.API_UNAVAILABLE);
    expect(errs[0]).toMatch(/timed out/);
  });

  // --- Test 5: invalid CLI arguments ------------------------------------
  test('reports usage and exits 2 on bad arguments', async () => {
    const errs = [];
    const code = await run(['100', 'USD'], { log: () => {}, error: (m) => errs.push(m) });
    expect(code).toBe(EXIT.BAD_ARGS);
    expect(errs[0]).toMatch(/Usage/);
  });

  // --- Test 6: non-positive amount is rejected before any HTTP call -----
  test('rejects a non-positive amount with exit 2 and never calls the API', async () => {
    const client = { post: jest.fn() };
    const errs = [];
    const code = await run(['-5', 'USD', 'INR'], { client, log: () => {}, error: (m) => errs.push(m) });
    expect(code).toBe(EXIT.BAD_ARGS);
    expect(errs[0]).toMatch(/positive/);
    expect(client.post).not.toHaveBeenCalled();
  });
});
