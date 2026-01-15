// 6. app.js
// This is the core frontend logic file for the client app.
// It handles GPS geolocation, dynamic service searches, 
// and manages the interactive booking modal for users.
/**
 * HOME SERVICES - Main Application
 */

(function () {
    'use strict';

    var API_BASE = '/api';

    // Application State
    var state = {
        userLocation: {
            latitude: null,
            longitude: null,
            address: ''
        },
        categories: [],
        selectedProvider: null
    };

    // DOM Elements Cache
    var elements = {};

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        cacheElements();
        bindEvents();
        loadCategories();
        loadSavedLocation();
    });

    // Cache DOM elements
    function cacheElements() {
        elements.gpsBtn = document.getElementById('gpsBtn');
        elements.locationStatus = document.getElementById('locationStatus');
        elements.serviceFilter = document.getElementById('serviceFilter');
        elements.distanceFilter = document.getElementById('distanceFilter');
        elements.searchBtn = document.getElementById('searchBtn');
        elements.providersGrid = document.getElementById('providersGrid');
        elements.providersLoading = document.getElementById('providersLoading');
        elements.providersEmpty = document.getElementById('providersEmpty');
        elements.alertContainer = document.getElementById('alertContainer');
        elements.bookingModal = document.getElementById('bookingModal');
        elements.reviewsModal = document.getElementById('reviewsModal');
        elements.userName = document.getElementById('userName');
        elements.userPhone = document.getElementById('userPhone');
        elements.userAddress = document.getElementById('userAddress');
        elements.bookingProviderInfo = document.getElementById('bookingProviderInfo');
        elements.reviewsList = document.getElementById('reviewsList');
        elements.reviewsModalTitle = document.getElementById('reviewsModalTitle');
    }

    // Bind all event listeners
    function bindEvents() {
        // GPS Button
        elements.gpsBtn.addEventListener('click', captureGPSLocation);

        // Search
        elements.searchBtn.addEventListener('click', searchProviders);

        // Filters
        elements.serviceFilter.addEventListener('change', function () {
            if (state.userLocation.latitude) searchProviders();
        });
        elements.distanceFilter.addEventListener('change', function () {
            if (state.userLocation.latitude) searchProviders();
        });

        // Booking Modal
        document.getElementById('modalCloseBtn').addEventListener('click', closeBookingModal);
        document.getElementById('cancelBookingBtn').addEventListener('click', closeBookingModal);
        document.getElementById('confirmBookingBtn').addEventListener('click', submitBooking);

        // Reviews Modal
        document.getElementById('reviewsCloseBtn').addEventListener('click', closeReviewsModal);

        // Close modals on overlay click
        elements.bookingModal.addEventListener('click', function (e) {
            if (e.target === elements.bookingModal) closeBookingModal();
        });
        elements.reviewsModal.addEventListener('click', function (e) {
            if (e.target === elements.reviewsModal) closeReviewsModal();
        });

        // Escape key closes modals
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeBookingModal();
                closeReviewsModal();
            }
        });
    }

    // Load categories from API
    function loadCategories() {
        fetch(API_BASE + '/providers/categories')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    state.categories = data.data;
                    populateCategoryFilter();
                }
            })
            .catch(function (err) {
                console.error('Failed to load categories:', err);
            });
    }

    function populateCategoryFilter() {
        var html = '<option value="all">All Services</option>';
        state.categories.forEach(function (cat) {
            html += '<option value="' + cat.id + '">' + cat.icon + ' ' + cat.name + '</option>';
        });
        elements.serviceFilter.innerHTML = html;
    }

    // Load saved location
    function loadSavedLocation() {
        try {
            var saved = localStorage.getItem('userLocation');
            if (saved) {
                state.userLocation = JSON.parse(saved);
                if (state.userLocation.latitude && state.userLocation.longitude) {
                    showLocationSuccess(state.userLocation.address);
                    elements.searchBtn.disabled = false;
                    searchProviders();
                }
            }
        } catch (e) {
            console.error('Error loading location:', e);
        }
    }

    // GPS Location Capture
    // This function captures the user's GPS coordinates using the Browser Geolocation API
    function captureGPSLocation() {
        if (!navigator.geolocation) {
            showAlert('Geolocation not supported by your browser', 'error');
            return;
        }

        elements.gpsBtn.disabled = true;
        elements.gpsBtn.innerHTML = '<span class="spinner"></span> Detecting...';
        showLocationStatus('pending', 'Detecting your location...');

        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                state.userLocation.latitude = lat;
                state.userLocation.longitude = lng;

                // Get address via reverse geocoding
                reverseGeocode(lat, lng)
                    .then(function (address) {
                        state.userLocation.address = address;
                        finishLocationCapture();
                    })
                    .catch(function () {
                        state.userLocation.address = 'Lat: ' + lat.toFixed(4) + ', Lng: ' + lng.toFixed(4);
                        finishLocationCapture();
                    });
            },
            function (error) {
                elements.gpsBtn.disabled = false;
                elements.gpsBtn.innerHTML = '<span>📡</span> Use My GPS Location';

                var msg = 'Unable to get location';
                if (error.code === 1) msg = 'Location permission denied. Please allow GPS access.';
                if (error.code === 2) msg = 'Location unavailable';
                if (error.code === 3) msg = 'Location request timed out';

                showLocationStatus('error', msg);
                showAlert(msg, 'error');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
    }


    function finishLocationCapture() {
        localStorage.setItem('userLocation', JSON.stringify(state.userLocation));
        showLocationSuccess(state.userLocation.address);
        elements.gpsBtn.disabled = false;
        elements.gpsBtn.innerHTML = '<span>📡</span> Update Location';
        elements.searchBtn.disabled = false;
        searchProviders();
    }

    // Reverse Geocoding (OpenStreetMap - Free)
    function reverseGeocode(lat, lng) {
        var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18';

        return fetch(url, { headers: { 'Accept-Language': 'en' } })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.display_name) {
                    return data.display_name.split(',').slice(0, 4).join(', ');
                }
                throw new Error('No address');
            });
    }

    // Location Status Display
    function showLocationStatus(type, message) {
        elements.locationStatus.className = 'location-status ' + type;
        var icons = { pending: '⏳', success: '✅', error: '❌' };
        elements.locationStatus.innerHTML = '<span>' + icons[type] + '</span> <span>' + message + '</span>';
    }

    function showLocationSuccess(address) {
        showLocationStatus('success', '📍 ' + address);
    }

    // Search Providers
    // This function handles the provider search by sending a request with filters and location
    function searchProviders() {
        if (!state.userLocation.latitude) {
            showAlert('Please set your location first', 'warning');
            return;
        }

        var service = elements.serviceFilter.value;
        var maxDist = elements.distanceFilter.value;

        elements.providersGrid.innerHTML = '';
        elements.providersEmpty.classList.add('hidden');
        elements.providersLoading.classList.remove('hidden');

        var url = API_BASE + '/providers/nearby?latitude=' + state.userLocation.latitude +
            '&longitude=' + state.userLocation.longitude + '&maxDistance=' + maxDist;

        if (service !== 'all') {
            url += '&service=' + encodeURIComponent(service);
        }

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                elements.providersLoading.classList.add('hidden');

                if (data.success && data.data && data.data.length > 0) {
                    renderProviders(data.data);
                } else {
                    elements.providersEmpty.innerHTML = '<div class="icon">😔</div><h3>No Providers Found</h3><p>Try increasing distance or changing category</p>';
                    elements.providersEmpty.classList.remove('hidden');
                }
            })
            .catch(function (err) {
                elements.providersLoading.classList.add('hidden');
                showAlert('Failed to search providers', 'error');
                console.error('Search error:', err);
            });
    }


    // Render Providers
    function renderProviders(providers) {
        var html = '';

        providers.forEach(function (provider, index) {
            var cat = findCategory(provider.service);
            var stars = renderStars(provider.rating ? provider.rating.average : 0);
            var reviewCount = provider.rating ? provider.rating.count : 0;

            html += '<div class="provider-card" style="animation-delay:' + (index * 0.1) + 's">' +
                '<div class="provider-header">' +
                '<span class="service-badge">' + cat.icon + ' ' + cat.name + '</span>' +
                '<h3>' + escapeHtml(provider.name) + '</h3>' +
                '<div class="distance">📍 ' + provider.distanceKm + ' km away</div>' +
                '</div>' +
                '<div class="provider-body">' +
                '<div class="provider-info">' +
                '<div class="info-row"><span class="icon">📍</span><span>' + escapeHtml(provider.address) + '</span></div>' +
                '<div class="info-row"><span class="icon">📞</span><span>' + escapeHtml(provider.phone) + '</span></div>' +
                '<div class="info-row"><span class="price">₹' + provider.price + '</span><span style="color:#6B7280"> per service</span></div>' +
                '<div class="provider-rating"><span class="stars">' + stars + '</span><span class="count">(' + reviewCount + ' reviews)</span></div>' +
                '</div>' +
                '</div>' +
                '<div class="provider-footer">' +
                '<button class="btn btn-outline btn-sm" onclick="viewReviews(\'' + provider._id + '\', \'' + escapeAttr(provider.name) + '\')">View Reviews</button>' +
                '<button class="btn btn-primary btn-sm" onclick="openBooking(\'' + provider._id + '\', \'' + escapeAttr(provider.name) + '\', \'' + escapeAttr(cat.name) + '\', ' + provider.price + ')">Book Now</button>' +
                '</div>' +
                '</div>';
        });

        elements.providersGrid.innerHTML = html;
    }

    function findCategory(serviceId) {
        for (var i = 0; i < state.categories.length; i++) {
            if (state.categories[i].id === serviceId) {
                return state.categories[i];
            }
        }
        return { icon: '🛠️', name: serviceId };
    }

    function renderStars(rating) {
        var full = Math.floor(rating);
        var stars = '';
        for (var i = 0; i < 5; i++) {
            stars += (i < full) ? '★' : '☆';
        }
        return stars;
    }

    // ==================== BOOKING FUNCTIONS ====================

    // Open Booking Modal (Global function)
    window.openBooking = function (providerId, providerName, serviceName, price) {
        state.selectedProvider = {
            id: providerId,
            name: providerName,
            service: serviceName,
            price: price
        };

        elements.bookingProviderInfo.innerHTML =
            '<div style="background:#F3F4F6;padding:1rem;border-radius:10px;margin-bottom:1rem;">' +
            '<h4 style="margin-bottom:0.5rem">' + escapeHtml(providerName) + '</h4>' +
            '<p style="color:#6B7280;margin-bottom:0.25rem">Service: ' + escapeHtml(serviceName) + '</p>' +
            '<p style="color:#10B981;font-weight:600;font-size:1.25rem">₹' + price + '</p>' +
            '</div>';

        elements.userAddress.value = state.userLocation.address || '';

        // Load saved user info
        try {
            var saved = localStorage.getItem('userInfo');
            if (saved) {
                var user = JSON.parse(saved);
                elements.userName.value = user.name || '';
                elements.userPhone.value = user.phone || '';
            }
        } catch (e) { }

        elements.bookingModal.classList.add('active');
        elements.userName.focus();
    };

    // Close Booking Modal
    function closeBookingModal() {
        elements.bookingModal.classList.remove('active');
        elements.userName.value = '';
        elements.userPhone.value = '';
        state.selectedProvider = null;
    }

    // Submit Booking
    function submitBooking() {
        var userName = elements.userName.value.trim();
        var userPhone = elements.userPhone.value.trim();
        var userAddress = elements.userAddress.value;

        // Validation
        if (!userName) {
            showAlert('Please enter your name', 'error');
            elements.userName.focus();
            return;
        }

        if (!userPhone) {
            showAlert('Please enter your phone number', 'error');
            elements.userPhone.focus();
            return;
        }

        if (!state.selectedProvider) {
            showAlert('No provider selected', 'error');
            return;
        }

        // Save user info
        localStorage.setItem('userInfo', JSON.stringify({ name: userName, phone: userPhone }));

        // Disable button
        var btn = document.getElementById('confirmBookingBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Booking...';

        // Make API call
        fetch(API_BASE + '/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userPhone,
                userName: userName,
                userPhone: userPhone,
                providerId: state.selectedProvider.id,
                userAddress: userAddress || 'Not provided',
                latitude: state.userLocation.latitude,
                longitude: state.userLocation.longitude
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Booking';

                if (data.success) {
                    closeBookingModal();
                    showAlert('🎉 Booking created successfully! Check "My Bookings" to track it.', 'success');
                } else {
                    showAlert(data.message || 'Failed to create booking', 'error');
                }
            })
            .catch(function (err) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Booking';
                showAlert('Failed to create booking. Please try again.', 'error');
                console.error('Booking error:', err);
            });
    }

    // ==================== REVIEWS FUNCTIONS ====================

    // View Reviews (Global function)
    window.viewReviews = function (providerId, providerName) {
        elements.reviewsModalTitle.textContent = '⭐ Reviews for ' + providerName;
        elements.reviewsList.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
        elements.reviewsModal.classList.add('active');

        fetch(API_BASE + '/reviews/provider/' + providerId)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success && data.data && data.data.length > 0) {
                    var html = '';
                    data.data.forEach(function (review) {
                        html += '<div class="review-item">' +
                            '<div class="review-header">' +
                            '<span class="review-author">' + escapeHtml(review.userName) + '</span>' +
                            '<span class="review-date">' + formatDate(review.createdAt) + '</span>' +
                            '</div>' +
                            '<div class="review-stars">' + renderStars(review.rating) + '</div>' +
                            '<p class="review-comment">' + escapeHtml(review.comment) + '</p>' +
                            '</div>';
                    });
                    elements.reviewsList.innerHTML = html;
                } else {
                    elements.reviewsList.innerHTML = '<div class="empty-state"><div class="icon">📝</div><h3>No Reviews Yet</h3></div>';
                }
            })
            .catch(function (err) {
                elements.reviewsList.innerHTML = '<p style="text-align:center;color:#EF4444">Failed to load reviews</p>';
            });
    };

    function closeReviewsModal() {
        elements.reviewsModal.classList.remove('active');
    }

    // ==================== UTILITY FUNCTIONS ====================

    function showAlert(message, type) {
        var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        var alert = document.createElement('div');
        alert.className = 'alert alert-' + type;
        alert.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
        elements.alertContainer.appendChild(alert);

        setTimeout(function () {
            alert.style.opacity = '0';
            setTimeout(function () {
                if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 300);
        }, 5000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttr(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    function formatDate(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

})();
