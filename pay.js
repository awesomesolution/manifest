/**
 * Manifest with Jaya — Razorpay Checkout Frontend Integration
 */

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const payForm = document.getElementById('payForm');
    const serviceSelect = document.getElementById('serviceSelect');
    const serviceGroup = document.getElementById('serviceSelectionGroup');
    const invoiceInput = document.getElementById('invoiceNumberInput');
    const invoiceBadge = document.getElementById('invoiceBadge');
    const invBadgeNum = document.getElementById('invBadgeNum');
    const invBadgeTerms = document.getElementById('invBadgeTerms');

    const summaryServiceName = document.getElementById('summaryServiceName');
    const summaryServiceDesc = document.getElementById('summaryServiceDesc');
    const breakdownAmount = document.getElementById('breakdownAmount');
    const totalDueAmount = document.getElementById('totalDueAmount');

    const clientName = document.getElementById('clientName');
    const clientEmail = document.getElementById('clientEmail');
    const clientPhone = document.getElementById('clientPhone');

    const submitBtn = document.getElementById('paySubmitBtn');
    const btnText = document.getElementById('payBtnText');
    const errorAlert = document.getElementById('checkoutError');

    const checkoutCard = document.getElementById('checkoutCard');
    const successView = document.getElementById('paymentSuccessView');

    // Receipt elements
    const recService = document.getElementById('recService');
    const recAmount = document.getElementById('recAmount');
    const recPaymentId = document.getElementById('recPaymentId');
    const recInvoiceNum = document.getElementById('recInvoiceNum');
    const recDate = document.getElementById('recDate');
    const portalBtn = document.getElementById('portalAccessBtn');

    // Catalog cache
    let servicesMap = {};
    let activeKeyId = '';

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    const invParam = urlParams.get('inv');

    // 1. Load Config & Services from backend
    try {
        const res = await fetch('api/payment.php?action=get_config');
        const data = await res.json();
        if (data.success) {
            activeKeyId = data.key_id;
            data.services.forEach(s => {
                servicesMap[s.key] = s;
            });
        }
    } catch (e) {
        console.error('Failed to load payment config', e);
    }

    // 2. Custom Quotation / Invoice Mode vs Standard Service Mode
    if (invParam) {
        // Invoice mode
        try {
            const res = await fetch(`api/payment.php?action=get_invoice&inv=${encodeURIComponent(invParam)}`);
            const data = await res.json();
            if (data.success && data.invoice) {
                const inv = data.invoice;
                invoiceInput.value = inv.invoice_number;
                serviceGroup.style.display = 'none';

                // Display Invoice Badge
                invoiceBadge.hidden = false;
                invBadgeNum.innerText = inv.invoice_number;
                invBadgeTerms.innerText = `Terms: ${inv.payment_terms || 'Due upon receipt'}`;

                summaryServiceName.innerText = inv.service_name;
                summaryServiceDesc.innerText = inv.notes || 'Custom tailored transformation journey with Jaya Kotta.';
                const fmtAmt = '₹' + Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                breakdownAmount.innerText = fmtAmt;
                totalDueAmount.innerText = fmtAmt;

                // Pre-fill client details if available
                if (inv.customer_name) clientName.value = inv.customer_name;
                if (inv.customer_email) clientEmail.value = inv.customer_email;
                if (inv.customer_phone) clientPhone.value = inv.customer_phone;
            } else {
                showError(data.error || 'The requested quotation could not be loaded.');
            }
        } catch (e) {
            showError('Unable to connect to billing server. Please try again.');
        }
    } else {
        // Standard Service mode
        if (serviceParam && servicesMap[serviceParam]) {
            serviceSelect.value = serviceParam;
        }

        function updateSummary() {
            const selectedKey = serviceSelect.value;
            const item = servicesMap[selectedKey];
            if (item) {
                summaryServiceName.innerText = item.name;
                summaryServiceDesc.innerText = item.description;
                const fmtAmt = '₹' + Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                breakdownAmount.innerText = fmtAmt;
                totalDueAmount.innerText = fmtAmt;
            }
        }

        serviceSelect.addEventListener('change', updateSummary);
        updateSummary();
    }

    // 3. Handle Form Submission -> Create Order -> Launch Razorpay
    payForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!payForm.checkValidity()) {
            payForm.classList.add('was-validated');
            return;
        }

        submitBtn.disabled = true;
        btnText.innerText = 'Initiating Secure Order...';

        const payload = {
            action: 'create_order',
            name: clientName.value.trim(),
            email: clientEmail.value.trim(),
            phone: clientPhone.value.trim(),
            city: document.getElementById('clientCity').value.trim(),
            notes: document.getElementById('clientNotes').value.trim(),
            service_key: serviceSelect.value,
            invoice_number: invoiceInput.value.trim()
        };

        try {
            const res = await fetch('api/payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!data.success) {
                showError(data.error || 'Failed to initiate payment.');
                submitBtn.disabled = false;
                btnText.innerText = 'Proceed to Secure Payment';
                return;
            }

            // Open Razorpay Checkout Modal
            openRazorpayModal(data);

        } catch (err) {
            console.error(err);
            showError('A network error occurred. Please check your connection and try again.');
            submitBtn.disabled = false;
            btnText.innerText = 'Proceed to Secure Payment';
        }
    });

    /**
     * Launch Razorpay Checkout Modal
     */
    function openRazorpayModal(orderData) {
        // Check if mock test mode (placeholder keys on local dev)
        if (orderData.order_id && orderData.order_id.startsWith('order_mock_')) {
            // Simulate seamless successful test transaction
            const proceedSimulation = confirm(
                `[TEST MODE ACTIVATED]\n\nTesting with simulated Razorpay order: ${orderData.order_id}\nAmount: ₹${orderData.amount_rupees.toLocaleString('en-IN')}\n\nClick OK to simulate successful payment verification.`
            );
            if (proceedSimulation) {
                verifyPaymentSignature({
                    razorpay_order_id: orderData.order_id,
                    razorpay_payment_id: 'pay_test_' + Math.random().toString(36).substring(2, 10),
                    razorpay_signature: 'mock_sig_' + Math.random().toString(36).substring(2, 10),
                    method: 'upi_mock'
                }, orderData);
            } else {
                submitBtn.disabled = false;
                btnText.innerText = 'Proceed to Secure Payment';
            }
            return;
        }

        // Live / Real Razorpay Options
        if (typeof Razorpay === 'undefined') {
            showError('The Razorpay checkout gateway could not be loaded. Please ensure you have an active internet connection, disable ad-blockers, and refresh the page.');
            submitBtn.disabled = false;
            btnText.innerText = 'Proceed to Secure Payment';
            return;
        }

        const options = {
            key: orderData.key_id,
            amount: orderData.amount_paise,
            currency: orderData.currency,
            name: 'Manifest with Jaya',
            description: orderData.service_name,
            image: './assets/manifest-logo-mark.webp',
            order_id: orderData.order_id,
            prefill: {
                name: orderData.customer.name,
                email: orderData.customer.email,
                contact: orderData.customer.phone
            },
            notes: {
                invoice_number: orderData.invoice_number,
                service_key: orderData.service_key
            },
            theme: {
                color: '#a93d5d'
            },
            modal: {
                ondismiss: function () {
                    submitBtn.disabled = false;
                    btnText.innerText = 'Proceed to Secure Payment';
                }
            },
            handler: function (response) {
                verifyPaymentSignature(response, orderData);
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            showError('Payment failed: ' + (response.error.description || 'Transaction declined.'));
            submitBtn.disabled = false;
            btnText.innerText = 'Proceed to Secure Payment';
        });
        rzp.open();
    }

    /**
     * Send cryptographic signature to server for HMAC-SHA256 verification
     */
    async function verifyPaymentSignature(response, orderData) {
        btnText.innerText = 'Verifying Payment...';

        try {
            const verifyRes = await fetch('api/payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_payment',
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    method: response.method || 'razorpay'
                })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
                // Success celebration
                payForm.hidden = true;
                document.querySelector('.checkout-header').hidden = true;
                successView.hidden = false;

                recService.innerText = orderData.service_name;
                recAmount.innerText = '₹' + Number(orderData.amount_rupees).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                recPaymentId.innerText = response.razorpay_payment_id;
                recInvoiceNum.innerText = orderData.invoice_number;
                recDate.innerText = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

                // If user enrolled in DMJ or coaching, redirect option
                if (portalBtn && (orderData.service_key === 'dmj-monthly' || orderData.service_key === 'dmj-yearly')) {
                    portalBtn.innerText = 'Enter Member Portal Now →';
                    portalBtn.href = `members.html?enrolled=${encodeURIComponent(orderData.customer.email)}`;
                }

                // Scroll up smoothly
                window.scrollTo({ top: 100, behavior: 'smooth' });
            } else {
                showError(verifyData.error || 'Payment signature could not be verified.');
                submitBtn.disabled = false;
                btnText.innerText = 'Proceed to Secure Payment';
            }
        } catch (e) {
            console.error(e);
            showError('Could not verify transaction with server. Please keep your Payment ID handy: ' + response.razorpay_payment_id);
            submitBtn.disabled = false;
            btnText.innerText = 'Proceed to Secure Payment';
        }
    }

    function showError(msg) {
        errorAlert.innerText = msg;
        errorAlert.hidden = false;
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideError() {
        errorAlert.hidden = true;
    }
});
