import type { RecurrenceParams, RecurrencePattern } from '../../types/recurrence';

// SDK 1.17.2 export issue workaround
const path = require('path');
const sdkPath = path.resolve(__dirname, '../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types');
const { ErrorCode } = require(sdkPath);

import { debug } from '../../utils/debug';
import { DailyRecurrence } from './DailyRecurrence';
import { MonthlyRecurrence } from './MonthlyRecurrence';
import { RecurrenceValidator } from './RecurrenceValidator';
import { WeeklyRecurrence } from './WeeklyRecurrence';
import { YearlyRecurrence } from './YearlyRecurrence';

export class RecurrenceFactory {
  private validator: RecurrenceValidator;
  private patterns: Map<string, RecurrencePattern>;

  constructor() {
    this.validator = new RecurrenceValidator();
    this.patterns = new Map<string, RecurrencePattern>();
    this.patterns.set('daily', new DailyRecurrence());
    this.patterns.set('weekly', new WeeklyRecurrence());
    this.patterns.set('monthly', new MonthlyRecurrence());
    this.patterns.set('yearly', new YearlyRecurrence());
  }

  /**
   * Creates and returns the appropriate recurrence pattern instance
   */
  create(params: RecurrenceParams): RecurrencePattern {
    // Validate parameters first
    this.validator.validate(params);

    // Get the appropriate pattern
    const pattern = this.patterns.get(params.pattern);
    if (!pattern) {
      // This should never happen if validation works correctly
      debug.error('Unknown pattern (should never happen): %s', params.pattern);
      const err: any = new Error(`Unknown pattern: ${params.pattern}`);
      err.code = ErrorCode.InvalidParams;
      err.data = { pattern: params.pattern };
      throw err;
    }

    return pattern;
  }

  /**
   * Validates parameters and calculates the next occurrence in one step
   */
  calculate(from: Date, params: RecurrenceParams): Date {
    const pattern = this.create(params);
    return pattern.calculate(from, params);
  }
}
