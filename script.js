// IMPORTANT: Replace with your actual Paystack Public Key from https://paystack.com
const PAYSTACK_PUBLIC_KEY = 'pk_live_YOUR_ACTUAL_PUBLIC_KEY_HERE';

let cart = [];
let selectedPayment = null;

// ─────────────────────────────────────────
// Add item to cart
// ─────────────────────────────────────────
function orderItem(itemName, price) {
    const existing = cart.find(i => i.name === itemName);
    if (existing) existing.quantity += 1;
    else cart.push({ name: itemName, price, quantity: 1 });
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
    if (reviewBtn) {
        reviewBtn.textContent = totalItems > 0 ? `Review Order (${totalItems})` : 'Review Order';
    }
}

// ─────────────────────────────────────────
// Cart Modal
// ─────────────────────────────────────────
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
            <div class="cart-total">
                <span>Total:</span>
                <span class="total-amount">&#8373;${total}</span>
            </div>
            <div class="delivery-info">
                <h3>Delivery Information</h3>
                <input type="text"  id="customer-name"    placeholder="Your Name"        required>
                <input type="email" id="customer-email"   placeholder="Your Email"       required>
                <input type="tel"   id="customer-phone"   placeholder="Phone Number"     required>
                <textarea           id="delivery-address" placeholder="Delivery Address" required></textarea>
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
                <button class="btn-primary"   onclick="proceedToCheckout()">Proceed to Checkout</button>
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
    document.querySelectorAll('.cart-modal').forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
}

function selectPayment(method, btn) {
    selectedPayment = method;
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

// ─────────────────────────────────────────
// Checkout — FIX: was missing 'email' param
// ─────────────────────────────────────────
function proceedToCheckout() {
    const name    = document.getElementById('customer-name')?.value.trim()    || '';
    const email   = document.getElementById('customer-email')?.value.trim()   || '';
    const phone   = document.getElementById('customer-phone')?.value.trim()   || '';
    const address = document.getElementById('delivery-address')?.value.trim() || '';

    if (!name || !email || !phone || !address) {
        return alert('Please fill in all delivery information.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return alert('Please enter a valid email address.');
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        return alert('Please enter a valid 10-digit phone number.');
    }

    if (!selectedPayment) {
        return alert('Please select a payment method.');
    }

    // ✅ FIX: pass all 4 params (was missing email)
    processPayment(name, email, phone, address);
}

// ─────────────────────────────────────────
// Process Payment — FIX: signature corrected
// ─────────────────────────────────────────
function processPayment(name, email, phone, address) {
    // ✅ FIX: removed duplicate email lookup — it's already passed in
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    closeCartModal();

    if (selectedPayment === 'momo') {
        showMomoPayment(total, name, email, phone, address);
    } else if (selectedPayment === 'cash') {
        confirmCashOrder(total, name, phone, address);
    }
}

// ─────────────────────────────────────────
// Mobile Money
// ─────────────────────────────────────────
function showMomoPayment(total, name, email, phone, address) {
    document.querySelectorAll('.cart-modal').forEach(m => m.remove());

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
                <div class="payment-amount-display">
                    <span>Amount to Pay:</span>
                    <span class="amount">&#8373;${total}</span>
                </div>
                <select id="momo-provider" class="payment-input">
                    <option value="">Select Provider</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="vod">Vodafone Cash</option>
                    <option value="tgo">AirtelTigo Money</option>
                </select>
                <input type="tel" id="momo-number" class="payment-input"
                       placeholder="Mobile Money Number (10 digits)"
                       value="${phone}" maxlength="10">
                <p class="payment-note">💡 You will receive a prompt on your phone to authorise the payment</p>
                <button class="btn-primary"
                    onclick="processPaystackMobileMoney('${name}', '${email}', '${phone}', '${address}', ${total})">
                    Pay &#8373;${total}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function processPaystackMobileMoney(name, email, phone, address, total) {
    const provider   = document.getElementById('momo-provider')?.value;
    const momoNumber = document.getElementById('momo-number')?.value;

    if (!provider)                          return alert('Please select your mobile money provider.');
    if (!momoNumber || momoNumber.length !== 10) return alert('Please enter a valid 10-digit mobile money number.');

    closeCartModal();

    if (typeof PaystackPop === 'undefined') {
        alert('Payment system is loading. Please try again in a moment.');
        return;
    }

    const amountInPesewas = Math.round(total * 100);
    const reference = 'ORDER_' + Math.floor(Math.random() * 1000000000) + '_' + Date.now();

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        metadata: {
            custom_fields: [
                { display_name: "Customer Name",    variable_name: "customer_name",    value: name },
                { display_name: "Phone Number",     variable_name: "phone_number",     value: phone },
                { display_name: "Delivery Address", variable_name: "delivery_address", value: address },
                { display_name: "Order Items",      variable_name: "order_items",      value: JSON.stringify(cart) }
            ]
        },
        channels: ['mobile_money'],
        mobile_money: { phone: momoNumber, provider },
        onClose: function() {
            alert('Payment window closed. Your order has not been placed.');
        },
        callback: function(response) {
            if (response.status === 'success') {
                showSuccessModal(name, phone, address, total, 'Mobile Money', response.reference);
            } else {
                alert('Payment was not completed. Please try again.');
            }
        }
    });

    handler.openIframe();
}

// ─────────────────────────────────────────
// Cash on Delivery
// ─────────────────────────────────────────
function confirmCashOrder(total, name, phone, address) {
    showProcessingModal();
    setTimeout(() => {
        closeProcessingModal();
        showSuccessModal(name, phone, address, total, 'Cash on Delivery', null);
    }, 1000);
}

// ─────────────────────────────────────────
// Processing & Success Modals
// ─────────────────────────────────────────
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

    const referenceHTML = reference ? `<p><strong>Payment Reference:</strong> ${reference}</p>` : '';

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

// ─────────────────────────────────────────
// Smooth scroll to section
// ─────────────────────────────────────────
function scrollToSection(sectionName) {
    let target = null;
    if (sectionName === 'home') {
        target = document.querySelector('.home');
    } else {
        document.querySelectorAll('.section').forEach(sec => {
            const title = sec.querySelector('.section-title');
            if (title && title.textContent.toLowerCase().includes(sectionName.toLowerCase())) {
                target = sec;
            }
        });
    }
    if (!target) target = document.querySelector('.container');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─────────────────────────────────────────
// Inject popup style once
// ─────────────────────────────────────────
(function injectPopupStyle() {
    if (document.getElementById('order-popup-style')) return;
    const style = document.createElement('style');
    style.id = 'order-popup-style';
    style.textContent = `
        .order-popup{position:fixed;top:100px;right:20px;background:#fff;border-radius:12px;
            box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:20px 30px;z-index:10000;
            opacity:0;transform:translateX(400px);transition:all .3s ease}
        .order-popup.show{opacity:1;transform:translateX(0)}
        .popup-content{display:flex;align-items:center;gap:15px}
        .popup-icon{width:40px;height:40px;background:linear-gradient(135deg,#b8956a,#d4af7a);
            color:#fff;border-radius:50%;display:flex;align-items:center;
            justify-content:center;font-size:24px;font-weight:700}
        .popup-content h3{margin:0;color:#2c2c2c;font-size:1.2em}
        .popup-content p{margin:5px 0 0;color:#666;font-size:.95em}
    `;
    document.head.appendChild(style);
})();

// ─────────────────────────────────────────
// DOM Ready — FIX: removed broken hamburger
// code at the bottom that crashed the page
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Order buttons
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const card = this.closest('.menu-card');
            if (!card) return;
            const itemName  = card.querySelector('.card-name')?.textContent.trim() || 'Item';
            const priceText = card.querySelector('.card-price')?.textContent || '0';
            const price     = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            orderItem(itemName, price);
        });
    });

    // Review Order button
    const reviewBtn = document.querySelector('.cta');
    if (reviewBtn) reviewBtn.addEventListener('click', e => { e.preventDefault(); showCart(); });

    // Nav links — smooth scroll + close hamburger
    document.querySelectorAll('.nav-links a:not(.cta)').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const t = this.textContent.toLowerCase().trim();
            if      (t === 'home')                      scrollToSection('home');
            else if (t === 'main meal' || t === 'main') scrollToSection('main meal');
            else if (t === 'specials')                  scrollToSection('specials');
            else if (t === 'desserts')                  scrollToSection('desserts');
            else if (t === 'drinks' || t === 'beverages') scrollToSection('beverages');

            // ✅ close hamburger menu after tapping a link on mobile
            const menuToggle = document.getElementById('menu-toggle');
            if (menuToggle) menuToggle.checked = false;
        });
    });

    // Explore button
    const exploreBtn = document.querySelector('.home-btn');
    if (exploreBtn) exploreBtn.addEventListener('click', e => { e.preventDefault(); scrollToSection('main meal'); });

});


