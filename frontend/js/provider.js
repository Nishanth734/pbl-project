/**
 * HOME SERVICES - Provider Registration
 */

(function () {
    'use strict';

    var API_BASE = '/api';

    var state = {
        latitude: null,
        longitude: null,
        address: ''
    };

    var elements = {};

    document.addEventListener('DOMContentLoaded', function () {
        cacheElements();
        bindEvents();
        loadCategories();
    });

    function cacheElements() {
        elements.providerName = document.getElementById('providerName');
        elements.providerPhone = document.getElementById('providerPhone');
        elements.providerService = document.getElementById('providerService');
        elements.providerPrice = document.getElementById('providerPrice');
        elements.providerAddress = document.getElementById('providerAddress');
        elements.gpsBtn = document.getElementById('gpsBtn');
        elements.locationStatus = document.getElementById('locationStatus');
        elements.submitBtn = document.getElementById('submitBtn');
        elements.alertContainer = document.getElementById('alertContainer');
        elements.formCard = document.getElementById('formCard');
        elements.successCard = document.getElementById('successCard');
    }

    function bindEvents() {
        elements.gpsBtn.addEventListener('click', captureLocation);
        elements.submitBtn.addEventListener('click', submitRegistration);
    }

    function loadCategories() {
        fetch(API_BASE + '/providers/categories')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    var html = '<option value="">Select a service...</option>';
                    data.data.forEach(function (cat) {
                        html += '<option value="' + cat.id + '">' + cat.icon + ' ' + cat.name + '</option>';
                    });
                    elements.providerService.innerHTML = html;
                }
            })
            .catch(function (err) {
                console.error('Failed to load categories:', err);
            });
    }

    function captureLocation() {
        if (!navigator.geolocation) {
            showAlert('Geolocation not supported', 'error');
            return;
        }

        elements.gpsBtn.disabled = true;
        elements.gpsBtn.innerHTML = '<span class="spinner"></span> Detecting...';
        showStatus('pending', 'Detecting location...');

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                state.latitude = pos.coords.latitude;
                state.longitude = pos.coords.longitude;

                // Reverse geocode
                fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + state.latitude + '&lon=' + state.longitude)
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data.display_name) {
                            state.address = data.display_name.split(',').slice(0, 4).join(', ');
                        } else {
                            state.address = state.latitude.toFixed(4) + ', ' + state.longitude.toFixed(4);
                        }
                        finishCapture();
                    })
                    .catch(function () {
                        state.address = state.latitude.toFixed(4) + ', ' + state.longitude.toFixed(4);
                        finishCapture();
                    });
            },
            function (err) {
                elements.gpsBtn.disabled = false;
                elements.gpsBtn.innerHTML = '📡 Capture GPS Location';
                var msg = 'Location error';
                if (err.code === 1) msg = 'Permission denied';
                showStatus('error', msg);
                showAlert(msg, 'error');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }

    function finishCapture() {
        elements.providerAddress.value = state.address;
        showStatus('success', '📍 ' + state.address);
        elements.gpsBtn.disabled = false;
        elements.gpsBtn.innerHTML = '📡 Update Location';
        elements.submitBtn.disabled = false;
    }

    function showStatus(type, message) {
        elements.locationStatus.className = 'location-status ' + type;
        var icons = { pending: '⏳', success: '✅', error: '❌' };
        elements.locationStatus.innerHTML = '<span>' + icons[type] + '</span> ' + message;
    }

    function submitRegistration() {
        var name = elements.providerName.value.trim();
        var phone = elements.providerPhone.value.trim();
        var service = elements.providerService.value;
        var price = elements.providerPrice.value;

        if (!name) { showAlert('Enter business name', 'error'); return; }
        if (!phone) { showAlert('Enter phone number', 'error'); return; }
        if (!service) { showAlert('Select a service', 'error'); return; }
        if (!price || parseFloat(price) <= 0) { showAlert('Enter valid price', 'error'); return; }
        if (!state.latitude) { showAlert('Capture GPS location first', 'error'); return; }

        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = '<span class="spinner"></span> Registering...';

        fetch(API_BASE + '/providers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                phone: phone,
                service: service,
                price: parseFloat(price),
                address: state.address || 'GPS Location',
                latitude: state.latitude,
                longitude: state.longitude
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    elements.formCard.classList.add('hidden');
                    elements.successCard.classList.remove('hidden');
                    showAlert('🎉 Registration successful!', 'success');
                } else {
                    elements.submitBtn.disabled = false;
                    elements.submitBtn.innerHTML = '✅ Register as Provider';
                    showAlert(data.message || 'Registration failed', 'error');
                }
            })
            .catch(function (err) {
                elements.submitBtn.disabled = false;
                elements.submitBtn.innerHTML = '✅ Register as Provider';
                showAlert('Registration failed', 'error');
            });
    }

    function showAlert(message, type) {
        var icons = { success: '✅', error: '❌', warning: '⚠️' };
        var alert = document.createElement('div');
        alert.className = 'alert alert-' + type;
        alert.innerHTML = '<span>' + icons[type] + '</span><span>' + message + '</span>';
        elements.alertContainer.appendChild(alert);

        setTimeout(function () {
            alert.style.opacity = '0';
            setTimeout(function () {
                if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 300);
        }, 4000);
    }

})();
