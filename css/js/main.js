class QuotationSystem {
    constructor() {
        this.categories = [];
        this.currentIndustry = null;
        this.taxSettings = {
            type: 'included',
            rate: 5
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDate();
        this.loadFromStorage();
    }

    bindEvents() {
        // 行業選擇事件
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const industry = e.currentTarget.dataset.industry;
                this.selectIndustry(industry);
            });
        });

        // 表單事件綁定
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('importBtn').addEventListener('click', () => this.importFromExcel());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToExcel());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetQuote());
        document.getElementById('exportHtmlBtn').addEventListener('click', () => this.exportHTML());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveQuote());

        // 稅率設定事件
        document.getElementById('taxType').addEventListener('change', () => this.updateTaxSettings());
        document.getElementById('taxRate').addEventListener('input', () => this.updateTaxSettings());

        // 彈窗事件
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        document.getElementById('saveCategoryBtn').addEventListener('click', () => this.saveCategory());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('saveItemBtn').addEventListener('click', () => this.saveItem());
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemModal());
        document.getElementById('addUnitBtn').addEventListener('click', () => this.addNewUnit());
    }

    setupDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quoteDate').value = today;
    }

    selectIndustry(industryKey) {
        this.currentIndustry = industryKey;
        const template = industryTemplates[industryKey];
        
        if (template) {
            this.categories = JSON.parse(JSON.stringify(template.categories));
            
            // 加入預設項目（如果有的話）
            if (defaultItems[industryKey]) {
                this.categories[0].items = [...defaultItems[industryKey]];
            }
            
            document.getElementById('industry-selection').classList.add('hidden');
            document.getElementById('quotation-app').classList.remove('hidden');
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = '';
        
        this.categories.forEach((category, index) => {
            const details = document.createElement('details');
            details.open = true;
            
            const summary = document.createElement('summary');
            summary.innerHTML = `
                <div class="cat-header">
                    <span class="cat-icon">${index + 1}</span> 
                    <span class="cat-title">${category.name}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="cat-total">$${this.calculateCategoryTotal(category).toLocaleString()}</span>
                    <button class="cat-delete" data-category-id="${category.id}" title="刪除類別">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            const itemList = document.createElement('div');
            itemList.className = 'item-list';
            
            category.items.forEach((item, itemIndex) => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.innerHTML = `
                    <div class="item-top">
                        <div class="item-name">
                            <span class="item-index">${itemIndex + 1}</span>${item.name}
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div class="item-subtotal">$${(item.quantity * item.price).toLocaleString()}</div>
                            <button class="btn-delete" data-category-id="${category.id}" data-item-id="${item.id}" title="刪除項目">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="item-specs">
                        <span class="spec-pill">數量: ${item.quantity} ${item.unit}</span>
                        <span class="spec-pill">單價: $${item.price.toLocaleString()}</span>
                    </div>
                    ${item.remark ? `<div class="item-remark"><span class="remark-label">備註</span>${item.remark}</div>` : ''}
                `;
                itemList.appendChild(detailItem);
            });
            
            const addButton = document.createElement('div');
            addButton.style.marginTop = '15px';
            addButton.style.textAlign = 'center';
            addButton.innerHTML = `<button class="btn btn-secondary" data-category-id="${category.id}"><i class="fas fa-plus"></i> 新增項目</button>`;
            itemList.appendChild(addButton);
            
            details.appendChild(summary);
            details.appendChild(itemList);
            container.appendChild(details);
        });
        
        // 綁定新增項目按鈕事件
        document.querySelectorAll('.btn-secondary[data-category-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.openAddItemModal(categoryId);
            });
        });
        
        // 綁定刪除類別按鈕事件
        document.querySelectorAll('.cat-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.deleteCategory(categoryId);
            });
        });
        
        // 綁定刪除項目按鈕事件
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                this.deleteItem(categoryId, itemId);
            });
        });
    }

    calculateCategoryTotal(category) {
        return category.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    updateTotals() {
        const subtotal = this.categories.reduce((sum, category) => sum + this.calculateCategoryTotal(category), 0);
        const tax = subtotal * (this.taxSettings.rate / 100);
        let total = 0;
        
        if (this.taxSettings.type === 'included') {
            total = subtotal;
            document.querySelector('.total-final span:first-child').textContent = '總報價金額 (含稅)';
        } else {
            total = subtotal + tax;
            document.querySelector('.total-final span:first-child').textContent = '總報價金額 (未稅)';
        }
        
        document.getElementById('subtotal').textContent = '$' + subtotal.toLocaleString();
        document.getElementById('taxAmount').textContent = '$' + tax.toLocaleString();
        document.getElementById('totalAmount').textContent = '$' + total.toLocaleString();
        document.getElementById('totalDisplay').textContent = '$' + total.toLocaleString();
        document.getElementById('taxRateDisplay').textContent = this.taxSettings.rate;
    }

    updateTaxSettings() {
        this.taxSettings.type = document.getElementById('taxType').value;
        this.taxSettings.rate = parseFloat(document.getElementById('taxRate').value) || 0;
        this.updateTotals();
    }

    openCategoryModal() {
        document.getElementById('categoryModal').classList.remove('hidden');
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.add('hidden');
        document.getElementById('categoryName').value = '';
    }

    saveCategory() {
        const categoryName = document.getElementById('categoryName').value.trim();
        if (!categoryName) {
            alert('請輸入類別名稱');
            return;
        }
        
        const newCategory = {
            id: Date.now(),
            name: categoryName,
            items: []
        };
        
        this.categories.push(newCategory);
        this.renderCategories();
        this.closeCategoryModal();
        this.updateTotals();
        this.updateChart();
    }

    openAddItemModal(categoryId) {
        this.currentCategoryId = categoryId;
        document.getElementById('itemModal').classList.remove('hidden');
    }

    closeItemModal() {
        document.getElementById('itemModal').classList.add('hidden');
        this.resetItemForm();
    }

    resetItemForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('itemQuantity').value = '1';
        document.getElementById('itemUnit').value = '式';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemRemark').value = '';
        this.currentCategoryId = null;
    }

    saveItem() {
        const itemName = document.getElementById('itemName').value.trim();
        const itemQuantity = parseFloat(document.getElementById('itemQuantity').value) || 1;
        const itemUnit = document.getElementById('itemUnit').value;
        const itemPrice = parseFloat(document.getElementById('itemPrice').value) || 0;
        const itemRemark = document.getElementById('itemRemark').value.trim();
        
        if (!itemName) {
            alert('請輸入項目名稱');
            return;
        }
        
        if (!this.currentCategoryId) {
            alert('請選擇類別');
            return;
        }
        
        const category = this.categories.find(cat => cat.id === this.currentCategoryId);
        if (category) {
            const newItem = {
                id: Date.now(),
                name: itemName,
                quantity: itemQuantity,
                unit: itemUnit,
                price: itemPrice,
                remark: itemRemark
            };
            
            category.items.push(newItem);
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
            this.closeItemModal();
        }
    }

    deleteItem(categoryId, itemId) {
        if (confirm('確定要刪除此項目嗎？')) {
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
                category.items = category.items.filter(item => item.id !== itemId);
                this.renderCategories();
                this.updateTotals();
                this.updateChart();
            }
        }
    }

    deleteCategory(categoryId) {
        if (confirm('確定要刪除此類別及其中所有項目嗎？')) {
            this.categories = this.categories.filter(cat => cat.id !== categoryId);
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    updateChart() {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        const chartLegend = document.getElementById('chartLegend');
        
        // 計算總金額
        const subtotal = this.categories.reduce((sum, category) => sum + this.calculateCategoryTotal(category), 0);
        
        if (subtotal === 0) {
            // 如果沒有數據，顯示提示
            chartLegend.innerHTML = '<div class="legend-item"><span class="legend-color" style="background:#ccc"></span>無數據</div>';
            return;
        }
        
        // 計算每個類別的百分比
        const categoryData = this.categories.map(category => {
            const total = this.calculateCategoryTotal(category);
            const percentage = ((total / subtotal) * 100).toFixed(1);
            return {
                name: category.name,
                total: total,
                percentage: parseFloat(percentage),
                color: this.getCategoryColor(category.id)
            };
        });
        
        // 生成圖表數據
        const labels = categoryData.map(data => data.name);
        const data = categoryData.map(data => data.total);
        const backgroundColors = categoryData.map(data => data.color);
        
        // 如果圖表已存在，先銷毀
        if (this.budgetChart) {
            this.budgetChart.destroy();
        }
        
        // 創建新圖表
        this.budgetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
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
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = ((value / subtotal) * 100).toFixed(1);
                                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // 生成圖例
        chartLegend.innerHTML = '';
        categoryData.forEach(data => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <span class="legend-color" style="background:${data.color}"></span>
                ${data.name} ${data.percentage}%
            `;
            chartLegend.appendChild(legendItem);
        });
    }

    getCategoryColor(id) {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        return colors[id % colors.length];
    }

    addNewUnit() {
        const newUnitInput = document.getElementById('newUnit');
        const unitSelect = document.getElementById('itemUnit');
        const newUnit = newUnitInput.value.trim();
        
        if (newUnit && !Array.from(unitSelect.options).some(option => option.value === newUnit)) {
            const option = document.createElement('option');
            option.value = newUnit;
            option.textContent = newUnit;
            unitSelect.appendChild(option);
            unitSelect.value = newUnit;
            newUnitInput.value = '';
        }
    }

    importFromExcel() {
        alert('匯入功能需配合後端實作，此處僅展示UI');
    }

    exportToExcel() {
        alert('匯出功能需配合後端實作，此處僅展示UI');
    }

    resetQuote() {
        if (confirm('確定要清空整個報價單嗎？此操作無法復原。')) {
            this.categories = [];
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    exportHTML() {
        alert('輸出HTML功能需配合後端實作，此處僅展示UI');
    }

    saveQuote() {
        alert('儲存功能需配合後端實作，此處僅展示UI');
    }

    loadFromStorage() {
        // 從localStorage載入資料（如果有的話）
        const savedData = localStorage.getItem('quotationData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.categories = data.categories || [];
                this.taxSettings = data.taxSettings || this.taxSettings;
                this.renderCategories();
                this.updateTotals();
                this.updateChart();
            } catch (e) {
                console.error('載入資料失敗:', e);
            }
        }
    }

    saveToStorage() {
        // 儲存到localStorage
        const data = {
            categories: this.categories,
            taxSettings: this.taxSettings
        };
        localStorage.setItem('quotationData', JSON.stringify(data));
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.quotationSystem = new QuotationSystem();
});
