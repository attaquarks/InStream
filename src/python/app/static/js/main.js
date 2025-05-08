// Main JavaScript file for global functionalities

document.addEventListener('DOMContentLoaded', function () {
    console.log('Global main.js loaded.');

    // Example: Activate Bootstrap tooltips if any
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // You can add more global event listeners or initializations here
});

// Function to show loading overlay (can be called from other scripts)
function showLoadingOverlay(message = 'Processing your request...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    if (overlay && loadingMessage) {
        loadingMessage.textContent = message;
        overlay.classList.remove('d-none');
    }
}

// Function to hide loading overlay (can be called from other scripts)
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('d-none');
    }
}

    