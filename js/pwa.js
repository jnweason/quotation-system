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
