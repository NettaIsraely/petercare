import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const googleServicesPath = resolve(rootDir, 'google-services.json');

if (!existsSync(googleServicesPath)) {
  console.error(
    'Missing google-services.json. Copy your Firebase download to petercare-mobile/google-services.json',
  );
  console.error('See google-services.json.example for the expected structure.');
  process.exit(1);
}

const config = JSON.parse(readFileSync(googleServicesPath, 'utf8'));
const androidClient = config.client?.find(
  (entry) => entry.client_info?.android_client_info?.package_name,
);

if (!androidClient) {
  console.error('google-services.json has no Android client entry.');
  process.exit(1);
}

const packageName = androidClient.client_info.android_client_info.package_name;
if (packageName !== 'com.petercare.app') {
  console.error(
    `Expected package com.petercare.app but found ${packageName}.`,
  );
  process.exit(1);
}

const appId = androidClient.client_info.mobilesdk_app_id;
if (!appId || appId.includes('REPLACE') || appId.includes('YOUR_')) {
  console.error('google-services.json still contains a placeholder mobilesdk_app_id.');
  process.exit(1);
}

console.log('google-services.json looks valid for com.petercare.app.');
console.log(`Android app ID: ${appId}`);
console.log('');
console.log('Next: verify FCM V1 credentials in EAS:');
console.log('  eas credentials -p android');
console.log('  → Google Service Account → FCM V1');
console.log('');
console.log('Then build and install a new Android app:');
console.log('  eas build --platform android --profile preview');
