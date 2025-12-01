// ===== FLUTTERWAVE CONFIGURATION =====
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-your-public-key-here'; // Replace with your actual key

// Format mobile money number
const momoNumberInput = document.getElementById('momoNumber');
momoNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    
    if (value.length > 3 && value.length <= 6) {
        value = value.slice(0, 3) + ' ' + value.slice(3);
    } else if (value.length > 6) {
        value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 10);
    }
    
    e.target.value = value;
});

// Ghanaian mobile number prefixes
const ghanaNetworkPrefixes = {
    mtn: ['024', '054', '055', '059'],
    vodafone: ['020', '050'],
    airteltigo: ['027', '057', '026', '056'],
    telecel: ['023', '028']
};

// Auto-detect network
momoNumberInput.addEventListener('blur', (e) => {
    const number = e.target.value.replace(/\s/g, '');
    const prefix = number.slice(0, 3);
    const providerSelect = document.getElementById('momoProvider');
    
    for (const [network, prefixes] of Object.entries(ghanaNetworkPrefixes)) {
        if (prefixes.includes(prefix)) {
            providerSelect.value = network;
            break;
        }
    }
});

// Validate Ghanaian number
function isValidGhanaNumber(number) {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length !== 10 || !cleanNumber.startsWith('0')) {
        return false;
    }
    const prefix = cleanNumber.slice(0, 3);
    const allPrefixes = Object.values(ghanaNetworkPrefixes).flat();
    return allPrefixes.includes(prefix);
}

// Show notification
function showNotification(type, title, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff9800'};
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        min-width: 320px;
        animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-size: 2rem;">${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span>
            <div>
                <h4 style="margin: 0 0 0.3rem 0; font-size: 1.1rem; font-weight: 600;">${title}</h4>
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.95;">${message}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

// Add animations
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(animationStyle);

// Show loading overlay
function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'paymentLoadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(8px);
    `;
    
    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <div style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #d4af37;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1.5rem auto;
            "></div>
            <h3 style="margin-bottom: 1rem; color: #1a1a1a; font-size: 1.3rem;">${message}</h3>
            <p style="color: #666; font-size: 0.95rem;">Please do not close this window</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('paymentLoadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Calculate total amount from cart
function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Process payment with Flutterwave
async function processMomoPayment() {
    const momoProvider = document.getElementById('momoProvider').value;
    const momoNumber = document.getElementById('momoNumber').value.replace(/\s/g, '');
    const momoName = document.getElementById('momoName').value;
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerEmail = customerPhone + '@bellacucina.com'; // Generate email from phone
    const customerAddress = document.getElementById('customerAddress').value;
    
    // Validate payment details
    if (!momoProvider) {
        showNotification('error', 'Validation Error', 'Please select your Mobile Money network');
        return false;
    }
    
    if (!isValidGhanaNumber(momoNumber)) {
        showNotification('error', 'Invalid Number', 'Please enter a valid 10-digit Ghanaian mobile number');
        return false;
    }
    
    if (!momoName.trim()) {
        showNotification('error', 'Missing Information', 'Please enter the registered account name');
        return false;
    }
    
    // Get total amount
    const totalAmount = calculateTotal();
    
    // Generate unique transaction reference
    const txRef = 'BC-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    
    // Show loading
    showLoadingOverlay('Processing your payment...');
    
    try {
        // Flutterwave Payment Configuration
        const paymentData = {
            public_key: FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: txRef,
            amount: totalAmount,
            currency: 'GHS',
            payment_options: 'mobilemoneyghana',
            meta: {
                consumer_id: momoNumber,
                consumer_mac: momoName,
            },
            customer: {
                email: customerEmail,
                phone_number: momoNumber,
                name: customerName,
            },
            customizations: {
                title: 'Bella Cucina',
                description: 'Food Order Payment',
                logo: 'https://your-logo-url.com/logo.png', // Optional: Add your logo URL
            },
            callback: function(payment) {
                hideLoadingOverlay();
                
                if (payment.status === 'successful') {
                    // Verify payment on your backend (recommended)
                    verifyPaymentOnBackend(payment.transaction_id, txRef);
                } else {
                    showNotification('error', 'Payment Cancelled', 'Your payment was not completed');
                }
            },
            onclose: function() {
                hideLoadingOverlay();
                showNotification('warning', 'Payment Window Closed', 'You closed the payment window');
            }
        };
        
        // Initialize Flutterwave payment
        FlutterwaveCheckout(paymentData);
        
    } catch (error) {
        hideLoadingOverlay();
        showNotification('error', 'Payment Error', 'An error occurred. Please try again.');
        console.error('Payment error:', error);
        return false;
    }
}

// Verify payment on backend (IMPORTANT: Do this on your server)
async function verifyPaymentOnBackend(transactionId, txRef) {
    showLoadingOverlay('Verifying payment...');
    
    try {
        // In production, call your backend API to verify the payment
        // Example:
        // const response = await fetch('/api/verify-payment', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ transactionId, txRef })
        // });
        // const result = await response.json();
        
        // SIMULATION: Remove this in production
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = { success: true, data: { status: 'successful', transaction_id: transactionId } };
        
        hideLoadingOverlay();
        
        if (result.success && result.data.status === 'successful') {
            // Payment successful
            showNotification('success', 'Payment Successful!', `Transaction ID: ${transactionId}`);
            
            // Store transaction
            const paymentDetails = {
                transactionId: transactionId,
                txRef: txRef,
                amount: calculateTotal(),
                timestamp: new Date().toISOString(),
                status: 'completed',
                items: cart
            };
            
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.push(paymentDetails);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            // Close checkout modal
            document.getElementById('checkoutModal').classList.remove('active');
            
            // Show success modal
            const orderNumber = 'ORD' + Date.now();
            document.getElementById('orderNumber').textContent = orderNumber;
            document.getElementById('successModal').classList.add('active');
            
            // Clear cart
            cart = [];
            updateCartDisplay();
            updateCartCount();
            
            return true;
        } else {
            showNotification('error', 'Payment Failed', 'Payment verification failed. Please contact support.');
            return false;
        }
        
    } catch (error) {
        hideLoadingOverlay();
        showNotification('error', 'Verification Error', 'Could not verify payment. Please contact support.');
        console.error('Verification error:', error);
        return false;
    }
}

// Update checkout form submission
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate delivery information
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerAddress = document.getElementById('customerAddress').value;
    
    if (!customerName || !customerPhone || !customerAddress) {
        showNotification('error', 'Missing Information', 'Please fill in all delivery information');
        return;
    }
    
    // Process payment
    await processMomoPayment();
});