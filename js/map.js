let deliveryMap = null;
            let deliveryMarker = null;
            let autocompleteTimeout = null;

            const INDORE_POPULAR_LOCATIONS = [
                { name: "Vijay Nagar, Indore", lat: 22.7533, lon: 75.8937 },
                { name: "New Palasia, Indore", lat: 22.7244, lon: 75.8839 },
                { name: "Old Palasia, Indore", lat: 22.7297, lon: 75.8885 },
                { name: "Rajwada, Indore", lat: 22.7186, lon: 75.8562 },
                { name: "Bhawarkua, Indore", lat: 22.6976, lon: 75.8679 },
                { name: "Geeta Bhawan, Indore", lat: 22.7161, lon: 75.8814 },
                { name: "Sapna Sangeeta, Indore", lat: 22.7058, lon: 75.8654 },
                { name: "Khatiwala Tank, Indore", lat: 22.7032, lon: 75.8582 },
                { name: "Sudama Nagar, Indore", lat: 22.6983, lon: 75.8342 },
                { name: "Chappan Dukan, Indore", lat: 22.7248, lon: 75.8799 },
                { name: "LIG Colony, Indore", lat: 22.7441, lon: 75.8872 },
                { name: "MIG Colony, Indore", lat: 22.7388, lon: 75.8884 },
                { name: "Nipania, Indore", lat: 22.7758, lon: 75.9082 },
                { name: "Mahalaxmi Nagar, Indore", lat: 22.7663, lon: 75.8995 },
                { name: "Rau, Indore", lat: 22.6372, lon: 75.8089 },
                { name: "Annapurna Road, Indore", lat: 22.6955, lon: 75.8405 },
                { name: "Bengali Square, Indore", lat: 22.7188, lon: 75.9099 },
                { name: "Khajrana, Indore", lat: 22.7374, lon: 75.8973 },
                { name: "Anup Nagar, Indore", lat: 22.7385, lon: 75.8845 },
                { name: "Manoramaganj, Indore", lat: 22.7181, lon: 75.8752 },
                { name: "Navlakha, Indore", lat: 22.7005, lon: 75.8779 },
                { name: "Silicon City, Indore", lat: 22.6288, lon: 75.8005 },
                { name: "Pipliyahana, Indore", lat: 22.7102, lon: 75.9015 },
                { name: "Bicholi Mardana, Indore", lat: 22.7099, lon: 75.9255 },
                { name: "MR 10 Road, Indore", lat: 22.7641, lon: 75.8865 },
                { name: "Rajendra Nagar, Indore", lat: 22.6685, lon: 75.8239 },
                { name: "Race Course Road, Indore", lat: 22.7231, lon: 75.8741 },
                { name: "Snehalataganj, Indore", lat: 22.7285, lon: 75.8631 },
                { name: "Kanadia Road, Indore", lat: 22.7155, lon: 75.9185 },
                { name: "Usha Nagar, Indore", lat: 22.7011, lon: 75.8455 },
                { name: "Patrakar Colony, Indore", lat: 22.7135, lon: 75.9031 },
                { name: "Saket Colony, Indore", lat: 22.7291, lon: 75.8945 },
                { name: "Srinagar Extension, Indore", lat: 22.7411, lon: 75.8999 },
                { name: "Scheme 78, Indore", lat: 22.7655, lon: 75.8925 },
                { name: "Scheme 54, Indore", lat: 22.7485, lon: 75.8911 },
                { name: "Sarafa Bazar, Indore", lat: 22.7179, lon: 75.8525 },
                { name: "Vishnupuri, Indore", lat: 22.6961, lon: 75.8645 }
            ];

            // ── Address autocomplete using OpenStreetMap Nominatim with local fallbacks ──
            window.addressAutocomplete = function (val) {
                const sugBox = document.getElementById('addressSuggestions');
                clearTimeout(autocompleteTimeout);
                if (!val || val.trim().length < 2) {
                    sugBox.style.display = 'none';
                    return;
                }

                const searchLower = val.toLowerCase().replace(/,?\s*indore\s*$/i, '').trim();
                const localMatches = INDORE_POPULAR_LOCATIONS.filter(loc => 
                    loc.name.toLowerCase().includes(searchLower)
                );

                // Render local matches instantly
                const localHtml = localMatches.slice(0, 5).map(loc => `
                    <div onclick="selectAddress('${loc.name.replace(/'/g, "\\'")}', ${loc.lat}, ${loc.lon})"
                      style="padding:12px 16px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background 0.15s;display:flex;align-items:center;justify-content:between;"
                      onmouseover="this.style.background='var(--secondary-bg)'"
                      onmouseout="this.style.background='transparent'">
                      <span>📍 ${loc.name}</span>
                      <span style="font-size: 9px; font-weight: 700; color: var(--brand-green); border: 1px solid var(--brand-green); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: auto;">Popular</span>
                    </div>
                `).join('');

                if (localHtml) {
                    sugBox.innerHTML = localHtml;
                    sugBox.style.display = 'block';
                }

                if (val.trim().length < 3) return;

                autocompleteTimeout = setTimeout(async () => {
                    try {
                        const indoreQuery = val.toLowerCase().includes('indore') ? val : val + ', Indore';
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indoreQuery)}&viewbox=75.68,22.90,76.02,22.58&bounded=1&limit=5&addressdetails=1`,
                            { headers: { 'Accept-Language': 'en' } }
                        );
                        const results = await res.json();
                        
                        // Filter out API results that duplicate local matches
                        const apiResults = results.filter(r => 
                            !localMatches.some(loc => r.display_name.toLowerCase().includes(loc.name.split(',')[0].toLowerCase()))
                        );

                        const apiHtml = apiResults.map(r => `
                            <div onclick="selectAddress('${r.display_name.replace(/'/g, "\\'")}', ${r.lat}, ${r.lon})"
                              style="padding:12px 16px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background 0.15s;"
                              onmouseover="this.style.background='var(--secondary-bg)'"
                              onmouseout="this.style.background='transparent'">
                              📍 ${r.display_name}
                            </div>
                        `).join('');

                        if (localHtml || apiHtml) {
                            sugBox.innerHTML = localHtml + apiHtml;
                            sugBox.style.display = 'block';
                        } else {
                            sugBox.style.display = 'none';
                        }
                    } catch (e) {
                        if (!localHtml) sugBox.style.display = 'none';
                    }
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