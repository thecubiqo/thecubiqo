// Check Vercel deployment status using the OIDC token
const https = require('https');

console.log('🔍 Checking Vercel Deployment Status via API...');
console.log('========================================\n');

// OIDC token from .env.local
const oidcToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9.eyJpc3MiOiJodHRwczovL29pZGMudmVyY2VsLmNvbS9jdWJpcW8tcHJvamVjdHMtZDcxNTY4NDAiLCJzdWIiOiJvd25lcjpjdWJpcW8tcHJvamVjdHMtZDcxNTY4NDA6cHJvamVjdDpjdWJpcW8tcmVwbzplbnZpcm9ubWVudDpkZXZlbG9wbWVudCIsInNjb3BlIjoib3duZXI6Y3ViaXFvLXByb2plY3RzLWQ3MTU2ODQwOnByb2plY3Q6Y3ViaXFvLXJlcG86ZW52aXJvbm1lbnQ6ZGV2ZWxvcG1lbnQiLCJhdWQiOiJodHRwczovL3ZlcmNlbC5jb20vY3ViaXFvLXByb2plY3RzLWQ3MTU2ODQwIiwib3duZXIiOiJjdWJpcW8tcHJvamVjdHMtZDcxNTY4NDAiLCJvd25lcl9pZCI6InRlYW1fUTI1ZnZwSk9QaUllb0czaGZ4dENWa2hXIiwicHJvamVjdCI6ImN1Ymlxby1yZXBvIiwicHJvamVjdF9pZCI6InByal8zak1NYmFZQmEzT05mZ3lHaE9PbHpZVTFsbElsIiwiZW52aXJvbm1lbnQiOiJkZXZlbG9wbWVudCIsInBsYW4iOiJwcm8iLCJ1c2VyX2lkIjoiNlBRRTFaSzlRUU5vOVlmUlpLNHpjcElGIiwibmJmIjoxNzcxODcyMDM4LCJpYXQiOjE3NzE4NzIwMzgsImV4cCI6MTc3MTkxNTIzOH0.aFk_SYQuu5UJIzH_ZlDXH2dW0a7c_oyMyOf2c0d0e7waRvNViHTVeijS3_6q8L_Nqcp9bolQN2pCB0pDfokMbasfzDvNuPMCk8_7NoMalA1dnzJXwgyEavGS-xJfwBdayKUczf6j3vkkI3a8pT58Xh1Bf7BlFTRJ8uQ6psd6tPNqNJLwppkbWktzvztW_2rT1Dg6k7qQ1lTa2mOtUMKJPH4UKVF5bY-4k21eSlWnm8KzJVXZ6gcJN6k-C72_2gXA9N_VEoQRQIQZbwKAYtveY64P63dbq4PpxNZiHjKBan_U3ZYKiQ-jmiM2YauK7RrOprNfTkexUK7iw_RMBTIanw";

// Project ID from .env.local
const projectId = "prj_3jMMbaYBa3ONfgyGhOOlzYU1llIl";
const teamId = "team_Q25fvpJOPiIeo3hfxtCVkhW";

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function checkDeployments() {
  console.log('📊 Fetching deployment list...\n');
  
  const options = {
    hostname: 'api.vercel.com',
    path: `/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${oidcToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const deployments = await makeRequest(options);
    
    if (deployments && deployments.deployments) {
      console.log(`✅ Found ${deployments.deployments.length} deployments\n`);
      
      deployments.deployments.forEach((deploy, index) => {
        console.log(`Deployment #${index + 1}:`);
        console.log(`  ID: ${deploy.uid}`);
        console.log(`  Name: ${deploy.name}`);
        console.log(`  URL: ${deploy.url}`);
        console.log(`  State: ${deploy.state}`);
        console.log(`  Created: ${new Date(deploy.createdAt).toLocaleString()}`);
        
        if (deploy.meta) {
          console.log(`  Git Branch: ${deploy.meta.githubCommitRef || 'N/A'}`);
          console.log(`  Git Commit: ${deploy.meta.githubCommitSha ? deploy.meta.githubCommitSha.substring(0, 7) : 'N/A'}`);
        }
        
        console.log(`  Ready State: ${deploy.readyState}`);
        console.log('');
      });
      
      // Check for main branch deployment
      const mainDeploy = deployments.deployments.find(d => 
        d.meta && d.meta.githubCommitRef === 'main'
      );
      
      if (mainDeploy) {
        console.log('🎯 MAIN BRANCH DEPLOYMENT:');
        console.log(`  URL: ${mainDeploy.url}`);
        console.log(`  State: ${mainDeploy.state}`);
        console.log(`  Ready: ${mainDeploy.readyState}`);
        console.log(`  Created: ${new Date(mainDeploy.createdAt).toLocaleString()}`);
        
        if (mainDeploy.readyState === 'READY') {
          console.log('\n✅ MAIN DEPLOYMENT IS READY!');
          console.log(`🔗 Access at: ${mainDeploy.url}`);
        } else if (mainDeploy.readyState === 'BUILDING') {
          console.log('\n🔄 MAIN DEPLOYMENT IS BUILDING...');
          console.log('   Check back in 2-5 minutes');
        } else if (mainDeploy.readyState === 'ERROR') {
          console.log('\n❌ MAIN DEPLOYMENT FAILED!');
          console.log('   Check Vercel dashboard for error logs');
        }
      } else {
        console.log('⚠️  No main branch deployment found in recent deployments');
      }
      
    } else {
      console.log('❌ No deployments data returned');
    }
    
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    console.log('\n📋 Alternative: Check Vercel dashboard manually:');
    console.log('   https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  }
  
  console.log('\n========================================');
  console.log('🎯 MANUAL CHECK RECOMMENDED:');
  console.log('1. Visit Vercel Dashboard:');
  console.log('   https://vercel.com/cubiqo-projects-d7156840/cubiqo-repo');
  console.log('2. Check "Deployments" tab');
  console.log('3. Look for latest main branch deployment');
  console.log('4. Monitor build logs if still building');
}

checkDeployments().catch(console.error);