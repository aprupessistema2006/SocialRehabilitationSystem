// Autentifikācija ar kopējo paroli un PIN

const ACCESS_PASSWORD = "VainodeSAC123*";
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbytjy6XsclYWeHtxiA8S0gz7SWIIR-pHggYIlylp-Ze7P8eNPOGmXMJLVHe8dZ6LrAAbQ/exec";

document.addEventListener('DOMContentLoaded', function() {
    const accessBtn = document.getElementById('accessBtn');
    const accessPasswordInput = document.getElementById('accessPassword');
    const accessGate = document.getElementById('accessGate');
    const pinGate = document.getElementById('pinGate');
    const accessError = document.getElementById('accessError');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    // Kopējās paroles pārbaude
    if (accessBtn) {
        accessBtn.addEventListener('click', function() {
            accessError.style.display = 'none';
            if (accessPasswordInput.value === ACCESS_PASSWORD) {
                accessGate.style.display = 'none';
                pinGate.style.display = 'block';
            } else {
                accessError.style.display = 'block';
            }
        });
    }
    
    if (accessPasswordInput) {
        accessPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                accessBtn.click();
            }
        });
    }
    
    // PIN pieteikšanās
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            loginError.style.display = 'none';
            
            const pin = document.getElementById('pin').value.trim();
            
            try {
                const response = await fetch(WEBAPP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        pin: pin
                    })
                });
                
                const result = await response.json();
                
                if (result.ok) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: result.employee_id,
                        name: result.employee_name,
                        role: result.role,
                        pin: pin
                    }));
                    window.location.href = 'pages/sakums.html';
                } else {
                    loginError.style.display = 'block';
                }
            } catch (error) {
                loginError.style.display = 'block';
            }
        });
    }
});
