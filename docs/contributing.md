# Contributing Guide

> **Help improve this Islamic prayer times library**

## Overview

We welcome contributions to @masaajid/prayer-times! Whether you're adding new Islamic calculation methods, improving accuracy, fixing bugs, or enhancing documentation, your contributions help the global Muslim community.

## Table of Contents

- [Getting Started](#getting-started)
- [Contributing New Methods](#contributing-new-methods)
- [Code Contributions](#code-contributions)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Development Setup

```bash
# Clone the repository
git clone https://github.com/masaajid-hub/prayer-times.git
cd prayer-times

# Install dependencies (requires Bun)
bun install

# Run tests
bun test

# Type checking
bun run typecheck

# Development mode
bun run dev
```

### Project Structure

```
src/
├── api/               # Public API layer
├── extensions/        # Optional features (Sunnah times)
├── lib/
│   ├── engine/       # Astronomical calculations
│   ├── methods/      # Islamic calculation methods
│   └── utils/        # Utilities and helpers
└── types/            # TypeScript definitions

__tests__/            # Test suite
scripts/              # Data generation and validation tools
test-data/            # Official Islamic authority data
docs/                 # Documentation
```

## Contributing New Methods

### Requirements for New Islamic Calculation Methods

1. **Official Authority**: Method must be from a recognized Islamic authority
2. **Official Parameters**: Documented calculation parameters (angles, intervals)
3. **Validation Data**: 30+ days of official prayer times for testing
4. **Geographic Justification**: Clear reason why this method is needed
5. **Source Documentation**: Links to official sources

### Step-by-Step Process

#### 1. Research Phase

**Gather Required Information**:

- Official calculation parameters (Fajr angle, Isha angle/interval, etc.)
- Official prayer time data for validation (minimum 30 days)
- Authority website and documentation links
- Geographic region and usage justification

**Example Documentation**:

```
Method: Bangladesh Islamic Foundation
Authority: Islamic Foundation Bangladesh
Region: Bangladesh
Official Site: https://islamicfoundation.gov.bd
Parameters:
  - Fajr Angle: 18.5°
  - Isha Angle: 17.5°
  - Madhab: Hanafi (traditional)
Validation: 30 days of official times from Dhaka
```

#### 2. Implementation

**Add Method Definition** in `src/lib/methods/methods.ts`:

```typescript
export const CALCULATION_METHODS: Record<MethodCode, MethodParams> = {
  // ... existing methods
  Bangladesh: {
    name: "Islamic Foundation Bangladesh",
    fajrAngle: 18.5,
    ishaAngle: 17.5,
    madhab: "Hanafi",
    region: "Bangladesh",
    source: "official",
  },
};
```

**Update Type Definitions** in `src/types/index.ts`:

```typescript
export type MethodCode =
  | "MWL"
  | "ISNA"
  // ... existing methods
  | "Bangladesh"; // Add new method
```

#### 3. Test Data Creation

**Create Validation File** `test-data/Bangladesh.json`:

```json
{
  "meta": {
    "method": "Bangladesh",
    "authority": "Islamic Foundation Bangladesh",
    "source": "https://islamicfoundation.gov.bd",
    "location": {
      "name": "Dhaka, Bangladesh",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "timezone": "Asia/Dhaka"
    },
    "validation": "official",
    "testDates": 30,
    "accuracy": "good"
  },
  "testCases": [
    {
      "date": "2024-06-01",
      "expected": {
        "fajr": "04:15",
        "sunrise": "05:25",
        "dhuhr": "12:00",
        "asr": "16:45",
        "maghrib": "18:35",
        "isha": "20:05"
      }
    }
    // ... more test cases
  ]
}
```

#### 4. Generate Tests

**Use Automated Test Generation**:

```bash
# Generate test file for new method
bun run scripts/generate-method-tests.js Bangladesh
```

This creates `__tests__/methods/Bangladesh.test.ts` with validation tests.

#### 5. Geographic Intelligence

**Add Geographic Suggestion** in `src/lib/methods/geographic.ts`:

```typescript
const SPECIFIC_REGIONS: RegionMapping[] = [
  // ... existing regions
  {
    bounds: { north: 26.6, south: 20.7, east: 92.7, west: 88.0 },
    method: "Bangladesh",
    priority: 10,
  },
];
```

### Validation Standards

#### Accuracy Requirements

- **Reference Implementation**: <1 minute average deviation (against adhan-js)
- **Official Authority Data**: <1 minute average deviation (against official sources)
- **All Methods**: Good accuracy across test cases

#### Data Quality Best Practices

- **Sufficient coverage**: Around 30 test cases provide good validation
- **Seasonal variety**: Include both summer and winter dates when possible
- **Edge cases**: Test challenging dates (solstices, equinoxes) when available
- **Source verification**: Use official sources when accessible, reference implementations otherwise

## Code Contributions

### Code Standards

#### TypeScript

- **Strict typing**: No `any` types in public API
- **Complete coverage**: All functions and classes typed
- **Documentation**: TSDoc comments for public APIs

```typescript
/**
 * Calculate prayer times for a specific date and location
 * @param config - Configuration object with method, location, timezone
 * @param date - Target date for calculations
 * @returns Prayer times object with formatted times
 */
export function calculatePrayerTimes(
  config: PrayerTimeConfig,
  date?: DateInput
): PrayerTimes {
  // Implementation
}
```

#### Performance

- **Sub-millisecond**: Single calculations < 1ms
- **Efficient algorithms**: Optimized astronomical calculations
- **Memory conscious**: Avoid unnecessary object creation
- **Tree-shakeable**: Modular exports for minimal bundles

#### Architecture

- **Separation of concerns**: Clear boundaries between API, engine, utilities
- **Pure functions**: No side effects in calculation functions
- **Immutable operations**: Don't modify input parameters
- **Error handling**: Graceful degradation with helpful messages

### Commit Standards

#### Commit Message Format

```
type(scope): description

- feat(methods): add Bangladesh Islamic Foundation method
- fix(calculations): correct Maghrib angle for Dubai method
- docs(api): update PrayerTimeCalculator documentation
- test(methods): add Qatar method validation
- perf(engine): optimize solar position calculations
```

#### Branch Naming

- `feature/method-bangladesh` - New Islamic method
- `fix/dubai-calculation` - Bug fix
- `docs/api-reference` - Documentation update
- `perf/solar-engine` - Performance improvement

## Testing Guidelines

### Test Categories

#### 1. Method Accuracy Tests

Located in `__tests__/methods/`:

- Validate against official Islamic authority data
- Test all supported calculation methods
- Ensure good accuracy against test data

#### 2. Unit Tests

Located in `__tests__/unit/`:

- Test individual functions and components
- Cover edge cases and error conditions
- Verify mathematical accuracy

#### 3. Integration Tests

- Test complete calculation workflows
- Verify API compatibility
- Check bulk operation efficiency

#### 4. Performance Tests

- Benchmark calculation speed
- Memory usage validation
- Bundle size monitoring

### Running Tests

```bash
# All tests
bun test

# Specific method
bun test __tests__/methods/Qatar.test.ts

# Coverage report
bun test --coverage

# Performance benchmarks
bun test __tests__/performance/
```

### Writing New Tests

#### Method Accuracy Test Template

```typescript
import { describe, test, expect } from "bun:test";
import { PrayerTimeCalculator } from "../../src";
import testData from "../../test-data/Bangladesh.json";

describe("Bangladesh Method Tests", () => {
  const calculator = new PrayerTimeCalculator("Bangladesh")
    .location([
      testData.meta.location.latitude,
      testData.meta.location.longitude,
    ])
    .timezone(testData.meta.location.timezone);

  testData.testCases.forEach(({ date, expected }, index) => {
    test(`Bangladesh calculation ${index + 1}: ${date}`, () => {
      const times = calculator.getTimes(date);

      expect(times.fajr).toBeCloseTo(expected.fajr, 2); // within tolerance
      expect(times.dhuhr).toBeCloseTo(expected.dhuhr, 2);
      expect(times.asr).toBeCloseTo(expected.asr, 2);
      expect(times.maghrib).toBeCloseTo(expected.maghrib, 2);
      expect(times.isha).toBeCloseTo(expected.isha, 2);
    });
  });
});
```

## Documentation

### Documentation Standards

#### API Documentation

- **Complete coverage**: Every public function documented
- **TypeScript integration**: TSDoc comments for IntelliSense
- **Practical examples**: Real-world usage patterns
- **Error handling**: Document error conditions

#### Method Documentation

- **Authority information**: Official sources and validation
- **Regional usage**: Geographic applicability
- **Parameter details**: Calculation angles and adjustments
- **Historical context**: When and why method was developed

### Writing Guidelines

#### Tone and Style

- **Professional**: Technical accuracy without marketing language
- **Inclusive**: Welcome developers from all backgrounds
- **Clear**: Explain Islamic concepts for non-Muslim developers
- **Practical**: Focus on implementation over theory

#### Structure

- **Logical flow**: Start simple, build complexity
- **Code examples**: Show don't just tell
- **Cross-references**: Link related concepts
- **Visual aids**: Diagrams for complex concepts when helpful

## Community Guidelines

### Code of Conduct

#### Respectful Interaction

- **Professional communication**: Focus on technical merit
- **Cultural sensitivity**: Respect Islamic values and practices
- **Inclusive environment**: Welcome contributors regardless of background
- **Constructive feedback**: Help improve code and documentation

#### Technical Standards

- **Quality focus**: Prioritize accuracy and reliability
- **Evidence-based**: Support claims with official sources
- **Collaborative approach**: Work together to solve problems
- **Learning mindset**: Help each other improve skills

### Issue Reporting

#### Bug Reports

```markdown
**Bug Description**: Brief summary
**Method Affected**: Which calculation method
**Expected**: What should happen
**Actual**: What actually happens
**Location**: Coordinates and timezone
**Date**: Test date
**Code**: Minimal reproduction example
```

#### Feature Requests

```markdown
**Feature**: New Islamic calculation method
**Authority**: Official Islamic authority
**Region**: Geographic coverage
**Justification**: Why this method is needed
**Sources**: Official documentation links
**Data**: Available validation data
```

### Review Process

#### Pull Request Reviews

- **Technical accuracy**: Verify calculations and implementations
- **Test coverage**: Ensure adequate testing
- **Documentation**: Check for clear explanations
- **Performance**: Verify efficiency requirements
- **Islamic compliance**: Ensure respect for Islamic values

#### Approval Process

1. **Automated tests**: All tests must pass
2. **Code review**: At least one maintainer approval
3. **Documentation review**: Clear and complete documentation
4. **Performance check**: No significant performance regressions

### Recognition

#### Contributors

- **Code contributions**: Listed in package.json and documentation
- **Method contributions**: Credited in method documentation
- **Issue reporting**: Acknowledged in release notes
- **Documentation**: Recognized in documentation credits

#### Islamic Authority Recognition

We acknowledge and thank the Islamic authorities whose official calculations and guidance make this library possible:

- Qatar Ministry of Awqaf and Islamic Affairs
- UAE General Authority of Islamic Affairs & Endowments
- Majlis Ugama Islam Singapura (MUIS)
- Department of Islamic Development Malaysia (JAKIM)
- Ministry of Religion Indonesia (Kemenag)
- And many others...

---

## Getting Help

### Resources

- **API Documentation**: [docs/api-reference.md](api-reference.md)
- **Method Guide**: [docs/methods.md](methods.md)

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Documentation**: Complete guides and examples

### Contact

- **Project**: @masaajid/prayer-times
- **Organization**: Masaajid Project
- **Repository**: https://github.com/masaajid-hub/prayer-times

---

_Thank you for contributing to this Islamic prayer times library and helping serve the Muslim community!_
