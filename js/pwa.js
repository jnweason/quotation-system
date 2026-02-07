// 註冊Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
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
    // 在這裡顯示安裝按鈕的邏輯
    const installBtn = document.createElement('button');
    installBtn.textContent = '安裝應用程式';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    installBtn.style.padding = '10px 20px';
    installBtn.style.backgroundColor = '#3498db';
    installBtn.style.color = 'white';
    installBtn.style.border = 'none';
    installBtn.style.borderRadius = '5px';
    installBtn.style.cursor = 'pointer';
    
    installBtn.addEventListener('click', () => {
        // 顯示安裝提示
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('用戶接受安裝');
                } else {
                    console.log('用戶拒絕安裝');
                }
                deferredPrompt = null;
            });
        }
    });
    
    document.body.appendChild(installBtn);
}
