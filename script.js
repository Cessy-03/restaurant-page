// IMPORTANT: Replace with your actual Paystack Public Key from https://paystack.com
const PAYSTACK_PUBLIC_KEY = 'pk_live_YOUR_ACTUAL_PUBLIC_KEY_HERE';
// Get your key from: https://paystack.com → Settings → API Keys

let cart = [];
let selectedPayment = null;

// Add item to cart
function orderItem(itemName, price) {
    const item = { name: itemName, price, quantity: 1 };
    const existing = cart.find(i => i.name === itemName);
    if (existing) existing.quantity += 1;
    else cart.push(item);
    showOrderConfirmation(itemName, price);
    updateCartCount();
}

function showOrderConfirmation(itemName, price) {
    const popup = document.createElement('div');
    popup.className = 'order-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="popup-icon">✓</span>
            <div>
                <h3>Added to Order!</h3>
                <p>${itemName} - &#8373;${price}</p>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('show'));
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 3000);
}

function updateCartCount() {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const reviewBtn = document.querySelector('.cta');
    if (reviewBtn) reviewBtn.textContent = totalItems > 0 ? `Review Order (${totalItems})` : 'Review Order';
}

function showCart() {
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items to your order.');
        return;
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    showCartModal(total);
}

function showCartModal(total) {
    document.querySelectorAll('.cart-modal').forEach(m => m.remove());
    let cartItemsHTML = '';
    cart.forEach((item, idx) => {
        const itemTotal = item.price * item.quantity;
        cartItemsHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-quantity">x${item.quantity}</span>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">&#8373;${itemTotal}</span>
                    <button class="remove-item" onclick="removeFromCart(${idx})">×</button>
                </div>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h2>Your Order</h2>
                <button class="close-modal" onclick="closeCartModal()">×</button>
            </div>
            <div class="cart-items-container">${cartItemsHTML}</div>
            <div class="cart-total"><span>Total:</span><span class="total-amount">&#8373;${total}</span></div>
            <div class="delivery-info">
                <h3>Delivery Information</h3>
                <input type="text" id="customer-name" placeholder="Your Name" required>
                <input type="email" id="customer-email" placeholder="Your Email" required>
                <input type="tel" id="customer-phone" placeholder="Phone Number" required>
                <textarea id="delivery-address" placeholder="Delivery Address" required></textarea>
            </div>
            <div class="payment-methods">
                <h3>Payment Method</h3>
                <div class="payment-options">
                    <button class="payment-btn" onclick="selectPayment('momo', this)">
                        <span class="payment-icon">📱</span><span>Mobile Money</span>
                    </button>
                    <button class="payment-btn" onclick="selectPayment('cash', this)">
                        <span class="payment-icon">💵</span><span>Cash on Delivery</span>
                    </button>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeCartModal()">Continue Shopping</button>
                <button class="btn-primary" onclick="proceedToCheckout()">Proceed to Checkout</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    if (cart.length === 0) closeCartModal();
    else showCartModal(cart.reduce((s, i) => s + i.price * i.quantity, 0));
}

function closeCartModal() {
    const modal = document.querySelector('.cart-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function selectPayment(method, btn) {
    selectedPayment = method;
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    if (btn && btn.classList) btn.classList.add('active');
}

function proceedToCheckout() {
    const name = document.getElementById('customer-name')?.value.trim() || '';
    const email = document.getElementById('customer-email')?.value.trim() || '';
    const phone = document.getElementById('customer-phone')?.value.trim() || '';
    const address = document.getElementById('delivery-address')?.value.trim() || '';
    
    if (!name || !email || !phone || !address) {
        return alert('Please fill in all delivery information.');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return alert('Please enter a valid email address.');
    }
    
    // Validate phone
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        return alert('Please enter a valid 10-digit phone number.');
    }
    
    if (!selectedPayment) {
        return alert('Please select a payment method.');
    }
    
    processPayment(name, email, phone, address);
}

function processPayment(name, phone, address) {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const email = document.getElementById('customer-email')?.value || prompt('Please enter your email for Paystack:');
    
    closeCartModal();
    
    if (selectedPayment === 'momo') {
        showMomoPayment(total, name, phone, address);
    } else if (selectedPayment === 'paystack') {
        showProcessingModal();
        setTimeout(() => {
            closeProcessingModal();
            processPaystackPayment(name, email, phone, address, total);
        }, 500);
    } else if (selectedPayment === 'cash') {
        confirmCashOrder(total, name, phone, address);
    }
}

function showMomoPayment(total, name, email, phone, address) {
    const modal = document.createElement('div');
    modal.className = 'cart-modal show';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h2>Mobile Money Payment</h2>
                <button class="close-modal" onclick="closeCartModal()">×</button>
            </div>
            <div class="payment-form">
                <p class="payment-instruction">Select your mobile money provider and enter your number</p>
                <div class="payment-amount-display"><span>Amount to Pay:</span><span class="amount">&#8373;${total}</span></div>
                <select id="momo-provider" class="payment-input">
                    <option value="">Select Provider</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="vod">Vodafone Cash</option>
                    <option value="tgo">AirtelTigo Money</option>
                </select>
                <input type="tel" id="momo-number" class="payment-input" placeholder="Mobile Money Number (10 digits)" value="${phone}" maxlength="10">
                <p class="payment-note">💡 You will receive a prompt on your phone to authorize the payment</p>
                <button class="btn-primary" onclick="processPaystackMobileMoney('${name}', '${email}', '${phone}', '${address}', ${total})">Pay &#8373;${total}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function processPaystackMobileMoney(name, email, phone, address, total) {
    const provider = document.getElementById('momo-provider')?.value;
    const momoNumber = document.getElementById('momo-number')?.value;
    
    if (!provider) {
        return alert('Please select your mobile money provider.');
    }
    
    if (!momoNumber || momoNumber.length !== 10) {
        return alert('Please enter a valid 10-digit mobile money number.');
    }
    
    closeCartModal();
    
    // Check if Paystack is loaded
    if (typeof PaystackPop === 'undefined') {
        alert('Payment system is loading. Please try again in a moment.');
        return;
    }
    
    // Convert total to pesewas (Paystack uses smallest currency unit)
    const amountInPesewas = Math.round(total * 100);
    
    // Generate unique reference
    const reference = 'ORDER_' + Math.floor((Math.random() * 1000000000) + 1) + '_' + Date.now();
    
    // Initialize Paystack payment
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        metadata: {
            custom_fields: [
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: name
                },
                {
                    display_name: "Phone Number",
                    variable_name: "phone_number",
                    value: phone
                },
                {
                    display_name: "Delivery Address",
                    variable_name: "delivery_address",
                    value: address
                },
                {
                    display_name: "Order Items",
                    variable_name: "order_items",
                    value: JSON.stringify(cart)
                }
            ]
        },
        channels: ['mobile_money'],
        mobile_money: {
            phone: momoNumber,
            provider: provider
        },
        onClose: function() {
            alert('Payment window closed. Your order has not been placed.');
        },
        callback: function(response) {
            // Payment successful
            if (response.status === 'success') {
                showSuccessModal(name, phone, address, total, 'Mobile Money', response.reference);
            } else {
                alert('Payment was not completed. Please try again.');
            }
        }
    });
    
    handler.openIframe();
}

function confirmCashOrder(total, name, phone, address) {
    showProcessingModal();
    setTimeout(() => {
        closeProcessingModal();
        showSuccessModal(name, phone, address, total, 'Cash on Delivery', null);
    }, 1000);
}

function showProcessingModal() {
    const modal = document.createElement('div');
    modal.className = 'cart-modal show processing-modal';
    modal.innerHTML = `
        <div class="cart-modal-content processing-content">
            <div class="spinner"></div>
            <h3>Processing your order...</h3>
            <p>Please wait</p>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeProcessingModal() {
    document.querySelectorAll('.processing-modal').forEach(m => m.remove());
}

function showSuccessModal(name, phone, address, total, paymentMethod, reference) {
    cart = [];
    updateCartCount();
    selectedPayment = null;
    
    let referenceHTML = '';
    if (reference) {
        referenceHTML = `<p><strong>Payment Reference:</strong> ${reference}</p>`;
    }
    
    const modal = document.createElement('div');
    modal.className = 'cart-modal show';
    modal.innerHTML = `
        <div class="cart-modal-content success-content">
            <div class="success-icon">✓</div>
            <h2>Order Confirmed!</h2>
            <p class="success-message">Thank you for your order, ${name}!</p>
            <div class="order-summary">
                <h3>Order Summary</h3>
                <p><strong>Total:</strong> &#8373;${total}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                ${referenceHTML}
                <p><strong>Delivery Address:</strong> ${address}</p>
                <p><strong>Contact:</strong> ${phone}</p>
            </div>
            <p class="delivery-estimate">Estimated delivery: 30-45 minutes</p>
            <button class="btn-primary" onclick="closeCartModal()">Continue Shopping</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function scrollToSection(sectionName) {
    let target = null;
    if (sectionName === 'home') target = document.querySelector('.home');
    else if (sectionName === 'menu') target = document.querySelector('#main-meal') || document.querySelector('.container');
    else {
        document.querySelectorAll('.section').forEach(sec => {
            const title = sec.querySelector('.section-title');
            if (title && title.textContent.toLowerCase().includes(sectionName.toLowerCase())) target = sec;
        });
    }
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Inject popup style once
(function injectPopupStyle(){
    if (document.getElementById('order-popup-style')) return;
    const style = document.createElement('style');
    style.id = 'order-popup-style';
    style.textContent = `
        .order-popup{position:fixed;top:100px;right:20px;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:20px 30px;z-index:10000;opacity:0;transform:translateX(400px);transition:all .3s ease}
        .order-popup.show{opacity:1;transform:translateX(0)}
        .popup-content{display:flex;align-items:center;gap:15px}
        .popup-icon{width:40px;height:40px;background:linear-gradient(135deg,#b8956a 0%,#d4af7a 100%);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700}
        .popup-content h3{margin:0;color:#2c2c2c;font-size:1.2em}
        .popup-content p{margin:5px 0 0 0;color:#666;font-size:0.95em}
    `;
    document.head.appendChild(style);
})();

// DOM ready init
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.menu-card');
            if (!card) return;
            const itemName = card.querySelector('.card-name')?.textContent || 'Item';
            const priceText = card.querySelector('.card-price')?.textContent || '0';
            const numeric = priceText.replace(/[^0-9.,]/g, '').replace(',', '.');
            const price = parseFloat(numeric) || 0;
            orderItem(itemName, price);
        });
    });

    const reviewBtn = document.querySelector('.cta');
    if (reviewBtn) reviewBtn.addEventListener('click', function(e){ e.preventDefault(); showCart(); });

    document.querySelectorAll('.nav-links a:not(.cta)').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const t = this.textContent.toLowerCase().trim();
            if (t === 'home') scrollToSection('home');
            else if (t === 'main meal' || t === 'main' || t === 'menu') scrollToSection('menu');
            else if (t === 'specials') scrollToSection('specials');
            else if (t === 'desserts') scrollToSection('desserts');
            else if (t === 'drinks' || t === 'beverages') scrollToSection('beverages');
            const menuToggle = document.getElementById('menu-toggle');
            if (menuToggle) menuToggle.checked = false;
        });
    });

    const exploreBtn = document.querySelector('.home-btn');
    if (exploreBtn) exploreBtn.addEventListener('click', function(e){ e.preventDefault(); scrollToSection('menu'); });
});
const hamburger = document.querySelector('.hamburger-menu');
const nav = document.querySelector('nav');

hamburger.addEventListener('click', () => {
    nav.classList.toggle('active');
});

