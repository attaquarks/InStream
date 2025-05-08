
// JavaScript for generating charts using a library like Chart.js or D3.js

// Example function to create a simple bar chart (assuming Chart.js is included)
function createBarChart(canvasId, label, data, labels) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // e.g., ['Twitter', 'Reddit']
            datasets: [{
                label: label, // e.g., 'Posts per Platform'
                data: data,   // e.g., [120, 80]
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    // Add more colors as needed
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Example function to create a line chart for activity over time
function createLineChart(canvasId, label, dataPoints) {
    // dataPoints should be an array of objects like [{date: 'YYYY-MM-DD', count: 10}, ...]
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(dp => dp.date),
            datasets: [{
                label: label,
                data: dataPoints.map(dp => dp.count),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            // Add options as needed
        }
    });
}


// Functions to fetch data and then call these chart creation functions
// will be typically located in dashboard.js or a dedicated data-fetching script.

// e.g., in dashboard.js:
// async function loadActivityChart() {
//     const response = await fetch('/api/activity?days=7');
//     const activityData = await response.json();
//     // Process activityData if needed to fit createLineChart structure
//     createLineChart('activityChartCanvas', 'Posts Over Time', processedData);
// }
