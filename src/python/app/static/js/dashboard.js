/**
 * Social Media Analytics Dashboard JavaScript
 * Handles dashboard charts, data loading, and interactivity
 */

// Global chart objects for later reference
let activityChart = null;
let sentimentChart = null;
let platformChart = null;
let engagementChart = null;
let wordCloud = null;

// Initialize activity chart
function updateActivityChart(viewType, data) {
    const canvas = document.getElementById('activityChart');
    
    // If no data is provided, use the current chart data
    if (!data && activityChart) {
        // Just update the chart view
        const currentData = activityChart.data;
        
        // Update x-axis labels based on view type
        if (viewType === 'daily') {
            activityChart.data.labels = currentData.dailyLabels || [];
            activityChart.data.datasets[0].data = currentData.dailyPosts || [];
            activityChart.data.datasets[1].data = currentData.dailyEngagement || [];
        } else if (viewType === 'weekly') {
            activityChart.data.labels = currentData.weeklyLabels || [];
            activityChart.data.datasets[0].data = currentData.weeklyPosts || [];
            activityChart.data.datasets[1].data = currentData.weeklyEngagement || [];
        } else if (viewType === 'monthly') {
            activityChart.data.labels = currentData.monthlyLabels || [];
            activityChart.data.datasets[0].data = currentData.monthlyPosts || [];
            activityChart.data.datasets[1].data = currentData.monthlyEngagement || [];
        }
        
        activityChart.update();
        return;
    }
    
    // Prepare data for the chart based on view type
    const chartLabels = data?.[viewType + 'Labels'] || [];
    const postsData = data?.[viewType + 'Posts'] || [];
    const engagementData = data?.[viewType + 'Engagement'] || [];
    
    // If chart already exists, destroy it
    if (activityChart) {
        activityChart.destroy();
    }
    
    // Store all data for later reference
    const chartData = {
        dailyLabels: data?.dailyLabels || [],
        dailyPosts: data?.dailyPosts || [],
        dailyEngagement: data?.dailyEngagement || [],
        weeklyLabels: data?.weeklyLabels || [],
        weeklyPosts: data?.weeklyPosts || [],
        weeklyEngagement: data?.weeklyEngagement || [],
        monthlyLabels: data?.monthlyLabels || [],
        monthlyPosts: data?.monthlyPosts || [],
        monthlyEngagement: data?.monthlyEngagement || []
    };
    
    // Create new chart
    activityChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Posts',
                    data: postsData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Engagement',
                    data: engagementData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Posts'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Engagement'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart data for reference
    activityChart.data.dailyLabels = chartData.dailyLabels;
    activityChart.data.dailyPosts = chartData.dailyPosts;
    activityChart.data.dailyEngagement = chartData.dailyEngagement;
    activityChart.data.weeklyLabels = chartData.weeklyLabels;
    activityChart.data.weeklyPosts = chartData.weeklyPosts;
    activityChart.data.weeklyEngagement = chartData.weeklyEngagement;
    activityChart.data.monthlyLabels = chartData.monthlyLabels;
    activityChart.data.monthlyPosts = chartData.monthlyPosts;
    activityChart.data.monthlyEngagement = chartData.monthlyEngagement;
}

// Initialize sentiment distribution chart
function updateSentimentChart(data) {
    const canvas = document.getElementById('sentimentChart');
    
    // If chart already exists, destroy it
    if (sentimentChart) {
        sentimentChart.destroy();
    }
    
    // Default data if none provided
    const sentimentData = data || {
        positive: 60,
        neutral: 30,
        negative: 10
    };
    
    // Update sentiment counters
    document.getElementById('sentimentPositiveCount').textContent = sentimentData.positive + '%';
    document.getElementById('sentimentNeutralCount').textContent = sentimentData.neutral + '%';
    document.getElementById('sentimentNegativeCount').textContent = sentimentData.negative + '%';
    
    // Create new chart
    sentimentChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [sentimentData.positive, sentimentData.neutral, sentimentData.negative],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(108, 117, 125, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(108, 117, 125, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                },
            },
            cutout: '65%'
        }
    });
}

// Update word cloud visualization
function updateWordCloud(data) {
    const container = document.getElementById('wordCloudContainer');
    container.innerHTML = '';
    
    // If no data, show a message
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted mt-5">No word cloud data available</div>';
        return;
    }
    
    // Set up dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create word cloud layout
    const layout = d3.layout.cloud()
        .size([width, height])
        .words(data.map(d => ({
            text: d.text,
            size: 10 + (d.value * 2)
        })))
        .padding(5)
        .rotate(() => 0)
        .font('Arial')
        .fontSize(d => d.size)
        .on('end', draw);
    
    // Start layout
    layout.start();
    
    // Function to draw the words
    function draw(words) {
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        
        svg.append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
            .selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .style('font-size', d => d.size + 'px')
            .style('font-family', 'Arial')
            .style('fill', (d, i) => colorScale(i % 10))
            .attr('text-anchor', 'middle')
            .attr('transform', d => 'translate(' + [d.x, d.y] + ')')
            .text(d => d.text);
    }
}

// Update top topics table
function updateTopTopics(data) {
    const table = document.getElementById('topTopicsTable');
    table.innerHTML = '';
    
    // If no data, show a message
    if (!data || data.length === 0) {
        table.innerHTML = '<tr><td colspan="5" class="text-center py-3">No topics data available</td></tr>';
        return;
    }
    
    // Add each topic row
    data.forEach(topic => {
        const row = document.createElement('tr');
        
        // Determine trend icon
        let trendIcon = '';
        if (topic.trend > 0) {
            trendIcon = '<i class="fas fa-arrow-up text-success"></i>';
        } else if (topic.trend < 0) {
            trendIcon = '<i class="fas fa-arrow-down text-danger"></i>';
        } else {
            trendIcon = '<i class="fas fa-minus text-muted"></i>';
        }
        
        // Create sentiment badge
        let sentimentBadge = '';
        if (topic.sentiment >= 7) {
            sentimentBadge = '<span class="badge bg-success">' + topic.sentiment.toFixed(1) + '</span>';
        } else if (topic.sentiment >= 4) {
            sentimentBadge = '<span class="badge bg-warning text-dark">' + topic.sentiment.toFixed(1) + '</span>';
        } else {
            sentimentBadge = '<span class="badge bg-danger">' + topic.sentiment.toFixed(1) + '</span>';
        }
        
        // Set row content
        row.innerHTML = `
            <td>${topic.name}</td>
            <td>${topic.posts.toLocaleString()}</td>
            <td>${topic.engagement.toLocaleString()}</td>
            <td>${sentimentBadge}</td>
            <td>${trendIcon} ${Math.abs(topic.trend)}%</td>
        `;
        
        table.appendChild(row);
    });
}

// Update platform distribution chart
function updatePlatformChart(data) {
    const canvas = document.getElementById('platformChart');
    
    // If chart already exists, destroy it
    if (platformChart) {
        platformChart.destroy();
    }
    
    // Default data if none provided
    const platformData = data || {
        labels: ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'],
        values: [40, 30, 20, 10]
    };
    
    // Create new chart
    platformChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: platformData.labels,
            datasets: [{
                data: platformData.values,
                backgroundColor: [
                    'rgba(29, 161, 242, 0.8)',
                    'rgba(59, 89, 152, 0.8)',
                    'rgba(193, 53, 132, 0.8)',
                    'rgba(0, 119, 181, 0.8)'
                ],
                borderColor: [
                    'rgba(29, 161, 242, 1)',
                    'rgba(59, 89, 152, 1)',
                    'rgba(193, 53, 132, 1)',
                    'rgba(0, 119, 181, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update engagement metrics chart
function updateEngagementChart(data) {
    const canvas = document.getElementById('engagementChart');
    
    // If chart already exists, destroy it
    if (engagementChart) {
        engagementChart.destroy();
    }
    
    // Default data if none provided
    const engagementData = data || {
        labels: ['Likes', 'Comments', 'Shares', 'Clicks', 'Saves'],
        current: [500, 300, 200, 150, 100],
        previous: [400, 250, 180, 120, 80]
    };
    
    // Create new chart
    engagementChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: engagementData.labels,
            datasets: [
                {
                    label: 'Current Period',
                    data: engagementData.current,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Previous Period',
                    data: engagementData.previous,
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 2]
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Calculate and update growth percentages
    if (engagementData.current && engagementData.previous) {
        updateGrowthStats(engagementData);
    }
}

// Update growth statistics
function updateGrowthStats(data) {
    // Calculate average engagement growth
    let totalCurrent = data.current.reduce((sum, val) => sum + val, 0);
    let totalPrevious = data.previous.reduce((sum, val) => sum + val, 0);
    let growthPercentage = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
    
    // Update growth indicator
    const growthIndicator = document.getElementById('engagementGrowth');
    if (growthIndicator) {
        const isPositive = growthPercentage >= 0;
        growthIndicator.innerHTML = `
            <i class="fas fa-${isPositive ? 'arrow-up' : 'arrow-down'} me-1 text-${isPositive ? 'success' : 'danger'}"></i>
            ${Math.abs(growthPercentage).toFixed(1)}%
        `;
        growthIndicator.className = `badge bg-${isPositive ? 'success' : 'danger'} fs-6`;
    }
    
    // Update individual metrics if they exist
    data.labels.forEach((label, index) => {
        const elementId = `${label.toLowerCase()}Growth`;
        const growthElement = document.getElementById(elementId);
        if (growthElement) {
            const metricGrowth = ((data.current[index] - data.previous[index]) / data.previous[index]) * 100;
            const isPositive = metricGrowth >= 0;
            growthElement.innerHTML = `
                <i class="fas fa-${isPositive ? 'arrow-up' : 'arrow-down'} me-1"></i>
                ${Math.abs(metricGrowth).toFixed(1)}%
            `;
            growthElement.className = `text-${isPositive ? 'success' : 'danger'} fs-7`;
        }
    });
}

// Update top performing posts table
function updateTopPosts(data) {
    const container = document.getElementById('topPostsContainer');
    
    // If no data, show a message
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">No top posts data available</div>';
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Add each post card
    data.forEach(post => {
        // Format date
        const postDate = new Date(post.date);
        const formattedDate = postDate.toLocaleDateString() + ' at ' + postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Create platform icon
        let platformIcon = '';
        switch (post.platform.toLowerCase()) {
            case 'twitter':
            case 'x':
                platformIcon = '<i class="fab fa-twitter text-info"></i>';
                break;
            case 'facebook':
                platformIcon = '<i class="fab fa-facebook text-primary"></i>';
                break;
            case 'instagram':
                platformIcon = '<i class="fab fa-instagram text-danger"></i>';
                break;
            case 'linkedin':
                platformIcon = '<i class="fab fa-linkedin text-primary"></i>';
                break;
            default:
                platformIcon = '<i class="fas fa-globe"></i>';
        }
        
        // Create post card
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <span class="badge bg-secondary me-2">${platformIcon} ${post.platform}</span>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <div>
                        <span class="badge bg-${post.sentiment >= 7 ? 'success' : post.sentiment >= 4 ? 'warning' : 'danger'}">
                            ${post.sentiment.toFixed(1)}
                        </span>
                    </div>
                </div>
                <p class="card-text">${post.content}</p>
                <div class="d-flex justify-content-between">
                    <div>
                        <small class="text-muted me-3"><i class="far fa-thumbs-up"></i> ${post.likes.toLocaleString()}</small>
                        <small class="text-muted me-3"><i class="far fa-comment"></i> ${post.comments.toLocaleString()}</small>
                        <small class="text-muted"><i class="fas fa-share"></i> ${post.shares.toLocaleString()}</small>
                    </div>
                    <div>
                        <small class="text-muted">Total Engagement: ${(post.likes + post.comments + post.shares).toLocaleString()}</small>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Filter data by date range
function filterDataByDateRange(data, range) {
    // Implementation depends on data structure
    // This is a placeholder function
    return data;
}

// Update all dashboard components
function updateDashboard(data, dateRange = 'week') {
    // Filter data by selected date range
    const filteredData = filterDataByDateRange(data, dateRange);
    
    // Update each component with filtered data
    updateActivityChart('daily', filteredData.activity);
    updateSentimentChart(filteredData.sentiment);
    updatePlatformChart(filteredData.platforms);
    updateEngagementChart(filteredData.engagement);
    updateWordCloud(filteredData.wordCloud);
    updateTopTopics(filteredData.topics);
    updateTopPosts(filteredData.posts);
    
    // Update dashboard last refreshed timestamp
    document.getElementById('lastRefreshed').textContent = new Date().toLocaleString();
}

// Load dashboard data from API
async function loadDashboardData(dateRange = 'week', customDates = null) {
    try {
        // Show loading indicators
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.display = 'block';
        });
        
        // Build API URL with parameters
        let apiUrl = `/api/analytics?range=${dateRange}`;
        
        // Add custom date range parameters if provided
        if (dateRange === 'custom' && customDates) {
            apiUrl += `&startDate=${customDates.startDate.toISOString()}&endDate=${customDates.endDate.toISOString()}`;
        }
        
        // Check if we have network connectivity
        if (!navigator.onLine) {
            throw new Error('No internet connection. Please check your network and try again.');
        }
        
        // Show loading indicators with loading text
        document.querySelectorAll('.chart-container').forEach(container => {
            const loadingText = container.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.display = 'block';
            }
        });
        
        // Fetch data from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
            const response = await fetch(apiUrl, { 
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Store data globally for other functions to access
            window.dashboardData = data;
        
            // For demo or development, use mock data if API returns empty data
            if (!data || Object.keys(data).length === 0) {
                console.warn('API returned empty data, using mock data instead');
                window.dashboardData = generateMockData();
                showNotification('Using sample data for demonstration purposes', 'info');
            }
        
        // Update dashboard with fetched data
        updateDashboard(window.dashboardData, dateRange);
        
        // Hide loading indicators
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.display = 'none';
        });
        
        document.querySelectorAll('.chart-container .loading-text').forEach(text => {
            text.style.display = 'none';
        });
        
        // Update last refreshed timestamp
        const lastRefreshed = document.getElementById('lastRefreshed');
        if (lastRefreshed) {
            const now = new Date();
            lastRefreshed.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            lastRefreshed.setAttribute('data-timestamp', now.getTime());
        }
        
        // Trigger event for any custom extensions that might be listening
        const dashboardUpdatedEvent = new CustomEvent('dashboardUpdated', {
            detail: {
                dateRange: dateRange,
                customDates: customDates,
                timestamp: new Date().getTime()
            }
        });
        document.dispatchEvent(dashboardUpdatedEvent);
        
        return true;
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        
        // Show error message
        document.getElementById('dashboardError').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load dashboard data: ${error.message}
                <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Hide loading indicators
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.display = 'none';
        });
        
        return false;
    }
}

// Handle date range selection
function handleDateRangeChange(event) {
    const range = event.target.value;
    loadDashboardData(range);
    
    // Update active button styling
    document.querySelectorAll('.date-range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Handle activity chart view change
function handleActivityViewChange(event) {
    const viewType = event.target.value;
    updateActivityChart(viewType);
    
    // Update active button styling
    document.querySelectorAll('.activity-view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Export dashboard data as CSV
function exportDashboardData() {
    // Implementation depends on data structure
    // For example purposes, we'll create a simple CSV download
    try {
        // Collect data from charts
        const data = {
            activity: activityChart ? {
                labels: activityChart.data.labels,
                posts: activityChart.data.datasets[0].data,
                engagement: activityChart.data.datasets[1].data
            } : null,
            sentiment: sentimentChart ? {
                labels: sentimentChart.data.labels,
                values: sentimentChart.data.datasets[0].data
            } : null,
            platforms: platformChart ? {
                labels: platformChart.data.labels,
                values: platformChart.data.datasets[0].data
            } : null,
            engagement: engagementChart ? {
                labels: engagementChart.data.labels,
                current: engagementChart.data.datasets[0].data,
                previous: engagementChart.data.datasets[1].data
            } : null
        };
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add activity data
        if (data.activity) {
            csvContent += "Activity Data\n";
            csvContent += "Date,Posts,Engagement\n";
            data.activity.labels.forEach((label, index) => {
                csvContent += `${label},${data.activity.posts[index]},${data.activity.engagement[index]}\n`;
            });
            csvContent += "\n";
        }
        
        // Add sentiment data
        if (data.sentiment) {
            csvContent += "Sentiment Distribution\n";
            csvContent += "Sentiment,Percentage\n";
            data.sentiment.labels.forEach((label, index) => {
                csvContent += `${label},${data.sentiment.values[index]}\n`;
            });
            csvContent += "\n";
        }
        
        // Add platform data
        if (data.platforms) {
            csvContent += "Platform Distribution\n";
            csvContent += "Platform,Percentage\n";
            data.platforms.labels.forEach((label, index) => {
                csvContent += `${label},${data.platforms.values[index]}\n`;
            });
            csvContent += "\n";
        }
        
        // Add engagement data
        if (data.engagement) {
            csvContent += "Engagement Metrics\n";
            csvContent += "Metric,Current Period,Previous Period\n";
            data.engagement.labels.forEach((label, index) => {
                csvContent += `${label},${data.engagement.current[index]},${data.engagement.previous[index]}\n`;
            });
        }
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "social_media_analytics_" + new Date().toISOString().slice(0,10) + ".csv");
        document.body.appendChild(link);
        
        // Download the data file
        link.click();
        
        // Clean up
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to export dashboard data:', error);
        
        // Show error message
        document.getElementById('dashboardError').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to export dashboard data: ${error.message}
                <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

// Print dashboard report
function printDashboard() {
    window.print();
}

// Event listeners
// Add utility function for custom date range selection
function setupDateRangePicker() {
    // Check if date picker elements exist
    const startDatePicker = document.getElementById('startDatePicker');
    const endDatePicker = document.getElementById('endDatePicker');
    const applyDateRangeBtn = document.getElementById('applyDateRangeBtn');
    
    if (startDatePicker && endDatePicker && applyDateRangeBtn) {
        // Set default values to last week
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        startDatePicker.valueAsDate = lastWeek;
        endDatePicker.valueAsDate = today;
        
        // Set up event listener for apply button
        applyDateRangeBtn.addEventListener('click', function() {
            const startDate = new Date(startDatePicker.value);
            const endDate = new Date(endDatePicker.value);
            
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                alert('Please enter valid dates');
                return;
            }
            
            if (endDate < startDate) {
                alert('End date cannot be before start date');
                return;
            }
            
            // Load data with custom date range
            loadDashboardData('custom', {
                startDate: startDate,
                endDate: endDate
            });
            
            // Update active button styling
            document.querySelectorAll('.date-range-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('customRangeBtn').classList.add('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Set up custom date range picker
    setupDateRangePicker();
    
    // Initialize dashboard with default data
    loadDashboardData('week');
    
    // Set up event listeners for date range buttons
    document.querySelectorAll('.date-range-btn').forEach(btn => {
        btn.addEventListener('click', handleDateRangeChange);
    });
    
    // Set up event listeners for activity view buttons
    document.querySelectorAll('.activity-view-btn').forEach(btn => {
        btn.addEventListener('click', handleActivityViewChange);
    });
    
    // Set up dashboard search
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchDashboard(e.target.value);
        });
        
        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                searchDashboard('');
                searchInput.focus();
            });
        }
    }
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Dashboard loaded successfully! Data is updated in real-time.', 'success');
    }, 1000);
    
    // Set up export button
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboardData);
    }
    
    // Set up print button
    const printBtn = document.getElementById('printDashboardBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printDashboard);
    }
    
    // Set up refresh button
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadDashboardData());
    }
    
    // Set up responsive behavior
    window.addEventListener('resize', function() {
        // Resize charts if they exist
        if (activityChart) activityChart.resize();
        if (sentimentChart) sentimentChart.resize();
        if (platformChart) platformChart.resize();
        if (engagementChart) engagementChart.resize();
        
        // Small delay to ensure proper resizing
        setTimeout(() => {
            if (activityChart) activityChart.update();
            if (sentimentChart) sentimentChart.update();
            if (platformChart) platformChart.update();
            if (engagementChart) engagementChart.update();
        }, 100);
        
        // Regenerate word cloud to fit new dimensions
        // This assumes the word cloud data is stored somewhere accessible
        const wordCloudData = window.dashboardData?.wordCloud;
        if (wordCloudData) {
            updateWordCloud(wordCloudData);
        }
    });
    
    // Set up theme toggle if it exists
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-theme');
            
            // Update charts with new theme colors
            // This would require more complex implementation based on your theming system
            // For demonstration, we'll just reload the dashboard
            loadDashboardData();
        });
    }
});

// Search functionality for the dashboard
function searchDashboard(query) {
    // Normalize search query
    query = query.toLowerCase().trim();
    
    // If empty query, show all content
    if (!query) {
        document.querySelectorAll('.searchable-item').forEach(item => {
            item.style.display = '';
        });
        document.getElementById('searchResultsCount').textContent = '';
        return;
    }
    
    // Hide/show content based on search
    let visibleCount = 0;
    document.querySelectorAll('.searchable-item').forEach(item => {
        const content = item.textContent.toLowerCase();
        if (content.includes(query)) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Update search results count
    const resultsElem = document.getElementById('searchResultsCount');
    if (resultsElem) {
        resultsElem.textContent = `${visibleCount} results found`;
    }
    
    // Highlight search terms in visible content
    document.querySelectorAll('.searchable-content').forEach(element => {
        const originalText = element.getAttribute('data-original-text') || element.innerHTML;
        
        // Store original text if not already stored
        if (!element.getAttribute('data-original-text')) {
            element.setAttribute('data-original-text', originalText);
        }
        
        // Only process if content is visible
        if (element.closest('.searchable-item').style.display !== 'none') {
            // Create regex for highlighting with word boundaries
            const regex = new RegExp(`(\\b${query}\\b)`, 'gi');
            const highlightedText = originalText.replace(regex, '<mark>$1</mark>');
            element.innerHTML = highlightedText;
        } else {
            // Reset to original if hidden
            element.innerHTML = originalText;
        }
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only process if not in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        // Ctrl/Cmd + / for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const searchInput = document.getElementById('dashboardSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // R for refresh
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            loadDashboardData();
        }
        
        // D for daily view
        if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const dailyBtn = document.querySelector('.activity-view-btn[value="daily"]');
            if (dailyBtn) dailyBtn.click();
        }
        
        // W for weekly view
        if (e.key === 'w' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const weeklyBtn = document.querySelector('.activity-view-btn[value="weekly"]');
            if (weeklyBtn) weeklyBtn.click();
        }
        
        // M for monthly view
        if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const monthlyBtn = document.querySelector('.activity-view-btn[value="monthly"]');
            if (monthlyBtn) monthlyBtn.click();
        }
        
        // E for export
        if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            exportDashboardData();
        }
        
        // P for print
        if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            printDashboard();
        }
    });
}

// Add notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notificationContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle me-2"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
            break;
        case 'danger':
            icon = '<i class="fas fa-times-circle me-2"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle me-2"></i>';
    }
    
    // Set content
    notification.innerHTML = `
        ${icon}${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Initialize Bootstrap alert
    const bsAlert = new bootstrap.Alert(notification);
    
    // Auto-dismiss after duration
    setTimeout(() => {
        bsAlert.close();
    }, duration);
    
    // Remove from DOM after animation
    notification.addEventListener('closed.bs.alert', function() {
        notification.remove();
    });
}

// Mock data generator for testing
function generateMockData() {
    // Generate date labels
    const today = new Date();
    const dailyLabels = Array(7).fill().map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const weeklyLabels = Array(4).fill().map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - ((3 - i) * 7));
        return `Week ${i + 1}`;
    });
    
    const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Generate random data
    return {
        activity: {
            dailyLabels: dailyLabels,
            dailyPosts: Array(7).fill().map(() => Math.floor(Math.random() * 50) + 10),
            dailyEngagement: Array(7).fill().map(() => Math.floor(Math.random() * 500) + 100),
            weeklyLabels: weeklyLabels,
            weeklyPosts: Array(4).fill().map(() => Math.floor(Math.random() * 200) + 50),
            weeklyEngagement: Array(4).fill().map(() => Math.floor(Math.random() * 2000) + 500),
            monthlyLabels: monthlyLabels,
            monthlyPosts: Array(6).fill().map(() => Math.floor(Math.random() * 500) + 100),
            monthlyEngagement: Array(6).fill().map(() => Math.floor(Math.random() * 5000) + 1000)
        },
        sentiment: {
            positive: Math.floor(Math.random() * 30) + 50, // 50-80%
            neutral: Math.floor(Math.random() * 20) + 10,  // 10-30%
            negative: Math.floor(Math.random() * 10) + 5   // 5-15%
        },
        platforms: {
            labels: ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok'],
            values: [
                Math.floor(Math.random() * 20) + 20,  // Twitter: 20-40%
                Math.floor(Math.random() * 15) + 15,  // Facebook: 15-30%
                Math.floor(Math.random() * 20) + 15,  // Instagram: 15-35%
                Math.floor(Math.random() * 10) + 10,  // LinkedIn: 10-20%
                Math.floor(Math.random() * 10) + 5    // TikTok: 5-15%
            ]
        },
        engagement: {
            labels: ['Likes', 'Comments', 'Shares', 'Clicks', 'Saves'],
            current: [
                Math.floor(Math.random() * 500) + 500,   // Likes: 500-1000
                Math.floor(Math.random() * 300) + 200,   // Comments: 200-500
                Math.floor(Math.random() * 200) + 100,   // Shares: 100-300
                Math.floor(Math.random() * 400) + 300,   // Clicks: 300-700
                Math.floor(Math.random() * 150) + 50     // Saves: 50-200
            ],
            previous: [
                Math.floor(Math.random() * 400) + 400,   // Likes: 400-800
                Math.floor(Math.random() * 250) + 150,   // Comments: 150-400
                Math.floor(Math.random() * 150) + 80,    // Shares: 80-230
                Math.floor(Math.random() * 350) + 250,   // Clicks: 250-600
                Math.floor(Math.random() * 120) + 40     // Saves: 40-160
            ]
        },
        wordCloud: [
            { text: 'Product', value: Math.floor(Math.random() * 10) + 5 },
            { text: 'Service', value: Math.floor(Math.random() * 8) + 4 },
            { text: 'Quality', value: Math.floor(Math.random() * 7) + 5 },
            { text: 'Customer', value: Math.floor(Math.random() * 9) + 6 },
            { text: 'Great', value: Math.floor(Math.random() * 6) + 4 },
            { text: 'Experience', value: Math.floor(Math.random() * 8) + 3 },
            { text: 'Support', value: Math.floor(Math.random() * 7) + 2 },
            { text: 'Team', value: Math.floor(Math.random() * 5) + 3 },
            { text: 'Innovation', value: Math.floor(Math.random() * 6) + 2 },
            { text: 'Technology', value: Math.floor(Math.random() * 7) + 3 },
            { text: 'Solution', value: Math.floor(Math.random() * 6) + 4 },
            { text: 'Value', value: Math.floor(Math.random() * 5) + 3 },
            { text: 'Amazing', value: Math.floor(Math.random() * 4) + 2 },
            { text: 'Performance', value: Math.floor(Math.random() * 5) + 2 },
            { text: 'Feature', value: Math.floor(Math.random() * 6) + 3 }
        ],
        topics: [
            {
                name: 'Product Launch',
                posts: Math.floor(Math.random() * 100) + 50,
                engagement: Math.floor(Math.random() * 1000) + 500,
                sentiment: (Math.random() * 3) + 6,
                trend: Math.floor(Math.random() * 20) + 10
            },
            {
                name: 'Customer Support',
                posts: Math.floor(Math.random() * 80) + 40,
                engagement: Math.floor(Math.random() * 800) + 400,
                sentiment: (Math.random() * 2) + 5,
                trend: Math.floor(Math.random() * 10) + 5
            },
            {
                name: 'Industry News',
                posts: Math.floor(Math.random() * 60) + 30,
                engagement: Math.floor(Math.random() * 600) + 300,
                sentiment: (Math.random() * 2) + 6,
                trend: -1 * (Math.floor(Math.random() * 5) + 1)
            },
            {
                name: 'Competitor Analysis',
                posts: Math.floor(Math.random() * 50) + 20,
                engagement: Math.floor(Math.random() * 500) + 200,
                sentiment: (Math.random() * 3) + 4,
                trend: Math.floor(Math.random() * 15) - 5
            },
            {
                name: 'Customer Feedback',
                posts: Math.floor(Math.random() * 70) + 30,
                engagement: Math.floor(Math.random() * 700) + 350,
                sentiment: (Math.random() * 4) + 3,
                trend: Math.floor(Math.random() * 10) - 2
            }
        ],
        posts: [
            {
                platform: 'Twitter',
                date: new Date(today - (Math.floor(Math.random() * 5) * 86400000)),
                content: 'Excited to announce our newest product launch! Check out all the amazing features at our website.',
                likes: Math.floor(Math.random() * 100) + 50,
                comments: Math.floor(Math.random() * 30) + 10,
                shares: Math.floor(Math.random() * 20) + 5,
                sentiment: (Math.random() * 2) + 7
            },
            {
                platform: 'Facebook',
                date: new Date(today - (Math.floor(Math.random() * 5) * 86400000)),
                content: 'Thanks to all our customers for making this our best quarter yet! We appreciate your continued support.',
                likes: Math.floor(Math.random() * 200) + 100,
                comments: Math.floor(Math.random() * 50) + 20,
                shares: Math.floor(Math.random() * 40) + 10,
                sentiment: (Math.random() * 1) + 8
            },
            {
                platform: 'Instagram',
                date: new Date(today - (Math.floor(Math.random() * 5) * 86400000)),
                content: 'Behind the scenes look at our team working hard to bring you the best service in the industry! #TeamWork #Excellence',
                likes: Math.floor(Math.random() * 300) + 150,
                comments: Math.floor(Math.random() * 40) + 15,
                shares: Math.floor(Math.random() * 10) + 5,
                sentiment: (Math.random() * 2) + 7
            },
            {
                platform: 'LinkedIn',
                date: new Date(today - (Math.floor(Math.random() * 5) * 86400000)),
                content: 'We're hiring! Join our innovative team and help shape the future of our industry. Apply now through our careers page.',
                likes: Math.floor(Math.random() * 150) + 50,
                comments: Math.floor(Math.random() * 20) + 5,
                shares: Math.floor(Math.random() * 30) + 10,
                sentiment: (Math.random() * 1.5) + 6.5
            },
            {
                platform: 'TikTok',
                date: new Date(today - (Math.floor(Math.random() * 5) * 86400000)),
                content: 'Quick tip from our experts: Here's how you can maximize your productivity using our tools! #ProductivityTips',
                likes: Math.floor(Math.random() * 500) + 200,
                comments: Math.floor(Math.random() * 100) + 30,
                shares: Math.floor(Math.random() * 200) + 50,
                sentiment: (Math.random() * 2) + 6
            }
        ]
    };
}

// Add this core functionalities. Adjust the code where required
// Implement the missing filterDataByDateRange function

function filterDataByDateRange(data, range, customDates = null) {
    let filteredData = JSON.parse(JSON.stringify(data)); // Deep copy to avoid modifying original data

    if (!data) {
        console.warn("No data to filter.");
        return filteredData;
    }

    const endDate = customDates ? new Date(customDates.endDate) : new Date();
    let startDate = new Date();

    switch (range) {
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'month':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case 'year':
            startDate.setDate(endDate.getDate() - 365);
            break;
        case 'custom':
            if (customDates && customDates.startDate && customDates.endDate) {
                startDate = new Date(customDates.startDate);
                endDate = new Date(customDates.endDate);
            } else {
                console.warn("Custom date range requires startDate and endDate.");
                return data;
            }
            break;
        default:
            console.warn("Invalid date range. Returning original data.");
            return data;
    }
  
    //Adjusting time to ensure proper comparison with only date

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  
  
    if (filteredData.posts && Array.isArray(filteredData.posts)) {
        filteredData.posts = filteredData.posts.filter(post => {
        const postDate = new Date(post.date);
        return postDate >= startDate && postDate <= endDate;
        });
    }
  
    return filteredData;
}
// Function to display announcement or alerts
function displayAnnouncement(message, type = 'info', duration = 10000) {
  // Create announcement container if it doesn't exist
    let announcementContainer = document.getElementById('announcementContainer');

    if (!announcementContainer) {
      announcementContainer = document.createElement('div');
      announcementContainer.id = 'announcementContainer';
      announcementContainer.style.position = 'fixed';
      announcementContainer.style.bottom = '20px'; // Position at the bottom
      announcementContainer.style.left = '20px';
      announcementContainer.style.zIndex = '9999'; // Ensure it's on top
      document.body.appendChild(announcementContainer);
    }

  // Create announcement element
    const announcement = document.createElement('div');
    announcement.className = `alert alert-${type} alert-dismissible fade show`;
    announcement.role = 'alert';

  // Add icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle me-2"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
        break;
      case 'danger':
        icon = '<i class="fas fa-times-circle me-2"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle me-2"></i>';
    }

  // Set content
    announcement.innerHTML = `
      ${icon}${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to container
    announcementContainer.appendChild(announcement);

    // Initialize Bootstrap alert
    const bsAlert = new bootstrap.Alert(announcement);

    // Auto-dismiss after duration
    setTimeout(() => {
      bsAlert.close();
    }, duration);

    // Remove from DOM after animation
    announcement.addEventListener('closed.bs.alert', function() {
      announcement.remove();
    });
}
document.addEventListener('DOMContentLoaded', function() {
  // Call utility function for custom date range selection
  setupDateRangePicker();
  // Initial dashboard load with default data
    loadDashboardData('week'); // load week data by default

  // Wire up event listeners for date range selection
    document.querySelectorAll('.date-range-btn').forEach(btn => {
      btn.addEventListener('click', handleDateRangeChange);
    });

  // set up activity buttons
    document.querySelectorAll('.activity-view-btn').forEach(btn => {
        btn.addEventListener('click', handleActivityViewChange);
    });

  // set up search
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchDashboard(e.target.value);
        });
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                searchDashboard('');
                searchInput.focus();
            });
        }
    }
    // Keyboard Shortcuts
    setupKeyboardShortcuts();

  // tool tips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  // Show welcome notification
    setTimeout(() => {
      showNotification('Dashboard loaded successfully! Data is updated in real-time.', 'success');
    }, 1000);

    // Exporting data
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportDashboardData);
    }
  // print function
    const printBtn = document.getElementById('printDashboardBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printDashboard);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadDashboardData());
    }

    //Responsive Behavior
    window.addEventListener('resize', function() {
        if (activityChart) activityChart.resize();
        if (sentimentChart) sentimentChart.resize();
        if (platformChart) platformChart.resize();
        if (engagementChart) engagementChart.resize();
        setTimeout(() => {
            if (activityChart) activityChart.update();
            if (sentimentChart) sentimentChart.update();
            if (platformChart) platformChart.update();
            if (engagementChart) engagementChart.update();
        }, 100);

        const wordCloudData = window.dashboardData?.wordCloud;
        if (wordCloudData) {
            updateWordCloud(wordCloudData);
        }
    });
    //Theme toggle

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-theme');
            loadDashboardData();
        });
    }
    // Simulate a maintenance announcement
    setTimeout(() => {
      displayAnnouncement('Dashboard will undergo maintenance on Saturday at 10 PM. Some features may be temporarily unavailable.', 'warning', 15000);
    }, 5000);
});
