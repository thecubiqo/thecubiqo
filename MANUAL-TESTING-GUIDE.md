# 🎯 MANUAL TESTING GUIDE - PR DEPLOYMENT
**For: End-to-End Merge Verification**  
**Deployment**: PR Preview (Ready Now)  
**Production**: Still Deploying (Check in 10min)

## 🔗 **ACCESS LINKS:**

### **PR Deployment (Test Now):**
- **Home**: https://cubiqo-repo-git-copilot-fix-ui-a226a1-cubiqo-projects-d7156840.vercel.app
- **FoundersPass**: Add `/founderspass` to above URL
- **PIN**: `2026`

### **Production (Check Soon):**
- **Primary**: https://cubiqo.ai
- **Direct**: https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app

## 🎨 **TEST 1: ENERGYCUBE ANIMATIONS (PR #194)**

### **What to Verify:**
- ✅ Ribbons morph into cube animation
- ✅ Orange "soul" design restored
- ✅ PlasmaWaveField replaced with EnergyCubeScene
- ✅ Smooth 3D animations

### **Testing Steps:**
1. **Visit homepage** (PR deployment URL)
2. **Look for 3D animations** in the background
3. **Check if ribbons** transform into a cube
4. **Verify orange color scheme** (not pink)
5. **Test animations** on different screen sizes

### **Expected Result:**
- Should see flowing ribbon animations
- Ribbons should morph into cube shape
- Orange/amber color palette
- No solid pink EnergyCube

### **Visual Indicators:**
- Look for WebGL canvas element
- Check browser console for Three.js logs
- Verify FPS is smooth (>30fps)

## 🏗️ **TEST 2: UI CUBOID STRUCTURE (PR #195)**

### **What to Verify:**
- ✅ Correct cuboid layout structure
- ✅ Orange design elements preserved
- ✅ No visual glitches or overlaps
- ✅ Responsive design works

### **Testing Steps:**
1. **Check overall layout** structure
2. **Verify orange accents** throughout UI
3. **Test responsive design** (resize browser)
4. **Check for any visual bugs**
5. **Verify typography** and spacing

### **Expected Result:**
- Clean, structured layout
- Consistent orange color scheme
- No broken elements or overlaps
- Works on mobile and desktop

### **Visual Checks:**
- Navigation menu structure
- Content sections alignment
- Button styles and hover effects
- Color consistency

## 🔐 **TEST 3: FOUNDERSPASS BOARD (Issue #79)**

### **What to Verify:**
- ✅ Login page accessible
- ✅ PIN authentication works (2026)
- ✅ Dashboard loads with feature toggles
- ✅ UI for toggling features exists

### **Testing Steps:**
1. **Go to `/founderspass`**
2. **Enter PIN**: `2026`
3. **Click Submit**
4. **Verify redirect** to dashboard
5. **Check feature toggle UI**

### **Expected Result:**
- Login page with PIN field
- Successful authentication
- Dashboard with feature list
- Toggle switches for each feature

### **Note on API:**
- **PR deployment**: API will fail (no Supabase)
- **Production**: API should work (has database)
- **UI should still load** with fallback defaults

## 📝 **TEST 4: CONTENT PUBLISHING (cpsite)**

### **What to Verify:**
- ✅ Content management features exist
- ✅ Editor interfaces accessible
- ✅ Publishing workflows available
- ✅ Integration with main site

### **Testing Steps:**
1. **Look for "Content" or "Publish"** in navigation
2. **Check for admin/editor** sections
3. **Test content creation** if available
4. **Verify published content** appears on site

### **Expected Result:**
- Content management system accessible
- Editor with formatting tools
- Preview/publish functionality
- Integration with site architecture

## 🔧 **TEST 5: FEATURE TOGGLE FUNCTIONALITY**

### **What to Verify:**
- ✅ Feature toggle UI exists
- ✅ Toggle switches work (UI side)
- ✅ Changes reflect in UI
- ✅ Dashboard layout is usable

### **Testing Steps:**
1. **Access dashboard** after login
2. **Find feature list** with toggles
3. **Toggle some features** on/off
4. **Check if UI updates** immediately
5. **Test search/filter** if available

### **Expected Result:**
- List of features with descriptions
- Toggle switches for each feature
- Visual feedback when toggling
- Categories or grouping of features

## ⚠️ **KNOWN LIMITATIONS (PR DEPLOYMENT):**

### **1. Database/API Connections:**
- ❌ Supabase not configured in PR builds
- ❌ API endpoints return 500 errors
- ✅ UI still loads with fallback data
- ✅ FoundersPass login works (client-side)

### **2. Environment Variables:**
- PR deployments don't get production env vars
- Database connections fail intentionally
- This is normal Vercel behavior

### **3. Production vs PR Differences:**
- **PR**: UI works, API fails (expected)
- **Production**: Both UI and API should work
- **Test UI now**, test API after production deploy

## 🎯 **PRIORITY TESTING ORDER:**

### **Phase 1: Visual/UI Tests (Do Now on PR)**
1. ✅ EnergyCube animations
2. ✅ UI cuboid structure  
3. ✅ FoundersPass login page
4. ✅ Dashboard UI layout
5. ✅ Overall visual design

### **Phase 2: Functional Tests (After Production)**
1. 🔄 FoundersPass authentication
2. 🔄 Feature toggle persistence
3. 🔄 API endpoint functionality
4. 🔄 Database connectivity
5. 🔄 Full end-to-end workflows

## 📊 **TEST RESULTS TRACKING:**

### **PR Deployment Tests:**
- [ ] EnergyCube animations visible
- [ ] UI structure correct
- [ ] Orange design preserved
- [ ] FoundersPass login page works
- [ ] Dashboard UI loads
- [ ] Feature toggle UI exists
- [ ] No visual glitches

### **Production Tests (After Deployment):**
- [ ] FoundersPass authentication works
- [ ] Feature toggles persist
- [ ] API endpoints return data
- [ ] Database connections work
- [ ] All features functional

## 🔍 **TROUBLESHOOTING:**

### **If EnergyCube Not Visible:**
1. Check browser console for errors
2. Verify WebGL is enabled
3. Check if ad-blocker is interfering
4. Try different browser

### **If FoundersPass Fails:**
1. Verify PIN: `2026`
2. Check browser console
3. Clear browser cache
4. Try incognito mode

### **If UI Looks Broken:**
1. Check browser zoom level
2. Clear cache and hard reload
3. Test different screen sizes
4. Check console for CSS errors

## 🚀 **NEXT STEPS:**

### **Immediate (Now):**
1. **Test PR deployment** visually
2. **Verify EnergyCube animations**
3. **Check UI structure**
4. **Test FoundersPass UI**

### **Short-term (10-15min):**
1. **Monitor production deployment**
2. **Test production when ready**
3. **Verify API/database functionality**
4. **Complete end-to-end testing**

### **Post-Deployment:**
1. **Document any issues found**
2. **Update deployment status**
3. **Celebrate successful merge!** 🎉

---
**Test Environment**: PR Deployment  
**Status**: Ready for visual testing  
**Production ETA**: 19:00 EST  
**PIN**: 2026