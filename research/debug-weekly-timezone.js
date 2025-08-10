#!/usr/bin/env node

const { getDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

// UTC: Wednesday Jan 15 at 2 AM
// NY: Tuesday Jan 14 at 9 PM
const from = new Date('2025-01-15T02:00:00Z');
console.log('From (UTC):', from.toISOString());
console.log('From (UTC) day:', getDay(from), '(0=Sun, 2=Tue, 3=Wed)');
console.log('UTC date check:', from.getUTCDay(), 'should be 3 for Wednesday');

const nyZoned = toZonedTime(from, 'America/New_York');
console.log('\nNY zoned:', nyZoned.toISOString());
console.log('NY zoned day:', getDay(nyZoned), '(0=Sun, 2=Tue)');

// The issue: We're in NY time Tuesday 9 PM
// Target: Tuesday 10 PM
// Since current time is 9 PM and target is 10 PM, it should be TODAY (Tuesday)
// not next week

console.log('\nExpected: Today (Tuesday) at 10 PM NY');
console.log('That would be Wednesday 3 AM UTC');
console.log('Expected UTC:', '2025-01-15T03:00:00.000Z');
