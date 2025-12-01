// backend/verify-payment.js
const axios = require('axios');

const FLUTTERWAVE_SECRET_KEY = 'FLWSECK-your-secret-key-here';

app.post('/api/verify-payment', async (req, res) => {
    const { transactionId } = req.body;
    
    try {
        const response = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
            {
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
                }
            }
        );
        
        const { status, amount, currency } = response.data.data;
        
        if (status === 'successful') {
            // Payment is verified
            // Update your database
            // Send confirmation email/SMS
            res.json({ success: true, data: response.data.data });
        } else {
            res.json({ success: false, message: 'Payment not successful' });
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});