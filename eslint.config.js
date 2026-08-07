// ESLint 最小配置（flat config）：TypeScript 推荐规则 + React Hooks 规则
// 目的：主要兜住 tsc 查不出的运行时行为（hooks 依赖、组件规范）
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: ['dist', 'dist-tmp', 'node_modules', 'coverage', 'cli/**', 'eslint.config.js'],
  },
  // TypeScript 推荐规则（非 type-checked，运行快）
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // 核心：hooks 依赖数组必须完整
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 测试 mock 常以下划线前缀声明未使用的占位参数
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
)
