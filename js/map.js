let deliveryMap = null;
            let deliveryMarker = null;
            let autocompleteTimeout = null;

            // ── Address autocomplete using OpenStreetMap Nominatim (free, no API key) ──
            window.addressAutocomplete = function (val) {
                const sugBox = document.getElementById('addressSuggestions');
                clearTimeout(autocompleteTimeout);
                if (!val || val.length < 3) {
                    sugBox.style.display = 'none';
                    return;
                }
                autocompleteTimeout = setTimeout(async () => {
                    try {
                        // Enforce Indore search context
                        const indoreQuery = val.toLowerCase().includes('indore') ? val : val + ', Indore';
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indoreQuery)}&viewbox=75.68,22.90,76.02,22.58&bounded=1&limit=5&addressdetails=1`,
                            { headers: { 'Accept-Language': 'en' } }
                        );
                        const results = await res.json();
                        if (!results.length) { sugBox.style.display = 'none'; return; }

                        sugBox.innerHTML = results.map((r, i) => `
            <div onclick="selectAddress('${r.display_name.replace(/'/g, "\\'")}', ${r.lat}, ${r.lon})"
              style="padding:12px 16px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background 0.15s;"
              onmouseover="this.style.background='var(--secondary-bg)'"
              onmouseout="this.style.background='transparent'">
              📍 ${r.display_name}
            </div>
          `).join('');
                        sugBox.style.display = 'block';
                    } catch (e) { sugBox.style.display = 'none'; }
                }, 350);
            };

            window.selectAddress = function (displayName, lat, lon) {
                // Fill input
                document.getElementById('deliveryAddress').value = displayName;
                document.getElementById('addressSuggestions').style.display = 'none';

                // Show map
                const mapWrap = document.getElementById('deliveryMapWrap');
                mapWrap.style.display = 'block';
                document.getElementById('mapAddressText').textContent = displayName;

                // Init or update map with Indore bounds
                const indoreBounds = L.latLngBounds([22.58, 75.68], [22.90, 76.02]);
                if (!deliveryMap) {
                    deliveryMap = L.map('deliveryMap', { 
                        zoomControl: true, 
                        scrollWheelZoom: false,
                        maxBounds: indoreBounds,
                        maxBoundsViscosity: 1.0
                    });
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                        minZoom: 11
                    }).addTo(deliveryMap);
                }

                const latlng = [parseFloat(lat), parseFloat(lon)];
                deliveryMap.setView(latlng, 15);

                if (deliveryMarker) {
                    deliveryMarker.setLatLng(latlng);
                } else {
                    const greenIcon = L.divIcon({
                        className: '',
                        html: `<div style="background:var(--brand-green,#008751);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,135,81,0.4);"></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    });
                    deliveryMarker = L.marker(latlng, { icon: greenIcon }).addTo(deliveryMap);
                }
                window.deliveryMarker = deliveryMarker;

                // Fix Leaflet tile render after display:block
                setTimeout(() => deliveryMap.invalidateSize(), 100);
            };

            // Close suggestions on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#deliveryAddress') && !e.target.closest('#addressSuggestions')) {
                    const s = document.getElementById('addressSuggestions');
                    if (s) s.style.display = 'none';
                }
            });

            // Reset map when checkout modal closes
            const _origCloseCheckout = window.closeCheckout;
            window.closeCheckout = function () {
                document.getElementById('deliveryMapWrap').style.display = 'none';
                document.getElementById('addressSuggestions').style.display = 'none';
                document.getElementById('deliveryAddress').value = '';
                document.getElementById('rentalStart').value = '';
                document.getElementById('rentalEnd').value = '';
                document.getElementById('rentalSummary').style.display = 'none';
                document.getElementById('checkoutError').style.display = 'none';
                document.getElementById('checkoutModal').style.display = 'none';
            };