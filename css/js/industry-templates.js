const industryTemplates = {
    engineering: {
        name: "工程",
        categories: [
            { name: "拆除工程", items: [] },
            { name: "水電工程", items: [] },
            { name: "泥作工程", items: [] },
            { name: "木作工程", items: [] },
            { name: "油漆工程", items: [] }
        ]
    },
    catering: {
        name: "餐飲",
        categories: [
            { name: "食材成本", items: [] },
            { name: "設備採購", items: [] },
            { name: "裝潢設計", items: [] },
            { name: "營運準備", items: [] },
            { name: "行銷推廣", items: [] }
        ]
    },
    beauty: {
        name: "美業",
        categories: [
            { name: "設備器材", items: [] },
            { name: "產品原料", items: [] },
            { name: "裝潢設計", items: [] },
            { name: "教育訓練", items: [] },
            { name: "行銷推廣", items: [] }
        ]
    },
    marketing: {
        name: "行銷",
        categories: [
            { name: "策略規劃", items: [] },
            { name: "創意設計", items: [] },
            { name: "媒體投放", items: [] },
            { name: "製作執行", items: [] },
            { name: "效果追蹤", items: [] }
        ]
    },
    sales: {
        name: "業務",
        categories: [
            { name: "客戶開發", items: [] },
            { name: "產品介紹", items: [] },
            { name: "合約協議", items: [] },
            { name: "售後服務", items: [] },
            { name: "關係維護", items: [] }
        ]
    },
    financial: {
        name: "理專",
        categories: [
            { name: "投資規劃", items: [] },
            { name: "保險配置", items: [] },
            { name: "退休規劃", items: [] },
            { name: "稅務優化", items: [] },
            { name: "財務分析", items: [] }
        ]
    },
    custom: {
        name: "自訂",
        categories: [
            { name: "服務項目一", items: [] },
            { name: "服務項目二", items: [] },
            { name: "服務項目三", items: [] }
        ]
    }
};

// 預設項目範例
const defaultItems = {
    engineering: [
        { name: "客浴拆除", quantity: 1, unit: "式", price: 21000 },
        { name: "主浴拆除", quantity: 1, unit: "式", price: 15000 },
        { name: "全室抽換線", quantity: 1, unit: "式", price: 45000 },
        { name: "電箱加大", quantity: 1, unit: "式", price: 32000, remark: "含打石" }
    ],
    catering: [
        { name: "食材採購", quantity: 1, unit: "批", price: 50000 },
        { name: "廚房設備", quantity: 1, unit: "套", price: 120000 },
        { name: "桌椅傢俱", quantity: 20, unit: "套", price: 8000 },
        { name: "招牌設計", quantity: 1, unit: "式", price: 15000 }
    ],
    beauty: [
        { name: "美容床", quantity: 3, unit: "張", price: 8000 },
        { name: "儀器設備", quantity: 1, unit: "套", price: 50000 },
        { name: "產品原料", quantity: 50, unit: "瓶", price: 300 },
        { name: "店面裝潢", quantity: 1, unit: "式", price: 80000 }
    ],
    marketing: [
        { name: "品牌策略", quantity: 1, unit: "案", price: 30000 },
        { name: "創意設計", quantity: 1, unit: "案", price: 25000 },
        { name: "社群經營", quantity: 3, unit: "月", price: 15000 },
        { name: "廣告投放", quantity: 1, unit: "期", price: 50000 }
    ],
    sales: [
        { name: "客戶拜訪", quantity: 10, unit: "次", price: 2000 },
        { name: "產品說明", quantity: 5, unit: "場", price: 5000 },
        { name: "合約擬定", quantity: 3, unit: "份", price: 3000 },
        { name: "售後服務", quantity: 1, unit: "年", price: 20000 }
    ],
    financial: [
        { name: "資產配置", quantity: 1, unit: "案", price: 15000 },
        { name: "保險規劃", quantity: 1, unit: "案", price: 10000 },
        { name: "退休規劃", quantity: 1, unit: "案", price: 20000 },
        { name: "稅務諮詢", quantity: 4, unit: "次", price: 3000 }
    ]
};
