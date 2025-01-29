import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}
if (location.hostname === 'localhost') {
	self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}
const app = initializeApp(firebaseConfig)
initializeAppCheck(app, {
	provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
	isTokenAutoRefreshEnabled: true,
})
const auth = getAuth(app)
const realtimeDB = getDatabase(app)
const firestoreDB = getFirestore(app)
const functions = getFunctions(app, 'asia-southeast1')
if (location.hostname === 'localhost') {
	connectDatabaseEmulator(realtimeDB, '127.0.0.1', 9000)
	connectAuthEmulator(auth, 'http://127.0.0.1:9099')
	connectFirestoreEmulator(firestoreDB, '127.0.0.1', 8080)
	connectFunctionsEmulator(functions, 'localhost', 5001)
}

export { auth, firestoreDB, realtimeDB, functions }
