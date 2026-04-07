#!/bin/bash

# =============================================================================
# check-secrets.sh - Security Secrets Scanner
# =============================================================================
# 
# This script scans the codebase for accidentally committed secrets and
# insecure patterns. It should be run in CI/CD to prevent security leaks.
#
# Exit codes:
#   0 - No secrets found (success)
#   1 - Secrets or insecure patterns detected (failure)
#
# Usage:
#   ./scripts/check-secrets.sh
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Scanning for secrets and insecure patterns..."
echo ""

ERRORS=0

# =============================================================================
# Check 1: Detect hardcoded Service Role Keys in source code
# =============================================================================
echo "📋 Check 1: Scanning for SUPABASE_SERVICE_ROLE_KEY in source code..."

if grep -r "SUPABASE_SERVICE_ROLE_KEY" apps/web/src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${RED}❌ FAIL: Found SUPABASE_SERVICE_ROLE_KEY reference in source code${NC}"
    echo "   Service Role Key should NEVER be used in frontend code"
    echo "   Use NEXT_PUBLIC_SUPABASE_ANON_KEY instead"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No Service Role Key references in source code${NC}"
fi
echo ""

# =============================================================================
# Check 2: Detect committed .env files
# =============================================================================
echo "📋 Check 2: Checking for committed .env files..."

if git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production$" 2>/dev/null; then
    echo -e "${RED}❌ FAIL: Found committed .env files${NC}"
    echo "   .env files should NEVER be committed to version control"
    echo "   Add them to .gitignore and remove from git history"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No .env files committed${NC}"
fi
echo ""

# =============================================================================
# Check 3: Detect insecure fallback patterns
# =============================================================================
echo "📋 Check 3: Scanning for insecure fallback patterns..."

if grep -r "process\.env\.[A-Z_]* || ['\"]" apps/web/src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Found environment variable with fallback value${NC}"
    echo "   Using fallback values for env vars can mask configuration errors"
    echo "   Consider using proper validation instead"
    # Don't increment ERRORS for warnings
else
    echo -e "${GREEN}✅ PASS: No insecure fallback patterns found${NC}"
fi
echo ""

# =============================================================================
# Check 4: Detect hardcoded JWT tokens
# =============================================================================
echo "📋 Check 4: Scanning for hardcoded JWT tokens..."

if grep -r "eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" apps/web/src/ --exclude-dir=node_modules --exclude="*.md" 2>/dev/null; then
    echo -e "${RED}❌ FAIL: Found hardcoded JWT token${NC}"
    echo "   JWT tokens should NEVER be hardcoded in source code"
    echo "   Use environment variables instead"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No hardcoded JWT tokens found${NC}"
fi
echo ""

# =============================================================================
# Check 5: Detect API keys in source code
# =============================================================================
echo "📋 Check 5: Scanning for hardcoded API keys..."

# Common API key patterns
if grep -rE "(api[_-]?key|apikey|api[_-]?secret)['\"]?\s*[:=]\s*['\"][a-zA-Z0-9]{20,}" apps/web/src/ --exclude-dir=node_modules --exclude="*.md" 2>/dev/null; then
    echo -e "${RED}❌ FAIL: Found hardcoded API key${NC}"
    echo "   API keys should NEVER be hardcoded in source code"
    echo "   Use environment variables instead"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No hardcoded API keys found${NC}"
fi
echo ""

# =============================================================================
# Check 6: Detect passwords in source code
# =============================================================================
echo "📋 Check 6: Scanning for hardcoded passwords..."

if grep -rE "(password|passwd|pwd)['\"]?\s*[:=]\s*['\"][^'\"]{8,}" apps/web/src/ --exclude-dir=node_modules --exclude="*.md" --exclude="*.test.*" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Found potential hardcoded password${NC}"
    echo "   Review the matches above to ensure they are not real passwords"
    # Don't increment ERRORS for warnings (could be test data)
else
    echo -e "${GREEN}✅ PASS: No hardcoded passwords found${NC}"
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo -e "${RED}❌ Security checks failed with $ERRORS error(s)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please fix the issues above before committing."
    echo "For help, see: .env.example and apps/web/src/lib/env.ts"
    exit 1
fi
