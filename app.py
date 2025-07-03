from flask import Flask, render_template, jsonify, request, session, send_from_directory, redirect, url_for
from flask_cors import CORS
# Temporarily commenting out Firebase
# from firebase_admin import credentials, auth, firestore, initialize_app
import os
from dotenv import load_dotenv
import qrcode
from datetime import datetime
import json
import base64
import cv2
import numpy as np
from PIL import Image
import io
from blockchain_service import blockchain_service
import time
import tensorflow as tf

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# Configure Flask
app.secret_key = os.getenv('SECRET_KEY')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_PATH', './static/uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load the trained model
try:
    model = tf.keras.models.load_model('final_kaggle_model.h5')
    print("Successfully loaded final_kaggle_model.h5")
except Exception as e:
    print(f"Error loading final_kaggle_model.h5: {str(e)}")
    print("Falling back to medicine_packaging_model.h5")
    try:
        model = tf.keras.models.load_model('medicine_packaging_model.h5')
        print("Successfully loaded medicine_packaging_model.h5")
    except Exception as e:
        print(f"Error loading medicine_packaging_model.h5: {str(e)}")
        raise Exception("No valid model file found. Please ensure either final_kaggle_model.h5 or medicine_packaging_model.h5 exists.")

# Temporarily commenting out Firebase initialization
# cred = credentials.Certificate("firebase-key.json")
# firebase_app = initialize_app(cred)
# db = firestore.client()

# Dummy database (replace with actual database later)
users_db = {}
medicines_db = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    account_type = request.args.get('type', 'user')
    if account_type not in ['user', 'industry']:
        return redirect(url_for('index'))
    return render_template('login.html', account_type=account_type)

@app.route('/signup')
def signup():
    account_type = request.args.get('type', 'user')
    if account_type not in ['user', 'industry']:
        return redirect(url_for('index'))
    return render_template('signup.html', account_type=account_type)

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if session['account_type'] == 'industry':
        return render_template('industry_dashboard.html')
    else:
        return render_template('user_dashboard.html')

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.form
        email = data.get('email')
        
        if email in users_db:
            return jsonify({'error': 'Email already registered'}), 400

        user_data = {
            'email': email,
            'name': data.get('name'),
            'password': data.get('password'),  # In real app, hash this!
            'account_type': data.get('account_type')
        }

        if data.get('account_type') == 'industry':
            user_data.update({
                'company': data.get('company'),
                'license': data.get('license'),
                'license_expiry': data.get('license_expiry'),
                'manufacturer_id': data.get('manufacturer_id'),
                'address': data.get('address')
            })
            
            # Try to register manufacturer on blockchain if available
            if blockchain_service.is_connected():
                try:
                    result = blockchain_service.register_manufacturer(
                        data.get('company'),
                        data.get('license')
                    )
                    if result['success']:
                        # Store blockchain transaction data
                        user_data['blockchain_tx'] = result['tx_hash']
                    else:
                        # Continue with registration even if blockchain fails
                        print(f"Blockchain registration warning: {result['error']}")
                except Exception as e:
                    # Continue with registration even if blockchain fails
                    print(f"Blockchain registration error: {str(e)}")

        users_db[email] = user_data
        return jsonify({'success': True, 'message': 'Registration successful'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def handle_login():
    try:
        data = request.form
        email = data.get('email')
        password = data.get('password')
        account_type = data.get('account_type')

        user = users_db.get(email)
        if not user or user['password'] != password:  # In real app, use proper password verification
            return jsonify({'error': 'Invalid credentials'}), 401

        if user['account_type'] != account_type:
            return jsonify({'error': 'Invalid account type'}), 401

        session['user_id'] = email
        session['account_type'] = account_type
        
        return jsonify({
            'success': True,
            'redirect': url_for('dashboard')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medicine/register', methods=['POST'])
def register_medicine():
    try:
        if 'user_id' not in session or session['account_type'] != 'industry':
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.form or request.get_json()
        medicine_id = f"MED_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Convert dates to Unix timestamps for blockchain
        try:
            manufacture_date = int(time.mktime(datetime.strptime(data.get('manufacture_date'), '%Y-%m-%d').timetuple()))
            expiry_date = int(time.mktime(datetime.strptime(data.get('expiry_date'), '%Y-%m-%d').timetuple()))
        except:
            # Fallback if date parsing fails
            manufacture_date = int(time.time())
            expiry_date = int(time.time()) + 31536000  # One year from now
        
        medicine_data = {
            'id': medicine_id,
            'name': data.get('name'),
            'manufacturer': data.get('manufacturer'),
            'manufacturer_id': data.get('manufacturer_id'),
            'batch_number': data.get('batch_number'),
            'manufacture_date': data.get('manufacture_date'),
            'expiry_date': data.get('expiry_date'),
            'registered_by': session['user_id'],
            'registered_at': datetime.now().isoformat(),
            'description': data.get('description', '')
        }

        # Try to register in the blockchain if available
        blockchain_result = {'success': False, 'error': 'Blockchain not available'}
        if blockchain_service.is_connected():
            try:
                # Use MetaMask wallet if available
                if 'wallet_address' in session:
                    blockchain_service.set_account(session['wallet_address'])
                    
                blockchain_result = blockchain_service.register_medicine(
                    medicine_id,
                    medicine_data['name'],
                    medicine_data['batch_number'],
                    manufacture_date,
                    expiry_date,
                    medicine_data['description']
                )
                
                if blockchain_result['success']:
                    # Store blockchain transaction data
                    medicine_data['blockchain_tx'] = blockchain_result['tx_hash']
                    medicine_data['blockchain_verified'] = True
                else:
                    # Continue with local registration even if blockchain fails
                    print(f"Blockchain medicine registration error: {blockchain_result['error']}")
                    medicine_data['blockchain_verified'] = False
            except Exception as e:
                print(f"Blockchain medicine registration exception: {str(e)}")
                medicine_data['blockchain_verified'] = False
        else:
            medicine_data['blockchain_verified'] = False

        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(json.dumps({
            'id': medicine_id,
            'name': medicine_data['name'],
            'manufacturer': medicine_data['manufacturer'],
            'batch': medicine_data['batch_number']
        }))
        qr.make(fit=True)

        # Save QR code - using the same path as in the static directory
        qr_filename = f'qr_{medicine_id}.png'
        # Important: Use the static directory for the path since Flask serves static files automatically
        qr_path = os.path.join(app.config['UPLOAD_FOLDER'], qr_filename)
        print(f"Saving QR code to: {qr_path}")
        
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(qr_path)
        
        # Set the URL for accessing the QR code
        # Use the absolute URL path with /static/uploads/ prefix
        qr_code_url = f"/static/uploads/{qr_filename}"
        print(f"QR code URL: {qr_code_url}")
        
        medicine_data['qr_code_url'] = qr_code_url
        medicines_db[medicine_id] = medicine_data

        return jsonify({
            'success': True,
            'medicine': medicine_data,
            'blockchain_result': {
                'success': blockchain_result.get('success', False),
                'message': blockchain_result.get('error', 'Not registered on blockchain')
            }
        })

    except Exception as e:
        print(f"Error registering medicine: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/medicine/verify', methods=['POST'])
def verify_medicine():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        medicine_id = data.get('id')

        # First check local database
        medicine = medicines_db.get(medicine_id)
        
        # Then check blockchain for verification
        if blockchain_service.is_connected():
            blockchain_result = blockchain_service.verify_medicine(medicine_id)
            
            if blockchain_result['success']:
                # If medicine exists on blockchain, return blockchain data
                blockchain_medicine = blockchain_result['medicine']
                
                # Format dates from Unix timestamps
                manufacturing_date = datetime.fromtimestamp(blockchain_medicine['manufacturingDate'])
                expiry_date = datetime.fromtimestamp(blockchain_medicine['expiryDate'])
                
                # Combine local and blockchain data
                if medicine:
                    medicine.update({
                        'blockchain_verified': True,
                        'isVerified': blockchain_medicine['isVerified'],
                        'isFakeReported': blockchain_medicine['isFakeReported'],
                        'manufacturerName': blockchain_medicine['manufacturerName'],
                        'reportCount': blockchain_medicine['reportCount'],
                        'manufacturing_date_formatted': manufacturing_date.strftime('%Y-%m-%d'),
                        'expiry_date_formatted': expiry_date.strftime('%Y-%m-%d')
                    })
                else:
                    # If medicine only exists on blockchain
                    medicine = {
                        'id': blockchain_medicine['medicineId'],
                        'name': blockchain_medicine['name'],
                        'batch_number': blockchain_medicine['batchNumber'],
                        'manufacturer': blockchain_medicine['manufacturerName'],
                        'blockchain_verified': True,
                        'isVerified': blockchain_medicine['isVerified'],
                        'isFakeReported': blockchain_medicine['isFakeReported'],
                        'reportCount': blockchain_medicine['reportCount'],
                        'manufacture_date': manufacturing_date.strftime('%Y-%m-%d'),
                        'expiry_date': expiry_date.strftime('%Y-%m-%d'),
                        'description': blockchain_medicine['description']
                    }
            elif not medicine:
                return jsonify({'error': 'Medicine not found'}), 404

        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404

        return jsonify({
            'success': True,
            'medicine': medicine
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medicine/report', methods=['POST'])
def report_medicine():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        medicine_id = data.get('id')

        # Check if medicine exists
        medicine = medicines_db.get(medicine_id)
        if not medicine and not blockchain_service.is_connected():
            return jsonify({'error': 'Medicine not found'}), 404

        # Report to blockchain
        if blockchain_service.is_connected():
            # Use MetaMask wallet if available
            if 'wallet_address' in session:
                blockchain_service.set_account(session['wallet_address'])
                
            result = blockchain_service.report_fake_medicine(medicine_id)
            
            if not result['success']:
                return jsonify({'error': f'Blockchain reporting failed: {result["error"]}'}), 500
                
            # After reporting, get updated information
            verify_result = blockchain_service.verify_medicine(medicine_id)
            if verify_result['success']:
                # Update medicine status from blockchain
                if medicine:
                    medicine['isFakeReported'] = verify_result['medicine']['isFakeReported']
                    medicine['reportCount'] = verify_result['medicine']['reportCount']

        return jsonify({
            'success': True,
            'message': 'Medicine reported successfully',
            'medicine': medicine
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Add a specific route for static uploads
@app.route('/static/uploads/<path:filename>')
def serve_static_upload(filename):
    # For direct static file access via /static/uploads URL
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    return send_from_directory(uploads_dir, filename)

@app.route('/ai-analysis')
def ai_analysis():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('ai_analysis.html')

@app.route('/api/analyze-packaging', methods=['POST'])
def analyze_packaging():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        # Remove the data URL prefix
        image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # Analyze packaging characteristics
        packaging_type, confidence, details = analyze_packaging_characteristics(img)

        return jsonify({
            'success': True,
            'packaging_type': packaging_type,
            'confidence': confidence,
            'details': details
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to view blockchain status
@app.route('/blockchain-status')
def blockchain_status():
    if 'user_id' not in session or session['account_type'] != 'industry':
        return redirect(url_for('login'))
        
    status = {
        'connected': blockchain_service.is_connected(),
        'contract_address': blockchain_service.contract_address if blockchain_service.is_connected() else None
    }
    return render_template('blockchain_status.html', status=status)

@app.route('/api/blockchain/status', methods=['GET'])
def blockchain_status_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        is_connected = blockchain_service.is_connected()
        
        if is_connected:
            network_id = blockchain_service.w3.eth.chain_id
            return jsonify({
                'success': True,
                'connected': True,
                'network_id': network_id
            })
        else:
            return jsonify({
                'success': False,
                'connected': False,
                'error': 'Not connected to blockchain'
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blockchain/contract-info', methods=['GET'])
def contract_info_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        if not blockchain_service.is_connected():
            return jsonify({'success': False, 'error': 'Blockchain not connected'}), 500
            
        # Load contract data
        with open('software assignment project/blockchain/contract.json', 'r') as file:
            contract_data = json.load(file)
            
        return jsonify({
            'success': True,
            'abi': contract_data['abi'],
            'address': contract_data['address']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blockchain/verify-contract', methods=['GET'])
def verify_contract_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        if not blockchain_service.is_connected():
            return jsonify({
                'success': False, 
                'error': 'Not connected to blockchain'
            })
            
        # Verify if contract is initialized
        if blockchain_service.contract is None:
            return jsonify({
                'success': False,
                'error': 'Contract not initialized'
            })
            
        try:
            # Check if we can access the contract address
            if not blockchain_service.contract_address:
                return jsonify({
                    'success': False,
                    'error': 'Contract address is not set'
                })
                
            # Check if the contract exists at the specified address
            code = blockchain_service.w3.eth.get_code(blockchain_service.contract_address)
            if code == b'' or code == '0x':
                return jsonify({
                    'success': False,
                    'error': 'No contract deployed at the specified address'
                })
                
            # Try to get contract owner
            owner = blockchain_service.contract.functions.owner().call()
            
            # Get basic contract info without calling complex functions
            contract_data = {
                'success': True,
                'owner': owner,
                'contract_address': blockchain_service.contract_address,
                'is_connected': blockchain_service.is_connected()
            }
            
            # Try to get additional data - these might fail if functions don't exist
            try:
                contract_data['medicine_count'] = blockchain_service.contract.functions.getMedicineCount().call()
            except Exception:
                contract_data['medicine_count'] = "Function not available"
                
            try:
                contract_data['manufacturer_count'] = blockchain_service.contract.functions.getVerifiedManufacturerCount().call()
            except Exception:
                contract_data['manufacturer_count'] = "Function not available"
            
            return jsonify(contract_data)
        except AttributeError as e:
            return jsonify({
                'success': False,
                'error': f'Contract functions not available: {str(e)}'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Contract verification error: {str(e)}'
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blockchain/sync-medicine', methods=['POST'])
def sync_medicine_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json()
        medicine_id = data.get('id')
        
        if not medicine_id:
            return jsonify({'error': 'Missing medicine ID'}), 400
            
        # Check if medicine exists in local database
        if medicine_id not in medicines_db:
            return jsonify({'error': 'Medicine not found in database'}), 404
            
        # Check blockchain connection
        if not blockchain_service.is_connected():
            return jsonify({'error': 'Blockchain not connected'}), 500
            
        # Verify if medicine exists on blockchain
        verify_result = blockchain_service.verify_medicine(medicine_id)
        
        if verify_result['success']:
            # Medicine exists on blockchain
            blockchain_medicine = verify_result['medicine']
            
            # Update local medicine with blockchain data
            medicines_db[medicine_id].update({
                'blockchain_verified': True,
                'blockchain_data': blockchain_medicine
            })
            
            return jsonify({
                'success': True,
                'message': 'Medicine synced with blockchain',
                'medicine': medicines_db[medicine_id]
            })
        else:
            return jsonify({'error': 'Medicine not found on blockchain'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoints for manufacturer management
@app.route('/api/blockchain/register-manufacturer', methods=['POST'])
def register_manufacturer_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return jsonify({'error': 'Missing wallet address'}), 400
            
        # Get user info from database
        user_id = session.get('user_id')
        user = users_db.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Check blockchain connection
        if not blockchain_service.is_connected():
            return jsonify({'error': 'Blockchain not connected'}), 500
            
        # Register manufacturer with user info
        result = blockchain_service.register_manufacturer(
            name=user.get('company_name', f"User-{user_id}"),
            license_number=user.get('license_number', f"LIC-{user_id}"),
            account=wallet_address
        )
        
        if result['success']:
            # Update user in database with wallet address and manufacturer status
            users_db[user_id].update({
                'wallet_address': wallet_address,
                'is_manufacturer': True,
                'manufacturer_verified': False,
                'transaction_hash': result.get('tx_hash')
            })
            
            return jsonify({
                'success': True,
                'message': 'Manufacturer registration request submitted',
                'tx_hash': result.get('tx_hash')
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error during registration')
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/blockchain/verify-manufacturer', methods=['POST'])
def verify_manufacturer_api():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return jsonify({'error': 'Missing wallet address'}), 400
            
        # Check blockchain connection
        if not blockchain_service.is_connected():
            return jsonify({'error': 'Blockchain not connected'}), 500
            
        # Get manufacturer info
        result = blockchain_service.get_manufacturer_info(wallet_address)
        
        if not result['success']:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Manufacturer not found on blockchain')
            }), 404
            
        manufacturer = result.get('manufacturer')
        
        # If admin user, allow them to verify manufacturers
        user_id = session.get('user_id')
        user = users_db.get(user_id)
        
        if user and user.get('role') == 'admin' and not manufacturer.get('isVerified'):
            # Admin can verify manufacturers
            verify_result = blockchain_service.verify_manufacturer(wallet_address)
            
            if verify_result['success']:
                # Update manufacturer record
                user_id = session.get('user_id')
                for uid, user_data in users_db.items():
                    if user_data.get('wallet_address') == wallet_address:
                        users_db[uid]['manufacturer_verified'] = True
                        break
                        
                # Get updated info
                result = blockchain_service.get_manufacturer_info(wallet_address)
                manufacturer = result.get('manufacturer')
                
                return jsonify({
                    'success': True,
                    'message': 'Manufacturer verified successfully',
                    'manufacturer': manufacturer,
                    'tx_hash': verify_result.get('tx_hash')
                })
            else:
                return jsonify({
                    'success': False,
                    'error': verify_result.get('error', 'Failed to verify manufacturer')
                }), 500
        
        # Return manufacturer info
        return jsonify({
            'success': True,
            'manufacturer': manufacturer
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/blockchain/connect-metamask', methods=['POST'])
def connect_metamask():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return jsonify({'error': 'Wallet address is required'}), 400
            
        # Store wallet address in user's session
        session['wallet_address'] = wallet_address
        
        # If blockchain is connected, validate the address format
        if blockchain_service.is_connected():
            try:
                from web3 import Web3
                is_valid = Web3.isAddress(wallet_address)
                if not is_valid:
                    return jsonify({'success': False, 'error': 'Invalid Ethereum address format'}), 400
            except Exception as e:
                print(f"Warning: Could not validate address: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Wallet connected successfully',
            'wallet_address': wallet_address
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/blockchain/disconnect-metamask', methods=['POST'])
def disconnect_metamask():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        # Remove wallet address from session if it exists
        if 'wallet_address' in session:
            session.pop('wallet_address')
        
        return jsonify({
            'success': True,
            'message': 'Wallet disconnected successfully'
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def analyze_packaging_characteristics(img):
    """
    Analyze the packaging characteristics using the trained model
    """
    try:
        # Preprocess image for model input
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (224, 224))
        img_normalized = img_resized.astype(np.float32) / 255.0
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        # Get model prediction
        prediction = model.predict(img_batch)[0][0]
        
        # Determine packaging type and confidence
        if prediction > 0.5:
            packaging_type = "Machine Packed"
            confidence = float(prediction)
        else:
            packaging_type = "Hand Packed"
            confidence = float(1 - prediction)
        
        # Generate details
        details = []
        if confidence > 0.9:
            details.append("Very high confidence in prediction")
        elif confidence > 0.7:
            details.append("High confidence in prediction")
        elif confidence > 0.5:
            details.append("Moderate confidence in prediction")
        else:
            details.append("Low confidence in prediction")
        
        details = " | ".join(details)
        
        return packaging_type, int(confidence * 100), details
        
    except Exception as e:
        print(f"Error in model prediction: {str(e)}")
        return "Unknown", 0, "Error in analysis"

if __name__ == '__main__':
    app.config['SECRET_KEY'] = 'your-secret-key-here'  # Temporary secret key
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='127.0.0.1', port=5001, debug=True) 