import { db } from '../config/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

async function testFirebaseConnection() {
    try {
        // Try to add a test document to Firestore
        const testDoc = await addDoc(collection(db, 'test'), {
            message: 'Test connection',
            timestamp: new Date()
        });
        
        console.log('✅ Firebase connection successful! Document written with ID:', testDoc.id);
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
}

// Run the test
testFirebaseConnection(); 