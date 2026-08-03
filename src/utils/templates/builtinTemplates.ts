// 内置配置模板库（通用 / 前端 / Python）
import type { ConfigTemplate } from '../../types'

/**
 * 内置模板只提供「结构」与「占位值」，
 * 不包含任何真实密钥。用户应用模板后可自行填入真实值。
 */
export const BUILTIN_TEMPLATES: ConfigTemplate[] = [
  // ===== 通用 =====
  {
    id: 'general-web',
    name: '通用 Web 应用',
    description: '适用于大多数 Web 服务的基础配置：端口、日志、应用信息',
    category: 'general',
    variables: [
      { key: 'NODE_ENV', placeholder: 'development', comment: '运行环境：development / production / test', isSensitive: false, expectedType: 'string', required: true },
      { key: 'APP_NAME', placeholder: 'my-app', comment: '应用名称', isSensitive: false, expectedType: 'string' },
      { key: 'APP_PORT', placeholder: '3000', comment: '服务监听端口', isSensitive: false, expectedType: 'number', required: true },
      { key: 'APP_HOST', placeholder: '0.0.0.0', comment: '服务监听地址', isSensitive: false, expectedType: 'string' },
      { key: 'LOG_LEVEL', placeholder: 'info', comment: '日志级别：debug / info / warn / error', isSensitive: false, expectedType: 'string' },
      { key: 'DEBUG', placeholder: 'false', comment: '是否开启调试模式', isSensitive: false, expectedType: 'boolean' },
    ],
  },
  {
    id: 'general-database',
    name: '数据库连接',
    description: '关系型数据库通用连接配置（PostgreSQL / MySQL）',
    category: 'general',
    variables: [
      { key: 'DB_HOST', placeholder: 'localhost', comment: '数据库主机', isSensitive: false, expectedType: 'string', required: true },
      { key: 'DB_PORT', placeholder: '5432', comment: '数据库端口', isSensitive: false, expectedType: 'number', required: true },
      { key: 'DB_NAME', placeholder: 'mydb', comment: '数据库名称', isSensitive: false, expectedType: 'string', required: true },
      { key: 'DB_USER', placeholder: 'dbuser', comment: '数据库用户名', isSensitive: false, expectedType: 'string', required: true },
      { key: 'DB_PASSWORD', placeholder: 'your-password', comment: '数据库密码', isSensitive: true, required: true },
      { key: 'DATABASE_URL', placeholder: 'postgresql://user:pass@host:5432/db', comment: '完整连接串（可替代以上单项）', isSensitive: true, expectedType: 'url' },
      { key: 'DB_POOL_SIZE', placeholder: '10', comment: '连接池大小', isSensitive: false, expectedType: 'number' },
    ],
  },
  {
    id: 'general-cache',
    name: '缓存服务',
    description: 'Redis / Memcached 缓存连接配置',
    category: 'general',
    variables: [
      { key: 'REDIS_HOST', placeholder: 'localhost', comment: 'Redis 主机', isSensitive: false, expectedType: 'string', required: true },
      { key: 'REDIS_PORT', placeholder: '6379', comment: 'Redis 端口', isSensitive: false, expectedType: 'number', required: true },
      { key: 'REDIS_PASSWORD', placeholder: 'your-password', comment: 'Redis 密码（无密码可留空）', isSensitive: true },
      { key: 'REDIS_DB', placeholder: '0', comment: '使用的数据库编号', isSensitive: false, expectedType: 'number' },
      { key: 'CACHE_TTL', placeholder: '3600', comment: '默认缓存过期时间（秒）', isSensitive: false, expectedType: 'number' },
    ],
  },

  // ===== 前端 =====
  {
    id: 'frontend-vite',
    name: 'Vite + React/Vue',
    description: 'Vite 构建的前端项目常用环境变量（以 VITE_ 前缀暴露给客户端）',
    category: 'frontend',
    variables: [
      { key: 'VITE_APP_TITLE', placeholder: 'My App', comment: '应用标题，显示在浏览器标签页', isSensitive: false, expectedType: 'string', required: true },
      { key: 'VITE_API_BASE_URL', placeholder: 'https://api.example.com', comment: '后端 API 基础地址', isSensitive: false, expectedType: 'url', required: true },
      { key: 'VITE_API_TIMEOUT', placeholder: '10000', comment: '请求超时时间（毫秒）', isSensitive: false, expectedType: 'number' },
      { key: 'VITE_PUBLIC_PATH', placeholder: '/', comment: '静态资源公共路径', isSensitive: false, expectedType: 'string' },
      { key: 'VITE_ENABLE_MOCK', placeholder: 'false', comment: '是否启用 Mock 数据', isSensitive: false, expectedType: 'boolean' },
      { key: 'VITE_SENTRY_DSN', placeholder: 'https://xxx@sentry.io/xxx', comment: 'Sentry 错误监控 DSN', isSensitive: true, expectedType: 'url' },
    ],
  },
  {
    id: 'frontend-cdn',
    name: 'CDN / 静态资源',
    description: '前端静态资源 CDN 与第三方服务配置',
    category: 'frontend',
    variables: [
      { key: 'VITE_CDN_BASE', placeholder: 'https://cdn.example.com', comment: 'CDN 基础地址', isSensitive: false, expectedType: 'url', required: true },
      { key: 'VITE_ASSETS_DIR', placeholder: 'assets', comment: '静态资源目录', isSensitive: false, expectedType: 'string' },
      { key: 'VITE_GA_ID', placeholder: 'G-XXXXXXXXXX', comment: 'Google Analytics ID', isSensitive: true },
      { key: 'VITE_ALGOLIA_ID', placeholder: 'XXX', comment: 'Algolia 搜索 App ID', isSensitive: true },
      { key: 'VITE_ALGOLIA_KEY', placeholder: 'xxx', comment: 'Algolia 搜索 API Key', isSensitive: true },
    ],
  },

  // ===== Python =====
  {
    id: 'python-django',
    name: 'Django',
    description: 'Django 项目常用配置（SECRET_KEY / DEBUG / 数据库）',
    category: 'python',
    variables: [
      { key: 'DJANGO_SETTINGS_MODULE', placeholder: 'myproject.settings', comment: 'Settings 模块路径', isSensitive: false, expectedType: 'string', required: true },
      { key: 'DJANGO_SECRET_KEY', placeholder: 'django-insecure-change-me', comment: 'Django 密钥，生产环境必须替换', isSensitive: true, required: true },
      { key: 'DJANGO_DEBUG', placeholder: 'False', comment: '调试模式（生产必须为 False）', isSensitive: false, expectedType: 'boolean', required: true },
      { key: 'DJANGO_ALLOWED_HOSTS', placeholder: 'example.com,www.example.com', comment: '允许的主机名（逗号分隔）', isSensitive: false, expectedType: 'string', required: true },
      { key: 'DATABASE_URL', placeholder: 'postgres://user:pass@localhost:5432/db', comment: '数据库连接串', isSensitive: true, expectedType: 'url' },
      { key: 'DJANGO_STATIC_URL', placeholder: '/static/', comment: '静态文件 URL 前缀', isSensitive: false, expectedType: 'string' },
    ],
  },
  {
    id: 'python-fastapi',
    name: 'FastAPI',
    description: 'FastAPI / Starlette 项目常用配置',
    category: 'python',
    variables: [
      { key: 'APP_NAME', placeholder: 'my-api', comment: '应用名称', isSensitive: false, expectedType: 'string', required: true },
      { key: 'APP_VERSION', placeholder: '1.0.0', comment: '应用版本', isSensitive: false, expectedType: 'string' },
      { key: 'API_PREFIX', placeholder: '/api/v1', comment: 'API 路径前缀', isSensitive: false, expectedType: 'string' },
      { key: 'JWT_SECRET', placeholder: 'your-jwt-secret', comment: 'JWT 签名密钥', isSensitive: true, required: true },
      { key: 'JWT_ALGORITHM', placeholder: 'HS256', comment: 'JWT 签名算法', isSensitive: false, expectedType: 'string' },
      { key: 'JWT_EXPIRE_MINUTES', placeholder: '60', comment: 'JWT 过期时间（分钟）', isSensitive: false, expectedType: 'number' },
      { key: 'CORS_ORIGINS', placeholder: 'http://localhost:3000,http://localhost:5173', comment: '允许的跨域来源（逗号分隔）', isSensitive: false, expectedType: 'string' },
    ],
  },
  {
    id: 'python-flask',
    name: 'Flask',
    description: 'Flask 项目常用配置',
    category: 'python',
    variables: [
      { key: 'FLASK_APP', placeholder: 'app.py', comment: '应用入口模块', isSensitive: false, expectedType: 'string', required: true },
      { key: 'FLASK_ENV', placeholder: 'production', comment: '运行环境', isSensitive: false, expectedType: 'string' },
      { key: 'FLASK_DEBUG', placeholder: '0', comment: '调试模式（0/1）', isSensitive: false, expectedType: 'boolean' },
      { key: 'SECRET_KEY', placeholder: 'your-secret-key', comment: 'Flask 会话密钥', isSensitive: true, required: true },
      { key: 'SQLALCHEMY_DATABASE_URI', placeholder: 'sqlite:///app.db', comment: 'SQLAlchemy 数据库 URI', isSensitive: true, expectedType: 'url' },
    ],
  },
]

/** 按分类获取模板 */
export function getTemplatesByCategory(category: ConfigTemplate['category']): ConfigTemplate[] {
  return BUILTIN_TEMPLATES.filter((t) => t.category === category)
}

/** 根据 id 获取模板 */
export function getTemplateById(id: string): ConfigTemplate | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id)
}

/** 分类标签 */
export const CATEGORY_LABELS: Record<ConfigTemplate['category'], string> = {
  general: '通用',
  frontend: '前端',
  python: 'Python',
  custom: '自定义',
}
