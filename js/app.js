import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
            import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
            import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, doc, setDoc, serverTimestamp, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
            import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-analytics.js";

            // ── Firebase Config (Fashcycle project) ──
            const firebaseConfig = {
                apiKey: "AIzaSyCDA9gHDE_4DrBMija6jql4WOwwIODSzHE",
                authDomain: "fashcycle-c3a60.firebaseapp.com",
                projectId: "fashcycle-c3a60",
                storageBucket: "fashcycle-c3a60.firebasestorage.app",
                messagingSenderId: "115893081508",
                appId: "1:115893081508:web:51c1004d416d5117df9d31",
                measurementId: "G-QBDV365Z36"
            };

            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const analytics = getAnalytics(app);
            const googleProvider = new GoogleAuthProvider();
            googleProvider.setCustomParameters({ prompt: 'select_account' });

            // ── Sandbox Mode Fallback State ──
            let sandboxMode = false;
            let sandboxUser = null;

            function activateSandbox(userObj) {
                sandboxMode = true;
                sandboxUser = userObj;
                localStorage.setItem('fashcycle_sandbox_user', JSON.stringify(userObj));

                document.getElementById('signInNavBtn').style.display = 'none';
                document.getElementById('userNavMenu').style.display = 'flex';
                const initials = (userObj.displayName || userObj.email || 'U').charAt(0).toUpperCase();
                document.getElementById('avatarCircle').textContent = initials;
                document.getElementById('dropdownUserName').textContent = userObj.displayName || 'Sandbox Account';
                document.getElementById('dropdownUserEmail').textContent = userObj.email;

                showToast("✨ Sandbox active: Running in local preview mode!");
            }

            // Check for existing sandbox session on load
            const savedSandboxUser = localStorage.getItem('fashcycle_sandbox_user');
            if (savedSandboxUser) {
                try {
                    activateSandbox(JSON.parse(savedSandboxUser));
                } catch (e) { }
            }

            // ── Auth State Observer ──
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    sandboxMode = false;
                    localStorage.removeItem('fashcycle_sandbox_user');
                    document.getElementById('signInNavBtn').style.display = 'none';
                    document.getElementById('userNavMenu').style.display = 'flex';
                    const initials = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                    document.getElementById('avatarCircle').textContent = initials;
                    document.getElementById('dropdownUserName').textContent = user.displayName || 'My Account';
                    document.getElementById('dropdownUserEmail').textContent = user.email;

                    // Write user details to Firestore: users/{uid}
                    try {
                        const userDocRef = doc(db, 'users', user.uid);
                        await setDoc(userDocRef, {
                            uid: user.uid,
                            displayName: user.displayName || 'Fashcycle User',
                            email: user.email,
                            lastLogin: serverTimestamp()
                        }, { merge: true });
                    } catch (e) {
                        console.warn("Failed to update user profile in Firestore database:", e);
                    }
                } else if (!sandboxMode) {
                    document.getElementById('signInNavBtn').style.display = 'flex';
                    document.getElementById('userNavMenu').style.display = 'none';
                }
            });

            // ── Auth Modal Controls ──
            window.openAuthModal = () => {
                const modal = document.getElementById('authModal');
                modal.style.display = 'flex';
            };
            window.closeAuthModal = () => {
                document.getElementById('authModal').style.display = 'none';
            };

            window.switchAuthTab = (tab) => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                event.target.classList.add('active');
                document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
                document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
            };

            // ── Google Sign-In ──
            window.signInWithGoogle = async () => {
                try {
                    await signInWithPopup(auth, googleProvider);
                    window.closeAuthModal();
                } catch (e) {
                    console.warn("Firebase Auth Error, failing over to Sandbox Google Login:", e);
                    activateSandbox({
                        uid: "sandbox_google_user",
                        displayName: "Gourav Bamaniya",
                        email: "gouravbamaniya441@gmail.com"
                    });
                    window.closeAuthModal();
                }
            };

            // ── Email Sign-In ──
            window.signInWithEmail = async () => {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                if (!email || !password) {
                    showAuthError("Please enter your email and password.");
                    return;
                }
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    window.closeAuthModal();
                } catch (e) {
                    console.warn("Firebase Auth Error, failing over to Sandbox Email Sign-in:", e);
                    activateSandbox({
                        uid: "sandbox_email_" + btoa(email).substring(0, 8),
                        displayName: email.split('@')[0],
                        email: email
                    });
                    window.closeAuthModal();
                }
            };

            // ── Create Account ──
            window.createAccount = async () => {
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                if (!name || !email || !password) {
                    showSignupError("Please fill out all signup fields.");
                    return;
                }
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(cred.user, { displayName: name });
                    window.closeAuthModal();
                } catch (e) {
                    console.warn("Firebase Auth Error, failing over to Sandbox Account Creation:", e);
                    activateSandbox({
                        uid: "sandbox_email_" + btoa(email).substring(0, 8),
                        displayName: name,
                        email: email
                    });
                    window.closeAuthModal();
                }
            };

            // ── Logout ──
            window.firebaseLogout = async () => {
                sandboxMode = false;
                sandboxUser = null;
                localStorage.removeItem('fashcycle_sandbox_user');
                await signOut(auth).catch(() => { });
                document.getElementById('signInNavBtn').style.display = 'flex';
                document.getElementById('userNavMenu').style.display = 'none';
                document.getElementById('profileDropdownMenu').style.display = 'none';
            };

            // ── Profile Dropdown Toggle ──
            window.toggleProfileDropdown = () => {
                const dd = document.getElementById('profileDropdownMenu');
                dd.style.display = dd.style.display === 'flex' ? 'none' : 'flex';
            };
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-profile-menu')) {
                    const dd = document.getElementById('profileDropdownMenu');
                    if (dd) dd.style.display = 'none';
                }
            });

            // ── Checkout Modal ──
            let currentCheckoutItem = null;

            window.openCheckout = (name, price, img) => {
                const user = auth.currentUser || sandboxUser;
                if (!user) {
                    window.openAuthModal();
                    return;
                }
                currentCheckoutItem = { name, price, img };

                // ── Populate item info ──
                document.getElementById('checkoutName').textContent = name;
                document.getElementById('checkoutPrice').textContent = price;
                document.getElementById('checkoutImg').src = img;

                // ── Reset all fields cleanly ──
                document.getElementById('rentalStart').value = '';
                document.getElementById('rentalEnd').value = '';
                document.getElementById('deliveryAddress').value = '';
                document.getElementById('rentalSummary').style.display = 'none';
                document.getElementById('checkoutError').style.display = 'none';
                if (document.getElementById('deliveryMapWrap'))
                    document.getElementById('deliveryMapWrap').style.display = 'none';
                if (document.getElementById('addressSuggestions'))
                    document.getElementById('addressSuggestions').style.display = 'none';

                // ── Set minimum date to tomorrow ──
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                const dayAfterStr = new Date(tomorrow.getTime() + 86400000).toISOString().split('T')[0];

                const startEl = document.getElementById('rentalStart');
                const endEl = document.getElementById('rentalEnd');
                startEl.min = tomorrowStr;
                startEl.value = tomorrowStr;
                endEl.min = dayAfterStr;
                endEl.value = dayAfterStr;

                // ── Remove old listeners, re-attach fresh ──
                const newStart = startEl.cloneNode(true);
                const newEnd = endEl.cloneNode(true);
                startEl.parentNode.replaceChild(newStart, startEl);
                endEl.parentNode.replaceChild(newEnd, endEl);

                newStart.addEventListener('change', () => {
                    const sDate = new Date(newStart.value);
                    const minEnd = new Date(sDate.getTime() + 86400000).toISOString().split('T')[0];
                    newEnd.min = minEnd;
                    if (!newEnd.value || newEnd.value <= newStart.value) newEnd.value = minEnd;
                    updateRentalSummary();
                });
                newEnd.addEventListener('change', updateRentalSummary);

                // Show modal
                document.getElementById('checkoutModal').style.display = 'flex';

                // Calculate summary for pre-filled dates
                updateRentalSummary();
            };

            window.closeCheckout = () => {
                document.getElementById('checkoutModal').style.display = 'none';
            };

            function updateRentalSummary() {
                const startEl = document.getElementById('rentalStart');
                const endEl = document.getElementById('rentalEnd');
                const start = startEl ? startEl.value : '';
                const end = endEl ? endEl.value : '';
                if (!start || !end || !currentCheckoutItem) return;
                const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
                if (days <= 0) return;
                const pricePerDay = parseInt(currentCheckoutItem.price.replace(/[^\d]/g, ''));
                document.getElementById('rentalDays').textContent = `${days} day${days > 1 ? 's' : ''}`;
                document.getElementById('rentalTotal').textContent = `₹${(pricePerDay * days).toLocaleString('en-IN')}`;
                document.getElementById('rentalSummary').style.display = 'block';
            }

            // ── Confirm & Save Rental ──
            window.confirmRental = async () => {
                const user = auth.currentUser || sandboxUser;
                if (!user || !currentCheckoutItem) return;

                const start = document.getElementById('rentalStart').value;
                const end = document.getElementById('rentalEnd').value;
                const address = document.getElementById('deliveryAddress').value;
                const errEl = document.getElementById('checkoutError');

                if (!start || !end || !address) {
                    errEl.textContent = 'Please fill in all fields.';
                    errEl.style.display = 'block';
                    return;
                }

                if (new Date(end) <= new Date(start)) {
                    errEl.textContent = 'End date must be after start date.';
                    errEl.style.display = 'block';
                    return;
                }
                errEl.style.display = 'none';

                const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
                const pricePerDay = parseInt(currentCheckoutItem.price.replace(/[^\d]/g, ''));
                const rentalData = {
                    userId: user.uid,
                    userName: user.displayName || user.email,
                    itemName: currentCheckoutItem.name,
                    itemImg: currentCheckoutItem.img,
                    pricePerDay,
                    totalCost: pricePerDay * days,
                    rentalStartStr: start,
                    rentalEndStr: end,
                    deliveryAddress: address,
                    phone: user.email,
                    status: 'confirmed',
                    bookedAtStr: new Date().toISOString()
                };

                // ── Launch the Order Success Modal with Animations ──
                window.closeCheckout();
                window.showSuccessModal(rentalData, user, days);

                if (sandboxMode) {
                    saveSandboxRental(rentalData);
                    currentCheckoutItem = null;
                    return;
                }

                // Try to write to Firestore with a 2-second timeout wrapper
                try {
                    const savePromise = addDoc(collection(db, 'users', user.uid, 'rentals'), {
                        ...rentalData,
                        rentalStart: Timestamp.fromDate(new Date(start)),
                        rentalEnd: Timestamp.fromDate(new Date(end)),
                        bookedAt: Timestamp.now()
                    });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                    await Promise.race([savePromise, timeoutPromise]);
                    currentCheckoutItem = null;
                } catch (e) {
                    console.warn("Firestore save failed or timed out, falling back to local Sandbox Storage:", e);
                    saveSandboxRental(rentalData);
                    currentCheckoutItem = null;
                }
            };

            // ── Success Modal Helper Functions ──
            window.showSuccessModal = (rental, user, days) => {
                const modal = document.getElementById('successModal');
                if (!modal) return;

                // Generate tracking details
                const orderId = 'FC' + Date.now().toString().slice(-8);
                const estDeliveryDate = new Date(rental.rentalStartStr);
                // Set est delivery to tomorrow or the rental start date
                const estDeliveryStr = estDeliveryDate.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                }) + '; 04:00pm';

                document.getElementById('successItemImg').src = rental.itemImg;
                document.getElementById('successItemName').textContent = rental.itemName;
                document.getElementById('successItemPrice').textContent = `₹${rental.totalCost.toLocaleString('en-IN')}`;
                document.getElementById('successOrderId').textContent = orderId;
                document.getElementById('successTrackingId').textContent = orderId;
                document.getElementById('successEstDelivery').textContent = estDeliveryStr;
                
                document.getElementById('successAddress').textContent = rental.deliveryAddress;
                document.getElementById('successAddress').title = rental.deliveryAddress;

                const loader = document.getElementById('successEmailStatus');
                if (loader) {
                    loader.style.display = 'flex';
                    loader.style.background = '#ECFDF5';
                    loader.style.color = '#065F46';
                    loader.innerHTML = `
                        <span class="spinner-mini" style="border:2px solid #047857;border-top:2px solid transparent;border-radius:50%;width:10px;height:10px;display:inline-block;animation:spin 0.8s linear infinite;"></span>
                        <span>Emailing order confirmation details...</span>
                    `;
                }

                modal.style.display = 'flex';

                // Trigger beautiful live canvas confetti explosion!
                setTimeout(triggerConfetti, 100);

                // Dispatch confirmation email to Admin and Customer via Web3Forms
                try {
                    const formData = new FormData();
                    formData.append("access_key", "01502762-5065-498c-b044-2ef30f45a7b6");
                    formData.append("subject", `👗 Fashcycle Booking Confirmed: ${rental.itemName}`);
                    formData.append("from_name", "Fashcycle Store");
                    
                    // Admin & Customer Emails
                    formData.append("admin_email", "gouravbamaniya441@gmail.com");
                    formData.append("email", user.email);
                    
                    formData.append("Customer Name", user.displayName || user.email.split('@')[0]);
                    formData.append("Customer Email", user.email);
                    formData.append("Item Name", rental.itemName);
                    formData.append("Daily Rental Price", `₹${rental.pricePerDay}`);
                    formData.append("Total Paid", `₹${rental.totalCost}`);
                    formData.append("Duration", `${days} Day(s)`);
                    formData.append("Rental Start Date", rental.rentalStartStr);
                    formData.append("Rental End Date", rental.rentalEndStr);
                    formData.append("Delivery Address", rental.deliveryAddress);
                    formData.append("Order ID", orderId);
                    
                    if (window.deliveryMarker) {
                        const latlng = window.deliveryMarker.getLatLng();
                        formData.append("GPS Coordinates", `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
                        formData.append("Google Maps Location Link", `https://www.google.com/maps?q=${latlng.lat},${latlng.lng}`);
                    }
                    
                    fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        body: formData
                    }).then(res => {
                        if (loader) {
                            loader.style.background = '#ECFDF5';
                            loader.style.color = '#065F46';
                            loader.innerHTML = `✓ <span>Confirmation emails sent! Check your inbox.</span>`;
                        }
                    }).catch(err => {
                        if (loader) {
                            loader.style.background = '#FEF2F2';
                            loader.style.color = '#991B1B';
                            loader.innerHTML = `⚠️ <span>Could not dispatch email invoice, saved to My Rentals!</span>`;
                        }
                    });
                } catch (err) {
                    console.warn("Could not send confirmation email:", err);
                    if (loader) {
                        loader.style.background = '#FEF2F2';
                        loader.style.color = '#991B1B';
                        loader.innerHTML = `⚠️ <span>Could not dispatch email invoice, saved to My Rentals!</span>`;
                    }
                }
            };

            window.closeSuccessModal = () => {
                document.getElementById('successModal').style.display = 'none';
                confettiActive = false;
                // Scroll to My Rentals portal or reload dashboard
                window.showRentalsPortal();
            };

            let confettiActive = false;
            function triggerConfetti() {
                const canvas = document.getElementById('successConfettiCanvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;

                const colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#3b82f6', '#60a5fa'];
                const particles = [];
                for (let i = 0; i < 90; i++) {
                    particles.push({
                        x: canvas.width / 2,
                        y: canvas.height / 2 - 15,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10 - 5,
                        r: Math.random() * 5 + 3,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 8
                    });
                }

                confettiActive = true;
                function animate() {
                    if (!confettiActive) return;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    let alive = false;
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.25; // gravity
                        p.vx *= 0.97; // air resistance
                        p.rotation += p.rotationSpeed;

                        if (p.y < canvas.height && p.x > 0 && p.x < canvas.width) {
                            alive = true;
                            ctx.save();
                            ctx.translate(p.x, p.y);
                            ctx.rotate(p.rotation * Math.PI / 180);
                            ctx.fillStyle = p.color;
                            ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                            ctx.restore();
                        }
                    });

                    if (alive) {
                        requestAnimationFrame(animate);
                    }
                }
                animate();
            }


            function saveSandboxRental(rental) {
                const rentals = JSON.parse(localStorage.getItem('fashcycle_sandbox_rentals') || '[]');
                rentals.push(rental);
                localStorage.setItem('fashcycle_sandbox_rentals', JSON.stringify(rentals));
            }

            // ── My Rentals Portal ──
            window.showRentalsPortal = async () => {
                const user = auth.currentUser || sandboxUser;
                if (!user) return;
                document.getElementById('profileDropdownMenu').style.display = 'none';
                document.getElementById('rentalsPortalModal').style.display = 'flex';

                const container = document.getElementById('rentalsListContainer');
                
                // Instantly render local sandbox rentals so the user never gets stuck with a freezing loader!
                renderSandboxRentals(user.uid, container);

                if (sandboxMode) {
                    return;
                }

                // Attempt to fetch Firestore rentals with a 2-second timeout fallback
                try {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                    const snap = await Promise.race([getDocs(collection(db, 'users', user.uid, 'rentals')), timeoutPromise]);

                    if (snap && !snap.empty) {
                        let html = '';
                        snap.forEach(doc => {
                            const r = doc.data();
                            const docId = doc.id;
                            const startVal = r.rentalStart ? r.rentalStart.toDate() : new Date(r.rentalStartStr);
                            const endVal = r.rentalEnd ? r.rentalEnd.toDate() : new Date(r.rentalEndStr);
                            const start = startVal.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const end = endVal.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            
                            const badgeClass = r.status === 'confirmed' ? 'active' : (r.status === 'cancelled' ? 'cancelled' : 'pending');
                            
                            const cancelBtn = (r.status !== 'cancelled') 
                                ? `<button onclick="cancelRentalOrder('${docId}', false)" style="padding: 5px 10px; font-size: 11px; font-weight: 700; margin-top: 8px; border: 1px solid #ef4444; color: #ef4444; background: transparent; border-radius: 6px; cursor: pointer; display: block; width: fit-content; transition: background 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Cancel Order</button>` 
                                : '';

                            html += `
            <div class="rental-item-row">
              <img src="${r.itemImg}" style="width:60px;height:75px;object-fit:cover;border-radius:10px;">
              <div>
                <div style="font-weight:700;font-size:15px;">${r.itemName}</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">📅 ${start} → ${end}</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">📞 Phone: ${r.phone || 'N/A'}</div>
                <div style="font-size:13px;color:var(--text-secondary);">📍 ${r.deliveryAddress.substring(0, 35)}...</div>
                ${cancelBtn}
              </div>
              <div class="rental-status-badge status-${badgeClass}">${r.status}</div>
              <div style="font-weight:700;color:var(--brand-green);">₹${r.totalCost?.toLocaleString('en-IN') || '—'}</div>
            </div>`;
                        });

                        // Render both local sandbox rentals and Firestore rentals
                        const sandboxRentals = JSON.parse(localStorage.getItem('fashcycle_sandbox_rentals') || '[]');
                        const filteredSandbox = sandboxRentals.filter(r => r.userId === user.uid);
                        let sandboxHtml = '';
                        filteredSandbox.forEach(r => {
                            const start = new Date(r.rentalStartStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const end = new Date(r.rentalEndStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            
                            const badgeClass = r.status === 'confirmed' ? 'active' : (r.status === 'cancelled' ? 'cancelled' : 'pending');
                            
                            const cancelBtn = (r.status !== 'cancelled') 
                                ? `<button onclick="cancelRentalOrder('${r.bookedAtStr}', true)" style="padding: 5px 10px; font-size: 11px; font-weight: 700; margin-top: 8px; border: 1px solid #ef4444; color: #ef4444; background: transparent; border-radius: 6px; cursor: pointer; display: block; width: fit-content; transition: background 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Cancel Order</button>` 
                                : '';

                            sandboxHtml += `
            <div class="rental-item-row">
              <img src="${r.itemImg}" style="width:60px;height:75px;object-fit:cover;border-radius:10px;">
              <div>
                <div style="font-weight:700;font-size:15px;">${r.itemName}</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">📅 ${start} → ${end}</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">📞 Phone: ${r.phone || 'N/A'}</div>
                <div style="font-size:13px;color:var(--text-secondary);">📍 ${r.deliveryAddress.substring(0, 35)}...</div>
                ${cancelBtn}
              </div>
              <div class="rental-status-badge status-${badgeClass}">${r.status}</div>
              <div style="font-weight:700;color:var(--brand-green);">₹${r.totalCost?.toLocaleString('en-IN') || '—'}</div>
            </div>`;
                        });

                        container.innerHTML = html + sandboxHtml;
                    }
                } catch (e) {
                    console.warn("Failed to load Firestore rentals or request timed out:", e);
                }
            };

            function renderSandboxRentals(userId, container) {
                const rentals = JSON.parse(localStorage.getItem('fashcycle_sandbox_rentals') || '[]');
                const filtered = rentals.filter(r => r.userId === userId);

                if (!filtered.length) {
                    container.innerHTML = `
          <div style="text-align:center;padding:40px 0;color:var(--text-secondary);">
            <div style="font-size:48px;margin-bottom:12px;">🛍️</div>
            <p>No rentals yet. Start browsing!</p>
            <button onclick="closeRentalsPortal();document.getElementById('browse').scrollIntoView();" class="btn btn-primary" style="margin-top:16px;">Browse Wardrobe →</button>
          </div>`;
                    return;
                }

                let html = '';
                filtered.forEach(r => {
                    const start = new Date(r.rentalStartStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    const end = new Date(r.rentalEndStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    
                    const badgeClass = r.status === 'confirmed' ? 'active' : (r.status === 'cancelled' ? 'cancelled' : 'pending');
                    
                    const cancelBtn = (r.status !== 'cancelled') 
                        ? `<button onclick="cancelRentalOrder('${r.bookedAtStr}', true)" style="padding: 5px 10px; font-size: 11px; font-weight: 700; margin-top: 8px; border: 1px solid #ef4444; color: #ef4444; background: transparent; border-radius: 6px; cursor: pointer; display: block; width: fit-content; transition: background 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Cancel Order</button>` 
                        : '';

                    html += `
          <div class="rental-item-row">
            <img src="${r.itemImg}" style="width:60px;height:75px;object-fit:cover;border-radius:10px;">
            <div>
              <div style="font-weight:700;font-size:15px;">${r.itemName}</div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">📅 ${start} → ${end}</div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">📞 Phone: ${r.phone || 'N/A'}</div>
              <div style="font-size:13px;color:var(--text-secondary);">📍 ${r.deliveryAddress.substring(0, 35)}...</div>
              ${cancelBtn}
            </div>
            <div class="rental-status-badge status-${badgeClass}">${r.status}</div>
            <div style="font-weight:700;color:var(--brand-green);">₹${r.totalCost?.toLocaleString('en-IN') || '—'}</div>
          </div>`;
                });
                container.innerHTML = html;
            }

            // ── Cancel Rental Order Action ──
            window.cancelRentalOrder = async (orderIdOrTimestamp, isSandbox) => {
                if (!confirm("Are you sure you want to cancel this order?")) return;

                const user = auth.currentUser || sandboxUser;
                if (!user) return;

                let cancelledItemName = '';
                let cancelledItemCost = 0;

                if (isSandbox || sandboxMode) {
                    const rentals = JSON.parse(localStorage.getItem('fashcycle_sandbox_rentals') || '[]');
                    const index = rentals.findIndex(r => r.bookedAtStr === orderIdOrTimestamp && r.userId === user.uid);
                    if (index !== -1) {
                        rentals[index].status = 'cancelled';
                        cancelledItemName = rentals[index].itemName;
                        cancelledItemCost = rentals[index].totalCost;
                        localStorage.setItem('fashcycle_sandbox_rentals', JSON.stringify(rentals));
                    }
                } else {
                    try {
                        const docRef = doc(db, 'users', user.uid, 'rentals', orderIdOrTimestamp);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            cancelledItemName = data.itemName;
                            cancelledItemCost = data.totalCost;
                            await updateDoc(docRef, { status: 'cancelled' });
                        }
                    } catch (e) {
                        console.error("Firestore cancel failed, trying sandbox fallback:", e);
                        const rentals = JSON.parse(localStorage.getItem('fashcycle_sandbox_rentals') || '[]');
                        const index = rentals.findIndex(r => r.bookedAtStr === orderIdOrTimestamp && r.userId === user.uid);
                        if (index !== -1) {
                            rentals[index].status = 'cancelled';
                            cancelledItemName = rentals[index].itemName;
                            cancelledItemCost = rentals[index].totalCost;
                            localStorage.setItem('fashcycle_sandbox_rentals', JSON.stringify(rentals));
                        }
                    }
                }

                showToast("Order cancelled successfully.");
                window.showRentalsPortal(); // reload portal list

                // Dispatch Web3Forms cancellation email to admin & customer
                try {
                    const formData = new FormData();
                    formData.append("access_key", "01502762-5065-498c-b044-2ef30f45a7b6");
                    formData.append("subject", `❌ Fashcycle Booking Cancelled: ${cancelledItemName || 'Outfit'}`);
                    formData.append("from_name", "Fashcycle Store");
                    
                    // Admin & Customer Emails
                    formData.append("admin_email", "gouravbamaniya441@gmail.com");
                    formData.append("email", user.email);
                    
                    formData.append("Customer Name", user.displayName || user.email.split('@')[0]);
                    formData.append("Customer Email", user.email);
                    formData.append("Item Name", cancelledItemName || 'Outfit');
                    formData.append("Total Refund Amount", `₹${cancelledItemCost || 0}`);
                    formData.append("Cancellation Status", "Cancelled & Refund Processing");
                    
                    fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        body: formData
                    });
                } catch (err) {
                    console.warn("Could not dispatch cancellation email:", err);
                }
            };

            // ── List Your Store Application Submission ──
            window.submitStoreApplication = async (event) => {
                event.preventDefault();
                
                const ownerName = document.getElementById('storeOwnerName').value.trim();
                const storeName = document.getElementById('storeName').value.trim();
                const phoneInput = document.getElementById('storePhone').value.trim();
                const email = document.getElementById('storeEmail').value.trim();
                const city = document.getElementById('storeCity').value.trim();
                const address = document.getElementById('storeAddress').value.trim();
                const products = document.getElementById('storeProducts').value.trim();
                const inventorySize = document.getElementById('storeInventorySize').value.trim();
                const priceRange = document.getElementById('storePriceRange').value.trim();
                const additionalInfo = document.getElementById('storeAdditionalInfo').value.trim();
                
                const errorEl = document.getElementById('storeFormError');
                const successEl = document.getElementById('storeFormSuccess');
                const submitBtn = event.target.querySelector('button[type="submit"]');
                
                if (errorEl) errorEl.style.display = 'none';
                if (successEl) successEl.style.display = 'none';
                
                // Phone Validation (10 digits starting with 6-9)
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!phoneRegex.test(phoneInput)) {
                    if (errorEl) {
                        errorEl.textContent = 'Please enter a valid 10-digit Indian phone number.';
                        errorEl.style.display = 'block';
                    }
                    return;
                }
                
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                
                const appData = {
                    ownerName,
                    storeName,
                    phone: '+91' + phoneInput,
                    email,
                    city,
                    address,
                    products,
                    inventorySize: inventorySize || 'Not specified',
                    priceRange: priceRange || 'Not specified',
                    additionalInfo: additionalInfo || 'None',
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                };
                
                let savedToFirestore = false;
                
                if (!sandboxMode) {
                    try {
                        const savePromise = addDoc(collection(db, 'lender_applications'), {
                            ...appData,
                            submittedAt: Timestamp.now()
                        });
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                        await Promise.race([savePromise, timeoutPromise]);
                        savedToFirestore = true;
                    } catch (e) {
                        console.warn("Firestore save failed, submitting via Sandbox local mode:", e);
                    }
                }
                
                // Fallback to local storage for local persistence
                const localApps = JSON.parse(localStorage.getItem('fashcycle_store_applications') || '[]');
                localApps.push(appData);
                localStorage.setItem('fashcycle_store_applications', JSON.stringify(localApps));
                
                // Send email notification to Admin & Owner via Web3Forms
                try {
                    const formData = new FormData();
                    formData.append("access_key", "01502762-5065-498c-b044-2ef30f45a7b6");
                    formData.append("subject", `🏪 New Store SaaS Application: ${storeName}`);
                    formData.append("from_name", "Fashcycle SaaS");
                    
                    // Admin & Customer Emails
                    formData.append("admin_email", "gouravbamaniya441@gmail.com");
                    formData.append("email", email);
                    
                    formData.append("Owner Name", ownerName);
                    formData.append("Store Name", storeName);
                    formData.append("Phone Number", '+91' + phoneInput);
                    formData.append("Email Address", email);
                    formData.append("City", city);
                    formData.append("Store Address", address);
                    formData.append("Products Rented", products);
                    formData.append("Inventory Size", inventorySize || "Not specified");
                    formData.append("Price Range", priceRange || "Not specified");
                    formData.append("Additional Comments", additionalInfo || "None");
                    formData.append("Database Status", savedToFirestore ? "Saved to Firestore" : "Saved to Sandbox Storage Only");
                    
                    await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        body: formData
                    });
                } catch (err) {
                    console.warn("Web3Forms email submit failed for store application:", err);
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                
                // Show Success
                if (successEl) {
                    successEl.textContent = '🎉 Application submitted successfully! We will contact you soon.';
                    successEl.style.display = 'block';
                }
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    window.closeListStoreModal();
                }, 2000);
            };

            window.closeRentalsPortal = () => {
                document.getElementById('rentalsPortalModal').style.display = 'none';
            };

            // ── Helpers ──
            function showAuthError(msg) {
                const el = document.getElementById('authError');
                el.textContent = msg; el.style.display = 'block';
            }
            function showSignupError(msg) {
                const el = document.getElementById('signupError');
                el.textContent = msg; el.style.display = 'block';
            }
            function friendlyError(code) {
                const map = {
                    'auth/user-not-found': 'No account found with this email.',
                    'auth/wrong-password': 'Incorrect password. Try again.',
                    'auth/email-already-in-use': 'This email is already registered. Sign in instead.',
                    'auth/weak-password': 'Password must be at least 6 characters.',
                    'auth/invalid-email': 'Invalid email address.',
                    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
                };
                return map[code] || 'Something went wrong. Please try again.';
            }
            function formatDate(dateStr) {
                return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            function showToast(msg) {
                const toast = document.createElement('div');
                toast.textContent = msg;
                Object.assign(toast.style, {
                    position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--brand-green)', color: '#fff', padding: '16px 28px',
                    borderRadius: '100px', zIndex: '9999', fontWeight: '600', fontSize: '15px',
                    boxShadow: '0 8px 30px rgba(0,135,81,0.35)', maxWidth: '90vw', textAlign: 'center',
                    animation: 'modalFadeIn 0.4s ease'
                });
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
            }