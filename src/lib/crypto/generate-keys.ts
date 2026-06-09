import { randomBytes } from 'crypto';

export function generateHexKey(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

if (require.main === module) {
  console.log(generateHexKey());
}
