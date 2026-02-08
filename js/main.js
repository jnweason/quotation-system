class QuotationSystem {
    constructor() {
        this.categories = [];
        this.negotiatedPrices = [];
        this.currentIndustry = null;
        this.taxSettings = {
            type: 'included',
            rate: 5
        };

        // 新增歷史記錄屬性
        this.historyRecords = {
            companyNames: [],
            staffNames: [],
            contactPhones: []
        };
        // 新增自定義欄位屬性
        this.customFields = [];
        
        this.init();
        this.draggedElement = null;
        this.draggedType = null; // 'category' 或 'item'
    }
    generateUniqueId() {
        // 結合時間戳和隨機數確保唯一性
        return Date.now() + Math.floor(Math.random() * 100000);
    }

    init() {
        this.injectHeaderStyles();
        this.bindEvents();
        this.setupDate();
        this.loadFromStorage();
        this.loadHistoryRecords(); // 加載歷史記錄
        this.setupAutocomplete(); // 設置自動完成
        this.initCustomFields();
        this.initNegotiatedPrices();
        this.bindNegotiatedPriceEvents();

        
        
        // 添加 Enter 鍵提交功能
        const inputs = document.querySelectorAll('#selectionCompanyName, #selectionStaffName, #selectionContactPhone');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    // 檢查是否有選中的行業按鈕
                    const industryButtons = document.querySelectorAll('.industry-btn');
                    let selectedIndustry = null;
                    industryButtons.forEach(btn => {
                        if (btn.classList.contains('selected')) {
                            selectedIndustry = btn.dataset.industry;
                        }
                    });
                    
                    if (selectedIndustry) {
                        this.selectIndustry(selectedIndustry);
                    }
                }
            });
        });
        
        // 為行業按鈕添加點擊後的視覺反饋
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除其他按鈕的選中狀態
                document.querySelectorAll('.industry-btn').forEach(b => b.classList.remove('selected'));
                // 添加當前按鈕的選中狀態
                e.currentTarget.classList.add('selected');
            });
        });
        
        // 為注意事項保存按鈕綁定事件
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', () => this.saveNotes());
        }
        
        // 從 localStorage 載入保存的注意事項
        const savedNotes = localStorage.getItem('quotationNotes');
        if (savedNotes) {
            const notesTextarea = document.getElementById('notesContent');
            if (notesTextarea) {
                notesTextarea.value = savedNotes;
            }
        }
    }

/**
 * 初始化議價價格欄位
 */
initNegotiatedPrices() {
    // 從 localStorage 載入議價價格
    const savedPrices = localStorage.getItem('quotationNegotiatedPrices');
    if (savedPrices) {
        try {
            this.negotiatedPrices = JSON.parse(savedPrices);
        } catch (e) {
            console.error('載入議價價格失敗:', e);
            this.negotiatedPrices = [];
        }
    }
    
    this.renderNegotiatedPrices();
    this.bindNegotiatedPriceEvents();
}

/**
 * 儲存議價價格到 localStorage
 */
saveNegotiatedPrices() {
    localStorage.setItem('quotationNegotiatedPrices', JSON.stringify(this.negotiatedPrices));
}

/**
 * 渲染議價價格欄位
 */
renderNegotiatedPrices() {
    const container = document.getElementById('negotiatedPriceContainer');
    if (!container) return;
    
    // 只有在議價價格數量發生變化時才重新渲染整個區域
    const currentChildrenCount = container.querySelectorAll('.negotiated-price-item').length;
    if (currentChildrenCount !== this.negotiatedPrices.length) {
        container.innerHTML = '';
        
        if (this.negotiatedPrices.length === 0) {
            return;
        }
        
        // 計算原始總金額
        const originalTotal = this.calculateOriginalTotal();
        
        this.negotiatedPrices.forEach((priceItem, index) => {
            const priceItemElement = document.createElement('div');
            priceItemElement.className = 'negotiated-price-item';
            priceItemElement.setAttribute('data-price-index', index);
            
            // 計算差價
            const difference = priceItem.amount - originalTotal;
            const differenceText = difference >= 0 ? 
                `+${this.formatCurrency(Math.abs(difference))}` : 
                `-${this.formatCurrency(Math.abs(difference))}`;
            
            priceItemElement.innerHTML = `
                <input type="text" 
                       class="negotiated-price-label" 
                       value="${priceItem.label}" 
                       data-price-index="${index}"
                       placeholder="議價名稱"
                       style="font-size: 0.8rem; color: #666; width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                <span style="color: #999;">$</span>
                <input type="number" 
                       class="negotiated-price-input" 
                       value="${priceItem.amount}" 
                       data-price-index="${index}"
                       placeholder="金額"
                       style="flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                <div class="negotiated-price-display" style="min-width: 120px; text-align: right; font-size: 0.8rem; color: ${difference >= 0 ? '#e74c3c' : '#27ae60'};">
                    差價: ${differenceText}
                </div>
                <button class="btn-remove-negotiated" 
                        data-price-index="${index}" 
                        style="background: #e74c3c; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(priceItemElement);
        });
        
        // 綁定事件（只綁定一次）
        this.bindNegotiatedPriceInputEventsOnce();
    } else {
        // 如果數量相同，只更新現有元素的值和顯示
        this.updateExistingNegotiatedPriceElements();
    }
    
    // 更新總計顯示
    this.updateTotals();
}

/**
 * 只綁定一次議價價格輸入事件
 */
bindNegotiatedPriceInputEventsOnce() {
    const container = document.getElementById('negotiatedPriceContainer');
    if (!container) return;
    
    // 為標籤輸入框綁定事件
    container.querySelectorAll('.negotiated-price-label').forEach(input => {
        // 使用標記避免重複綁定
        if (!input.dataset.eventBound) {
            input.dataset.eventBound = 'true';
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.priceIndex);
                if (this.negotiatedPrices[index]) {
                    this.negotiatedPrices[index].label = e.target.value;
                    this.saveNegotiatedPrices();
                    this.updateNegotiatedPriceDisplayOnly(index);
                }
            });
        }
    });
    
    // 為金額輸入框綁定事件
    container.querySelectorAll('.negotiated-price-input').forEach(input => {
        // 使用標記避免重複綁定
        if (!input.dataset.eventBound) {
            input.dataset.eventBound = 'true';
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.priceIndex);
                if (this.negotiatedPrices[index]) {
                    this.negotiatedPrices[index].amount = parseFloat(e.target.value) || 0;
                    this.saveNegotiatedPrices();
                    this.updateNegotiatedPriceDisplayOnly(index);
                }
            });
        }
    });
    
    // 為刪除按鈕綁定事件
    container.querySelectorAll('.btn-remove-negotiated').forEach(btn => {
        // 使用標記避免重複綁定
        if (!btn.dataset.eventBound) {
            btn.dataset.eventBound = 'true';
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.priceIndex);
                this.removeNegotiatedPrice(index);
            });
        }
    });
}

/**
 * 只更新議價價格顯示（不重新渲染）
 */
updateNegotiatedPriceDisplayOnly(index) {
    const container = document.getElementById('negotiatedPriceContainer');
    if (!container) return;
    
    const priceItemElement = container.querySelector(`[data-price-index="${index}"]`);
    if (!priceItemElement) return;
    
    const originalTotal = this.calculateOriginalTotal();
    const priceItem = this.negotiatedPrices[index];
    if (!priceItem) return;
    
    // 計算差價
    const difference = priceItem.amount - originalTotal;
    const differenceText = difference >= 0 ? 
        `+${this.formatCurrency(Math.abs(difference))}` : 
        `-${this.formatCurrency(Math.abs(difference))}`;
    
    const displayElement = priceItemElement.querySelector('.negotiated-price-display');
    if (displayElement) {
        displayElement.textContent = `差價: ${differenceText}`;
        displayElement.style.color = difference >= 0 ? '#e74c3c' : '#27ae60';
    }
    
    // 更新總計顯示
    this.updateTotals();
}

/**
 * 更新現有議價價格元素的值
 */
updateExistingNegotiatedPriceElements() {
    const container = document.getElementById('negotiatedPriceContainer');
    if (!container) return;
    
    this.negotiatedPrices.forEach((priceItem, index) => {
        const priceItemElement = container.querySelector(`[data-price-index="${index}"]`);
        if (priceItemElement) {
            const labelInput = priceItemElement.querySelector('.negotiated-price-label');
            const amountInput = priceItemElement.querySelector('.negotiated-price-input');
            
            if (labelInput) {
                labelInput.value = priceItem.label;
            }
            if (amountInput) {
                amountInput.value = priceItem.amount;
            }
        }
    });
}

/**
 * 新增議價價格欄位
 */
addNegotiatedPrice() {
    const newPrice = {
        id: this.generateUniqueId(),
        label: '議價價格',
        amount: this.calculateOriginalTotal()
    };
    
    this.negotiatedPrices.push(newPrice);
    this.saveNegotiatedPrices();
    this.renderNegotiatedPrices();
    
    // 聚焦到新添加的輸入框
    setTimeout(() => {
        const container = document.getElementById('negotiatedPriceContainer');
        if (container) {
            const elements = container.querySelectorAll('.negotiated-price-item');
            if (elements.length > 0) {
                const lastElement = elements[elements.length - 1];
                const labelInput = lastElement.querySelector('.negotiated-price-label');
                if (labelInput) {
                    labelInput.focus();
                    labelInput.select();
                }
            }
        }
    }, 100);
}

/**
 * 刪除議價價格欄位
 */
removeNegotiatedPrice(index) {
    if (confirm('確定要刪除此議價價格欄位嗎？')) {
        this.negotiatedPrices.splice(index, 1);
        this.saveNegotiatedPrices();
        this.renderNegotiatedPrices();
    }
}


/**
 * 計算原始總金額
 */
calculateOriginalTotal() {
    const subtotal = Math.ceil(this.categories.reduce((sum, category) => sum + this.calculateCategoryTotal(category), 0));
    const tax = Math.ceil(subtotal * (this.taxSettings.rate / 100));
    
    if (this.taxSettings.type === 'included') {
        return Math.ceil(subtotal + tax);
    } else {
        return Math.ceil(subtotal);
    }
}

/**
 * 新增議價價格欄位
 */
addNegotiatedPrice() {
    const newPrice = {
        id: this.generateUniqueId(),
        label: '議價價格',
        amount: this.calculateOriginalTotal()
    };
    
    this.negotiatedPrices.push(newPrice);
    this.saveNegotiatedPrices();
    this.renderNegotiatedPrices();
    this.updateTotals(); // 更新總計顯示
}

/**
 * 刪除議價價格欄位
 */
removeNegotiatedPrice(index) {
    if (confirm('確定要刪除此議價價格欄位嗎？')) {
        this.negotiatedPrices.splice(index, 1);
        this.saveNegotiatedPrices();
        this.renderNegotiatedPrices();
        this.updateTotals(); // 更新總計顯示
    }
}

/**
 * 綁定議價價格事件
 */
bindNegotiatedPriceEvents() {
    const addBtn = document.getElementById('addNegotiatedPriceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => this.addNegotiatedPrice());
    }
}



    /**
 * 初始化自定義欄位
 */
initCustomFields() {
    // 從 localStorage 載入自定義欄位
    const savedFields = localStorage.getItem('quotationCustomFields');
    if (savedFields) {
        try {
            this.customFields = JSON.parse(savedFields);
        } catch (e) {
            console.error('載入自定義欄位失敗:', e);
            this.customFields = [];
        }
    }
    
    this.renderCustomFields();
}

/**
 * 儲存自定義欄位到 localStorage
 */
saveCustomFields() {
    localStorage.setItem('quotationCustomFields', JSON.stringify(this.customFields));
}

        /**
 * 渲染自定義欄位
 */
renderCustomFields() {
    const container = document.getElementById('customFieldsContainer');
    if (!container) return;
    
    // 清空容器但保留新增按鈕
    container.innerHTML = '';
    
    // 如果沒有自定義欄位，顯示提示文字
    if (this.customFields.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            text-align: center; 
            padding: 10px; 
            color: #999; 
            font-size: 0.9rem;
            grid-column: span 2;
        `;
        placeholder.textContent = '尚未新增自定義欄位';
        container.appendChild(placeholder);
        return;
    }
    
    // 渲染每個自定義欄位
    this.customFields.forEach((field, index) => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'info-item custom-field-item';
        fieldElement.style.cssText = 'margin-bottom: 15px;';
        fieldElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="text" 
                       class="custom-field-label" 
                       value="${field.label}" 
                       data-field-index="${index}"
                       placeholder="欄位名稱"
                       style="font-size: 0.75rem; color: #95a5a6; width: 100px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                <input type="text" 
                       id="customField_${index}" 
                       class="custom-field-input" 
                       value="${field.value || ''}" 
                       placeholder="${field.placeholder || '請輸入內容'}"
                       data-field-index="${index}"
                       style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                <button class="btn btn-danger remove-field-btn" 
                        data-field-index="${index}" 
                        style="padding: 4px 8px; min-width: auto; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(fieldElement);
    });
    
    // 綁定標籤輸入事件
    container.querySelectorAll('.custom-field-label').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.fieldIndex);
            this.customFields[index].label = e.target.value;
            this.saveCustomFields();
        });
    });
    
    // 綁定輸入事件
    container.querySelectorAll('.custom-field-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.fieldIndex);
            this.customFields[index].value = e.target.value;
            this.saveCustomFields();
        });
    });
    
    // 綁定刪除按鈕事件
    container.querySelectorAll('.remove-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-field-btn').dataset.fieldIndex);
            this.removeCustomField(index);
        });
    });
}

  /**
 * 新增自定義欄位
 */
addCustomField() {
    const field = {
        id: this.generateUniqueId(),
        label: '新增欄位',
        value: '',
        placeholder: '請輸入內容'
    };
    
    this.customFields.push(field);
    this.saveCustomFields();
    this.renderCustomFields();
    
    // 聚焦到新欄位的標籤輸入框
    setTimeout(() => {
        const newFieldIndex = this.customFields.length - 1;
        const labelInput = document.querySelector(`.custom-field-label[data-field-index="${newFieldIndex}"]`);
        if (labelInput) {
            labelInput.focus();
            labelInput.select();
        }
    }, 100);
}

        /**
         * 刪除自定義欄位
         */
        removeCustomField(index) {
            if (confirm('確定要刪除此欄位嗎？')) {
                this.customFields.splice(index, 1);
                this.saveCustomFields();
                this.renderCustomFields();
            }
        }

        /**
         * 編輯自定義欄位標籤
         */
        editCustomFieldLabel(index, newLabel) {
            if (this.customFields[index]) {
                this.customFields[index].label = newLabel;
                this.saveCustomFields();
                this.renderCustomFields();
            }
        }


          /**
 * 注入頁首輸入框所需樣式
 */
injectHeaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .header-input {
            background: transparent;
            border: none;
            color: white;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
            padding: 5px 10px;
            margin: 0;
            outline: none;
            width: calc(100% - 60px);
            text-align: center;
            border-radius: 4px;
        }
        
        .header-input:focus {
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        .header h1 .header-input {
            font-size: 1.4rem;
            letter-spacing: 1px;
        }
        
        .sub-title .header-input {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 5px;
        }
        
        @media (max-width: 768px) {
            .header-input {
                width: calc(100% - 40px);
            }
        }
        
        /* 自定義欄位樣式 */
        .custom-fields-container {
            margin: 15px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .custom-field-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .custom-field-label {
            font-size: 0.75rem !important;
            color: #95a5a6 !important;
            font-weight: 500;
        }
        
        .custom-field-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .remove-field-btn {
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 30px;
            height: 30px;
        }
        
        #addCustomFieldBtn {
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 15px;
        }
        
        #addCustomFieldBtn:hover {
            background: #2980b9;
        }
        
        /* 響應式設計 */
        @media (max-width: 768px) {
            .custom-fields-container {
                grid-template-columns: 1fr;
            }
        }

        /* 圖片上傳樣式 */
        .item-image-preview {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }
        
        .item-image-preview img {
            max-width: 100px;
            max-height: 100px;
            border-radius: 4px;
            border: 1px solid #eee;
            object-fit: cover;
        }
        
        .btn-remove-image {
            margin-left: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 2px 6px;
            cursor: pointer;
        }
        
        .btn-upload-image {
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .btn-upload-image:hover {
            background: #2980b9;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 綁定圖片上傳事件
 */
bindImageUploadEvents() {
    // 綁定上傳圖片按鈕事件
    document.querySelectorAll('.btn-upload-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = parseInt(e.currentTarget.dataset.itemId);
            this.openImageUpload(itemId);
        });
    });
    
    // 綁定移除圖片按鈕事件
    document.querySelectorAll('.btn-remove-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = parseInt(e.currentTarget.dataset.itemId);
            this.removeItemImage(itemId);
        });
    });
}

/**
 * 打開圖片上傳對話框
 */
openImageUpload(itemId) {
    // 創建隱藏的文件輸入元素
    let fileInput = document.querySelector(`.image-upload-input[data-item-id="${itemId}"]`);
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.className = 'image-upload-input';
        fileInput.setAttribute('data-item-id', itemId);
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // 設置文件選擇事件處理
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            this.processImageFile(file, itemId);
        }
        // 清空選擇以允許重複選擇同一檔案
        event.target.value = '';
    };
    
    // 觸發文件選擇
    fileInput.click();
}

/**
 * 處理圖片文件
 */
processImageFile(file, itemId) {
    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
        alert('請選擇圖片文件');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            // 創建圖片元素來獲取原始尺寸
            const img = new Image();
            img.onload = () => {
                // 調整圖片尺寸到300x300
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 300;
                canvas.height = 300;
                
                // 計算縮放比例以保持圖片比例
                const ratio = Math.min(300 / img.width, 300 / img.height);
                const width = img.width * ratio;
                const height = img.height * ratio;
                const x = (300 - width) / 2;
                const y = (300 - height) / 2;
                
                // 在畫布上繪製圖片
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 300, 300);
                ctx.drawImage(img, x, y, width, height);
                
                // 轉換為數據URL
                const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
                
                // 保存圖片到項目
                this.saveItemImage(itemId, resizedImageData);
            };
            img.src = e.target.result;
        } catch (error) {
            console.error('處理圖片失敗:', error);
            alert('圖片處理失敗，請稍後再試');
        }
    };
    
    reader.readAsDataURL(file);
}

/**
 * 保存圖片到項目
 */
saveItemImage(itemId, imageData) {
    // 找到對應的項目並保存圖片數據
    let found = false;
    for (const category of this.categories) {
        for (const item of category.items) {
            if (item.id === itemId) {
                item.image = imageData;
                found = true;
                break;
            }
        }
        if (found) break;
    }
    
    if (found) {
        this.saveToStorage();
        this.renderCategories();
        this.updateTotals();
        this.updateChart();
        this.renderNegotiatedPrices();
    }
}

/**
 * 移除項目圖片
 */
removeItemImage(itemId) {
    if (confirm('確定要移除這張圖片嗎？')) {
        // 找到對應的項目並移除圖片數據
        let found = false;
        for (const category of this.categories) {
            for (const item of category.items) {
                if (item.id === itemId) {
                    delete item.image;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        
        if (found) {
            this.saveToStorage();
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }
}
    bindEvents() {
        // 行業選擇事件
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const industry = e.currentTarget.dataset.industry;
                this.selectIndustry(industry);
            });
        });
          // 綁定新增議價價格按鈕事件
        const addNegotiatedPriceBtn = document.getElementById('addNegotiatedPriceBtn');
        if (addNegotiatedPriceBtn) {
            addNegotiatedPriceBtn.addEventListener('click', () => this.addNegotiatedPrice());
        }

        // 表單事件綁定
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
        
        // 綁定標題輸入框事件
            const mainTitleInput = document.getElementById('mainTitle');
            const subTitleInput = document.getElementById('subTitle');
            
            if (mainTitleInput) {
                mainTitleInput.addEventListener('input', () => {
                // 即時更新預覽
                document.title = mainTitleInput.value + " - 報價單系統";
            });
                mainTitleInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        mainTitleInput.blur();
                    }
                });
            }
            
            if (subTitleInput) {
                subTitleInput.addEventListener('blur', () => this.saveHeaderSettings());
                subTitleInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        subTitleInput.blur();
                    }
                });
            }
        // 綁定新增自定義欄位按鈕事件
        const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
        if (addCustomFieldBtn) {
            addCustomFieldBtn.addEventListener('click', () => this.addCustomField());
        }
    
    }

    setupDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quoteDate').value = today;
    }

    selectIndustry(industryKey) {
        this.hideAllAutocompleteDropdowns();
        const companyName = document.getElementById('selectionCompanyName').value.trim();
        const staffName = document.getElementById('selectionStaffName').value.trim();
        const contactPhone = document.getElementById('selectionContactPhone').value.trim();
        
        if (!companyName || !staffName || !contactPhone) {
            alert('請填寫所有必填欄位（公司名稱、承辦人員、聯絡電話）');
            return;
        }
        
        // 保存歷史記錄
        this.saveHistoryRecord('companyNames', companyName);
        this.saveHistoryRecord('staffNames', staffName);
        this.saveHistoryRecord('contactPhones', contactPhone);
        
        this.currentIndustry = industryKey;
        const template = industryTemplates[industryKey];

        if (template) {
            // 深拷貝模板並為所有類別和項目分配唯一ID
            this.categories = JSON.parse(JSON.stringify(template.categories)).map((category) => {
                // 為類別分配唯一ID
                const categoryId = this.generateUniqueId();
                
                // 為類別中的每個項目分配唯一ID
                const itemsWithIds = category.items.map(item => ({
                    ...item,
                    id: this.generateUniqueId()
                }));
                
                return {
                    ...category,
                    id: categoryId,
                    items: itemsWithIds
                };
            });
            
            // 加入預設項目（如果有的話），並確保項目有唯一ID
            if (defaultItems[industryKey]) {
                // 為預設項目分配唯一ID
                const defaultItemsWithIds = defaultItems[industryKey].map(item => ({
                    ...item,
                    id: this.generateUniqueId(),
                    image: null  // 添加圖片字段
                }));
                
                // 如果第一個類別存在，將預設項目加入其中
                if (this.categories.length > 0) {
                    this.categories[0].items = [...defaultItemsWithIds];
                }
            }

            document.getElementById('industry-selection').classList.add('hidden');
            document.getElementById('quotation-app').classList.remove('hidden');
            document.getElementById('companyName').value = companyName;
            document.getElementById('staffName').value = staffName;
            document.getElementById('contactPhone').value = contactPhone;

            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = '';
        
        // 如果沒有類別，顯示新增類別按鈕
        if (this.categories.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'card empty-state';
            emptyState.style.textAlign = 'center';
            emptyState.style.padding = '40px 20px';
            emptyState.style.backgroundColor = '#f8f9fa';
            emptyState.style.borderRadius = '12px';
            emptyState.style.marginBottom = '20px';
            emptyState.style.border = '2px dashed #dee2e6';
            emptyState.innerHTML = `
                <div style="font-size: 1.2rem; color: #666; margin-bottom: 20px;">
                    <i class="fas fa-folder-plus" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <div>目前還沒有類別項目</div>
                </div>
                <div class="empty-state-button-wrapper">
                    <button class="btn btn-primary" id="addCategoryEmptyBtn" style="margin: 0 auto; display: block; width: fit-content; min-width: 200px;">
                        <i class="fas fa-plus-circle"></i> 新增第一個類別
                    </button>
                </div>
                <div style="font-size: 0.8rem; color: #999; margin-top: 10px;">
                    點擊上方按鈕開始建立您的報價項目
                </div>
            `;
            container.appendChild(emptyState);
            
            // 綁定事件
            setTimeout(() => {
                const addCategoryEmptyBtn = document.getElementById('addCategoryEmptyBtn');
                if (addCategoryEmptyBtn) {
                    addCategoryEmptyBtn.addEventListener('click', () => this.openCategoryModal());
                }
            }, 0);
            
            return;
        }
        
        // 有類別時的處理
        this.categories.forEach((category, index) => {
            const details = document.createElement('details');
            details.open = true;
            details.className = 'category-details';
            details.setAttribute('draggable', 'true');
            details.setAttribute('data-category-id', category.id);
            details.setAttribute('data-index', index);
            
            const summary = document.createElement('summary');
            summary.innerHTML = `
                <div class="cat-header">
                    <span class="cat-icon">${index + 1}</span> 
                    <span class="cat-title">${category.name}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="cat-total">$${this.formatCurrency(this.calculateCategoryTotal(category))}</span>
                    <button class="cat-delete" data-category-id="${category.id}" title="刪除類別">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            const itemList = document.createElement('div');
            itemList.className = 'item-list sortable-category';
            itemList.setAttribute('data-category-id', category.id);
            
            category.items.forEach((item, itemIndex) => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.setAttribute('draggable', 'true');
                detailItem.setAttribute('data-item-id', item.id);
                detailItem.setAttribute('data-category-id', category.id);
                detailItem.setAttribute('data-index', itemIndex);
                // 建立圖片預覽區域
let imagePreview = '';
if (item.image) {
    imagePreview = `
        <div class="item-image-preview">
            <img src="${item.image}" alt="項目圖片">
            <button class="btn-remove-image" data-item-id="${item.id}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

detailItem.innerHTML = `
    <div class="item-top">
        <div class="item-name">
            <span class="item-index">${itemIndex + 1}</span>${item.name}
        </div>
        <div style="display: flex; align-items: center;">
            <div class="item-subtotal">$${this.formatCurrency(item.quantity * item.price)}</div>
            <button class="btn-edit" data-category-id="${category.id}" data-item-id="${item.id}" title="編輯項目">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" data-category-id="${category.id}" data-item-id="${item.id}" title="刪除項目">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
    <div class="item-specs">
        <span class="spec-pill">數量: ${item.quantity} ${item.unit}</span>
        <span class="spec-pill">單價: $${this.formatCurrency(item.price)}</span>
    </div>
    ${item.remark ? `<div class="item-remark"><span class="remark-label">備註</span>${item.remark}</div>` : ''}
    <div style="margin-top: 10px;">
        <button class="btn-upload-image" data-item-id="${item.id}">
            <i class="fas fa-camera"></i> ${item.image ? '更換圖片' : '上傳圖片'}
        </button>
        ${imagePreview}
    </div>
`;
                itemList.appendChild(detailItem);
            });
            
            const addButton = document.createElement('div');
            addButton.style.marginTop = '15px';
            addButton.style.textAlign = 'center';
            addButton.innerHTML = `<button class="btn btn-secondary add-item-btn" data-category-id="${category.id}"><i class="fas fa-plus"></i> 新增項目</button>`;
            itemList.appendChild(addButton);
            
            details.appendChild(summary);
            details.appendChild(itemList);
            container.appendChild(details);
        });
        
        // 只在最後一個類別後面添加新增類別按鈕
        if (this.categories.length > 0) {
            const addCategorySection = document.createElement('div');
            addCategorySection.className = 'text-center mt-30 mb-40';
            addCategorySection.style.textAlign = 'center';
            addCategorySection.style.marginTop = '30px';
            addCategorySection.style.marginBottom = '40px';
            addCategorySection.innerHTML = `
                <div class="category-button-wrapper">
                    <button class="btn btn-primary" id="addCategoryBottomBtn" style="margin: 0 auto; display: block; width: fit-content; min-width: 200px;">
                        <i class="fas fa-plus-circle"></i> 新增類別
                    </button>
                </div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 8px;">
                    點擊此處新增新的類別項目
                </div>
            `;
            container.appendChild(addCategorySection);
        }
        
        // 重新綁定所有事件
        this.bindDynamicEvents();
        this.bindDragEvents();
        this.bindImageUploadEvents();
    }


    // 格式化貨幣（無條件進位，不顯示小數點）
    formatCurrency(amount) {
        return Math.ceil(amount).toLocaleString();
    }

    bindDynamicEvents() {
        // 綁定新增項目按鈕事件
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.openAddItemModal(categoryId);
            });
        });

        // 綁定編輯項目按鈕事件
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                this.editItem(categoryId, itemId);
            });
        });
        
        // 綁定刪除類別按鈕事件
        document.querySelectorAll('.cat-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                this.showConfirmDialog('確定要刪除此類別及其中所有項目嗎？此操作無法復原。', () => {
                    this.deleteCategory(categoryId);
                });
            });
        });
        
        // 綁定刪除項目按鈕事件
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const categoryId = parseInt(e.currentTarget.dataset.categoryId);
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                this.showConfirmDialog('確定要刪除此項目嗎？此操作無法復原。', () => {
                    this.deleteItem(categoryId, itemId);
                });
            });
        });
        
        // 綁定底部新增類別按鈕事件
        const addCategoryBottomBtn = document.getElementById('addCategoryBottomBtn');
        if (addCategoryBottomBtn) {
            addCategoryBottomBtn.addEventListener('click', () => this.openCategoryModal());
        }
        
        // 綁定空狀態新增類別按鈕事件
        const addCategoryEmptyBtn = document.getElementById('addCategoryEmptyBtn');
        if (addCategoryEmptyBtn) {
            addCategoryEmptyBtn.addEventListener('click', () => this.openCategoryModal());
        }
    }


    bindDragEvents() {
        const container = document.getElementById('categoriesContainer');
        
        // 為容器添加拖動事件
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('category-details')) {
                this.draggedElement = e.target;
                this.draggedType = 'category';
                e.target.classList.add('dragging');
                setTimeout(() => {
                    e.dataTransfer.effectAllowed = 'move';
                }, 0);
            } else if (e.target.classList.contains('detail-item')) {
                this.draggedElement = e.target;
                this.draggedType = 'item';
                e.target.classList.add('dragging');
                setTimeout(() => {
                    e.dataTransfer.effectAllowed = 'move';
                }, 0);
            }
        });
        
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('category-details') || e.target.classList.contains('detail-item')) {
                e.target.classList.remove('dragging');
                // 移除所有佔位符
                document.querySelectorAll('.drag-placeholder').forEach(el => el.remove());
            }
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const target = e.target.closest('.category-details, .detail-item, .item-list');
            if (!target) return;
            
            // 創建佔位符
            let placeholder = document.querySelector('.drag-placeholder');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'drag-placeholder';
            }
            
            if (this.draggedType === 'category') {
                // 類別拖動
                if (target.classList.contains('category-details') && target !== this.draggedElement) {
                    const rect = target.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    if (next) {
                        target.parentNode.insertBefore(placeholder, target.nextSibling);
                    } else {
                        target.parentNode.insertBefore(placeholder, target);
                    }
                } else if (target.id === 'categoriesContainer') {
                    target.appendChild(placeholder);
                }
            } else if (this.draggedType === 'item') {
                // 項目拖動
                const itemList = e.target.closest('.item-list');
                if (itemList) {
                    const item = e.target.closest('.detail-item');
                    if (item && item !== this.draggedElement) {
                        const rect = item.getBoundingClientRect();
                        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                        if (next) {
                            itemList.insertBefore(placeholder, item.nextSibling);
                        } else {
                            itemList.insertBefore(placeholder, item);
                        }
                    } else {
                        itemList.appendChild(placeholder);
                    }
                }
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const placeholder = document.querySelector('.drag-placeholder');
            if (!placeholder) return;
            
            if (this.draggedType === 'category') {
                // 處理類別拖動
                this.handleCategoryDrop(placeholder);
            } else if (this.draggedType === 'item') {
                // 處理項目拖動
                this.handleItemDrop(placeholder);
            }
            
            // 移除佔位符
            placeholder.remove();
            this.draggedElement = null;
            this.draggedType = null;
        });
    }

    handleCategoryDrop(placeholder) {
        const draggedCategoryId = parseInt(this.draggedElement.getAttribute('data-category-id'));
        const categoriesContainer = document.getElementById('categoriesContainer');
        
        // 將拖動的元素插入到佔位符位置
        if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(this.draggedElement, placeholder);
        }
        
        // 更新類別順序
        const categoryElements = categoriesContainer.querySelectorAll('.category-details');
        const newOrder = [];
        
        categoryElements.forEach(element => {
            const categoryId = parseInt(element.getAttribute('data-category-id'));
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
                newOrder.push(category);
            }
        });
        
        this.categories = newOrder;
        this.saveToStorage();
        this.renderCategories();
        this.updateTotals();
        this.updateChart();
    }

    handleItemDrop(placeholder) {
        const draggedItemId = parseInt(this.draggedElement.getAttribute('data-item-id'));
        const draggedCategoryId = parseInt(this.draggedElement.getAttribute('data-category-id'));
        
        // 找到目標類別
        let targetCategoryElement = placeholder.closest('.category-details');
        if (!targetCategoryElement) {
            targetCategoryElement = placeholder.parentNode.closest('.category-details');
        }
        
        if (targetCategoryElement) {
            const targetCategoryId = parseInt(targetCategoryElement.getAttribute('data-category-id'));
            
            // 如果在同一個類別內拖動
            if (draggedCategoryId === targetCategoryId) {
                // 更新項目順序
                const itemList = targetCategoryElement.querySelector('.item-list');
                if (itemList) {
                    // 將拖動的元素插入到佔位符位置
                    if (placeholder.parentNode) {
                        placeholder.parentNode.insertBefore(this.draggedElement, placeholder);
                    }
                    
                    // 更新數據順序
                    const itemElements = itemList.querySelectorAll('.detail-item');
                    const category = this.categories.find(cat => cat.id === targetCategoryId);
                    if (category) {
                        const newOrder = [];
                        itemElements.forEach(element => {
                            const itemId = parseInt(element.getAttribute('data-item-id'));
                            const item = category.items.find(i => i.id === itemId);
                            if (item) {
                                newOrder.push(item);
                            }
                        });
                        category.items = newOrder;
                    }
                }
            } else {
                // 跨類別拖動
                const sourceCategory = this.categories.find(cat => cat.id === draggedCategoryId);
                const targetCategory = this.categories.find(cat => cat.id === targetCategoryId);
                
                if (sourceCategory && targetCategory) {
                    // 找到被拖動的項目
                    const draggedItem = sourceCategory.items.find(item => item.id === draggedItemId);
                    if (draggedItem) {
                        // 從源類別中移除
                        sourceCategory.items = sourceCategory.items.filter(item => item.id !== draggedItemId);
                        
                        // 添加到目標類別
                        targetCategory.items.push(draggedItem);
                    }
                }
            }
            
            this.saveToStorage();
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    showConfirmDialog(message, onConfirm) {
        if (confirm(message)) {
            onConfirm();
        }
    }

    calculateCategoryTotal(category) {
        return Math.ceil(category.items.reduce((sum, item) => sum + (item.quantity * item.price), 0));
    }
    
updateTotals() {
    const subtotal = Math.ceil(this.categories.reduce((sum, category) => sum + this.calculateCategoryTotal(category), 0));
    const tax = Math.ceil(subtotal * (this.taxSettings.rate / 100));
    let total = 0;
    let totalLabel = '';
    
    if (this.taxSettings.type === 'included') {
        total = Math.ceil(subtotal + tax);  // 含稅模式下總額應包含稅額
        totalLabel = '總報價金額 (含稅)';
    } else {
        total = Math.ceil(subtotal);
        totalLabel = '總報價金額 (未稅)';
    }
    
    // 總計區塊永遠顯示原始計算金額，不受到議價影響
    document.querySelector('.total-final span:first-child').textContent = totalLabel;
    
    // 更新浮動操作按鈕顯示 - 這裡會根據議價金額改變
    const fabBarDiv = document.querySelector('.fab-bar > div:first-child');
    if (fabBarDiv) {
        let displayTotal = total;
        let finalDisplayText = this.taxSettings.type === 'included' ? '總額(含稅)' : '總額(未稅)';
        
        // 如果有議價價格，使用最後一個議價價格作為顯示金額
        if (this.negotiatedPrices.length > 0) {
            const lastNegotiatedPrice = this.negotiatedPrices[this.negotiatedPrices.length - 1].amount;
            displayTotal = Math.ceil(lastNegotiatedPrice);
            finalDisplayText = '議價後金額';
        }
        
        fabBarDiv.innerHTML = `
            ${finalDisplayText}<br>
            <div id="totalDisplay">$${this.formatCurrency(displayTotal)}</div>
        `;
    }
    
    document.getElementById('subtotal').textContent = '$' + this.formatCurrency(subtotal);
    document.getElementById('taxAmount').textContent = '$' + this.formatCurrency(tax);
    document.getElementById('totalAmount').textContent = '$' + this.formatCurrency(total);
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
        
        // 確保ID唯一性
        const newId = this.generateUniqueId();
        
        const newCategory = {
            id: newId,
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

    editItem(categoryId, itemId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
                // 填充編輯表單
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemQuantity').value = item.quantity;
                document.getElementById('itemUnit').value = item.unit;
                document.getElementById('itemPrice').value = item.price;
                document.getElementById('itemRemark').value = item.remark || '';
                
                // 設置當前編輯的項目ID
                this.editingItemId = itemId;
                this.currentCategoryId = categoryId;
                
                // 打開編輯彈窗
                document.getElementById('itemModal').classList.remove('hidden');
                
                // 更改保存按鈕文字
                document.getElementById('saveItemBtn').textContent = '更新';
            }
        }
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
            if (this.editingItemId) {
                // 更新現有項目
                const itemIndex = category.items.findIndex(item => item.id === this.editingItemId);
                if (itemIndex !== -1) {
                    category.items[itemIndex] = {
                        id: this.editingItemId,
                        name: itemName,
                        quantity: itemQuantity,
                        unit: itemUnit,
                        price: itemPrice,
                        remark: itemRemark,
                        image: category.items[itemIndex].image // 保留原有圖片
                    };
                }
                document.getElementById('saveItemBtn').textContent = '新增';
                this.editingItemId = null;
            } else {
                // 新增新項目
                const newItem = {
                    id: Date.now(),
                    name: itemName,
                    quantity: itemQuantity,
                    unit: itemUnit,
                    price: itemPrice,
                    remark: itemRemark,
                    image: null // 初始化圖片為 null
                };
                category.items.push(newItem);
            }
            
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
            this.closeItemModal();
        }
    }

    resetItemForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('itemQuantity').value = '1';
        document.getElementById('itemUnit').value = '式';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemRemark').value = '';
        this.currentCategoryId = null;
        this.editingItemId = null;
        document.getElementById('saveItemBtn').textContent = '新增';
    }

    deleteItem(categoryId, itemId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            category.items = category.items.filter(item => item.id !== itemId);
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        }
    }

    deleteCategory(categoryId) {
        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        this.renderCategories();
        this.updateTotals();
        this.updateChart();
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    updateChart() {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        const chartLegend = document.getElementById('chartLegend');
        
        // 計算總金額（無條件進位）
        const subtotal = Math.ceil(this.categories.reduce((sum, category) => sum + this.calculateCategoryTotal(category), 0));
        
        if (subtotal === 0) {
            // 如果沒有數據，顯示提示
            chartLegend.innerHTML = '<div class="legend-item"><span class="legend-color" style="background:#ccc"></span>無數據</div>';
            return;
        }
        
        // 計算每個類別的百分比
        const categoryData = this.categories.map(category => {
            const total = Math.ceil(this.calculateCategoryTotal(category));
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
                                const value = Math.ceil(context.raw || 0);
                                const percentage = ((value / subtotal) * 100).toFixed(1);
                                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                // 添加顏色過渡效果
                animation: {
                    animateRotate: true,
                    animateScale: false
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
        // 擴充至至少20種顏色
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
            '#6A4C93', '#F15BB5', '#00BBF9', '#00F5D4',
            '#FEE440', '#9B5DE5', '#F15BB5', '#00BBF9',
            '#00F5D4', '#FEE440', '#9B5DE5', '#F15BB5',
            '#00BBF0', '#00F5D0', '#FEE444', '#9B5DE0'
            ];
            // 使用 ID 的哈希值而不是簡單的模運算來獲得更好的分佈
        let hash = 0;
        const str = id.toString();
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
        }
        // 確保哈希值為正數
        hash = Math.abs(hash);
        
        return colors[hash % colors.length];
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
        // 創建檔案選擇元件
        let fileInput = document.getElementById('excelFileInput');
        if (!fileInput) {
            // 如果不存在，動態創建
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'excelFileInput';
            fileInput.accept = '.xlsx, .xls';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
        }
        
        // 設置檔案選擇事件處理
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                this.processExcelFile(file);
            }
            // 清空選擇以允許重複選擇同一檔案
            event.target.value = '';
        };
        
        // 觸發檔案選擇
        fileInput.click();
    }

    processExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 獲取第一個工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 將工作表轉換為 JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 解析數據
                this.parseExcelData(jsonData);
                
            } catch (error) {
                console.error('讀取 Excel 檔案失敗:', error);
                alert('讀取檔案失敗，請確認檔案格式正確\n錯誤: ' + error.message);
            }
        };
        
        reader.onerror = (error) => {
            console.error('檔案讀取錯誤:', error);
            alert('檔案讀取失敗\n錯誤: ' + error.message);
        };
        
        reader.readAsArrayBuffer(file);
    }

    parseExcelData(data) {
        try {
            // 顯示確認對話框
            if (!confirm('確定要匯入此 Excel 檔案嗎？這將覆蓋目前的報價單內容。')) {
                return;
            }
            
            // 重置當前報價單
            this.categories = [];
            
            let dataIndex = -1;
            
            // 尋找數據開始行（包含類別標題的行）
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row && row[0] === '類別' && row[1] === '項目名稱') {
                    dataIndex = i + 1; // 數據從下一行開始
                    break;
                }
            }
            
            if (dataIndex === -1) {
                alert('無法識別的 Excel 格式，請使用標準格式的檔案');
                return;
            }
            
            // 解析項目數據
            const categoryMap = {}; // 用於追蹤類別
            
            for (let i = dataIndex; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                // 如果是總計資訊行則停止解析
                if (row[0] === '總計資訊' || row[0] === '小計(未稅)') break;
                
                // 檢查是否是有效的數據行（必須有類別和項目名稱）
                if (row[0] && row[1] && row[0] !== '類別') {
                    const categoryName = row[0].toString().trim();
                    const itemName = row[1].toString().trim();
                    const quantity = parseFloat(row[2]) || 1;
                    const unit = row[3] ? row[3].toString().trim() : '式';
                    const price = parseFloat(row[4]) || 0;
                    const remark = row[6] ? row[6].toString().trim() : '';
                    
                    // 檢查類別是否存在
                    let category = categoryMap[categoryName];
                    if (!category) {
                        // 創建新類別
                        category = {
                            id: Date.now() + Object.keys(categoryMap).length,
                            name: categoryName,
                            items: []
                        };
                        categoryMap[categoryName] = category;
                        this.categories.push(category);
                    }
                    
                    // 添加項目
                    const newItem = {
                        id: this.generateUniqueId(), 
                        name: itemName,
                        quantity: quantity,
                        unit: unit,
                        price: price,
                        remark: remark
                    };
                    
                    category.items.push(newItem);
                }
            }
            
            // 重新渲染界面
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
            
            alert('Excel 匯入成功！');
            
        } catch (error) {
            console.error('解析 Excel 數據失敗:', error);
            alert('解析數據失敗，請確認檔案格式正確\n錯誤: ' + error.message);
        }
    }

    exportToExcel() {
        try {
            // 創建工作簿
            const wb = XLSX.utils.book_new();
            
            // 準備數據
            const exportData = [];
            let rowIndex = 1;
            
            // 添加報價單基本信息
            exportData.push(['企業報價單系統 - 匯出數據']);
            exportData.push([]);
            exportData.push(['基本資訊']);
            exportData.push(['公司名稱', document.getElementById('companyName').value || '']);
            exportData.push(['承辦人員', document.getElementById('staffName').value || '']);
            exportData.push(['聯絡電話', document.getElementById('contactPhone').value || '']);
            exportData.push(['報價日期', document.getElementById('quoteDate').value || '']);
            exportData.push(['客戶姓名', document.getElementById('clientName').value || '']);
            exportData.push(['客戶電話', document.getElementById('clientPhone').value || '']);
            exportData.push(['客戶地址', document.getElementById('projectAddress').value || '']);
            exportData.push(['稅額計算', document.getElementById('taxType').options[document.getElementById('taxType').selectedIndex].text || '']);
            exportData.push(['稅率(%)', document.getElementById('taxRate').value || '']);
            exportData.push([]);
            
            // 添加表頭
            exportData.push(['類別', '項目名稱', '數量', '單位', '單價', '小計', '備註']);
            
            // 添加項目數據
            this.categories.forEach(category => {
                category.items.forEach(item => {
                    const subtotal = Math.ceil(item.quantity * item.price);
                    exportData.push([
                        category.name,
                        item.name,
                        item.quantity,
                        item.unit,
                        item.price,
                        subtotal,
                        item.remark || ''
                    ]);
                });
            });
            
            // 添加總計信息
            exportData.push([]);
            exportData.push(['總計資訊']);
            exportData.push(['小計(未稅)', this.formatCurrency(parseFloat(document.getElementById('subtotal').textContent.replace(/[^0-9]/g, '') || 0))]);
            exportData.push(['稅額', this.formatCurrency(parseFloat(document.getElementById('taxAmount').textContent.replace(/[^0-9]/g, '') || 0))]);
            exportData.push(['總報價金額', this.formatCurrency(parseFloat(document.getElementById('totalAmount').textContent.replace(/[^0-9]/g, '') || 0))]);
            
            // 創建工作表
            const ws = XLSX.utils.aoa_to_sheet(exportData);
            
            // 設置列寬
            ws['!cols'] = [
                { wch: 15 }, // 類別
                { wch: 25 }, // 項目名稱
                { wch: 10 }, // 數量
                { wch: 10 }, // 單位
                { wch: 15 }, // 單價
                { wch: 15 }, // 小計
                { wch: 30 }  // 備註
            ];
            
            // 添加樣式
            for (let R = 0; R < exportData.length; ++R) {
                for (let C = 0; C < exportData[R].length; ++C) {
                    const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                    if (ws[cell_ref]) {
                        // 設置表頭樣式
                        if (R === 0 || R === 13 || R === 2 || R === 14) { // 標題行
                            ws[cell_ref].s = {
                                font: { bold: true, sz: 14 },
                                fill: { fgColor: { rgb: "CCCCCC" } }
                            };
                        }
                        // 設置總計行樣式
                        if (R >= exportData.length - 4) {
                            ws[cell_ref].s = {
                                font: { bold: true }
                            };
                        }
                    }
                }
            }
            
            // 將工作表添加到工作簿
            XLSX.utils.book_append_sheet(wb, ws, "報價單");
            
            // 生成檔名
            const companyName = document.getElementById('companyName').value || '報價單';
            const date = new Date().toISOString().split('T')[0];
            const filename = `${companyName}_${date}_報價單.xlsx`;
            
            // 下載文件
            XLSX.writeFile(wb, filename);
            
            console.log('Excel 匯出成功');
        } catch (error) {
            console.error('Excel 匯出失敗:', error);
            alert('匯出失敗，請稍後再試\n錯誤: ' + error.message);
        }
    }

    // 添加保存注意事項方法
    saveNotes() {
        const notesContent = document.getElementById('notesContent').value;
        localStorage.setItem('quotationNotes', notesContent);
        // 顯示保存成功的視覺反饋
        const saveBtn = document.getElementById('saveNotesBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '已保存！';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    }
            /**
         * 保存頁首設定到 localStorage
         */
        saveHeaderSettings() {
            const mainTitle = document.getElementById('mainTitle');
            const subTitle = document.getElementById('subTitle');
            
            if (mainTitle && subTitle) {
                const headerSettings = {
                    mainTitle: mainTitle.value,
                    subTitle: subTitle.value
                };
                localStorage.setItem('quotationHeaderSettings', JSON.stringify(headerSettings));
            }
        }

        /**
         * 從 localStorage 載入頁首設定
         */
        loadHeaderSettings() {
            const savedSettings = localStorage.getItem('quotationHeaderSettings');
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    const mainTitle = document.getElementById('mainTitle');
                    const subTitle = document.getElementById('subTitle');
                    
                    if (mainTitle && settings.mainTitle) {
                        mainTitle.value = settings.mainTitle;
                    }
                    
                    if (subTitle && settings.subTitle) {
                        subTitle.value = settings.subTitle;
                    }
                } catch (e) {
                    console.error('載入頁首設定失敗:', e);
                }
            }
        }

    // 修改後的 saveQuote 方法（實現暫存功能）
    saveQuote() {
        // 保存當前報價單狀態到 localStorage
        this.saveToStorage();
        
        // 顯示保存成功的提示
        const notification = document.createElement('div');
        notification.textContent = '報價單已暫存成功！';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 2000;
            font-weight: bold;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒後自動消失
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    resetQuote() {
        this.showConfirmDialog('確定要清空整個報價單嗎？此操作無法復原。', () => {
            this.categories = [];
            this.renderCategories();
            this.updateTotals();
            this.updateChart();
        });
    }

    exportHTML() {
        alert('輸出HTML功能需配合後端實作，此處僅展示UI');
    }

    // 新增歷史記錄相關方法
    loadHistoryRecords() {
        const companyNames = localStorage.getItem('historyCompanyNames');
        const staffNames = localStorage.getItem('historyStaffNames');
        const contactPhones = localStorage.getItem('historyContactPhones');
        
        if (companyNames) {
            this.historyRecords.companyNames = JSON.parse(companyNames);
        }
        if (staffNames) {
            this.historyRecords.staffNames = JSON.parse(staffNames);
        }
        if (contactPhones) {
            this.historyRecords.contactPhones = JSON.parse(contactPhones);
        }
    }

    saveHistoryRecord(fieldName, value) {
        if (!value.trim()) return;
        
        const records = this.historyRecords[fieldName];
        // 檢查是否已存在
        if (!records.includes(value)) {
            records.unshift(value); // 添加到開頭
            // 限制歷史記錄數量為20條
            if (records.length > 20) {
                records.pop();
            }
            // 保存到 localStorage
            localStorage.setItem(`history${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`, JSON.stringify(records));
        }
    }

    // 新增自動完成功能
    setupAutocomplete() {
        const companyNameInput = document.getElementById('selectionCompanyName');
        const staffNameInput = document.getElementById('selectionStaffName');
        const contactPhoneInput = document.getElementById('selectionContactPhone');
        
        this.createAutocomplete(companyNameInput, 'companyNames');
        this.createAutocomplete(staffNameInput, 'staffNames');
        this.createAutocomplete(contactPhoneInput, 'contactPhones');
    }
            /**
         * 隱藏所有自動完成下拉選單
         */
        hideAllAutocompleteDropdowns() {
            document.querySelectorAll('.autocomplete-dropdown').forEach(el => {
                if (el.parentNode) {
                    // 添加淡出效果
                    el.style.transition = 'opacity 0.2s ease';
                    el.style.opacity = '0';
                    
                    // 延遲移除元素以實現淡出效果
                    setTimeout(() => {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    }, 200);
                }
            });
        }

    showSuggestions(input, fieldName) {
    // 移除現有的下拉列表
    const existingDropdown = input.parentNode.querySelector('.autocomplete-dropdown');
    if (existingDropdown) {
        existingDropdown.parentNode.removeChild(existingDropdown);
    }
    
    const value = input.value.toLowerCase();
    const suggestions = this.historyRecords[fieldName].filter(item => 
        item.toLowerCase().includes(value)
    ).slice(0, 5); // 最多顯示5個建議
    
    // 如果沒有輸入內容或沒有匹配的建議，不顯示下拉選單
    if (!value || suggestions.length === 0) {
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 1000;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
    `;
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.textContent = suggestion;
        item.style.cssText = `
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;
        
        item.addEventListener('click', () => {
            input.value = suggestion;
            this.hideAllAutocompleteDropdowns();
            input.focus();
        });
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f5f5f5';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'white';
        });
        
        dropdown.appendChild(item);
    });
    
    // 插入到輸入框後面
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(dropdown);
}

// 修改 saveToStorage 方法以支持更多數據
saveToStorage() {
    // 儲存到localStorage
    const data = {
        categories: this.categories,
        taxSettings: this.taxSettings,
        customFields: this.customFields,
        negotiatedPrices: this.negotiatedPrices,
        // 添加表單數據
        formData: {
            companyName: document.getElementById('companyName').value,
            staffName: document.getElementById('staffName').value,
            contactPhone: document.getElementById('contactPhone').value,
            quoteDate: document.getElementById('quoteDate').value,
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            projectAddress: document.getElementById('projectAddress').value,
            taxType: document.getElementById('taxType').value,
            taxRate: document.getElementById('taxRate').value,
            sectionTitle: document.getElementById('sectionTitle').value,
            notesContent: document.getElementById('notesContent').value
        }
    };
    localStorage.setItem('quotationData', JSON.stringify(data));
}

    // 修改 loadFromStorage 方法以恢復表單數據
    loadFromStorage() {
        // 從localStorage載入資料（如果有的話）
        const savedData = localStorage.getItem('quotationData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.categories = data.categories || [];
                this.categories.forEach(category => {
                if (category.items) {
                    category.items.forEach(item => {
                        if (item.image === undefined) {
                            item.image = null;
                        }
                    });
                }
                 });
                this.taxSettings = data.taxSettings || this.taxSettings;
                
                // 恢復表單數據
                if (data.formData) {
                    const form = data.formData;
                    if (form.companyName) document.getElementById('companyName').value = form.companyName;
                    if (form.staffName) document.getElementById('staffName').value = form.staffName;
                    if (form.contactPhone) document.getElementById('contactPhone').value = form.contactPhone;
                    if (form.quoteDate) document.getElementById('quoteDate').value = form.quoteDate;
                    if (form.clientName) document.getElementById('clientName').value = form.clientName;
                    if (form.clientPhone) document.getElementById('clientPhone').value = form.clientPhone;
                    if (form.projectAddress) document.getElementById('projectAddress').value = form.projectAddress;
                    if (form.taxType) document.getElementById('taxType').value = form.taxType;
                    if (form.taxRate) document.getElementById('taxRate').value = form.taxRate;
                    if (form.sectionTitle) document.getElementById('sectionTitle').value = form.sectionTitle;
                    if (form.notesContent) document.getElementById('notesContent').value = form.notesContent;
                }
                
                this.renderCategories();
                this.updateTotals();
                this.updateChart();
                this.renderCustomFields();
                this.negotiatedPrices = data.negotiatedPrices || [];

            } catch (e) {
                console.error('載入資料失敗:', e);
            }
        }
        
        // 載入注意事項
        const savedNotes = localStorage.getItem('quotationNotes');
        if (savedNotes) {
            const notesTextarea = document.getElementById('notesContent');
            if (notesTextarea) {
                notesTextarea.value = savedNotes;
            }
        }
        
        // 載入歷史記錄
        this.loadHistoryRecords();
        // 載入頁首設定
         this.loadHeaderSettings();
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.quotationSystem = new QuotationSystem();
});
