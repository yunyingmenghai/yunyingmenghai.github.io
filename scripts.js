let itemsPerPage = 10; // 默认每页显示10个卡片
let currentPage = 1;
let originalData = [];
let filteredData = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    fetchDataAndDisplay();
    setupEventListeners();
    setupItemsPerPageSelector();
    new BubbleEffect(); // 初始化气泡效果
});

function setupItemsPerPageSelector() {
    const itemsPerPageSelect = document.getElementById('items-per-page-select');
    itemsPerPageSelect.addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        currentPage = 1; // 重置到第一页
        displayTable();
    });
}

async function fetchDataAndDisplay() {
    try {
        const response = await fetch('qf_source.json');
        if (!response.ok) {
            throw new Error('网络响应错误');
        }
        const data = await response.json();
        const tableData = data.find(item => item.type === 'table' && item.name === 'qf_source');
        originalData = tableData.data;
        filteredData = [...originalData];
        displayTable();
    } catch (error) {
        console.error('获取数据时发生错误:', error);
    }
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', searchTable);
    document.querySelector('.pagination').addEventListener('click', handlePaginationClick);
}

function handlePaginationClick(event) {
    if (event.target.tagName === 'BUTTON') {
        currentPage = parseInt(event.target.textContent);
        displayTable();
    }
}

function displayTable() {
    const resourceList = document.getElementById('resource-list');
    const fragment = document.createDocumentFragment();
    let sortedData = filteredData;

    // 默认按更新时间降序排序
    if (!currentSort || currentSort === 'desc') {
        sortedData.sort((a, b) => b.update_time - a.update_time);
    } else if (currentSort === 'asc') {
        sortedData.sort((a, b) => a.update_time - b.update_time);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = sortedData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        card.innerHTML = `
            <h3>${item.title}</h3>
            <p class="update-time">更新时间: ${updateTime}</p>
            <a href="${item.url}" class="source-link" target="_blank">立即访问</a>
        `;
        fragment.appendChild(card);
    });

    resourceList.innerHTML = '';
    resourceList.appendChild(fragment);
    updatePagination();
}

// 添加排序功能
let currentSort = 'desc'; // 默认降序

function sortTable(ascending) {
    currentSort = ascending ? 'asc' : 'desc';
    filteredData.sort((a, b) => {
        return ascending ? a.update_time - b.update_time : b.update_time - a.update_time;
    });
    currentPage = 1;
    displayTable();
}

function searchTable() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    filteredData = originalData.filter(item => item.title.toLowerCase().includes(searchInput));
    currentPage = 1;
    displayTable();
}

function downloadData() {
    // 定义CSV列标题
    const columns = ['序号', '文件名', '夸克链接', '更新时间'];
    // 将列标题转换为CSV格式
    const csvData = [columns.join(',')];

    // 将数据添加到CSV
    filteredData.forEach((item, index) => {
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        const rowData = [
            index + 1, // 序号从1开始
            item.title,
            item.url,
            updateTime
        ].join(',');
        csvData.push(rowData);
    });

    // 创建CSV文件并下载
    const blob = new Blob([csvData.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resource_data-panhub.fun.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadLinks() {
    const links = filteredData.map(item => item.url).join('\n');
    const blob = new Blob([links], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download_links-panhub.fun.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function filterSelection(filter) {
    currentFilter = filter;
    if (filter === 'all') {
        filteredData = [...originalData];
    } else {
        filteredData = originalData.filter(item => item.source_category_id.toString() === filter);
    }
    currentPage = 1;
    displayTable();
    updateFilterButtons();
}

function updateFilterButtons() {
    const filters = document.querySelectorAll('.filters button');
    filters.forEach(filter => {
        filter.classList.remove('active');
        if (filter.textContent.trim() === currentFilter) {
            filter.classList.add('active');
        }
    });
}

// 更新分页逻辑以保持最初的显示
function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (totalPages <= 1) return; // 如果只有一页，不显示分页

    // 添加"上一页"按钮
    const prevButton = document.createElement('button');
    prevButton.textContent = '上一页';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTable();
        }
    });
    pagination.appendChild(prevButton);

    // 显示页码按钮
    const maxVisibleButtons = 5; // 最多显示的页码按钮数量
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    // 调整 startPage，确保显示足够的页码按钮
    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // 添加省略号和页码按钮
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.addEventListener('click', () => {
            currentPage = 1;
            displayTable();
        });
        pagination.appendChild(firstButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            pagination.appendChild(ellipsis);
        }
    }

    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayTable();
        });
        pagination.appendChild(pageButton);
    }

    // 添加末尾省略号和最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            pagination.appendChild(ellipsis);
        }

        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        lastButton.addEventListener('click', () => {
            currentPage = totalPages;
            displayTable();
        });
        pagination.appendChild(lastButton);
    }

    // 添加"下一页"按钮
    const nextButton = document.createElement('button');
    nextButton.textContent = '下一页';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTable();
        }
    });
    pagination.appendChild(nextButton);
}

function displayTable() {
    const resourceList = document.getElementById('resource-list');
    const fragment = document.createDocumentFragment();
    let sortedData = filteredData;

    // 默认按更新时间降序排序
    if (!currentSort || currentSort === 'desc') {
        sortedData.sort((a, b) => b.update_time - a.update_time);
    } else if (currentSort === 'asc') {
        sortedData.sort((a, b) => a.update_time - b.update_time);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = sortedData.slice(startIndex, endIndex);

    console.log(`Displaying page ${currentPage} with items ${startIndex} to ${endIndex - 1}`);

    pageData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        card.innerHTML = `
            <h3>${item.title}</h3>
            <p class="update-time">更新时间: ${updateTime}</p>
            <a href="${item.url}" class="source-link" target="_blank">立即访问</a>
        `;
        fragment.appendChild(card);
    });

    resourceList.innerHTML = '';
    resourceList.appendChild(fragment);
    updatePagination();
}



class BubbleEffect {
    constructor() {
        this.container = document.getElementById('bubbles-container');
        this.bubbleCount = 30; // 增加气泡数量
        this.init();
    }

    init() {
        // 初始化时创建气泡
        this.createBubbles();
        // 定期检查和补充气泡
        setInterval(() => this.checkAndReplenishBubbles(), 2000);
    }

    createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // 增加气泡大小 (30-90px)
        const size = Math.random() * 60 + 30;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        // 随机位置
        const startX = Math.random() * 100;
        bubble.style.left = `${startX}%`;
        
        // 随机动画持续时间 (4-8秒)
        const duration = Math.random() * 4 + 4;
        bubble.style.setProperty('--duration', `${duration}s`);
        
        // 随机透明度 (0.1-0.7)
        const opacity = Math.random() * 0.6 + 0.1;
        bubble.style.setProperty('--opacity', opacity);
        
        // 添加到容器
        this.container.appendChild(bubble);
        
        // 动画结束后移除气泡
        bubble.addEventListener('animationend', () => {
            bubble.remove();
        });
        
        return bubble;
    }

    createBubbles() {
        for (let i = 0; i < this.bubbleCount; i++) {
            this.createBubble();
        }
    }

    checkAndReplenishBubbles() {
        const currentBubbles = this.container.getElementsByClassName('bubble').length;
        const bubblesNeeded = this.bubbleCount - currentBubbles;
        
        if (bubblesNeeded > 0) {
            for (let i = 0; i < bubblesNeeded; i++) {
                this.createBubble();
            }
        }
    }
}
