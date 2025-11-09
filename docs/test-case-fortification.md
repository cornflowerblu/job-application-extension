## Plan: Fortify Test Cases with Real-World Job Application Fields

### 1. **Reorganize Test Form Location**

- Move `test-form.html` → `e2e/fixtures/comprehensive-job-application.html`
- Create `e2e/fixtures/` directory for test forms
- Update all Playwright test imports to use new path

### 2. **Enhance Test Form with Priority Field Types**

Add the following sections to the comprehensive test form:

**Personal Information Section** (enhanced):

- LinkedIn URL (url input)
- Portfolio/Website URL (url input)
- GitHub URL (url input)

**Address Section** (new):

- Street Address (text)
- City (text)
- State (select dropdown with US states)
- Zip Code (text with pattern validation)

**Employment History Section** (new - 2 entries):

- Previous Employer 1 & 2 (text)
- Job Title 1 & 2 (text)
- Start Date 1 & 2 (date input)
- End Date 1 & 2 (date input)
- Currently Working checkbox (makes end date optional)

**Education History Section** (new - 2 entries):

- School/University 1 & 2 (text)
- Degree 1 & 2 (select: Bachelor's, Master's, PhD, etc.)
- Field of Study 1 & 2 (text)
- Graduation Date 1 & 2 (date or month/year)
- GPA 1 & 2 (number input with min/max validation)

**Compensation Section** (new):

- Current Salary (number input)
- Expected Salary (number input)
- Start Date Availability (date input)

### 3. **Update Content Script for New Field Types**

Enhance `src/content/content-script.ts`:

- Add date input filling logic (format: YYYY-MM-DD)
- Add number input filling logic with validation
- Add URL input filling logic with validation
- Enhance fuzzy matching for date formats

### 4. **Add Jest Unit Tests**

**Update `src/__tests__/form-field-extraction.test.ts`**:

- Test extracting date inputs
- Test extracting number inputs with min/max
- Test extracting URL inputs
- Test extracting multi-field groups (employment/education history)

**Update `src/__tests__/form-filling.test.ts`**:

- Test filling date inputs (various formats)
- Test filling number inputs (with/without validation)
- Test filling URL inputs
- Test filling address fields
- Test filling employment history (multiple entries)
- Test filling education history (multiple entries)

### 5. **Add Jest Integration Tests**

**Update `src/__tests__/integration/form-flow.test.ts`**:

- Test full flow with employment history fields
- Test full flow with education history fields
- Test full flow with date inputs
- Test full flow with number inputs
- Test full flow with URL inputs
- Test Claude generates appropriate dates (formatted correctly)
- Test Claude generates reasonable salary expectations
- Test Claude fills multiple employment/education entries

### 6. **Update Playwright E2E Tests**

**Update `e2e/form-filling.spec.ts`** (mocked):

- Add mock Claude response for all new field types
- Verify date inputs are filled correctly
- Verify number inputs are filled correctly
- Verify URL inputs are filled correctly
- Verify employment history is filled (2 entries)
- Verify education history is filled (2 entries)
- Verify address fields are filled

**Update `e2e/real-api.spec.ts`** (real API):

- Add test for employment/education history (1 API call)
- Add test for date/number/URL validation (1 API call)
- Keep existing 3 tests (total will be 5 tests, still under limit)

### 7. **Update Prompt Construction**

**Update `src/background/service-worker.ts`**:

- Enhance prompt to handle date inputs (explain format expectations)
- Enhance prompt to handle number inputs (explain validation ranges)
- Enhance prompt to handle URL inputs (explain expected formats)
- Enhance prompt to handle multi-field scenarios (employment/education history)
- Add instructions for generating realistic dates (not future dates for past employment)

### 8. **Update Documentation**

**Update `TESTING.md`**:

- Document new test form structure
- Explain new field types being tested
- Update test coverage metrics

---

## Expected Outcomes

✅ **More Realistic Test Coverage**: Test form mirrors real job applications (Greenhouse, Lever, Workday style)

✅ **Better Bug Detection**: Catch issues with date/number/URL field handling before production

✅ **Employment/Education History**: Test the most tedious part of job applications (what user mentioned!)

✅ **Comprehensive Field Type Coverage**: Date, number, URL inputs + multi-field scenarios

✅ **Maintained Safety**: Real API tests stay under cost limit (5 total tests)

---

## Files to Modify

1. `test-form.html` → `e2e/fixtures/comprehensive-job-application.html` (move + enhance)
2. `src/content/content-script.ts` (add date/number/URL filling logic)
3. `src/background/service-worker.ts` (enhance prompt for new field types)
4. `src/__tests__/form-field-extraction.test.ts` (add extraction tests)
5. `src/__tests__/form-filling.test.ts` (add filling tests)
6. `src/__tests__/integration/form-flow.test.ts` (add integration tests)
7. `e2e/form-filling.spec.ts` (update mocked tests)
8. `e2e/real-api.spec.ts` (add 2 new real API scenarios)
9. `TESTING.md` (update documentation)
