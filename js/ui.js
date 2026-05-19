// 1. Scroll Progress Bar
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.getElementById("myProgressBar").style.width = scrolled + "%";
        });

        // 2. Sticky Nav Scroll Behavior
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // 3. Dark Mode Toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');

        // Check local storage preference
        if (localStorage.getItem('dark-mode') === 'enabled') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.innerText = '☀️';
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
                themeToggleBtn.innerText = '☀️';
            } else {
                localStorage.setItem('dark-mode', 'disabled');
                themeToggleBtn.innerText = '🌙';
            }
        });

        // 4. Mobile Menu
        window.toggleMobileMenu = function () {
            const navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('mobile-active');
        };

        // 5. Intersection Observer for Fade-Up Animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-up').forEach(el => {
            observer.observe(el);
        });

        // 6. Counter Animation
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = document.querySelectorAll('.counter');
                    const speed = 200; // speed of count

                    counters.forEach(counter => {
                        const updateCount = () => {
                            const target = +counter.getAttribute('data-target');
                            const count = +counter.innerText.replace(/,/g, '').replace('₹', '');

                            const inc = target / speed;

                            if (count < target) {
                                const prefix = counter.getAttribute('data-prefix') || '';
                                counter.innerText = prefix + Math.ceil(count + inc).toLocaleString('en-IN');
                                setTimeout(updateCount, 10);
                            } else {
                                const prefix = counter.getAttribute('data-prefix') || '';
                                counter.innerText = prefix + target.toLocaleString('en-IN');
                            }
                        };
                        updateCount();
                    });
                    observer.unobserve(entry.target);
                }
            });
        });

        const counterSection = document.getElementById('counter-section');
        if (counterSection) {
            counterObserver.observe(counterSection);
        }

        // 7. Tab Toggle (How It Works)
        window.switchTab = function (tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            if (tab === 'renters') {
                document.getElementById('flow-renters').style.display = 'grid';
                document.getElementById('flow-lenders').style.display = 'none';
            } else {
                document.getElementById('flow-renters').style.display = 'none';
                document.getElementById('flow-lenders').style.display = 'grid';
            }
        };

        // 8. SaaS Section Dashboard Carousel
        let currentSaasSlide = 0;
        const saasCarouselTrack = document.getElementById('saasCarouselTrack');

        window.setSaasSlide = function(index) {
            currentSaasSlide = index;
            if (currentSaasSlide > 2) currentSaasSlide = 0;
            if (currentSaasSlide < 0) currentSaasSlide = 2;
            
            if (saasCarouselTrack) {
                saasCarouselTrack.style.transform = `translateX(-${currentSaasSlide * 33.333}%)`;
            }
            
            const saasDots = document.querySelectorAll('.saas-carousel-dot');
            saasDots.forEach((dot, idx) => {
                if (idx === currentSaasSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };

        window.moveSaasCarousel = function(direction) {
            setSaasSlide(currentSaasSlide + direction);
        };

        // Auto play the carousel every 4 seconds
        let saasCarouselInterval = setInterval(() => {
            moveSaasCarousel(1);
        }, 4000);

        // Pause autoplay on mouse hover
        setTimeout(() => {
            const carouselContainer = document.querySelector('.saas-carousel-container');
            if (carouselContainer) {
                carouselContainer.addEventListener('mouseenter', () => clearInterval(saasCarouselInterval));
                carouselContainer.addEventListener('mouseleave', () => {
                    clearInterval(saasCarouselInterval);
                    saasCarouselInterval = setInterval(() => {
                        moveSaasCarousel(1);
                    }, 4000);
                });
            }
        }, 100);

        // List Your Store Modal logic
        window.openListStoreModal = function() {
            document.getElementById('listStoreModal').style.display = 'flex';
        };

        window.closeListStoreModal = function() {
            document.getElementById('listStoreModal').style.display = 'none';
            // Reset form status
            const errorEl = document.getElementById('storeFormError');
            const successEl = document.getElementById('storeFormSuccess');
            if (errorEl) errorEl.style.display = 'none';
            if (successEl) successEl.style.display = 'none';
            const form = document.getElementById('listStoreForm');
            if (form) form.reset();
        };

        // Wishlist Toggle Interaction
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const svg = this.querySelector('svg');
                if (svg.getAttribute('fill') === 'none') {
                    svg.setAttribute('fill', 'var(--error)');
                    svg.setAttribute('stroke', 'var(--error)');
                } else {
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', '#1C1917');
                }
            });
        });

        // 9. AI Style Quiz Logic
        window.openQuiz = function () {
            document.getElementById('quizModal').style.display = 'flex';
            document.getElementById('q-step-1').classList.add('active');
            document.getElementById('q-step-2').classList.remove('active');
            document.getElementById('q-step-3').classList.remove('active');
        };

        window.closeQuiz = function () {
            document.getElementById('quizModal').style.display = 'none';
        };

        let quizChoices = {};
        window.nextQuizStep = function (step, val) {
            if (step === 2) {
                quizChoices.occasion = val;
                document.getElementById('q-step-1').classList.remove('active');
                document.getElementById('q-step-2').classList.add('active');
            } else if (step === 3) {
                quizChoices.vibe = val;
                document.getElementById('q-step-2').classList.remove('active');
                document.getElementById('q-step-3').classList.add('active');
                renderQuizResult();
            }
        };

        function renderQuizResult() {
            const resultArea = document.getElementById('quizResultArea');
            let img = "https://fashcycle-official-media.s3.amazonaws.com/image/e67c5ee7-653c-428c-af81-8ea752adc26f.webp";
            let title = "Luxury Bridal Lehenga";
            let price = "₹75/day";

            if (quizChoices.occasion === 'Cocktail') {
                img = "https://fashcycle-official-media.s3.amazonaws.com/image/c2aa2ca5-acb6-468a-b1bb-0f447c96baf0.webp";
                title = "Emerald Silk Gown";
                price = "₹89/day";
            } else if (quizChoices.occasion === 'Wedding' && quizChoices.vibe === 'Traditional') {
                img = "https://fashcycle-official-media.s3.amazonaws.com/image/391d38cd-3461-4536-bff5-e0ab59f17ed3.webp";
                title = "Silk Banarasi Weave";
                price = "₹45/day";
            } else if (quizChoices.occasion === 'Festive') {
                img = "https://fashcycle-official-media.s3.amazonaws.com/image/8018e31e-e8bf-4992-bae9-1ac3a4b78ffb.webp";
                title = "Embellished Anarkali Suit";
                price = "₹35/day";
            }

            resultArea.innerHTML = `
        <img src="${img}" style="width: 80px; height: 100px; object-fit: cover; border-radius: var(--radius-img);" alt="${title}">
        <div>
          <h4 style="font-size: 16px; font-weight: 600;">${title}</h4>
          <p style="color: var(--text-secondary); font-size: var(--fs-small);">${price}</p>
        </div>
      `;
        }

        // 9. Filtering Logic for Listings
        const filterBtns = document.querySelectorAll('.filter-btn');
        const productCards = document.querySelectorAll('.product-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                productCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // 10. Cookie Consent Show
        window.addEventListener('load', () => {
            if (!localStorage.getItem('cookies-accepted')) {
                setTimeout(() => {
                    document.getElementById('cookieBanner').classList.add('show');
                }, 2000);
            }
        });

        window.acceptCookies = function () {
            localStorage.setItem('cookies-accepted', 'true');
            document.getElementById('cookieBanner').classList.remove('show');
        };

        window.dismissCookies = function () {
            document.getElementById('cookieBanner').classList.remove('show');
        };

        // 11. Subscription Success Simulation
        window.handleSubscribe = function () {
            const email = document.getElementById('subscriberEmail').value;
            alert(`Thank you for joining the Fashcycle community, ${email}! We've registered your early access perk! 🌿✨`);
        }