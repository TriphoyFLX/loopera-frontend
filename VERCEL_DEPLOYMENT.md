# 🚀 Vercel Deployment Guide

## 📋 Настройка Vercel для Loopera

### 1. **Backend на Vercel (Serverless Functions)**

Если бэкенд тоже на Vercel:

```json
// vercel.json для бэкенда
{
  "version": 2,
  "builds": [
    {
      "src": "index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DB_HOST": "your-db-host.com",
    "DB_USER": "loopera_user",
    "DB_PASSWORD": "your-password",
    "DB_NAME": "loopera",
    "JWT_SECRET": "your-32-char-secret"
  }
}
```

### 2. **Frontend на Vercel с проксированием**

Текущий `vercel.json` уже настроен для проксирования:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://loopera-backend.vercel.app/api/$1"
    },
    {
      "src": "/uploads/(.*)", 
      "dest": "https://loopera-backend.vercel.app/uploads/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3. **Environment Variables в Vercel Dashboard**

В настройках проекта Vercel → Environment Variables:

```bash
# Для бэкенда
NODE_ENV=production
DB_HOST=your-db-host.com
DB_USER=loopera_user
DB_PASSWORD=secure_password
DB_NAME=loopera
JWT_SECRET=super_secure_32_char_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password

# Для фронтенда
VITE_API_URL=https://loopera-backend.vercel.app
```

### 4. **Деплой**

#### Frontend:
```bash
cd frontend-repo
npm run build
vercel --prod
```

#### Backend (если на Vercel):
```bash
cd backend-repo
vercel --prod
```

### 5. **Проверка проксирования**

После деплоя проверьте:

```bash
# API запросы должны проксироваться
curl https://your-vercel-app.vercel.app/api/health

# Статические файлы должны проксироваться
curl https://your-vercel-app.vercel.app/uploads/loops/filename.mp3
```

### 6. **Траблшутинг**

#### CORS ошибки:
```bash
# Проверьте CORS headers в бэкенде
curl -I https://your-backend-domain.com/api/health
```

#### Проксирование не работает:
1. Убедитесь, что `vercel.json` в корне проекта
2. Проверьте URL бэкенда в `routes`
3. Проверьте environment variables

#### Билд ошибки:
```bash
# Локально проверьте билд
npm run build
npm run preview
```

### 7. **Custom Domain**

1. В Vercel Dashboard → Domains
2. Добавьте ваш домен
3. Обновите `FRONTEND_URL` в `.env.production`
4. Переправьте `vercel.json` если нужно

### 8. **Оптимизация**

```json
// Добавить в vercel.json для кеширования
{
  "headers": [
    {
      "source": "/uploads/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 9. **Мониторинг**

В Vercel Dashboard:
- Functions tab → Логи serverless функций
- Analytics → Метрики производительности
- Speed Insights → Оптимизация загрузки

### 10. **Автоматический деплой**

```bash
# Подключите GitHub репозиторий
# Vercel будет автоматически деплоить при push
```

## 🔧 Альтернативный вариант: VPS + Vercel

Если бэкенд на VPS, а фронтенд на Vercel:

1. **VPS**: Деплой бэкенда через Docker
2. **Vercel**: Фронтенд с проксированием на VPS
3. **Обновите vercel.json**:
   ```json
   "dest": "https://your-vps-ip.com/api/$1"
   ```

## 📱 Тестирование

```bash
# Тест локально с Vercel CLI
vercel dev

# Тест продакшн билда
vercel --prod
```
