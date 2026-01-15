/**
 * HOME SERVICES - Bookings Page
 */

(function () {
    'use strict';

    var API_BASE = '/api';

    var state = {
        currentBookingId: null,
        currentRating: 0
    };

    var elements = {};

    document.addEventListener('DOMContentLoaded', function () {
        cacheElements();
        bindEvents();
        loadSavedPhone();
    });

    function cacheElements() {
        elements.viewerPhone = document.getElementById('viewerPhone');
        elements.loadBookingsBtn = document.getElementById('loadBookingsBtn');
        elements.bookingsLoading = document.getElementById('bookingsLoading');
        elements.bookingsEmpty = document.getElementById('bookingsEmpty');
        elements.bookingsList = document.getElementById('bookingsList');
        elements.alertContainer = document.getElementById('alertContainer');
        elements.reviewModal = document.getElementById('reviewModal');
        elements.starRating = document.getElementById('starRating');
        elements.reviewComment = document.getElementById('reviewComment');
    }

    function bindEvents() {
        elements.loadBookingsBtn.addEventListener('click', loadBookings);

        elements.viewerPhone.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') loadBookings();
        });

        document.getElementById('closeReviewBtn').addEventListener('click', closeReviewModal);
        document.getElementById('cancelReviewBtn').addEventListener('click', closeReviewModal);
        document.getElementById('submitReviewBtn').addEventListener('click', submitReview);

        elements.reviewModal.addEventListener('click', function (e) {
            if (e.target === elements.reviewModal) closeReviewModal();
        });

        setupStarRating();
    }

    function loadSavedPhone() {
        try {
            var saved = localStorage.getItem('userInfo');
            if (saved) {
                var user = JSON.parse(saved);
                if (user.phone) {
                    elements.viewerPhone.value = user.phone;
                    loadBookings();
                }
            }
        } catch (e) { }
    }

    function loadBookings() {
        var phone = elements.viewerPhone.value.trim();

        if (!phone) {
            showAlert('Please enter your phone number', 'warning');
            return;
        }

        // Save phone
        try {
            var user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            user.phone = phone;
            localStorage.setItem('userInfo', JSON.stringify(user));
        } catch (e) { }

        elements.bookingsList.innerHTML = '';
        elements.bookingsEmpty.classList.add('hidden');
        elements.bookingsLoading.classList.remove('hidden');

        fetch(API_BASE + '/bookings/user/' + encodeURIComponent(phone))
            .then(function (res) { return res.json(); })
            .then(function (data) {
                elements.bookingsLoading.classList.add('hidden');

                if (data.success && data.data && data.data.length > 0) {
                    renderBookings(data.data);
                } else {
                    elements.bookingsEmpty.classList.remove('hidden');
                }
            })
            .catch(function (err) {
                elements.bookingsLoading.classList.add('hidden');
                showAlert('Failed to load bookings', 'error');
            });
    }

    function renderBookings(bookings) {
        var html = '';

        bookings.forEach(function (booking) {
            var provider = booking.providerId || {};
            var canComplete = (booking.status === 'requested' || booking.status === 'accepted');
            var canCancel = (booking.status === 'requested' || booking.status === 'accepted');
            var canReview = (booking.status === 'completed' && !booking.hasReview);

            html += '<div class="booking-card">' +
                '<div class="booking-header">' +
                '<div>' +
                '<h4 style="margin-bottom:0.25rem">' + escapeHtml(provider.name || 'Provider') + '</h4>' +
                '<span style="color:#6B7280;font-size:0.875rem">Booked: ' + formatDate(booking.createdAt) + '</span>' +
                '</div>' +
                '<span class="booking-status ' + booking.status + '">' + booking.status + '</span>' +
                '</div>' +
                '<div class="booking-body">' +
                '<div class="booking-details">' +
                '<div class="booking-detail"><span class="label">Service</span><span class="value">' + escapeHtml(booking.service) + '</span></div>' +
                '<div class="booking-detail"><span class="label">Price</span><span class="value" style="color:#10B981">₹' + booking.price + '</span></div>' +
                '<div class="booking-detail"><span class="label">Provider Address</span><span class="value">' + escapeHtml(provider.address || 'N/A') + '</span></div>' +
                '<div class="booking-detail"><span class="label">Your Address</span><span class="value">' + escapeHtml(booking.userAddress || 'N/A') + '</span></div>' +
                '<div class="booking-detail"><span class="label">Contact</span><span class="value">' + escapeHtml(provider.phone || 'N/A') + '</span></div>' +
                '</div>' +
                '<div class="booking-actions">' +
                (canComplete ? '<button class="btn btn-secondary btn-sm" onclick="updateStatus(\'' + booking._id + '\', \'completed\')">✅ Mark Completed</button>' : '') +
                (canCancel ? '<button class="btn btn-danger btn-sm" onclick="updateStatus(\'' + booking._id + '\', \'cancelled\')">❌ Cancel</button>' : '') +
                (canReview ? '<button class="btn btn-primary btn-sm" onclick="openReview(\'' + booking._id + '\')">⭐ Leave Review</button>' : '') +
                (booking.hasReview ? '<span style="color:#10B981;font-weight:500">✓ Reviewed</span>' : '') +
                '</div>' +
                '</div>' +
                '</div>';
        });

        elements.bookingsList.innerHTML = html;
    }

    // Update booking status (global)
    window.updateStatus = function (bookingId, status) {
        var msg = status === 'cancelled' ? 'Cancel this booking?' : 'Mark as completed?';
        if (!confirm(msg)) return;

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

    // Star rating setup
    function setupStarRating() {
        var stars = elements.starRating.querySelectorAll('.star');

        stars.forEach(function (star) {
            star.addEventListener('click', function () {
                state.currentRating = parseInt(this.getAttribute('data-rating'));
                updateStars(state.currentRating);
            });

            star.addEventListener('mouseenter', function () {
                updateStars(parseInt(this.getAttribute('data-rating')));
            });

            star.addEventListener('mouseleave', function () {
                updateStars(state.currentRating);
            });
        });
    }

    function updateStars(rating) {
        var stars = elements.starRating.querySelectorAll('.star');
        stars.forEach(function (star, i) {
            if (i < rating) {
                star.classList.add('active');
                star.style.color = '#F59E0B';
            } else {
                star.classList.remove('active');
                star.style.color = '#D1D5DB';
            }
        });
    }

    // Open review modal (global)
    window.openReview = function (bookingId) {
        state.currentBookingId = bookingId;
        state.currentRating = 0;
        updateStars(0);
        elements.reviewComment.value = '';
        elements.reviewModal.classList.add('active');
    };

    function closeReviewModal() {
        elements.reviewModal.classList.remove('active');
        state.currentBookingId = null;
        state.currentRating = 0;
    }

    function submitReview() {
        if (!state.currentRating) {
            showAlert('Please select a rating', 'error');
            return;
        }

        var comment = elements.reviewComment.value.trim();
        if (!comment || comment.length < 10) {
            showAlert('Please write at least 10 characters', 'error');
            return;
        }

        var btn = document.getElementById('submitReviewBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Submitting...';

        fetch(API_BASE + '/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: state.currentBookingId,
                rating: state.currentRating,
                comment: comment
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                btn.disabled = false;
                btn.innerHTML = 'Submit Review';

                if (data.success) {
                    closeReviewModal();
                    showAlert('⭐ Review submitted!', 'success');
                    loadBookings();
                } else {
                    showAlert(data.message || 'Failed to submit', 'error');
                }
            })
            .catch(function () {
                btn.disabled = false;
                btn.innerHTML = 'Submit Review';
                showAlert('Failed to submit review', 'error');
            });
    }

    function showAlert(message, type) {
        var icons = { success: '✅', error: '❌', warning: '⚠️' };
        var alert = document.createElement('div');
        alert.className = 'alert alert-' + type;
        alert.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
        elements.alertContainer.appendChild(alert);

        setTimeout(function () {
            alert.style.opacity = '0';
            setTimeout(function () {
                if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 300);
        }, 4000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(str) {
        return new Date(str).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

})();
