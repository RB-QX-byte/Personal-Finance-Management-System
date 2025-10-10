import { verifyFirebaseToken } from './firebaseAuth.js';

// Use Firebase auth as the default authentication middleware
export const protect = verifyFirebaseToken;
