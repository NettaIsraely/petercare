import os from 'os';

function getLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) {
        continue;
      }
      if (net.address.startsWith('169.254.')) {
        continue;
      }
      candidates.push({ name, address: net.address });
    }
  }

  const preferred =
    candidates.find((c) => /wi-?fi|wlan|wireless/i.test(c.name)) ??
    candidates.find((c) => /ethernet|eth/i.test(c.name)) ??
    candidates[0];

  return preferred?.address ?? null;
}

const ip = getLanIp();
const port = process.env.API_PORT ?? '3000';

if (ip) {
  console.log('');
  console.log('Local API URL for Expo Go on a physical device:');
  console.log(`  http://${ip}:${port}`);
  console.log('');
  console.log(`Set in petercare-mobile/.env:`);
  console.log(`  EXPO_PUBLIC_API_URL=http://${ip}:${port}`);
  console.log('');
} else {
  console.warn('Could not detect a LAN IP. Run ipconfig and set EXPO_PUBLIC_API_URL manually.');
}
