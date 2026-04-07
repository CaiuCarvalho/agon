/**
 * Bug Condition Exploration Test for Audit Fixes
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * Property 1: Bug Condition - Type Safety Violations and Security Issues
 * 
 * For any codebase with TypeScript files and environment variable usage,
 * the audit system SHALL detect all instances of:
 * - Type safety violations (usage of `any` type)
 * - Security issues (hardcoded fallbacks in environment variables)
 * 
 * Expected counterexamples on UNFIXED code:
 * - Audit score is 78/100 (not ≥95)
 * - 18 `any` occurrences in components
 * - 2 insecure fallback patterns in docs/scripts
 * - No autocomplete in form fields
 * - No type checking in order/address components
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';

describe('Bug Condition Exploration: Type Safety and Security Issues', () => {
  /**
   * Test 1: Audit Detection - Verify audit detects exactly 20 issues
   * 
   * This test runs the SDD audit and verifies it detects:
   * - 18 type safety violations (any usage)
   * - 2 security issues (hardcoded env fallbacks)
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (audit finds 20 issues)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (audit finds 0 issues or score ≥95)
   */
  it('Property 1.1: Audit SHALL detect all type safety violations and security issues', () => {
    // Run the audit from the project root
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    try {
      // Run audit and capture results
      execSync('npm run audit', { 
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error) {
      // Audit script may exit with non-zero code, but we still get the output
    }

    // Read audit results
    const auditResultsPath = path.join(projectRoot, 'scripts', 'audit-results.json');
    const auditResults = JSON.parse(fs.readFileSync(auditResultsPath, 'utf-8'));

    // Read audit report for score
    const auditReportPath = path.join(projectRoot, 'scripts', 'audit-report.md');
    const auditReport = fs.readFileSync(auditReportPath, 'utf-8');
    
    // Extract score from report (format: "### 📊 Score Final: 78/100")
    const scoreMatch = auditReport.match(/Score Final: (\d+)\/100/);
    const currentScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Count issues by category
    const typeSafetyIssues = auditResults.filter(
      (issue: any) => issue.category === 'Anti-pattern' && issue.message.includes('any')
    );
    const securityIssues = auditResults.filter(
      (issue: any) => issue.category === 'Segurança' && issue.message.includes('Fallback hardcoded')
    );

    // Document counterexamples
    console.log('\n=== COUNTEREXAMPLES FOUND ===');
    console.log(`Current Audit Score: ${currentScore}/100`);
    console.log(`Type Safety Violations (any usage): ${typeSafetyIssues.length}`);
    console.log(`Security Issues (hardcoded fallbacks): ${securityIssues.length}`);
    console.log(`Total Issues: ${auditResults.length}`);
    
    console.log('\n=== TYPE SAFETY VIOLATIONS ===');
    typeSafetyIssues.forEach((issue: any) => {
      console.log(`  - ${issue.file}:${issue.line} - ${issue.snippet || issue.message}`);
    });
    
    console.log('\n=== SECURITY ISSUES ===');
    securityIssues.forEach((issue: any) => {
      console.log(`  - ${issue.file}:${issue.line} - ${issue.message}`);
    });

    // EXPECTED BEHAVIOR (after fix):
    // - Score should be ≥95 (ideally 100)
    // - Type safety issues should be 0
    // - Security issues should be 0
    // - Total issues should be 0
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Score is 78/100
    // - Type safety issues: 18
    // - Security issues: 2
    // - Total issues: 20

    expect(currentScore, 'Audit score should be ≥95 after fix').toBeGreaterThanOrEqual(95);
    expect(typeSafetyIssues.length, 'Type safety violations should be 0 after fix').toBe(0);
    expect(securityIssues.length, 'Security issues should be 0 after fix').toBe(0);
    expect(auditResults.length, 'Total issues should be 0 after fix').toBe(0);
  });

  /**
   * Test 2: TypeScript Compilation - Verify strict mode allows `any` types
   * 
   * This test verifies that TypeScript compilation in strict mode
   * should catch type safety issues.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (compilation allows `any` without errors)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (no `any` types, strict mode passes)
   */
  it('Property 1.2: TypeScript strict mode SHALL enforce type safety', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    const webAppRoot = path.join(projectRoot, 'apps', 'web');

    // Check if tsconfig has strict mode enabled
    const tsconfigPath = path.join(webAppRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    
    console.log('\n=== TYPESCRIPT CONFIGURATION ===');
    console.log(`Strict mode: ${tsconfig.compilerOptions?.strict || false}`);
    console.log(`noImplicitAny: ${tsconfig.compilerOptions?.noImplicitAny || false}`);

    // Run TypeScript compiler in noEmit mode to check for errors
    let compileOutput = '';
    let hasErrors = false;
    
    try {
      compileOutput = execSync('npx tsc --noEmit --strict', {
        cwd: webAppRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      hasErrors = true;
      compileOutput = error.stdout || error.stderr || '';
    }

    // Count type errors related to `any`
    const anyErrors = (compileOutput.match(/any/gi) || []).length;
    
    console.log('\n=== TYPESCRIPT COMPILATION ===');
    console.log(`Has compilation errors: ${hasErrors}`);
    console.log(`Errors mentioning 'any': ${anyErrors}`);
    
    if (compileOutput) {
      console.log('\nCompilation output (first 500 chars):');
      console.log(compileOutput.substring(0, 500));
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Strict mode compilation should pass with zero errors
    // - No `any` types should exist in the codebase
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Compilation may have warnings about `any` usage
    // - Multiple files use `any` type annotations

    // After fix, this should pass (no errors)
    expect(hasErrors, 'TypeScript strict mode should pass without errors after fix').toBe(false);
  });

  /**
   * Test 3: Property-Based Test - Type Safety Violations Pattern
   * 
   * This property-based test generates random file paths and verifies
   * that files with `any` type annotations are detected by the audit.
   * 
   * Uses scoped PBT approach: tests the concrete failing cases identified in audit.
   */
  it('Property 1.3: For all files with `any` type annotations, audit SHALL detect them', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    // Read audit results
    const auditResultsPath = path.join(projectRoot, 'scripts', 'audit-results.json');
    const auditResults = JSON.parse(fs.readFileSync(auditResultsPath, 'utf-8'));
    
    // Get all files with type safety violations
    const filesWithAny = auditResults
      .filter((issue: any) => issue.category === 'Anti-pattern')
      .map((issue: any) => ({
        file: issue.file,
        line: issue.line,
        snippet: issue.snippet
      }));

    console.log('\n=== FILES WITH `any` TYPE ANNOTATIONS ===');
    console.log(`Total files with violations: ${filesWithAny.length}`);

    // Sample only first 5 files for faster testing
    const sampleFiles = filesWithAny.slice(0, Math.min(5, filesWithAny.length));

    // Property: For each file with `any`, verify it's detected
    fc.assert(
      fc.property(
        fc.constantFrom(...sampleFiles),
        (fileInfo) => {
          // Verify the file exists
          const filePath = path.join(projectRoot, fileInfo.file.replace(/\\/g, '/'));
          const fileExists = fs.existsSync(filePath);
          
          if (!fileExists) {
            console.log(`  ⚠️  File not found: ${fileInfo.file}`);
            return true; // Skip if file doesn't exist
          }

          // Read file content
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          const lineContent = lines[fileInfo.line - 1] || '';

          // Verify the line contains `any`
          const containsAny = lineContent.includes('any');
          
          console.log(`  ${containsAny ? '✓' : '✗'} ${fileInfo.file}:${fileInfo.line}`);
          console.log(`    Snippet: ${fileInfo.snippet || lineContent.trim()}`);

          // EXPECTED BEHAVIOR (after fix):
          // - No files should contain `any` type annotations
          // - This property should pass with 0 violations
          
          // CURRENT BEHAVIOR (unfixed code):
          // - Multiple files contain `any` type annotations
          // - This property documents each violation

          return !containsAny; // Should be true after fix (no `any` found)
        }
      ),
      { 
        numRuns: sampleFiles.length > 0 ? sampleFiles.length : 1,
        verbose: true 
      }
    );
  });

  /**
   * Test 4: Security Issues - Hardcoded Fallbacks
   * 
   * This test verifies that hardcoded fallbacks in environment variables
   * are detected by the audit system.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (2 hardcoded fallbacks found)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (0 hardcoded fallbacks)
   */
  it('Property 1.4: Audit SHALL detect hardcoded fallbacks in environment variables', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    // Read audit results
    const auditResultsPath = path.join(projectRoot, 'scripts', 'audit-results.json');
    const auditResults = JSON.parse(fs.readFileSync(auditResultsPath, 'utf-8'));
    
    // Get security issues
    const securityIssues = auditResults.filter(
      (issue: any) => issue.category === 'Segurança' && issue.message.includes('Fallback hardcoded')
    );

    console.log('\n=== HARDCODED FALLBACK PATTERNS ===');
    console.log(`Total security issues: ${securityIssues.length}`);
    
    securityIssues.forEach((issue: any) => {
      console.log(`  - ${issue.file}:${issue.line}`);
      console.log(`    Message: ${issue.message}`);
      
      // Read the file to show context
      const filePath = path.join(projectRoot, issue.file.replace(/\\/g, '/'));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const lineContent = lines[issue.line - 1] || '';
        console.log(`    Content: ${lineContent.trim()}`);
      }
    });

    // EXPECTED BEHAVIOR (after fix):
    // - No hardcoded fallbacks should exist
    // - Documentation should show secure patterns
    // - Scripts should use fail-fast or safe defaults
    
    // CURRENT BEHAVIOR (unfixed code):
    // - 2 hardcoded fallbacks in documentation and scripts
    // - Potential security risk

    expect(securityIssues.length, 'Security issues should be 0 after fix').toBe(0);
  });
});
