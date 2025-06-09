# Frontend Demo Application Testing Guide

This guide provides comprehensive instructions for testing the Insurance AI Demo application functionality, including manual testing procedures, automated testing setup, and validation criteria.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Manual Testing Procedures](#manual-testing-procedures)
3. [API Integration Testing](#api-integration-testing)
4. [Automated Testing Setup](#automated-testing-setup)
5. [Performance Testing](#performance-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Cross-Browser Testing](#cross-browser-testing)
8. [Test Data and Scenarios](#test-data-and-scenarios)

## Prerequisites

### Environment Setup
```bash
# Ensure both frontend and backend are running
# Frontend: http://localhost:3000
# Backend: http://localhost:8000

# Verify backend health
curl http://localhost:8000/api/health

# Verify frontend is accessible
curl http://localhost:3000

# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest jest-environment-jsdom
npm install --save-dev @types/jest
npm install --save-dev playwright @playwright/test
```

### Required Tools
- Node.js 18+ 
- Modern browser (Chrome, Firefox, Safari, Edge)
- Backend API running on port 8000
- Frontend development server on port 3000

## Manual Testing Procedures

### 1. Navigation and Layout Testing

#### Sidebar Navigation
- [ ] **Test**: Click on "Agent Demos" in sidebar
- [ ] **Expected**: Submenu expands showing three agent options
- [ ] **Test**: Click each agent demo link
- [ ] **Expected**: Navigation to correct page with URL update

#### Responsive Design
- [ ] **Test**: Resize browser window to mobile size (< 768px)
- [ ] **Expected**: Sidebar collapses, mobile-friendly layout
- [ ] **Test**: Test on tablet size (768px - 1024px)
- [ ] **Expected**: Proper layout adaptation

### 2. Assessment Agent Demo Testing

#### Form Validation
```bash
# Test Cases:
1. Submit empty form
   - Expected: Validation errors for required fields
   
2. Enter invalid policy number format
   - Expected: Format validation error
   
3. Select future incident date
   - Expected: Date validation error
   
4. Enter negative estimated amount
   - Expected: Amount validation error
```

#### Demo Scenarios
- [ ] **Test**: Click "Load Demo Scenario" dropdown
- [ ] **Expected**: List of 6 predefined scenarios
- [ ] **Test**: Select "Minor Auto Accident"
- [ ] **Expected**: Form auto-populates with scenario data
- [ ] **Test**: Submit form with demo data
- [ ] **Expected**: Assessment results display with risk score, recommendations

#### Results Display
- [ ] **Test**: Verify risk score visualization (0-100 scale)
- [ ] **Expected**: Color-coded progress bar (green/yellow/red)
- [ ] **Test**: Check required documents list
- [ ] **Expected**: Relevant documents based on claim type
- [ ] **Test**: Verify analysis details expansion
- [ ] **Expected**: Fraud indicators, coverage analysis visible

### 3. Communication Agent Demo Testing

#### Multi-Language Support
```bash
# Test Cases:
1. Select Spanish language
   - Expected: Generated content in Spanish
   
2. Select French language
   - Expected: Generated content in French
   
3. Test different communication types
   - Email: Formal structure with headers
   - SMS: Concise message under 160 characters
   - Letter: Formal business letter format
```

#### Communication Generation
- [ ] **Test**: Fill form with customer context
- [ ] **Expected**: Personalized communication generated
- [ ] **Test**: Click "Generate Communication"
- [ ] **Expected**: Loading state, then results display
- [ ] **Test**: Verify tone analysis scores
- [ ] **Expected**: Formality, empathy, clarity scores displayed

#### Content Actions
- [ ] **Test**: Click "Copy to Clipboard" button
- [ ] **Expected**: Content copied, success toast notification
- [ ] **Test**: Click "Download as Text" button
- [ ] **Expected**: File download initiated
- [ ] **Test**: Click "Share" button
- [ ] **Expected**: Share dialog or native share functionality

### 4. Orchestrator Agent Demo Testing

#### Workflow Initiation
- [ ] **Test**: Select workflow type from dropdown
- [ ] **Expected**: Workflow description updates
- [ ] **Test**: Set priority level
- [ ] **Expected**: Priority badge color changes
- [ ] **Test**: Submit workflow request
- [ ] **Expected**: Workflow status tracking begins

#### Real-Time Status Updates
- [ ] **Test**: Monitor agent assignment cards
- [ ] **Expected**: Status indicators update (pending → in-progress → completed)
- [ ] **Test**: Check progress bar
- [ ] **Expected**: Percentage completion updates
- [ ] **Test**: Verify estimated completion times
- [ ] **Expected**: Realistic time estimates displayed

#### Workflow Scenarios
```bash
# Test each workflow type:
1. Standard Auto Claim Processing
   - 4 steps: intake → assessment → communication → settlement
   
2. Complex Claim Investigation  
   - 6 steps: intake → preliminary → investigation → review → communication → settlement
   
3. Expedited Processing
   - 4 steps: intake → quick assessment → auto approval → communication
   
4. Multi-Party Coordination
   - 6 steps: intake → identification → parallel assessment → coordination → communication → settlement
```

## Automated Testing Setup

### Unit Tests Configuration

Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock API calls
global.fetch = jest.fn()
```

### Component Tests

Create `__tests__/components/assessment-demo.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssessmentDemo from '@/app/agents/assessment/page'

describe('Assessment Demo', () => {
  test('renders form elements', () => {
    render(<AssessmentDemo />)
    
    expect(screen.getByLabelText(/claim description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/policy number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/incident date/i)).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    const user = userEvent.setup()
    render(<AssessmentDemo />)
    
    const submitButton = screen.getByRole('button', { name: /assess claim/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/claim description is required/i)).toBeInTheDocument()
    })
  })

  test('loads demo scenario', async () => {
    const user = userEvent.setup()
    render(<AssessmentDemo />)
    
    const scenarioSelect = screen.getByRole('combobox', { name: /demo scenario/i })
    await user.click(scenarioSelect)
    
    const scenario = screen.getByText(/minor auto accident/i)
    await user.click(scenario)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(/rear-ended at traffic light/i)).toBeInTheDocument()
    })
  })
})
```

### Integration Tests

Create `__tests__/integration/api-integration.test.tsx`:
```typescript
import { apiClient } from '@/lib/api'

describe('API Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  test('assessment API call', async () => {
    const mockResponse = {
      assessment_id: 'ASS-123',
      risk_score: 75,
      recommendation: 'Approve with standard processing'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const request = {
      claim_description: 'Test claim',
      policy_number: 'TEST-001',
      incident_date: '2024-06-01',
      claim_type: 'auto',
    }

    const result = await apiClient.assessClaim(request)
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockResponse)
  })

  test('handles API errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const request = {
      claim_description: 'Test claim',
      policy_number: 'TEST-001',
      incident_date: '2024-06-01',
      claim_type: 'auto',
    }

    const result = await apiClient.assessClaim(request)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })
})
```

### End-to-End Tests with Playwright

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

Create `e2e/assessment-flow.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Assessment Agent Flow', () => {
  test('complete assessment workflow', async ({ page }) => {
    await page.goto('/agents/assessment')
    
    // Fill form
    await page.fill('[name="claim_description"]', 'Test claim description')
    await page.fill('[name="policy_number"]', 'TEST-001')
    await page.fill('[name="incident_date"]', '2024-06-01')
    await page.selectOption('[name="claim_type"]', 'auto')
    await page.fill('[name="estimated_amount"]', '5000')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for results
    await expect(page.locator('[data-testid="assessment-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="risk-score"]')).toContainText(/\d+/)
  })

  test('demo scenario loading', async ({ page }) => {
    await page.goto('/agents/assessment')
    
    // Load demo scenario
    await page.click('[data-testid="demo-scenario-select"]')
    await page.click('text=Minor Auto Accident')
    
    // Verify form is populated
    await expect(page.locator('[name="claim_description"]')).toHaveValue(/rear-ended/i)
    await expect(page.locator('[name="policy_number"]')).toHaveValue('AUTO-2024-001234')
  })
})
```

## API Integration Testing

### Backend Health Check
```bash
# Test backend connectivity
curl -X GET http://localhost:8000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-06-07T18:00:00Z",
  "version": "1.0.0"
}
```

### Agent Endpoint Testing
```bash
# Assessment Agent
curl -X POST http://localhost:8000/api/agents/assessment/assess \
  -H "Content-Type: application/json" \
  -d '{
    "claim_description": "Test claim",
    "policy_number": "TEST-001",
    "incident_date": "2024-06-01",
    "claim_type": "auto"
  }'

# Communication Agent
curl -X POST http://localhost:8000/api/agents/communication/generate \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_type": "customer",
    "language": "en",
    "communication_type": "email",
    "context": {
      "claim_id": "CLM-001",
      "customer_name": "John Doe"
    }
  }'

# Orchestrator Agent
curl -X POST http://localhost:8000/api/agents/orchestrator/start-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "auto_claim_standard",
    "priority": "medium",
    "initial_data": {
      "claim_description": "Test claim",
      "policy_number": "TEST-001"
    }
  }'
```

## Performance Testing

### Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run performance audit
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

### Load Testing
```bash
# Install Artillery for load testing
npm install -g artillery

# Create artillery.yml:
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Browse demo pages"
    flow:
      - get:
          url: "/"
      - get:
          url: "/agents/assessment"
      - get:
          url: "/agents/communication"
      - get:
          url: "/agents/orchestrator"

# Run load test
artillery run artillery.yml
```

## Accessibility Testing

### Automated Accessibility Testing
```bash
# Install axe-core
npm install --save-dev @axe-core/playwright

# Add to Playwright tests
import { injectAxe, checkA11y } from '@axe-core/playwright'

test('accessibility check', async ({ page }) => {
  await page.goto('/agents/assessment')
  await injectAxe(page)
  await checkA11y(page)
})
```

### Manual Accessibility Checklist
- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: Test with NVDA/JAWS/VoiceOver
- [ ] **Color Contrast**: Verify WCAG AA compliance (4.5:1 ratio)
- [ ] **Focus Indicators**: Visible focus states on all interactive elements
- [ ] **Alt Text**: Images have descriptive alt attributes
- [ ] **Form Labels**: All form inputs have associated labels
- [ ] **Heading Structure**: Proper h1-h6 hierarchy

## Cross-Browser Testing

### Browser Compatibility Matrix
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Form Validation | ✅ | ✅ | ✅ | ✅ |
| API Calls | ✅ | ✅ | ✅ | ✅ |
| Responsive Design | ✅ | ✅ | ✅ | ✅ |
| Animations | ✅ | ✅ | ✅ | ✅ |

### Testing Procedure
1. Test core functionality in each browser
2. Verify responsive design at different breakpoints
3. Check form validation and submission
4. Test API integration and error handling
5. Validate accessibility features

## Test Data and Scenarios

### Assessment Agent Test Cases
```typescript
const testCases = [
  {
    name: "Simple Auto Claim",
    input: {
      claim_description: "Minor fender bender",
      policy_number: "AUTO-001",
      incident_date: "2024-06-01",
      claim_type: "auto",
      estimated_amount: 2500
    },
    expected: {
      risk_score: "< 50",
      priority_level: "medium"
    }
  },
  {
    name: "High-Value Claim",
    input: {
      claim_description: "Total loss vehicle",
      policy_number: "AUTO-002",
      incident_date: "2024-06-01",
      claim_type: "auto",
      estimated_amount: 35000
    },
    expected: {
      risk_score: "> 70",
      priority_level: "high"
    }
  }
]
```

### Communication Agent Test Cases
```typescript
const communicationTests = [
  {
    name: "English Email",
    input: {
      language: "en",
      communication_type: "email",
      recipient_type: "customer"
    },
    expected: {
      language_used: "en",
      formality_level: "professional"
    }
  },
  {
    name: "Spanish SMS",
    input: {
      language: "es",
      communication_type: "sms",
      recipient_type: "customer"
    },
    expected: {
      language_used: "es",
      delivery_method: "sms"
    }
  }
]
```

## Running the Tests

### Development Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npx playwright test

# Run specific test file
npm test -- assessment-demo.test.tsx
```

### CI/CD Pipeline Testing
```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run all tests
npm run test:ci

# Run E2E tests
npm run test:e2e

# Build application
npm run build

# Run Lighthouse audit
npm run lighthouse
```

## Troubleshooting

### Common Issues
1. **API Connection Errors**: Verify backend is running on port 8000
2. **Form Validation Issues**: Check Zod schema definitions
3. **Component Rendering Errors**: Verify all required props are passed
4. **Styling Issues**: Check Tailwind CSS classes and shadcn/ui components

### Debug Commands
```bash
# Check frontend build
npm run build

# Analyze bundle size
npm run analyze

# Check for unused dependencies
npx depcheck

# Verify TypeScript compilation
npx tsc --noEmit
```

This comprehensive testing guide ensures thorough validation of all frontend functionality, from individual components to full user workflows. 