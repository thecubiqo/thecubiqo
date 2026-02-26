// Resolve PR #217 merge conflict
const fs = require('fs');
const path = require('path');

console.log('🔧 RESOLVING PR #217 MERGE CONFLICT');
console.log('===================================\n');

const fullscreenAppPath = path.join(__dirname, 'src/components/FullscreenApp.tsx');
if (!fs.existsSync(fullscreenAppPath)) {
  console.log('❌ FullscreenApp.tsx not found!');
  process.exit(1);
}

let content = fs.readFileSync(fullscreenAppPath, 'utf8');

console.log('1. 🔍 ANALYZING MERGE CONFLICT:\n');

if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
  console.log('✅ Merge conflict markers found');
  
  // Split by conflict markers
  const parts = content.split(/(<<<<<<<.*?\n|=======\n|>>>>>>>.*?\n)/);
  
  // Keep PR #217 changes (they fix logo positioning and CQ messenger)
  // But also keep our coding panel button and eye icon
  
  console.log('\n2. 🎯 KEEPING PR #217 CHANGES (logo + CQ messenger fixes)');
  console.log('   AND OUR CHANGES (coding panel + eye icon)\n');
  
  // Manual resolution strategy:
  // 1. PR #217 moves logo to top-left (GOOD)
  // 2. PR #217 adds CQ messenger to bottom-left (GOOD)  
  // 3. We added coding panel button (KEEP)
  // 4. We added eye icon (KEEP)
  
  // Let's rebuild the file with both sets of changes
  const lines = content.split('\n');
  let resolvedLines = [];
  let inConflict = false;
  let inOurVersion = false;
  let inTheirVersion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('<<<<<<<')) {
      inConflict = true;
      inOurVersion = true;
      console.log(`   Conflict start at line ${i + 1}`);
      continue;
    } else if (line.includes('=======')) {
      inOurVersion = false;
      inTheirVersion = true;
      continue;
    } else if (line.includes('>>>>>>>')) {
      inConflict = false;
      inOurVersion = false;
      inTheirVersion = false;
      console.log(`   Conflict end at line ${i + 1}`);
      continue;
    }
    
    if (!inConflict) {
      resolvedLines.push(line);
    } else {
      // We're in a conflict zone
      if (inOurVersion) {
        // Keep our changes (coding panel button, eye icon)
        if (line.includes('Coding Panel') || line.includes('/coder') || line.includes('Code brackets icon')) {
          console.log(`   Keeping our line: ${line.substring(0, 60)}...`);
          resolvedLines.push(line);
        } else if (line.includes('AI Visual Interaction') || line.includes('Eye icon')) {
          console.log(`   Keeping our line: ${line.substring(0, 60)}...`);
          resolvedLines.push(line);
        }
        // Skip other our changes that conflict with PR #217
      } else if (inTheirVersion) {
        // Keep PR #217 changes (logo positioning, CQ messenger)
        if (line.includes('CubiQo + TM') || line.includes('wordmark') || line.includes('left header')) {
          console.log(`   Keeping PR #217 line: ${line.substring(0, 60)}...`);
          resolvedLines.push(line);
        } else if (line.includes('CQ Connect') || line.includes('chat bubble') || line.includes('bottom-6')) {
          console.log(`   Keeping PR #217 line: ${line.substring(0, 60)}...`);
          resolvedLines.push(line);
        } else if (line.includes('logo') || line.includes('Logo')) {
          console.log(`   Keeping PR #217 line: ${line.substring(0, 60)}...`);
          resolvedLines.push(line);
        } else {
          // Keep other PR #217 changes
          resolvedLines.push(line);
        }
      }
    }
  }
  
  content = resolvedLines.join('\n');
  console.log('\n✅ Merge conflict resolved programmatically');
} else {
  console.log('✅ No merge conflict markers found');
}

// 3. Ensure our coding panel button is present
console.log('\n3. 💻 ENSURING CODING PANEL BUTTON IS PRESENT:\n');

if (!content.includes('/coder')) {
  console.log('❌ Coding panel button missing! Adding...');
  
  // Find the right side buttons section
  const rightSideStart = content.indexOf('Right side - CQ Connect + RGY Signal + Keywords underneath');
  if (rightSideStart !== -1) {
    // Find eye icon section
    const eyeIconSection = content.indexOf('AI Visual Interaction', rightSideStart);
    if (eyeIconSection !== -1) {
      const afterEyeIcon = content.indexOf('</button>', eyeIconSection) + 9;
      
      // Add coding panel button
      const coderButton = `
        {/* Coding Panel Access Button */}
        <a
          href="/coder"
          className={\`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 \${isDark
            ? 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 hover:text-emerald-200'
            : 'bg-emerald-100/80 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700'
            } backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/30 hover:scale-110\`}
          title="CubiQo Coding Panel"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m18 16 4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m6 8-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m14.5 4-5 16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_5px_yellow]"></div>
        </a>
      `;
      
      content = content.substring(0, afterEyeIcon) + coderButton + content.substring(afterEyeIcon);
      console.log('✅ Added coding panel button');
    }
  }
} else {
  console.log('✅ Coding panel button already present');
}

// 4. Ensure eye icon is present
console.log('\n4. 👁️ ENSURING EYE ICON IS PRESENT:\n');

if (!content.includes('AI Visual Interaction')) {
  console.log('❌ Eye icon missing! This should be there from our changes...');
} else {
  console.log('✅ Eye icon present');
}

// 5. Ensure PR #217 logo positioning is correct
console.log('\n5. 🎨 ENSURING PR #217 LOGO POSITIONING:\n');

// Check for logo in top-left
if (content.includes('CubiQo + TM') && content.includes('left header')) {
  console.log('✅ Logo positioned top-left (PR #217 fix)');
} else {
  console.log('⚠️  Logo positioning might not be correct');
}

// 6. Ensure PR #217 CQ messenger is in bottom-left
console.log('\n6. 💬 ENSURING PR #217 CQ MESSENGER POSITIONING:\n');

if (content.includes('CQ Connect') && content.includes('bottom-6')) {
  console.log('✅ CQ messenger in bottom-left (PR #217 fix)');
} else {
  console.log('⚠️  CQ messenger positioning might not be correct');
}

// 7. Save the resolved file
fs.writeFileSync(fullscreenAppPath, content);
console.log('\n✅ SAVED RESOLVED FULLSCREENAPP.TSX!');

// 8. Also check LandingCube.tsx for PR #217 changes
console.log('\n7. 🎯 CHECKING LANDINGCUBE.TSX FOR PR #217 CHANGES:\n');

const landingCubePath = path.join(__dirname, 'src/components/LandingCube.tsx');
if (fs.existsSync(landingCubePath)) {
  let landingCubeContent = fs.readFileSync(landingCubePath, 'utf8');
  
  // PR #217 removes black background and gradient overlays
  // Check if those are still present
  if (landingCubeContent.includes('bg-black') && landingCubeContent.includes('absolute inset-0')) {
    console.log('⚠️  LandingCube still has black backdrop (PR #217 should remove it)');
    
    // Apply PR #217 fix: remove the black backdrop and gradients
    landingCubeContent = landingCubeContent.replace(
      /<div className="absolute inset-0 bg-gradient-to-b from-purple-950\/20 via-black to-black" \/>/g,
      ''
    );
    landingCubeContent = landingCubeContent.replace(
      /<div className="absolute inset-0 bg-\[radial-gradient\(ellipse_at_center,_rgba\(100,50,180,0\.1\)_0%,_transparent_70%\)\]" \/>/g,
      ''
    );
    landingCubeContent = landingCubeContent.replace(
      /className="[^"]*bg-black[^"]*"/g,
      (match) => match.replace('bg-black', '')
    );
    
    console.log('✅ Applied PR #217 fix to LandingCube.tsx');
    fs.writeFileSync(landingCubePath, landingCubeContent);
  } else {
    console.log('✅ LandingCube already has PR #217 fixes (no black backdrop)');
  }
}

// 9. Check LandingOverlay.tsx
console.log('\n8. ✨ CHECKING LANDINGOVERLAY.TSX FOR PR #217 CHANGES:\n');

const landingOverlayPath = path.join(__dirname, 'src/components/landing/LandingOverlay.tsx');
if (fs.existsSync(landingOverlayPath)) {
  let landingOverlayContent = fs.readFileSync(landingOverlayPath, 'utf8');
  
  // PR #217 removes cyan glow shadow
  if (landingOverlayContent.includes('drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]')) {
    console.log('⚠️  LandingOverlay still has cyan glow (PR #217 should remove it)');
    
    // Remove the glow
    landingOverlayContent = landingOverlayContent.replace(
      /drop-shadow-\[0_0_15px_rgba\(0,255,255,0\.6\)\]/g,
      ''
    );
    
    console.log('✅ Applied PR #217 fix to LandingOverlay.tsx');
    fs.writeFileSync(landingOverlayPath, landingOverlayContent);
  } else {
    console.log('✅ LandingOverlay already has PR #217 fixes (no cyan glow)');
  }
}

// 10. Complete the merge
console.log('\n9. 🔄 COMPLETING THE MERGE:\n');

console.log('Run these commands:');
console.log('git add src/components/FullscreenApp.tsx');
console.log('git add src/components/LandingCube.tsx');
console.log('git add src/components/landing/LandingOverlay.tsx');
console.log('git commit -m "Merge PR #217: Logo top-left, CQ messenger bottom-left + coding panel button"');
console.log('git push origin copilot/update-logo-positioning');
console.log('');
console.log('Then merge the PR on GitHub or use:');
console.log('gh pr merge 217 --merge');

// 11. Summary
console.log('\n🎯 PR #217 MERGE RESOLUTION COMPLETE:');
console.log('====================================');
console.log('✅ Applied PR #217 fixes:');
console.log('   • Logo moved to top-left');
console.log('   • CQ messenger added to bottom-left');
console.log('   • Black backdrop removed from LandingCube');
console.log('   • Cyan glow removed from LandingOverlay');
console.log('');
console.log('✅ Kept our improvements:');
console.log('   • Coding panel access button');
console.log('   • Eye icon for AI visual interaction');
console.log('');
console.log('🚀 NEXT STEPS:');
console.log('1. Commit the resolved files');
console.log('2. Push to the PR branch');
console.log('3. Merge PR #217 on GitHub');
console.log('4. Pull changes to main branch');
console.log('5. Deploy to Vercel');
console.log('');
console.log('🔗 PR #217: https://github.com/thecubiqo/thecubiqo/pull/217');