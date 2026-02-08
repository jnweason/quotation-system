// 註冊Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 使用絕對路徑註冊
        navigator.serviceWorker.register('/quotation-system/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// 檢查是否支援安裝為應用程式
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止默認的安裝提示
    e.preventDefault();
    // 儲存事件以便稍後觸發
    deferredPrompt = e;
    // 顯示安裝按鈕
    showInstallButton();
});

// iOS Safari 專用安裝提示
function showIOSInstallMessage() {
    // 檢查是否為 iOS Safari 且不是 PWA 模式
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.navigator.standalone) {
        // 檢查是否已經顯示過提示
        if (!localStorage.getItem('iosPromptShown')) {
            const iosPrompt = document.createElement('div');
            iosPrompt.id = 'ios-install-prompt';
            iosPrompt.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    z-index: 9999;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">
                    <div style="margin-bottom: 10px; font-weight: bold;">安裝應用程式</div>
                    <div style="margin-bottom: 15px; line-height: 1.4;">
                        點擊瀏覽器的分享按鈕<br>
                        選擇「加入主畫面」即可安裝
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        float: right;
                    ">知道了</button>
                    <div style="clear: both;"></div>
                </div>
            `;
            
            // 30秒後自動隱藏
            setTimeout(() => {
                if (iosPrompt.parentElement) {
                    iosPrompt.parentElement.removeChild(iosPrompt);
                }
            }, 30000);
            
            document.body.appendChild(iosPrompt);
            localStorage.setItem('iosPromptShown', 'true');
        }
    }
}

function showInstallButton() {
    // 檢查是否已經有安裝按鈕
    if (document.getElementById('installAppBtn')) {
        return;
    }
    
    // 在這裡顯示安裝按鈕的邏輯
    const installBtn = document.createElement('button');
    installBtn.id = 'installAppBtn';
    installBtn.textContent = '安裝應用程式';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    installBtn.style.padding = '10px 20px';
    installBtn.style.backgroundColor = '#3498db';
    installBtn.style.color = 'white';
    installBtn.style.border = 'none';
    installBtn.style.borderRadius = '50px';
    installBtn.style.cursor = 'pointer';
    installBtn.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
    installBtn.style.fontSize = '14px';
    
    installBtn.addEventListener('click', () => {
        // 顯示安裝提示
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('用戶接受安裝');
                    // 安裝成功後移除按鈕
                    if (installBtn.parentNode) {
                        installBtn.parentNode.removeChild(installBtn);
                    }
                } else {
                    console.log('用戶拒絕安裝');
                }
                deferredPrompt = null;
            });
        }
    });
    
    document.body.appendChild(installBtn);
}

// 頁面加載完成後檢查 iOS 安裝提示
document.addEventListener('DOMContentLoaded', () => {
    // 延遲顯示 iOS 提示，避免影響頁面加載
    setTimeout(showIOSInstallMessage, 3000);
});
