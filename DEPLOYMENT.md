# 🚀 Deployment Guide - CUBIQO

## Автоматический деплой настроен через GitHub Actions

### Как это работает:

#### **develop → staging.cubiqo.ai**
Когда вы делаете `git push origin develop`, автоматически:
1. GitHub Actions запускает workflow
2. Код деплоится на Vercel
3. Домен **staging.cubiqo.ai** автоматически обновляется
4. Изменения видны через 1-2 минуты

#### **main → cubiqo.ai (production)**
Когда вы делаете `git push origin main`, автоматически:
1. GitHub Actions запускает workflow
2. Код деплоится на Vercel Production
3. Домен **cubiqo.ai** автоматически обновляется
4. Production обновлён!

---

## 🔧 Первичная настройка GitHub Secrets

Чтобы GitHub Actions работал, нужно один раз настроить секреты:

### 1. Получить VERCEL_TOKEN

```bash
vercel login
vercel token create
```

Скопируйте полученный токен.

### 2. Получить ORG_ID и PROJECT_ID

Они уже есть в файле `.vercel/project.json`:

```bash
cat .vercel/project.json
```

Выведет что-то вроде:
```json
{
  "projectId": "prj_OLFZNZ59NDO5kw8owiPQOhhOIdYZ",
  "orgId": "team_Q25fvpJOPiIeoG3hfxtCVkhW"
}
```

### 3. Добавить секреты в GitHub

Идём на GitHub: **Settings → Secrets and variables → Actions → New repository secret**

Добавляем 3 секрета:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | Токен из шага 1 |
| `VERCEL_ORG_ID` | `orgId` из `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` из `.vercel/project.json` |

**Готово!** 🎉

---

## 📋 Ежедневный workflow

### Разработка новых фич:

```bash
# 1. Работаешь в ветке develop
git checkout develop
git pull origin develop

# 2. Делаешь изменения
# ... редактируешь код ...

# 3. Коммитишь
git add .
git commit -m "feat: add new feature"

# 4. Пушишь в develop
git push origin develop

# ✅ Автоматически деплоится на staging.cubiqo.ai
```

### Релиз в production:

```bash
# 1. Мержишь develop в main
git checkout main
git pull origin main
git merge develop

# 2. Пушишь в main
git push origin main

# ✅ Автоматически деплоится на cubiqo.ai (production)
```

---

## 🛠️ Ручной деплой (если нужно)

Если GitHub Actions не работает или нужен срочный деплой:

### Staging:
```bash
git checkout develop
vercel deploy --yes
vercel alias set <deployment-url> staging.cubiqo.ai
```

### Production:
```bash
git checkout main
vercel deploy --prod --yes
vercel alias set <deployment-url> cubiqo.ai
```

---

## 🔍 Проверка статуса деплоя

### Через Vercel CLI:
```bash
# Список всех деплоев
vercel ls

# Статус последнего деплоя
vercel inspect <deployment-url>

# Список всех доменов
vercel alias ls
```

### Через GitHub:
1. Идём в **Actions** на GitHub
2. Смотрим на статус последнего workflow
3. Зелёная галочка ✅ = всё ок
4. Красный крестик ❌ = есть ошибка (смотрим логи)

---

## 📊 Текущая конфигурация

| Ветка | Домен | Environment | Автодеплой |
|-------|-------|-------------|------------|
| `develop` | staging.cubiqo.ai | Preview | ✅ Включён |
| `main` | cubiqo.ai | Production | ✅ Включён |

---

## ⚙️ Файлы конфигурации

- `.github/workflows/deploy-staging.yml` - Автодеплой develop → staging
- `.github/workflows/deploy-production.yml` - Автодеплой main → production
- `vercel.json` - Настройки Vercel (API endpoints, headers, cache)
- `.vercel/project.json` - ID проекта и организации

---

## 🚨 Troubleshooting

### Проблема: "Изменения не видны на staging.cubiqo.ai"

**Решение:**
1. Проверь, что пуш был в ветку `develop` (не в `main`)
2. Зайди в GitHub Actions и проверь, что workflow прошёл успешно
3. Подожди 1-2 минуты для DNS propagation
4. Сделай жёсткую перезагрузку страницы: `Cmd+Shift+R` (Mac) или `Ctrl+F5` (Windows)

### Проблема: "GitHub Action падает с ошибкой"

**Решение:**
1. Проверь, что все 3 секрета добавлены в GitHub
2. Проверь, что токен Vercel ещё валиден (не истёк)
3. Посмотри логи в GitHub Actions для детальной ошибки

### Проблема: "vercel alias set не работает"

**Решение:**
```bash
# Убедись, что домен уже добавлен в Vercel
vercel domains ls

# Если домена нет, добавь его
vercel domains add staging.cubiqo.ai
```

---

## 📝 Environment Variables

API ключи хранятся в Vercel Dashboard:

| Variable | Location | Used by |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Vercel Project Settings | `api/chat.js` |

Чтобы обновить:
```bash
vercel env add ANTHROPIC_API_KEY
```

---

**Вопросы?** Смотри [DEVELOPMENT-LOG.md](./DEVELOPMENT-LOG.md) для технических деталей.
