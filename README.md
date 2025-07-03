# Medicine Verification System with AI Packaging Analysis

A comprehensive system for verifying medicines using QR codes and analyzing medicine packaging using AI-powered computer vision.

## Features

1. **User Authentication**
   - Separate user and industry member accounts
   - Secure login and registration system
   - Session management

2. **Medicine Verification**
   - QR code scanning for medicine verification
   - Detailed medicine information display
   - Verification history tracking

3. **AI Packaging Analysis**
   - Real-time camera access for packaging analysis
   - Machine vs. Hand-packed detection
   - Confidence scoring and detailed analysis
   - Edge and contour regularity analysis
   - Color consistency checking

4. **Industry Dashboard**
   - Medicine registration system
   - QR code generation for new medicines
   - Batch tracking and management

## Prerequisites

- Python 3.8 or higher
- Webcam (for AI packaging analysis)
- Modern web browser with camera access

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd medicine-verification-system
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with the following content:
```
SECRET_KEY=your-secret-key-here
UPLOAD_PATH=./static/uploads
PORT=5001
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5001
```

3. Register as a user or industry member:
   - Regular users can verify medicines and use the AI analysis feature
   - Industry members can register new medicines and generate QR codes

4. Using the AI Packaging Analysis:
   - Log in as a regular user
   - Click on "AI Packaging Analysis" in the navigation
   - Allow camera access when prompted
   - Point your camera at a medicine package
   - Click "Capture Image" and then "Analyze Packaging"
   - View the analysis results including packaging type and confidence level

## Project Structure

```
medicine-verification-system/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables
├── static/               # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   └── uploads/         # Uploaded files
└── templates/           # HTML templates
    ├── index.html       # Landing page
    ├── login.html       # Login page
    ├── signup.html      # Registration page
    ├── user_dashboard.html    # User dashboard
    ├── industry_dashboard.html # Industry dashboard
    └── ai_analysis.html      # AI analysis interface
```

## Security Considerations

- All passwords should be hashed in a production environment
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use secure session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flask web framework
- OpenCV for computer vision
- HTML5 QR Code Scanner
- Bootstrap for UI components 