# 🔐 GitHub Secrets Setup Instructions

## Значения для добавления в GitHub Secrets

Зайди на: https://github.com/devStar0604/cubiqo/settings/secrets/actions

Добавь эти 3 секрета (New repository secret):

---

### 1. VERCEL_TOKEN

**Value:** `<токен который ты только что создал на vercel.com/account/tokens>`

---

### 2. VERCEL_PROJECT_ID

**Value:**
```
prj_OLFZNZ59NDO5kw8owiPQOhhOIdYZ
```

---

### 3. VERCEL_ORG_ID

**Value:**
```
team_Q25fvpJOPiIeoG3hfxtCVkhW
```

---

## Или через GitHub CLI (автоматически):

Если у тебя установлен `gh` CLI:

```bash
# Залогинься в GitHub CLI (если ещё не залогинен)
gh auth login

# Добавь секреты (замени YOUR_VERCEL_TOKEN на реальный токен)
gh secret set VERCEL_TOKEN --body "YOUR_VERCEL_TOKEN"
gh secret set VERCEL_PROJECT_ID --body "prj_OLFZNZ59NDO5kw8owiPQOhhOIdYZ"
gh secret set VERCEL_ORG_ID --body "team_Q25fvpJOPiIeoG3hfxtCVkhW"
```

---

## Проверка

После добавления, проверь что все 3 секрета появились:
https://github.com/devStar0604/cubiqo/settings/secrets/actions

Должны быть:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_PROJECT_ID
- ✅ VERCEL_ORG_ID
