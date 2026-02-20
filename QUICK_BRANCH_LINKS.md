# Quick Links - Production & Preview Branch Features

**Quick Reference for Branch Comparisons**

---

## 🔗 Branch Links

| Branch | URL |
|--------|-----|
| **Production** | https://github.com/thecubiqo/thecubiqo/tree/production |
| **Main** | https://github.com/thecubiqo/thecubiqo/tree/main |
| **Preview** | https://github.com/thecubiqo/thecubiqo/tree/preview |

**Compare:** https://github.com/thecubiqo/thecubiqo/compare/main...production

---

## 🔴 Production Branch - What's Extra?

**25 commits ahead of main | +1,519 lines**

### 1. Storybook Stories (8 files)
📂 **Location:** [src/components/stories/](https://github.com/thecubiqo/thecubiqo/tree/production/src/components/stories)

- [AuthButton.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/AuthButton.stories.tsx)
- [AuthNudgeModal.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/AuthNudgeModal.stories.tsx)
- [BYOSettings.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/BYOSettings.stories.tsx)
- [FullscreenApp.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/FullscreenApp.stories.tsx)
- [GettingStartedPanel.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/GettingStartedPanel.stories.tsx)
- [KeywordPanel.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/KeywordPanel.stories.tsx)
- [LoginForm.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/LoginForm.stories.tsx)
- [RGYChatsModal.stories.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/components/stories/RGYChatsModal.stories.tsx)

### 2. Admin Designs System
- **UI:** [src/app/admin/designs/page.tsx](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/admin/designs/page.tsx)
- **API:** [src/app/api/admin/designs/route.ts](https://github.com/thecubiqo/thecubiqo/blob/production/src/app/api/admin/designs/route.ts)

### 3. Enhanced Landing Configuration
- Environment-based landing variants
- Runtime validation
- Plasma Wave Field support

### 4. Production Hotfixes
- Build error fixes (ChatInput, turbopack)
- Dependency conflict resolutions  
- PR #92 conflict analysis docs

---

## 🟡 Preview Branch - What's Different?

**211 commits ahead, 356 behind main (diverged)**

**Browse:** https://github.com/thecubiqo/thecubiqo/tree/preview

### Unique Features:
- 7-Agent System (Blossom, Bubbles, Buttercup, Guy, Jo, Mo, Pushpa)
- Chromatic visual testing workflow
- TTS & voice improvements
- UI reorganization

⚠️ **Warning:** Preview is 356 commits behind - needs sync or archival

---

## 📋 Where Are These Files?

All production extras are in these locations:

```
src/
├── components/
│   └── stories/           ← 8 Storybook story files
├── app/
│   ├── admin/
│   │   └── designs/
│   │       └── page.tsx   ← Admin UI
│   └── api/
│       └── admin/
│           └── designs/
│               └── route.ts ← Admin API
```

**View folder:** https://github.com/thecubiqo/thecubiqo/tree/production/src

---

**For full details, see:** [BRANCH_LINKS_AND_FILE_LOCATIONS.md](BRANCH_LINKS_AND_FILE_LOCATIONS.md)
