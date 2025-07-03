from flask import Blueprint, render_template, jsonify, request
from blockchain_service import blockchain_service

# Create blueprint
blockchain_bp = Blueprint('blockchain', __name__, url_prefix='/blockchain')

@blockchain_bp.route('/', methods=['GET'])
def blockchain_page():
    """Render blockchain main page"""
    return render_template('blockchain.html')

@blockchain_bp.route('/test', methods=['GET'])
def test_blockchain():
    """Test the blockchain connection and return status"""
    is_connected = blockchain_service.is_connected()
    
    if not is_connected:
        return jsonify({
            'success': False,
            'message': 'Not connected to the blockchain'
        }), 500
    
    try:
        # Get contract owner for verification
        contract = blockchain_service.contract
        owner = contract.functions.owner().call()
        
        # Get account info
        default_account = blockchain_service.default_account
        is_owner = (owner.lower() == default_account.lower())
        
        return jsonify({
            'success': True,
            'connected': True,
            'account': default_account,
            'owner': owner,
            'is_owner': is_owner,
            'network_id': blockchain_service.w3.eth.chain_id
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error testing blockchain: {str(e)}'
        }), 500

# Register blueprint in your main Flask app
def register_blockchain_routes(app):
    app.register_blueprint(blockchain_bp) 