# ⏳ TODO: Активация автоматического деплоя

## 🎯 Статус: Готово к активации, ожидает доступов к GitHub

---

## ✅ Что уже сделано:

1. ✅ GitHub Actions workflows созданы:
   - `.github/workflows/deploy-staging.yml` - автодеплой develop → staging.cubiqo.ai
   - `.github/workflows/deploy-production.yml` - автодеплой main → cubiqo.ai

2. ✅ Project/Org IDs получены:
   - `VERCEL_PROJECT_ID`: `prj_OLFZNZ59NDO5kw8owiPQOhhOIdYZ`
   - `VERCEL_ORG_ID`: `team_Q25fvpJOPiIeoG3hfxtCVkhW`

3. ✅ Документация создана:
   - `DEPLOYMENT.md` - полная инструкция
   - `GITHUB_SECRETS_SETUP.md` - инструкция по настройке секретов
   - `setup-github-secrets.sh` - скрипт для автоматической настройки

4. ⚠️ Файлы находятся ЛОКАЛЬНО (не закоммичены в Git):
   - Готовы к передаче админу для активации
   - Токен нужно будет создать новый от аккаунта админа

---

## 🔧 Что нужно сделать АДМИНУ (когда будут доступы):

### Шаг 0: Создать Vercel Token от аккаунта админа

⚠️ **ВАЖНО:** Токен нужно создать от аккаунта АДМИНА, не использовать временный токен разработчика!

1. Залогиниться в Vercel под аккаунтом админа
2. Открыть: https://vercel.com/account/tokens
3. Создать новый токен: `github-actions-cubiqo`
4. Scope: `Full Account` или только `denis-projects-d7156840`
5. Скопировать токен (показывается только один раз!)

### Шаг 1: Добавить GitHub Secrets

Зайти на: https://github.com/devStar0604/cubiqo/settings/secrets/actions

Нажать **"New repository secret"** 3 раза и добавить:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | `<токен созданный админом на шаге 0>` |
| `VERCEL_PROJECT_ID` | `prj_OLFZNZ59NDO5kw8owiPQOhhOIdYZ` |
| `VERCEL_ORG_ID` | `team_Q25fvpJOPiIeoG3hfxtCVkhW` |

---

### Шаг 2: Закоммитить workflows в Git

⚠️ **Файлы находятся ЛОКАЛЬНО** (не в Git репозитории)

```bash
# Добавить все файлы автодеплоя
git add .github/ DEPLOYMENT.md GITHUB_SECRETS_SETUP.md TODO_ACTIVATE_AUTO_DEPLOY.md setup-github-secrets.sh

# Закоммитить
git commit -m "feat: add GitHub Actions auto-deploy infrastructure"

# Запушить в develop (или main, в зависимости от workflow)
git push origin develop
```

---

### Шаг 3: Протестировать

После добавления секретов:

```bash
# Создай тестовый коммит
echo "test auto-deploy" >> README.md
git add README.md
git commit -m "test: verify auto-deploy works"
git push origin develop
```

Затем:
1. Зайди на: https://github.com/devStar0604/cubiqo/actions
2. Увидишь запущенный workflow "Deploy to Staging"
3. Через 1-2 минуты: https://staging.cubiqo.ai/ обновится

---

## 🎉 После активации

### Автоматически будет работать:

```bash
# Push в develop → staging.cubiqo.ai обновляется
git push origin develop

# Push в main → cubiqo.ai обновляется
git push origin main
```

Больше не нужно:
- ❌ Вручную запускать `vercel deploy`
- ❌ Вручную обновлять `vercel alias set`
- ❌ Заходить в Vercel Dashboard

Всё работает автоматически! 🚀

---

## 📞 Контакты для помощи

Если возникнут проблемы при активации:
1. Проверь логи в GitHub Actions: https://github.com/devStar0604/cubiqo/actions
2. Проверь что все 3 секрета добавлены
3. Проверь что токен валиден (не истёк)

---

**Файл создан:** 2025-10-20
**Статус:** Ожидает доступов к репозиторию
