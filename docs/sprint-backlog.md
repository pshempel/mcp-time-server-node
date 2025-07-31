# Sprint Backlog

## Current Sprint - Code Quality & Refactoring
*Focus: Clean up the 22 complexity/length linting errors*

### Completed ✅
- Fixed 51 import order issues
- Fixed NodeCache import warning
- Fixed object injection false positive

### In Progress 🔄
See `docs/refactoring-plan.md` for the 12 refactoring tasks ordered by complexity

---

## Next Sprint - Test Quality & Security Hardening

### High Priority 🔴

#### Test Quality Issues
- [ ] Fix 302 fake tests found in audit
- [ ] Fix 60 suspicious tests with incomplete assertions
- [ ] Fix MCP JSON-RPC test communication issues

#### Rate Limiting Hardening
- [ ] Fix critical rate limiting bypass vulnerability
- [ ] Update tests to reflect per-process rate limiting reality
- [ ] Update Python stress tests to match per-process reality
- [ ] Add rate limit headers to responses

#### Security & Stability
- [ ] Implement memory exhaustion protection
- [ ] Phase 6: Create security integration tests
- [ ] Add cache overflow/poisoning stress tests
- [ ] Add concurrent request stress tests
- [ ] Add resource exhaustion tests (CPU/memory limits)
- [ ] Add sustained memory leak tests (5+ minute runs)

### Medium Priority 🟡

#### Dependency Updates
- [ ] Update @typescript-eslint to v8 to support TypeScript 5.8 officially
  - Current: v6.21.0 with TS 5.8.3 shows compatibility warning
  - Target: v8.38.0 supports TS >=4.8.4 <5.9.0
  - Keep ESLint at v8 to avoid breaking changes

#### Documentation
- [ ] Document rate limiting limitations
- [ ] Document rate limiting configuration
- [ ] Phase 7: Complete security documentation

#### New Tools for Daily Use
- [ ] `find_meeting_time` - Given multiple timezones, find overlapping business hours
- [ ] `calculate_deadline` - Add N business days from start date
- [ ] `working_hours_overlap` - When do two timezones have overlapping work hours
- [ ] ~~`days_until`~~ - Already implemented! ✅

#### Testing Enhancements
- [ ] Implement comprehensive time edge case testing strategy
- [ ] Add cross-verification with date-holidays package

### Low Priority 🟢
- [ ] Consider dynamic holiday data sources (API integration)
- [ ] Implement distributed rate limiting if needed
- [ ] Phase 5: Add execution timeouts

---

## Future Considerations

### From TODO.md
- [ ] UK consecutive weekend holiday fix
- [ ] Lazy loading of timezone data
- [ ] Better timezone data caching
- [ ] Holiday data caching improvements
- [ ] Optimize cache TTLs per operation
- [ ] Configurable business hours
- [ ] Weekend customization
- [ ] Half-day support
- [ ] Lunch break handling
- [ ] State/Province holidays
- [ ] City-specific holidays

---

## Notes
- Current focus: Complete refactoring sprint first (est. 9 hours)
- Test quality sprint is critical - 362 problematic tests need fixing
- Security hardening should follow test fixes
- New tools can be added after core stability is ensured
