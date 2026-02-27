#!/usr/bin/env node
/**
 * AI Acceptance Script
 * 自动化验收流程：静态检查 → 单元测试 → 构建 → 报告生成
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, code: error.status };
  }
}

class AIAcceptance {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      stages: {},
      overall: false,
    };
  }

  async run() {
    log('\n╔══════════════════════════════════════════════════╗', 'cyan');
    log('║        AI Development Acceptance Loop            ║', 'cyan');
    log('╚══════════════════════════════════════════════════╝\n', 'cyan');

    // Stage 1: 静态检查
    await this.stage1StaticAnalysis();

    // Stage 2: 单元测试
    await this.stage2UnitTests();

    // Stage 3: TypeScript编译
    await this.stage3TypeScriptCheck();

    // Stage 4: 应用构建
    await this.stage4Build();

    // Stage 5: 生成报告
    await this.stage5GenerateReport();

    // 最终结果
    this.printFinalResult();

    return this.results.overall;
  }

  async stage1StaticAnalysis() {
    log('📋 Stage 1: Static Analysis', 'bright');
    log('─────────────────────────────────────────────');

    const checks = [
      { name: 'ESLint', command: 'npx eslint . --ext ts,tsx', optional: true },
      { name: 'Prettier', command: 'npx prettier --check "src/**/*.{ts,tsx}"' },
    ];

    this.results.stages.staticAnalysis = { passed: true, checks: [] };

    for (const check of checks) {
      log(`\n  Running ${check.name}...`, 'yellow');
      const result = exec(check.command, { silent: true });

      if (result.success) {
        log(`  ✅ ${check.name} passed`, 'green');
        this.results.stages.staticAnalysis.checks.push({ name: check.name, passed: true });
      } else {
        if (check.optional) {
          log(`  ⚠️  ${check.name} failed (optional)`, 'yellow');
          this.results.stages.staticAnalysis.checks.push({
            name: check.name,
            passed: false,
            optional: true,
            error: result.error,
          });
        } else {
          log(`  ❌ ${check.name} failed`, 'red');
          this.results.stages.staticAnalysis.checks.push({
            name: check.name,
            passed: false,
            error: result.error,
          });
          this.results.stages.staticAnalysis.passed = false;
        }
      }
    }

    log('');
    return this.results.stages.staticAnalysis.passed;
  }

  async stage2UnitTests() {
    log('🧪 Stage 2: Unit Tests', 'bright');
    log('─────────────────────────────────────────────');

    const result = exec('npm run test:run', { silent: true });

    if (result.success) {
      log('  ✅ All tests passed', 'green');
      this.results.stages.unitTests = { passed: true };

      // 尝试读取覆盖率报告
      this.checkCoverage();
    } else {
      log('  ❌ Tests failed', 'red');
      this.results.stages.unitTests = { passed: false, error: result.error };
    }

    log('');
    return this.results.stages.unitTests.passed;
  }

  checkCoverage() {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        const total = coverage.total;

        log(`\n  📊 Coverage Report:`, 'blue');
        log(`     Lines: ${total.lines.pct}%`, total.lines.pct >= 70 ? 'green' : 'yellow');
        log(
          `     Functions: ${total.functions.pct}%`,
          total.functions.pct >= 70 ? 'green' : 'yellow'
        );
        log(`     Branches: ${total.branches.pct}%`, total.branches.pct >= 60 ? 'green' : 'yellow');

        this.results.stages.unitTests.coverage = total;
      }
    } catch (error) {
      log('  ⚠️  Could not read coverage report', 'yellow');
    }
  }

  async stage3TypeScriptCheck() {
    log('🔍 Stage 3: TypeScript Type Check', 'bright');
    log('─────────────────────────────────────────────');

    const result = exec('npx tsc --noEmit', { silent: true });

    if (result.success) {
      log('  ✅ TypeScript check passed', 'green');
      this.results.stages.typeScript = { passed: true };
    } else {
      log('  ❌ TypeScript check failed', 'red');
      this.results.stages.typeScript = { passed: false, error: result.error };
    }

    log('');
    return this.results.stages.typeScript.passed;
  }

  async stage4Build() {
    log('🏗️  Stage 4: Application Build', 'bright');
    log('─────────────────────────────────────────────');

    // 先编译主进程
    log('\n  Compiling main process...', 'yellow');
    const mainResult = exec('npx tsc -p tsconfig.main.json', { silent: true });

    if (!mainResult.success) {
      log('  ❌ Main process compilation failed', 'red');
      this.results.stages.build = { passed: false, error: mainResult.error };
      log('');
      return false;
    }

    // 再打包主进程
    log('  Bundling main process...', 'yellow');
    const bundleResult = exec(
      'npx esbuild src/main/index.ts --bundle --platform=node --outfile=dist/main/index.js --external:electron --external:worker_threads',
      { silent: true }
    );

    if (!bundleResult.success) {
      log('  ❌ Main process bundling failed', 'red');
      this.results.stages.build = { passed: false, error: bundleResult.error };
      log('');
      return false;
    }

    log('  ✅ Build successful', 'green');
    this.results.stages.build = { passed: true };

    log('');
    return true;
  }

  async stage5GenerateReport() {
    log('📝 Stage 5: Generating Report', 'bright');
    log('─────────────────────────────────────────────\n');

    // 计算总体结果
    this.results.overall = Object.values(this.results.stages).every(stage => stage.passed);

    // 生成JSON报告
    const reportPath = path.join(process.cwd(), 'ai-acceptance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    log(`  📄 Report saved to: ${reportPath}`, 'blue');

    // 生成Markdown报告
    const mdReport = this.generateMarkdownReport();
    const mdPath = path.join(process.cwd(), 'AI_ACCEPTANCE_REPORT.md');
    fs.writeFileSync(mdPath, mdReport);
    log(`  📄 Markdown report saved to: ${mdPath}`, 'blue');

    log('');
  }

  generateMarkdownReport() {
    const { timestamp, stages, overall } = this.results;

    return `# AI Acceptance Report

**Generated:** ${new Date(timestamp).toLocaleString()}

**Overall Status:** ${overall ? '✅ PASSED' : '❌ FAILED'}

---

## Stage 1: Static Analysis

**Status:** ${stages.staticAnalysis.passed ? '✅ Passed' : '❌ Failed'}

${stages.staticAnalysis.checks
  .map(check => `- ${check.passed ? '✅' : '❌'} ${check.name}`)
  .join('\n')}

## Stage 2: Unit Tests

**Status:** ${stages.unitTests.passed ? '✅ Passed' : '❌ Failed'}

${
  stages.unitTests.coverage
    ? `**Coverage:**
- Lines: ${stages.unitTests.coverage.lines.pct}%
- Functions: ${stages.unitTests.coverage.functions.pct}%
- Branches: ${stages.unitTests.coverage.branches.pct}%`
    : ''
}

## Stage 3: TypeScript Check

**Status:** ${stages.typeScript.passed ? '✅ Passed' : '❌ Failed'}

## Stage 4: Build

**Status:** ${stages.build.passed ? '✅ Passed' : '❌ Failed'}

---

## Next Steps

${
  overall
    ? '✅ All checks passed! Ready to commit and push.'
    : '❌ Some checks failed. Please fix the issues above and re-run the acceptance script.'
}

`;
  }

  printFinalResult() {
    log('╔══════════════════════════════════════════════════╗', 'bright');
    if (this.results.overall) {
      log('║           ✅ ACCEPTANCE PASSED ✅                ║', 'green');
    } else {
      log('║           ❌ ACCEPTANCE FAILED ❌                ║', 'red');
    }
    log('╚══════════════════════════════════════════════════╝\n', 'bright');

    // 汇总
    log('Summary:', 'bright');
    log(`  Static Analysis: ${this.results.stages.staticAnalysis.passed ? '✅' : '❌'}`);
    log(`  Unit Tests: ${this.results.stages.unitTests.passed ? '✅' : '❌'}`);
    log(`  TypeScript: ${this.results.stages.typeScript.passed ? '✅' : '❌'}`);
    log(`  Build: ${this.results.stages.build.passed ? '✅' : '❌'}`);

    log(
      '\n' +
        (this.results.overall
          ? '✨ All checks passed! The code is ready for deployment.'
          : '⚠️  Please fix the failing checks and re-run this script.'),
      this.results.overall ? 'green' : 'yellow'
    );
    log('');
  }
}

// 运行验收
const acceptance = new AIAcceptance();
acceptance.run().then(passed => {
  process.exit(passed ? 0 : 1);
});
