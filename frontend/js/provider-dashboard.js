/**
 * HOME SERVICES - Provider Dashboard
 */

(function () {
    'use strict';

    var API_BASE = '/api';

    var state = {
        provider: null,
        bookings: [],
        reviews: [],
        currentFilter: 'requested'
    };

    var elements = {};

    document.addEventListener('DOMContentLoaded', function () {
        cacheElements();
        bindEvents();
        checkSavedProvider();
    });

    function cacheElements() {
        elements.alertContainer = document.getElementById('alertContainer');
        elements.loginSection = document.getElementById('loginSection');
        elements.dashboardSection = document.getElementById('dashboardSection');
        elements.providerPhone = document.getElementById('providerPhone');
        elements.loginBtn = document.getElementById('loginBtn');
        elements.providerName = document.getElementById('providerName');
        elements.providerService = document.getElementById('providerService');
        elements.providerAvatar = document.getElementById('providerAvatar');
        elements.providerRating = document.getElementById('providerRating');
        elements.ratingCount = document.getElementById('ratingCount');
        elements.totalBookings = document.getElementById('totalBookings');
        elements.pendingRequests = document.getElementById('pendingRequests');
        elements.completedJobs = document.getElementById('completedJobs');
        elements.totalEarnings = document.getElementById('totalEarnings');
        elements.bookingRequestsList = document.getElementById('bookingRequestsList');
        elements.reviewsList = document.getElementById('reviewsList');
        elements.noBookings = document.getElementById('noBookings');
        elements.noReviews = document.getElementById('noReviews');
        elements.bookingsLoading = document.getElementById('bookingsLoading');
        elements.reviewsLoading = document.getElementById('reviewsLoading');
        elements.reviewsCount = document.getElementById('reviewsCount');
    }

    function bindEvents() {
        elements.loginBtn.addEventListener('click', loginProvider);

        elements.providerPhone.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') loginProvider();
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                state.currentFilter = this.getAttribute('data-status');
                renderBookings();
            });
        });
    }

    function checkSavedProvider() {
        try {
            var saved = localStorage.getItem('providerData');
            if (saved) {
                var data = JSON.parse(saved);
                if (data.phone) {
                    elements.providerPhone.value = data.phone;
                    loginProvider();
                }
            }
        } catch (e) { }
    }

    function loginProvider() {
        var phone = elements.providerPhone.value.trim();

        if (!phone) {
            showAlert('Please enter your phone number', 'error');
            return;
        }

        elements.loginBtn.disabled = true;
        elements.loginBtn.innerHTML = '<span class="spinner"></span> Loading...';

        fetch(API_BASE + '/providers/dashboard/' + encodeURIComponent(phone))
            .then(function (res) { return res.json(); })
            .then(function (data) {
                elements.loginBtn.disabled = false;
                elements.loginBtn.innerHTML = 'Access Dashboard';

                if (data.success && data.data) {
                    state.provider = data.data;
                    localStorage.setItem('providerData', JSON.stringify({ phone: phone }));
                    showDashboard();
                } else {
                    showAlert(data.message || 'Provider not found. Please check your phone number.', 'error');
                }
            })
            .catch(function (err) {
                elements.loginBtn.disabled = false;
                elements.loginBtn.innerHTML = 'Access Dashboard';
                showAlert('Failed to load dashboard', 'error');
                console.error(err);
            });
    }

    function showDashboard() {
        elements.loginSection.classList.add('hidden');
        elements.dashboardSection.classList.remove('hidden');

        // Set provider info
        elements.providerName.textContent = state.provider.name;
        elements.providerService.textContent = capitalizeFirst(state.provider.service);
        elements.providerAvatar.textContent = getServiceIcon(state.provider.service);

        var rating = state.provider.rating || { average: 0, count: 0 };
        elements.providerRating.textContent = renderStars(rating.average);
        elements.ratingCount.textContent = '(' + rating.count + ' reviews)';

        loadBookings();
        loadReviews();
    }

    function loadBookings() {
        elements.bookingsLoading.classList.remove('hidden');
        elements.bookingRequestsList.innerHTML = '';
        elements.noBookings.classList.add('hidden');

        fetch(API_BASE + '/providers/' + state.provider._id + '/bookings')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                elements.bookingsLoading.classList.add('hidden');

                if (data.success) {
                    state.bookings = data.data || [];
                    updateStats();
                    renderBookings();
                }
            })
            .catch(function (err) {
                elements.bookingsLoading.classList.add('hidden');
                showAlert('Failed to load bookings', 'error');
            });
    }

    function loadReviews() {
        elements.reviewsLoading.classList.remove('hidden');
        elements.reviewsList.innerHTML = '';
        elements.noReviews.classList.add('hidden');

        fetch(API_BASE + '/reviews/provider/' + state.provider._id)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                elements.reviewsLoading.classList.add('hidden');

                if (data.success && data.data && data.data.length > 0) {
                    state.reviews = data.data;
                    elements.reviewsCount.textContent = data.data.length + ' reviews';
                    renderReviews();
                } else {
                    elements.noReviews.classList.remove('hidden');
                    elements.reviewsCount.textContent = '0 reviews';
                }
            })
            .catch(function (err) {
                elements.reviewsLoading.classList.add('hidden');
                elements.noReviews.classList.remove('hidden');
            });
    }

    function updateStats() {
        var total = state.bookings.length;
        var pending = state.bookings.filter(function (b) { return b.status === 'requested'; }).length;
        var completed = state.bookings.filter(function (b) { return b.status === 'completed'; }).length;
        var earnings = state.bookings
            .filter(function (b) { return b.status === 'completed'; })
            .reduce(function (sum, b) { return sum + (b.price || 0); }, 0);

        elements.totalBookings.textContent = total;
        elements.pendingRequests.textContent = pending;
        elements.completedJobs.textContent = completed;
        elements.totalEarnings.textContent = '₹' + earnings;
    }

    function renderBookings() {
        var filtered = state.bookings;

        if (state.currentFilter !== 'all') {
            filtered = state.bookings.filter(function (b) {
                return b.status === state.currentFilter;
            });
        }

        if (filtered.length === 0) {
            elements.bookingRequestsList.innerHTML = '';
            elements.noBookings.classList.remove('hidden');
            return;
        }

        elements.noBookings.classList.add('hidden');

        var html = '';
        filtered.forEach(function (booking) {
            var statusClass = booking.status;
            var showActions = (booking.status === 'requested');
            var canComplete = (booking.status === 'accepted');

            html += '<div class="request-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:start">' +
                '<div>' +
                '<strong style="font-size:1.1rem">' + escapeHtml(booking.userName) + '</strong>' +
                '<span class="booking-status ' + statusClass + '" style="margin-left:0.5rem">' + booking.status + '</span>' +
                '</div>' +
                '<span style="color:var(--gray-500);font-size:0.875rem">' + formatDate(booking.createdAt) + '</span>' +
                '</div>' +
                '<div class="client-info">' +
                '<div class="info-item"><span class="label">Phone</span><span class="value">' + escapeHtml(booking.userPhone) + '</span></div>' +
                '<div class="info-item"><span class="label">Service</span><span class="value">' + escapeHtml(booking.service) + '</span></div>' +
                '<div class="info-item"><span class="label">Price</span><span class="value" style="color:var(--secondary)">₹' + booking.price + '</span></div>' +
                '<div class="info-item"><span class="label">Address</span><span class="value">' + escapeHtml(booking.userAddress || 'Not provided') + '</span></div>' +
                '</div>' +
                '<div class="request-actions">' +
                (showActions ?
                    '<button class="btn btn-secondary btn-sm" onclick="window.updateBooking(\'' + booking._id + '\', \'accepted\')">✅ Accept</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="window.updateBooking(\'' + booking._id + '\', \'cancelled\')">❌ Decline</button>' : '') +
                (canComplete ?
                    '<button class="btn btn-primary btn-sm" onclick="window.updateBooking(\'' + booking._id + '\', \'completed\')">🏁 Mark Completed</button>' : '') +
                '</div>' +
                '</div>';
        });

        elements.bookingRequestsList.innerHTML = html;
    }

    function renderReviews() {
        var html = '';

        state.reviews.forEach(function (review) {
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
    }

    // Update booking status (global)
    window.updateBooking = function (bookingId, status) {
        var msgs = {
            'accepted': 'Accept this booking?',
            'cancelled': 'Decline this booking?',
            'completed': 'Mark this job as completed?'
        };

        if (!confirm(msgs[status] || 'Update booking status?')) return;

        fetch(API_BASE + '/bookings/' + bookingId + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    showAlert('Booking ' + status + '!', 'success');
                    loadBookings();
                } else {
                    showAlert(data.message || 'Failed to update', 'error');
                }
            })
            .catch(function () {
                showAlert('Failed to update booking', 'error');
            });
    };

    // Utility functions
    function renderStars(rating) {
        var stars = '';
        for (var i = 0; i < 5; i++) {
            stars += (i < Math.floor(rating)) ? '★' : '☆';
        }
        return stars;
    }

    function getServiceIcon(service) {
        var icons = {
            'plumbing': '🔧', 'electrical': '⚡', 'cleaning': '🧹',
            'painting': '🎨', 'carpentry': '🪚', 'appliance-repair': '🔌',
            'gardening': '🌱', 'pest-control': '🐛', 'moving': '📦', 'handyman': '🛠️'
        };
        return icons[service] || '🛠️';
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(str) {
        return new Date(str).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function showAlert(message, type) {
        var icons = { success: '✅', error: '❌', warning: '⚠️' };
        var alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        var alert = document.createElement('div');
        alert.className = 'alert alert-' + type;
        alert.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
        alertContainer.appendChild(alert);

        setTimeout(function () {
            alert.style.opacity = '0';
            setTimeout(function () {
                if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 300);
        }, 4000);
    }

})();
