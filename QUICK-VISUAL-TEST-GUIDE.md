# 🎯 QUICK VISUAL TEST GUIDE
**While Monitoring Runs in Background (1 Hour)**

## 🔗 **TEST NOW - VISUAL VERIFICATION:**

### **1. 🎨 ENERGYCUBE ANIMATIONS (PR #194)**
**URL:** https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app

**What to look for:**
- [ ] **3D ribbon animations** in background
- [ ] **Ribbons morphing into cube** shape
- [ ] **Orange/amber color scheme** (not pink)
- [ ] **Smooth WebGL rendering** (no lag)
- [ ] **No solid pink EnergyCube** (should be animated)

**Quick check:**
1. Open the URL in Chrome/Firefox
2. Look for moving 3D elements
3. Check browser console (F12) for Three.js logs
4. Verify orange colors throughout

### **2. 🔐 FOUNDERSPASS FLOW (Issue #79)**
**URL:** https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app/founderspass

**Test steps:**
1. [ ] **Open login page** - Should see PIN field
2. [ ] **Enter PIN:** `2026`
3. [ ] **Click Submit** - Should redirect to dashboard
4. [ ] **Dashboard loads** - Feature toggle UI visible
5. [ ] **Test toggles** - Click some feature switches
6. [ ] **Refresh page** - Changes should persist (database)

**Expected:**
- Login page with "Founders Pass" title
- Successful authentication with PIN 2026
- Dashboard with list of features
- Toggle switches that change state
- Database persistence after refresh

### **3. 🏗️ UI STRUCTURE (PR #195)**
**URL:** https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app

**Visual checks:**
- [ ] **Clean layout** - No overlapping elements
- [ ] **Orange accents** - Consistent color scheme
- [ ] **Responsive design** - Works on mobile/desktop
- [ ] **No visual glitches** - Check all sections
- [ ] **Typography** - Readable, well-spaced

**Quick test:**
1. Resize browser window
2. Check different screen sizes
3. Scroll through entire page
4. Look for broken images/elements

### **4. 🌐 DOMAIN REDIRECT**
**URL:** https://cubiqo.ai

**Check:**
- [ ] **Redirects** to www.cubiqo.ai
- [ ] **All features work** via domain
- [ ] **SSL certificate** valid (🔒 in address bar)
- [ ] **No mixed content warnings**

## ⚡ **QUICK TEST SCRIPT (Copy & Paste):**

```bash
# 1. Test EnergyCube (open in browser):
https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app

# 2. Test FoundersPass:
https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app/founderspass
# PIN: 2026

# 3. Test domain:
https://cubiqo.ai

# 4. Check browser console (F12):
# Look for:
# - Three.js initialization
# - WebGL context created
# - No critical errors
```

## 📊 **MONITORING STATUS:**

**Background monitoring is running for 1 hour (until ~19:50 EST)**
- ✅ **Checking every 5 minutes:**
  1. Main deployment availability
  2. Domain redirect status  
  3. FoundersPass accessibility
  4. Database API connectivity

**Monitoring logs saved to:**
- `monitoring-log.json` - All check results
- `monitoring-alerts.json` - Any issues detected
- `monitoring-summary.json` - Final report (after 1 hour)

## 🚨 **WHAT TO WATCH FOR:**

### **Immediate Issues (Test Now):**
1. **EnergyCube not visible** - Check browser console for WebGL errors
2. **FoundersPass login fails** - Verify PIN 2026, check network tab
3. **UI looks broken** - Clear cache, try incognito mode
4. **Domain not redirecting** - DNS propagation may take time

### **Performance Issues:**
- **Slow loading** (> 3 seconds)
- **Janky animations** (low FPS)
- **High CPU usage** (check Task Manager)
- **Memory leaks** (monitor memory usage)

### **Functional Issues:**
- **Feature toggles don't persist** (database issue)
- **API endpoints return errors** (check network tab)
- **Missing features** (compare with PR deployment)

## 🔧 **TROUBLESHOOTING:**

### **If EnergyCube Not Showing:**
1. Check browser supports WebGL: https://get.webgl.org
2. Disable ad-blockers/extensions
3. Try different browser (Chrome recommended)
4. Check console for Three.js errors

### **If FoundersPass Fails:**
1. Clear browser cache and cookies
2. Try incognito/private mode
3. Check network tab for API errors
4. Verify Supabase connection (API status)

### **If UI Looks Wrong:**
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Check CSS loading (network tab)
3. Verify all assets load (images, fonts)
4. Test on different device/browser

## 📈 **TEST RESULTS TRACKING:**

### **Visual Test Results:**
- [ ] EnergyCube animations visible and smooth
- [ ] Orange color scheme correct
- [ ] FoundersPass login works (PIN: 2026)
- [ ] Feature toggles work and persist
- [ ] Dashboard UI loads correctly
- [ ] Domain redirects properly
- [ ] No visual glitches or errors
- [ ] Responsive design works

### **Performance Results:**
- [ ] Page loads in < 3 seconds
- [ ] Animations run at > 30 FPS
- [ ] No console errors
- [ ] API responses < 1 second
- [ ] Database queries fast

## 🎯 **PRIORITY TESTS:**

### **CRITICAL (Test Now):**
1. ✅ EnergyCube animations visible
2. ✅ FoundersPass authentication works
3. ✅ Database connectivity (toggles persist)

### **IMPORTANT (Test within 15min):**
1. ✅ UI structure correct on all screen sizes
2. ✅ All navigation works
3. ✅ No JavaScript errors in console

### **NICE-TO-HAVE (Test within 1 hour):**
1. ✅ Performance under load
2. ✅ Edge cases (offline, slow network)
3. ✅ Cross-browser compatibility

## 📱 **TEST ON MULTIPLE DEVICES:**

### **Recommended:**
1. **Desktop Chrome** - Primary testing
2. **Desktop Firefox** - Cross-browser check
3. **Mobile Chrome** - Responsive test
4. **Tablet Safari** - iOS compatibility

## ⏰ **TIMELINE:**

### **Now (18:50-19:00 EST):**
- [ ] Quick visual tests
- [ ] FoundersPass flow test
- [ ] Domain verification

### **Next 30min (19:00-19:30 EST):**
- [ ] Monitor background checks
- [ ] Test edge cases
- [ ] Performance testing

### **Final 30min (19:30-20:00 EST):**
- [ ] Review monitoring results
- [ ] Document any issues
- [ ] Final verification

## 🎉 **SUCCESS CRITERIA:**

### **Deployment Successful If:**
1. ✅ EnergyCube animations visible to users
2. ✅ FoundersPass board fully functional
3. ✅ Database connected and persisting data
4. ✅ No regressions in existing features
5. ✅ Monitoring shows >95% uptime

### **Issue #79 Solved If:**
1. ✅ FoundersPass login works (PIN: 2026)
2. ✅ Feature toggle UI loads
3. ✅ Toggle changes persist in database
4. ✅ Dashboard accessible to founders

---
**Monitoring Active**: ✅ Yes (1 hour)  
**Next Check**: 18:55 EST  
**Final Report**: 19:50 EST  
**Status**: All systems operational, testing recommended