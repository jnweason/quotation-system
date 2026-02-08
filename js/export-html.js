// export-html.js
class ExportHTML {
    constructor(quotationSystem) {
        this.quotationSystem = quotationSystem;
    }

        /**
     * 獲取當前表單數據
     */
    getCurrentFormData() {
        return {
            companyName: document.getElementById('companyName').value || '公司名稱',
            staffName: document.getElementById('staffName').value || '承辦人員',
            contactPhone: document.getElementById('contactPhone').value || '聯絡電話',
            quoteDate: document.getElementById('quoteDate').value || new Date().toISOString().split('T')[0],
            clientName: document.getElementById('clientName').value || '',
            clientPhone: document.getElementById('clientPhone').value || '',
            projectAddress: document.getElementById('projectAddress').value || '',
            taxType: document.getElementById('taxType').value,
            taxRate: document.getElementById('taxRate').value,
            sectionTitle: document.getElementById('sectionTitle').value || '報價項目明細',
            notesContent: document.getElementById('notesContent').value || '',
            customFields: this.quotationSystem.customFields || [] // 添加自定義欄位數據
        };
    }

    /**
     * 匯出 HTML 功能
     */
        exportHTML() {
            // 取得當前資料
            const formData = this.getCurrentFormData();
            const companyName = formData.companyName;
            const staffName = formData.staffName;
            const contactPhone = formData.contactPhone;
            const quoteDate = formData.quoteDate;
            const clientName = formData.clientName;
            const clientPhone = formData.clientPhone;
            const projectAddress = formData.projectAddress;
            const taxType = formData.taxType;
            const taxRate = formData.taxRate;
            const sectionTitle = formData.sectionTitle;
            const notesContent = formData.notesContent;
                
        
        // 計算總金額
        const subtotal = Math.ceil(this.quotationSystem.categories.reduce((sum, category) => sum + this.quotationSystem.calculateCategoryTotal(category), 0));
        const tax = Math.ceil(subtotal * (taxRate / 100));
        let total = 0;
        if (taxType === 'included') {
            total = Math.ceil(subtotal + tax);
        } else {
            total = Math.ceil(subtotal);
        }

        // 檢查是否有議價價格，如果有則使用最後一個議價價格
        let displayTotal = total;
        if (this.quotationSystem.negotiatedPrices && this.quotationSystem.negotiatedPrices.length > 0) {
            const lastNegotiatedPrice = this.quotationSystem.negotiatedPrices[this.quotationSystem.negotiatedPrices.length - 1].amount;
            displayTotal = Math.ceil(lastNegotiatedPrice);
        }

        // 檢查是否有議價價格來決定顯示的文字
        let totalLabel = '總報價金額';
        let finalDisplayText = taxType === 'included' ? '總額(含稅)' : '總額(未稅)';
        if (this.quotationSystem.negotiatedPrices && this.quotationSystem.negotiatedPrices.length > 0) {
            totalLabel = '議價後總金額';
            finalDisplayText = '議價後金額';
            total = displayTotal;
        }
        // 生成HTML內容
        const htmlContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>報價單 - ${companyName}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary: #2c3e50;
            --accent: #3498db;
            --light-bg: #f8f9fa;
            --text: #333;
            --gray: #666;
            --border: #e9ecef;
            --success: #27ae60;
            --danger: #e74c3c;
        }

        * { 
            box-sizing: border-box; 
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Microsoft JhengHei", Roboto, sans-serif;
            margin: 0; 
            padding: 0; 
            background-color: #f0f2f5; 
            color: var(--text); 
            line-height: 1.5; 
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }

        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 15px; 
        }

        .header {
            background: linear-gradient(135deg, var(--primary), #1a252f);
            color: white; 
            padding: 25px 20px; 
            text-align: center;
            border-bottom-left-radius: 20px; 
            border-bottom-right-radius: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .header h1 { 
            margin: 0; 
            font-size: 1.4rem; 
            letter-spacing: 1px; 
        }

        .sub-title { 
            font-size: 0.9rem; 
            opacity: 0.9; 
            margin-top: 5px; 
        }

        .card { 
            background: white; 
            border-radius: 12px; 
            padding: 20px; 
            margin-bottom: 15px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.03); 
        }

        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 12px; 
            font-size: 0.9rem; 
        }

        .info-item label { 
            display: block; 
            color: #95a5a6; 
            font-size: 0.75rem; 
            margin-bottom: 2px; 
        }

        .info-item span {
            display: block;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
            background: #f8f9fa;
        }

        .chart-section {
            text-align: center;
        }

        .chart-section h3 {
            margin: 0 0 15px 0;
            font-size: 1rem;
            color: #666;
        }

        .chart-container {
            position: relative;
            height: 200px;
            margin: 20px 0;
        }

        .chart-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
        }

        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        details {
            background: white; 
            border-radius: 10px; 
            margin-bottom: 12px;
            overflow: hidden; 
            transition: all 0.3s;
            border: 1px solid transparent;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }

        details[open] { 
            border-color: var(--accent); 
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1); 
        }

        summary {
            padding: 15px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            cursor: pointer; 
            list-style: none; 
            user-select: none;
            background: white; 
            position: relative; 
            z-index: 10;
        }

        summary::-webkit-details-marker { 
            display: none; 
        }

        .cat-header { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
        }

        .cat-icon { 
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            background: var(--light-bg); 
            color: var(--primary); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 14px; 
            font-weight: bold; 
            border: 1px solid #eee;
        }

        .cat-title { 
            font-weight: bold; 
            font-size: 1.05rem; 
        }

        .cat-total { 
            color: var(--accent); 
            font-weight: bold; 
            font-size: 1rem; 
        }

        .item-list { 
            background: #fafafa; 
            border-top: 1px solid #f1f1f1; 
            padding: 5px 15px 15px 15px; 
        }

        .detail-item {
            background: white;
            border: 1px solid #eee;
            border-radius: 8px;
            margin-top: 10px;
            padding: 12px;
        }

        .item-top { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 8px; 
        }

        .item-index { 
            background: #eee; 
            color: #555; 
            font-size: 0.7rem; 
            padding: 2px 6px; 
            border-radius: 4px; 
            margin-right: 8px; 
            display: inline-block;
        }

        .item-name { 
            font-weight: bold; 
            color: var(--primary); 
            font-size: 0.95rem; 
            flex: 1; 
        }

        .item-subtotal { 
            font-weight: bold; 
            color: var(--primary); 
            font-size: 1rem; 
            margin-left: 10px; 
        }

        .item-specs {
            display: flex; 
            gap: 15px; 
            font-size: 0.85rem; 
            color: #555; 
            border-bottom: 1px dashed #eee; 
            padding-bottom: 8px; 
            margin-bottom: 8px;
        }

        .spec-pill { 
            background: #f8f9fa; 
            padding: 2px 8px; 
            border-radius: 4px; 
            border: 1px solid #eee; 
        }

        .item-remark { 
            font-size: 0.85rem; 
            color: #666; 
            background: #fff8e1; 
            padding: 6px 10px; 
            border-radius: 4px; 
            line-height: 1.4; 
        }

        .remark-label { 
            color: #e67e22; 
            font-weight: bold; 
            font-size: 0.75rem; 
            margin-right: 4px; 
        }

        .item-image {
            max-width: 100px;
            max-height: 100px;
            border-radius: 4px;
            border: 1px solid #eee;
            object-fit: cover;
            margin-top: 10px;
        }

        .total-section { 
            background: white; 
            padding: 20px; 
            border-radius: 12px; 
            margin-top: 20px; 
        }

        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-size: 0.9rem; 
            color: #666; 
        }

        .total-final { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 15px; 
            padding-top: 15px; 
            border-top: 2px solid #eee; 
            font-size: 1.2rem; 
            font-weight: bold; 
            color: var(--primary); 
        }

        .signature-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .signature-canvas {
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
            height: 200px;
            cursor: crosshair;
            touch-action: none;
            background-color: white;
        }

        .signature-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .signature-btn {
            padding: 12px 20px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            min-height: 44px;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-secondary {
            background: var(--light-bg);
            color: var(--text);
            border: 1px solid #ddd;
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .signature-preview {
            margin-top: 20px;
            text-align: center;
        }

        .signature-preview img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .footer-notes {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .footer-notes h3 {
            margin-top: 0;
            color: var(--primary);
        }

        .notes-content {
            white-space: pre-wrap;
            color: #666;
            line-height: 1.6;
        }

        @media print {
            .signature-buttons {
                display: none;
            }
            
            body {
                background: white;
            }
            
            .card, .signature-section, .footer-notes {
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }

        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .item-specs {
                flex-direction: column;
                gap: 5px;
            }
            
            .total-final {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .chart-container {
                height: 150px;
            }
            
            .item-image {
                max-width: 80px;
                max-height: 80px;
            }
            
            .signature-canvas {
                height: 150px;
            }
            
            .signature-btn {
                flex: 1;
                justify-content: center;
            }
        }

        .signature-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .signature-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .signature-modal-content {
            background: white;
            border-radius: 12px;
            width: 95%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }

        .signature-modal.active .signature-modal-content {
            transform: translateY(0);
        }

        .signature-modal-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--primary);
            color: white;
        }

        .signature-modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }

        .signature-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .signature-modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .signature-modal-body {
            padding: 20px;
        }

        .signature-canvas-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
            background: white;
        }

        #signatureCanvasModal {
            width: 100%;
            height: 250px;
            cursor: crosshair;
            touch-action: none;
            display: block;
        }

        .signature-modal-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .signature-modal-btn {
            flex: 1;
            padding: 12px 15px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 16px;
            min-height: 44px;
        }

        .btn-modal-clear {
            background: var(--light-bg);
            color: var(--text);
            border: 1px solid #ddd;
        }

        .btn-modal-confirm {
            background: var(--success);
            color: white;
        }

        .signature-instructions {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }

        .signature-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            text-align: center;
        }

        .signature-btn-main {
            padding: 12px 25px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            font-size: 16px;
            min-height: 44px;
            background: var(--success);
            color: white;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .signature-btn-main:hover {
            background: #218838;
        }

        .signature-preview {
            margin-top: 20px;
            text-align: center;
            padding: 15px;
            border: 1px dashed #ddd;
            border-radius: 8px;
            background: #f8f9fa;
        }

        .signature-preview img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-top: 10px;
        }

        .signature-preview h4 {
            margin: 0 0 10px 0;
            color: var(--primary);
        }

        .signature-preview p {
            margin: 5px 0;
            color: #666;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .signature-modal-content {
                width: 98%;
                margin: 10px;
            }
            
            .signature-modal-buttons {
                flex-direction: column;
            }
            
            #signatureCanvasModal {
                height: 200px;
            }
        }

        @media print {
            .signature-btn-main, .signature-modal {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>企業報價單系統</h1>
        <div class="sub-title">跨行業適用 • 客戶預覽版本</div>
    </div>

    <div class="container">
        <div class="card">
            <div class="info-grid">
                <div class="info-item">
                    <label>公司名稱</label>
                    <span>${companyName}</span>
                </div>
                <div class="info-item">
                    <label>承辦人員</label>
                    <span>${staffName}</span>
                </div>
                <div class="info-item">
                    <label>聯絡電話</label>
                    <span>${contactPhone}</span>
                </div>
                <div class="info-item">
                    <label>報價日期</label>
                    <span>${quoteDate}</span>
                </div>
                
                <div class="info-item">
                    <label>客戶姓名</label>
                    <span>${clientName}</span>
                </div>
                <div class="info-item">
                    <label>客戶電話</label>
                    <span>${clientPhone}</span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                    <label>客戶地址</label>
                    <span>${projectAddress}</span>
                </div>
                
                <div class="info-item">
                    <label>稅額計算</label>
                    <span>${taxType === 'included' ? '含稅' : '未稅'}</span>
                </div>
                <div class="info-item">
                    <label>稅率 (%)</label>
                    <span>${taxRate}%</span>
                </div>
                <!-- 自定義欄位 -->
                ${formData.customFields.map((field, index) => `
                <div class="info-item">
                    <label>${field.label}</label>
                    <span>${field.value || ''}</span>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="card chart-section">
            <h3>預算佔比分析</h3>
            <div class="chart-container">
                <canvas id="budgetChart"></canvas>
            </div>
            <div class="chart-legend" id="chartLegend"></div>
        </div>

        <div class="form-group">
            <h2 style="text-align: center; color: var(--primary);">${sectionTitle}</h2>
        </div>
        
        <div id="categoriesContainer">
            ${this.quotationSystem.categories.map((category, categoryIndex) => `
            <details open>
                <summary>
                    <div class="cat-header">
                        <span class="cat-icon">${categoryIndex + 1}</span> 
                        <span class="cat-title">${category.name}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="cat-total">$${this.quotationSystem.formatCurrency(this.quotationSystem.calculateCategoryTotal(category))}</span>
                    </div>
                </summary>
                <div class="item-list">
                    ${category.items.map((item, itemIndex) => `
                    <div class="detail-item">
                        <div class="item-top">
                            <div class="item-name">
                                <span class="item-index">${itemIndex + 1}</span>${item.name}
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div class="item-subtotal">$${this.quotationSystem.formatCurrency(item.quantity * item.price)}</div>
                            </div>
                        </div>
                        <div class="item-specs">
                            <span class="spec-pill">數量: ${item.quantity} ${item.unit}</span>
                            <span class="spec-pill">單價: $${this.quotationSystem.formatCurrency(item.price)}</span>
                        </div>
                        ${item.remark ? `<div class="item-remark"><span class="remark-label">備註</span>${item.remark}</div>` : ''}
                        ${item.image ? `<div><img src="${item.image}" alt="項目圖片" class="item-image"></div>` : ''}
                    </div>
                    `).join('')}
                </div>
            </details>
            `).join('')}
        </div>

        <div class="total-section">
            <div class="total-row">
                <span>小計 (未稅)</span>
                <span>$${this.quotationSystem.formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
                <span>稅額 (${taxRate}%)</span>
                <span>$${this.quotationSystem.formatCurrency(tax)}</span>
            </div>
            <div class="total-final">
                <span>總報價金額</span>
                <span>$${this.quotationSystem.formatCurrency(displayTotal)}</span>
            </div>
        </div>

        <div class="footer-notes">
            <h3>注意事項：</h3>
            <div class="notes-content">${notesContent.replace(/\n/g, '<br>')}</div>
        </div>

       <div class="signature-section">
    <h3>客戶簽署區</h3>
    <p>請點擊下方按鈕進行電子簽名：</p>
    <button id="openSignatureModal" class="signature-btn-main">
        <i class="fas fa-signature"></i> 開始簽名
    </button>
    <button id="downloadPdfBtn" class="signature-btn-main" style="background: #9b59b6; margin-left: 10px;">
        <i class="fas fa-print"></i> 列印/下載
    </button>
    <div id="signaturePreview" class="signature-preview" style="display: none;">
        <h4>簽名已完成</h4>
        <p>簽名時間：<span id="signatureTime"></span></p>
        <img id="signatureImage" src="" alt="客戶簽名">
        <p style="margin-top: 10px; font-size: 0.8rem; color: #999;">如需重新簽名，請再次點擊「開始簽名」按鈕</p>
    </div>
    <div id="resetSignatureContainer" style="margin-top: 15px; display: none;">
    <button id="resetSignatureBtn" class="signature-btn-main" style="background: #f39c12;">
        <i class="fas fa-redo"></i> 重新簽名
    </button>
</div>
</div>
</div>

<!-- 簽名彈窗 -->
<div id="signatureModal" class="signature-modal">
    <div class="signature-modal-content">
        <div class="signature-modal-header">
            <h3>電子簽名</h3>
            <button class="signature-modal-close">&times;</button>
        </div>
        <div class="signature-modal-body">
            <p class="signature-instructions">請在下方區域簽署您的姓名</p>
            <div class="signature-canvas-container">
                <canvas id="signatureCanvasModal" width="400" height="250"></canvas>
            </div>
            <div class="signature-modal-buttons">
                <button id="clearSignatureModal" class="signature-modal-btn btn-modal-clear">
                    <i class="fas fa-eraser"></i> 清除
                </button>
                <button id="confirmSignatureModal" class="signature-modal-btn btn-modal-confirm">
                    <i class="fas fa-check"></i> 確認簽名
                </button>
            </div>
        </div>
    </div>
</div>
    </div>

    <script>
    // 圖表數據
    const chartData = ${JSON.stringify(this.quotationSystem.categories.map(category => ({
        name: category.name,
        total: this.quotationSystem.calculateCategoryTotal(category),
        color: this.quotationSystem.getCategoryColor(category.id)
    })))};
    
    // 繪製圖表
    function renderChart() {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        const chartLegend = document.getElementById('chartLegend');
        
        const total = chartData.reduce((sum, item) => sum + item.total, 0);
        
        if (total === 0) {
            chartLegend.innerHTML = '<div class="legend-item"><span class="legend-color" style="background:#ccc"></span>無數據</div>';
            return;
        }
        
        const labels = chartData.map(data => data.name);
        const data = chartData.map(data => data.total);
        const backgroundColors = chartData.map(data => data.color);
        
        new Chart(ctx, {
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
                                const percentage = ((value / total) * 100).toFixed(1);
                                return \`\${label}: $\${value.toLocaleString()} (\${percentage}%)\`;
                            }
                        }
                    }
                }
            }
        });
        
        chartLegend.innerHTML = '';
        chartData.forEach(data => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = \`
                <span class="legend-color" style="background:\${data.color}"></span>
                \${data.name} \${((data.total / total) * 100).toFixed(1)}%
            \`;
            chartLegend.appendChild(legendItem);
        });
    }
    
        // 電子簽名功能
        function initSignaturePad() {
            const modal = document.getElementById('signatureModal');
            const openBtn = document.getElementById('openSignatureModal');
            const closeBtn = document.querySelector('.signature-modal-close');
            const clearBtn = document.getElementById('clearSignatureModal');
            const confirmBtn = document.getElementById('confirmSignatureModal');
            const canvas = document.getElementById('signatureCanvasModal');
            
            // 檢查所有必要元素是否存在
            if (!modal || !openBtn || !closeBtn || !clearBtn || !confirmBtn || !canvas) {
                console.error('簽名板初始化失敗：缺少必要的DOM元素');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            // 設置畫布樣式
            canvas.style.touchAction = 'none';
            canvas.style.backgroundColor = 'white';
            
            // 設置繪圖屬性
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;
            
            // 獲取畫布坐標的函數
            function getCanvasCoordinates(e) {
                    const rect = canvas.getBoundingClientRect();
                    let x, y;

                    if (e.type.includes('touch')) {
                        const touch = e.touches[0] || e.changedTouches[0];
                        x = touch.clientX - rect.left;
                        y = touch.clientY - rect.top;
                    } else {
                        x = e.clientX - rect.left;
                        y = e.clientY - rect.top;
                    }
                    return { x, y };
                }
            
            // 重置簽名按鈕事件
            const resetBtn = document.getElementById('resetSignatureBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    // 清除畫布
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // 顯示簽名按鈕
                    document.getElementById('openSignatureModal').style.display = 'inline-flex';
                    // 隱藏預覽和重置按鈕
                    document.getElementById('signaturePreview').style.display = 'none';
                    document.getElementById('resetSignatureContainer').style.display = 'none';
                });
            }
            
            // 開始繪製
            function startDrawing(e) {
            e.preventDefault();
            isDrawing = true;
            const pos = getCanvasCoordinates(e);
            lastX = pos.x;
            lastY = pos.y;
        }
        
        // 繪製過程
        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            
            const pos = getCanvasCoordinates(e);
            const currentX = pos.x;
            const currentY = pos.y;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        }
        
        // 結束繪製
        function stopDrawing(e) {
            if (!isDrawing) return;
            e.preventDefault();
            isDrawing = false;
        }
        
        // 滑鼠事件
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // 觸控事件
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startDrawing(e);
        });
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            draw(e);
        });
        canvas.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopDrawing(e);
        });
        canvas.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            stopDrawing(e);
        });
        
        // 打開彈窗
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.add('active');
        });
        
        // 關閉彈窗
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
        
        // 清除簽名
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        
        // 確認簽名
         confirmBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const dataUrl = canvas.toDataURL('image/png');
        document.getElementById('signatureImage').src = dataUrl;
        document.getElementById('signatureTime').textContent = new Date().toLocaleString('zh-TW');
        document.getElementById('signaturePreview').style.display = 'block';
        // 隱藏簽名按鈕
        document.getElementById('openSignatureModal').style.display = 'none';
        modal.classList.remove('active');
        // 顯示重置按鈕容器
        document.getElementById('resetSignatureContainer').style.display = 'block';
         });
        });
        
        // 點擊背景關閉彈窗
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    
// 頁面加載完成後初始化
function initializePage() {
    renderChart();
    
    // 確保簽名功能初始化
    setTimeout(initSignatureFunctionality, 500);
    
    // 防止頁面滾動時畫布被觸發
    document.addEventListener('touchmove', function(e) {
        if (e.target && e.target.closest && e.target.closest('#signatureCanvasModal')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// 初始化簽名功能
function initSignatureFunctionality() {
    // 綁定開始簽名按鈕
    const openSignatureBtn = document.getElementById('openSignatureModal');
    if (openSignatureBtn) {
        openSignatureBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('signatureModal');
            modal.classList.add('active');
        });
    }
    
    // 綁定關閉按鈕
    const closeBtn = document.querySelector('.signature-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const modal = document.getElementById('signatureModal');
            modal.classList.remove('active');
        });
    }
    
    // 綁定清除按鈕
    const clearBtn = document.getElementById('clearSignatureModal');
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const canvas = document.getElementById('signatureCanvasModal');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }
    
    // 綁定確認簽名按鈕
    const confirmBtn = document.getElementById('confirmSignatureModal');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const canvas = document.getElementById('signatureCanvasModal');
            const dataUrl = canvas.toDataURL('image/png');
            
            document.getElementById('signatureImage').src = dataUrl;
            document.getElementById('signatureTime').textContent = new Date().toLocaleString('zh-TW');
            document.getElementById('signaturePreview').style.display = 'block';
            document.getElementById('openSignatureModal').style.display = 'none';
            document.getElementById('signatureModal').classList.remove('active');
            document.getElementById('resetSignatureContainer').style.display = 'block';
        });
    }
    
    // 綁定重置簽名按鈕
    const resetBtn = document.getElementById('resetSignatureBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const canvas = document.getElementById('signatureCanvasModal');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById('signaturePreview').style.display = 'none';
            document.getElementById('openSignatureModal').style.display = 'inline-flex';
            document.getElementById('resetSignatureContainer').style.display = 'none';
        });
    }

        // 綁定下載按鈕
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 展開所有 details
            const detailsElements = document.querySelectorAll('details');
            detailsElements.forEach(detail => {
                detail.open = true;
            });
            
            // 如果有簽名，顯示簽名預覽
            const signaturePreview = document.getElementById('signaturePreview');
            if (signaturePreview) {
                signaturePreview.style.display = 'block';
            }
            
            // 使用瀏覽器的列印功能
            window.print();
        });
    }
    
    // 設置簽名畫布
    setupSignatureCanvas();
}

// 設置簽名畫布
function setupSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvasModal');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 250;
    canvas.style.touchAction = 'none';
    canvas.style.backgroundColor = 'white';
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // 獲取畫布坐標
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        if (e.type.includes('touch')) {
            const touch = e.touches[0] || e.changedTouches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        return { x, y };
    }
    
    // 開始繪製
    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        const pos = getCanvasCoordinates(e);
        lastX = pos.x;
        lastY = pos.y;
    }
    
    // 繪製過程
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getCanvasCoordinates(e);
        const currentX = pos.x;
        const currentY = pos.y;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        lastX = currentX;
        lastY = currentY;
    }
    
    // 結束繪製
    function stopDrawing(e) {
        if (!isDrawing) return;
        e.preventDefault();
        isDrawing = false;
    }
    
    // 綁定事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e);
    });
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e);
    });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        stopDrawing(e);
    });
    canvas.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        stopDrawing(e);
    });
}

// 確保在頁面完全加載後初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializePage, 100);
} else {
    document.addEventListener('DOMContentLoaded', initializePage);
}

// 添加備用的 window load 事件
window.addEventListener('load', function() {
    if (!window.initialized) {
        initializePage();
        window.initialized = true;
    }
});
    </script>
</body>
</html>
        `;

        // 創建 Blob 物件並下載
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // 生成檔名
        const filename = `${companyName}_${quoteDate}_報價單.html`;
        
        // 創建下載連結
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}

// 如果需要全局訪問
if (typeof window !== 'undefined') {
    window.ExportHTML = ExportHTML;
}
