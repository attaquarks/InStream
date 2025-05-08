// dashboard_main.js

let activityChartInstance = null;
let sentimentChartInstance = null;
let platformChartInstance = null;
let engagementChartInstance = null;
let allRecentPosts = []; // To store all fetched posts for client-side filtering
let currentPostsPage = 1;
const postsPerPage = 10;


// Function to load dashboard data
function loadDashboardData() {
    showLoadingOverlay('Loading dashboard data...');
    
    const source = document.getElementById('filterDataSource').value;
    const keyword = document.getElementById('filterKeyword').value;
    const timeRange = document.getElementById('filterTimeRange').value;
    
    fetch(`/api/dashboard-data?source=${source}&keyword=${keyword}&timeRange=${timeRange}`)
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            updateDashboardMetrics(data.metrics);
            updateActivityChart(document.querySelector('.card-header [data-chart-view].active')?.dataset.chartView || 'day', data.activityData);
            updateSentimentChart(data.sentimentDistribution);
            updateWordCloud(data.wordCloudData || []);
            updateTopHashtags(data.topTopics || []); // Assuming topTopics from API is hashtags
            updatePlatformChart(data.platformDistribution);
            updateEngagementChart(data.engagementMetrics);
            
            allRecentPosts = data.recentPosts || [];
            currentPostsPage = 1;
            updateRecentPostsTable();
            setupPagination();

            populateKeywordFilter(data.topTopics || []); // Populate keyword filter from hashtags for now
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Error loading dashboard data:', error);
            alert('Error loading dashboard data. Please try again later.');
        });
}

function populateKeywordFilter(topics) {
    const keywordFilter = document.getElementById('filterKeyword');
    // This is populating with hashtags/topics, adjust if actual keywords are available
    // const existingOptions = new Set(Array.from(keywordFilter.options).map(opt => opt.value));
    
    // Clear existing options except 'All Keywords'
    // while (keywordFilter.options.length > 1) {
    //    keywordFilter.remove(1);
    // }
    // topics.forEach(topic => {
    //    if (!existingOptions.has(topic.name)) {
    //        const option = new Option(topic.name, topic.name);
    //        keywordFilter.add(option);
    //    }
    // });
}


// Function to update dashboard metrics
function updateDashboardMetrics(metrics) {
    if (!metrics) return;
    document.getElementById('metricTotalPosts').textContent = metrics.totalPosts?.toLocaleString() || '0';
    updateTrendIndicator('metricPostsTrend', metrics.postsChange);
    document.getElementById('metricPostsChange').textContent = `${metrics.postsChange || 0}%`;

    document.getElementById('metricEngagementRate').textContent = `${metrics.engagementRate?.toFixed(1) || '0.0'}%`;
    updateTrendIndicator('metricEngagementTrend', metrics.engagementChange);
    document.getElementById('metricEngagementChange').textContent = `${metrics.engagementChange || 0}%`;
    
    document.getElementById('metricSentimentScore').textContent = metrics.sentimentScore?.toFixed(1) || '0.0';
    updateTrendIndicator('metricSentimentTrend', metrics.sentimentChange);
    document.getElementById('metricSentimentChange').textContent = `${metrics.sentimentChange || 0}%`;

    document.getElementById('metricTrendingTopicsCount').textContent = metrics.reach?.toLocaleString() || '0'; // Assuming reach is used for topics count for now
    updateTrendIndicator('metricTrendingTopicsTrend', metrics.reachChange);
    document.getElementById('metricTrendingTopicsChange').textContent = `${metrics.reachChange || 0}%`;
}

function updateTrendIndicator(elementId, changeValue) {
    const trendElement = document.getElementById(elementId);
    if (trendElement) {
        if (changeValue >= 0) {
            trendElement.innerHTML = '<i class="fas fa-arrow-up trend-up"></i>';
        } else {
            trendElement.innerHTML = '<i class="fas fa-arrow-down trend-down"></i>';
        }
    }
}


// Function to update top hashtags table
function updateTopHashtags(hashtags) {
    const tableBody = document.getElementById('topHashtagsTable');
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Clear existing rows

    hashtags.slice(0, 5).forEach(hashtag => { // Display top 5
        const row = tableBody.insertRow();
        row.insertCell().textContent = hashtag.name; // Assuming 'name' is the hashtag text
        row.insertCell().textContent = hashtag.posts?.toLocaleString() || '0';
        // Add more cells if needed (engagement, sentiment, trend)
        // row.insertCell().textContent = hashtag.engagement?.toLocaleString() || '0';
        // row.insertCell().textContent = hashtag.sentiment?.toFixed(1) || '0.0';
        // const trendCell = row.insertCell();
        // trendCell.innerHTML = hashtag.trend === 'up' ? '<i class="fas fa-arrow-up trend-up"></i>' : '<i class="fas fa-arrow-down trend-down"></i>';
    });
}


// Function to update recent posts table
function updateRecentPostsTable() {
    const tableBody = document.getElementById('recentPostsTable');
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Clear existing rows

    const sentimentFilter = document.querySelector('[data-filter-posts].active')?.dataset.filterPosts || 'all';
    
    let filteredPosts = allRecentPosts;
    if (sentimentFilter !== 'all') {
        filteredPosts = allRecentPosts.filter(post => post.sentiment.toLowerCase() === sentimentFilter);
    }
    
    const startIndex = (currentPostsPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    paginatedPosts.forEach(post => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = post.platform;
        row.insertCell().textContent = post.author || 'N/A';
        
        const contentCell = row.insertCell();
        contentCell.innerHTML = `<span title="${escapeHtml(post.content)}">${escapeHtml(post.content.substring(0,50))}...</span>`;

        const sentimentCell = row.insertCell();
        sentimentCell.textContent = post.sentiment;
        sentimentCell.classList.add(`sentiment-${post.sentiment.toLowerCase()}`);
        
        row.insertCell().textContent = post.likes?.toLocaleString() || '0';
        row.insertCell().textContent = post.shares?.toLocaleString() || '0';
        row.insertCell().textContent = post.date;
        // Actions cell can be added if needed
        // const actionsCell = row.insertCell();
        // actionsCell.innerHTML = `<button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>`;
    });
     // Update total pages for pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    setupPagination(totalPages);
}

function setupPagination(totalPages) {
    const paginationUl = document.getElementById('postsPagination');
    if (!paginationUl) return;
    paginationUl.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPostsPage === 1 ? 'disabled' : ''}`;
    const prevA = document.createElement('a');
    prevA.className = 'page-link';
    prevA.href = '#';
    prevA.innerHTML = '&laquo;';
    prevA.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPostsPage > 1) {
            currentPostsPage--;
            updateRecentPostsTable();
        }
    });
    prevLi.appendChild(prevA);
    paginationUl.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${currentPostsPage === i ? 'active' : ''}`;
        const pageA = document.createElement('a');
        pageA.className = 'page-link';
        pageA.href = '#';
        pageA.textContent = i;
        pageA.addEventListener('click', (e) => {
            e.preventDefault();
            currentPostsPage = i;
            updateRecentPostsTable();
        });
        pageLi.appendChild(pageA);
        paginationUl.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPostsPage === totalPages ? 'disabled' : ''}`;
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = '#';
    nextA.innerHTML = '&raquo;';
    nextA.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPostsPage < totalPages) {
            currentPostsPage++;
            updateRecentPostsTable();
        }
    });
    nextLi.appendChild(nextA);
    paginationUl.appendChild(nextLi);
}


function sortHashtags(sortBy) {
    // This function would typically re-fetch data or sort existing data
    // For now, let's assume the API handles sorting or we re-fetch
    console.log(`Sorting hashtags by: ${sortBy}`);
    loadDashboardData(); // Simplest way is to reload data with sort preference
}

function filterPosts(filterBy) {
    console.log(`Filtering posts by: ${filterBy}`);
    currentPostsPage = 1; // Reset to first page on filter change
    updateRecentPostsTable(); // This will apply the filter and re-render
}

function exportDashboard() {
    // Placeholder for export functionality
    alert('Export functionality is not yet implemented.');
    // For a real implementation, you might use a library like SheetJS for Excel/CSV
    // or generate a PDF using jspdf.
}

function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') {
        return '';
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

    