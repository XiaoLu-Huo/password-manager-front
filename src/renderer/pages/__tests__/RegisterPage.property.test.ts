import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { countCharacterTypes, computeStrengthPercent } from '../RegisterPage';

/**
 * Feature: multi-user-platform, Property 9: 密码强度指示器准确性（Password Strength Indicator Accuracy）
 *
 * 验证前端 countCharacterTypes 与后端 User.countCharacterTypes() 逻辑一致：
 * - 大写字母 (A-Z) 算一种
 * - 小写字母 (a-z) 算一种
 * - 数字 (0-9) 算一种
 * - 其他字符算特殊字符一种
 * - 返回值范围 0-4
 */
describe('Property 9: Password Strength Indicator Accuracy', () => {
  it('countCharacterTypes returns 0-4 for any string', () => {
    fc.assert(
      fc.property(fc.string(), (password) => {
        const result = countCharacterTypes(password);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(4);
      }),
      { numRuns: 200 },
    );
  });

  it('countCharacterTypes matches backend logic: upper/lower/digit/special classification', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (password) => {
        // Replicate backend User.countCharacterTypes logic exactly
        let hasUpper = false;
        let hasLower = false;
        let hasDigit = false;
        let hasSpecial = false;

        for (const c of password) {
          if (c >= 'A' && c <= 'Z') hasUpper = true;
          else if (c >= 'a' && c <= 'z') hasLower = true;
          else if (c >= '0' && c <= '9') hasDigit = true;
          else hasSpecial = true;
        }

        let expected = 0;
        if (hasUpper) expected++;
        if (hasLower) expected++;
        if (hasDigit) expected++;
        if (hasSpecial) expected++;

        expect(countCharacterTypes(password)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('strength percent is consistent: length >= 12 contributes 40, each type contributes 15, capped at 100', () => {
    fc.assert(
      fc.property(fc.string(), (password) => {
        const percent = computeStrengthPercent(password);
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);

        // Verify formula
        const types = countCharacterTypes(password);
        const lengthPart = password.length >= 12 ? 40 : (password.length / 12) * 40;
        const expected = Math.min(100, lengthPart + types * 15);
        expect(percent).toBeCloseTo(expected, 10);
      }),
      { numRuns: 200 },
    );
  });

  it('empty password has 0 character types and 0 strength', () => {
    expect(countCharacterTypes('')).toBe(0);
    expect(computeStrengthPercent('')).toBe(0);
  });

  it('password with all 4 types has countCharacterTypes === 4', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 3 }),
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 3 }),
        fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 3 }),
        fc.stringOf(fc.constantFrom(...'!@#$%^&*'.split('')), { minLength: 1, maxLength: 3 }),
        (upper, lower, digit, special) => {
          const password = upper + lower + digit + special;
          expect(countCharacterTypes(password)).toBe(4);
        },
      ),
      { numRuns: 100 },
    );
  });
});
