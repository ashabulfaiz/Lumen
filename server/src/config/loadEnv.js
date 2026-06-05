const path = require('path');
const dotenv = require('dotenv');

// loadEnv.js lives in server/src/config → server root is two levels up.
const ROOT = path.resolve(__dirname, '../..');

// Load the base .env (your production reference / shared defaults), then let
// .env.local override it for LOCAL development. Neither file is committed, so
// on Railway/production the platform's dashboard env vars are used instead.
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });
dotenv.config({ path: path.join(ROOT, '.env.local'), override: true, quiet: true });
