#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Runs before build to ensure all required environment variables are present
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_SUPPORT_WHATSAPP',
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required Variables:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.error(`  ❌ ${varName} - MISSING (REQUIRED)`);
    hasErrors = true;
  } else {
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
      : '***';
    console.log(`  ✅ ${varName} - Set (${maskedValue})`);
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.warn(`  ⚠️  ${varName} - Not set (optional)`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ ${varName} - Set`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.error('\n❌ VALIDATION FAILED!');
  console.error('\nMissing required environment variables.');
  console.error('\nFor local development:');
  console.error('  1. Copy .env.example to .env.local');
  console.error('  2. Fill in your actual values');
  console.error('\nFor Vercel deployment:');
  console.error('  1. Go to: https://vercel.com/[your-project]/settings/environment-variables');
  console.error('  2. Add all required variables');
  console.error('  3. Make sure to check all environments (Production, Preview, Development)');
  console.error('  4. Redeploy after adding variables\n');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('\n⚠️  Some optional variables are not set.');
  console.warn('The app will work, but some features may be limited.\n');
}

console.log('\n✅ All required environment variables are present!');
console.log('🚀 Proceeding with build...\n');


