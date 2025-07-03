const { db } = require('./firebaseConfig');

async function testFirebaseConnection() {
    try {
        // Try to access Firestore
        const testCollection = db.collection('test');
        await testCollection.add({
            test: true,
            timestamp: new Date()
        });
        console.log('✅ Firebase connection successful!');
        
        // Clean up test document
        const snapshot = await testCollection.where('test', '==', true).get();
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
}

// Run the test
testFirebaseConnection(); 