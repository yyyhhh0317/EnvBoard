// 示例 .env 内容，方便用户快速体验
export const SAMPLE_ENV = `# ===== 数据库配置 =====
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
DB_HOST=localhost
DB_PORT=5432

# ===== 应用配置 =====
APP_NAME=EnvBoard
PORT=3000
HOST=0.0.0.0
DEBUG=true
LOG_LEVEL=info

# ===== API 密钥（敏感，请勿泄露） =====
API_KEY=sk-1234567890abcdef
SECRET_KEY=super-secret-value
JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

# ===== 第三方服务 =====
STRIPE_SECRET=sk_test_abcdef
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# 被注释掉的变量
# DISABLED_FEATURE=false
`
