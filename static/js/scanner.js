// QR Code Scanner functionality
document.addEventListener('DOMContentLoaded', function() {
    const reader = document.getElementById('reader');
    if (reader) {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10,
                qrbox: 250
            }
        );
        
        function onScanSuccess(decodedText, decodedResult) {
            try {
                const medicineData = JSON.parse(decodedText);
                verifyMedicine(medicineData);
            } catch (error) {
                showError('Invalid QR code format');
            }
        }

        function onScanError(error) {
            // Handle scan error if needed
            console.warn(`QR error = ${error}`);
        }

        html5QrcodeScanner.render(onScanSuccess, onScanError);
    }
}); 