from flask import Flask, request, jsonify
from blockchain_service import blockchain_service
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

@app.route('/api/blockchain/status', methods=['GET'])
def blockchain_status():
    """Check blockchain connection status"""
    is_connected = blockchain_service.is_connected()
    return jsonify({
        'connected': is_connected,
        'default_account': blockchain_service.default_account if is_connected else None
    })

@app.route('/api/manufacturers/register', methods=['POST'])
def register_manufacturer():
    """Register a new manufacturer"""
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    # Validate inputs
    if not data.get('name') or not data.get('license_number'):
        return jsonify({'success': False, 'error': 'Name and license number are required'}), 400
    
    # Register manufacturer
    result = blockchain_service.register_manufacturer(
        name=data.get('name'),
        license_number=data.get('license_number')
    )
    
    if result['success']:
        return jsonify({
            'success': True,
            'tx_hash': result.get('tx_hash'),
            'message': 'Manufacturer registered successfully'
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 400

@app.route('/api/manufacturers/verify/<address>', methods=['POST'])
def verify_manufacturer(address):
    """Verify a manufacturer (admin only)"""
    # In a real app, you'd add authentication here to ensure only admins can call this
    
    result = blockchain_service.verify_manufacturer(address)
    
    if result['success']:
        return jsonify({
            'success': True,
            'tx_hash': result.get('tx_hash'),
            'message': 'Manufacturer verified successfully'
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 400

@app.route('/api/manufacturers/<address>', methods=['GET'])
def get_manufacturer(address):
    """Get manufacturer information"""
    result = blockchain_service.get_manufacturer_info(address)
    
    if result['success']:
        return jsonify({
            'success': True,
            'manufacturer': result.get('manufacturer')
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 404

@app.route('/api/medicines/register', methods=['POST'])
def register_medicine():
    """Register a new medicine"""
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['medicine_id', 'name', 'batch_number', 'manufacturing_date', 'expiry_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    # Register medicine
    result = blockchain_service.register_medicine(
        medicine_id=data.get('medicine_id'),
        name=data.get('name'),
        batch_number=data.get('batch_number'),
        manufacturing_date=data.get('manufacturing_date'),
        expiry_date=data.get('expiry_date'),
        description=data.get('description', '')
    )
    
    if result['success']:
        return jsonify({
            'success': True,
            'tx_hash': result.get('tx_hash'),
            'message': 'Medicine registered successfully'
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 400

@app.route('/api/medicines/verify/<medicine_id>', methods=['GET'])
def verify_medicine(medicine_id):
    """Verify a medicine"""
    result = blockchain_service.verify_medicine(medicine_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'medicine': result.get('medicine')
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 404

@app.route('/api/medicines/report/<medicine_id>', methods=['POST'])
def report_fake_medicine(medicine_id):
    """Report a medicine as fake"""
    result = blockchain_service.report_fake_medicine(medicine_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'tx_hash': result.get('tx_hash'),
            'message': 'Medicine reported as fake'
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error')
        }), 400

if __name__ == '__main__':
    # Run the app in debug mode
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000) 