// dashboard_charts.js

// Chart instances (global or scoped as needed)
let activityChartInstance = null;
let sentimentChartInstance = null;
let platformChartInstance = null;
let engagementChartInstance = null;

// Function to update Activity Over Time chart
function updateActivityChart(viewType, data) {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx || !data) return;

    if (activityChartInstance) {
        activityChartInstance.destroy();
    }
    
    // Data might need transformation based on viewType (daily, weekly, monthly)
    // For simplicity, assuming data is pre-formatted for the current view or API handles it.
    activityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: data.datasets || [] 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Posts' }
                },
                x: {
                     title: { display: true, text: 'Time (' + viewType + ')' }
                }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

// Function to update Sentiment Distribution chart
function updateSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart')?.getContext('2d');
    if (!ctx || !data) return;

    document.getElementById('sentimentPositiveCount').textContent = data.positive?.toLocaleString() || '0';
    document.getElementById('sentimentNeutralCount').textContent = data.neutral?.toLocaleString() || '0';
    document.getElementById('sentimentNegativeCount').textContent = data.negative?.toLocaleString() || '0';

    if (sentimentChartInstance) {
        sentimentChartInstance.destroy();
    }
    sentimentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [data.positive || 0, data.neutral || 0, data.negative || 0],
                backgroundColor: ['#28a745', '#6c757d', '#dc3545'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// Function to update Word Cloud
function updateWordCloud(words) {
    const container = document.getElementById('wordCloudContainer');
    if (!container || !words || words.length === 0) {
        if(container) container.innerHTML = '<p class="text-center text-muted">No word cloud data available.</p>';
        return;
    }
    container.innerHTML = ''; // Clear previous

    const layout = d3.layout.cloud()
        .size([container.clientWidth, container.clientHeight])
        .words(words.map(d => ({ text: d.text, size: Math.log2(d.value +1) * 10 + 10 }))) // Scale size
        .padding(5)
        .rotate(() => (~~(Math.random() * 6) - 3) * 30) // Random rotation
        .font("Impact")
        .fontSize(d => d.size)
        .on("end", drawWordCloud);

    layout.start();

    function drawWordCloud(words) {
        d3.select(container).append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1])
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => d.size + "px")
            .style("font-family", "Impact")
            .style("fill", (d, i) => d3.schemeCategory10[i % 10])
            .attr("text-anchor", "middle")
            .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
            .text(d => d.text)
            .on("click", d => { // Add click event to filter by keyword
                document.getElementById('filterKeyword').value = d.text;
                loadDashboardData(); // Reload data with the new keyword filter
            });
    }
}

// Function to update Platform Distribution chart
function updatePlatformChart(data) {
    const ctx = document.getElementById('platformChart')?.getContext('2d');
    if (!ctx || !data) return;

    if (platformChartInstance) {
        platformChartInstance.destroy();
    }
    platformChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels || [],
            datasets: [{
                data: data.data || [],
                backgroundColor: [ // Example colors
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// Function to update Engagement Metrics chart
function updateEngagementChart(data) {
    const ctx = document.getElementById('engagementChart')?.getContext('2d');
    if (!ctx || !data) return;

    if (engagementChartInstance) {
        engagementChartInstance.destroy();
    }
    engagementChartInstance = new Chart(ctx, {
        type: 'bar', // or 'line'
        data: {
            labels: data.labels || [],
            datasets: data.datasets || [] // Expecting array of dataset objects
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Average Engagement Count' }
                },
                x: {
                     title: { display: true, text: 'Date' }
                }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

    