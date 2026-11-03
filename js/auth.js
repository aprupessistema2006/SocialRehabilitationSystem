// Autentifikācija ar kopējo paroli un PIN

const ACCESS_PASSWORD = "VainodeSAC123*";
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycby-6TL8wqZIjpkn4GY1gkUe-6l_8pXvgPmHH_1MM6olEc9ayp85c9CDaanWFX0KtHUWiw/exec";

let selectedEmployeeId = "D001";

document.addEventListener('DOMContentLoaded', function() {
    const accessBtn = document.getElementById('accessBtn');
    const accessPasswordInput = document.getElementById('accessPassword');
    const accessGate = document.getElementById('accessGate');
    const pinGate = document.getElementById('pinGate');
    const accessError = document.getElementById('accessError');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (accessBtn) {
        accessBtn.addEventListener('click', function() {
            accessError.style.display = 'none';
            if (accessPasswordInput.value === ACCESS_PASSWORD) {
                accessGate.style.display = 'none';
                pinGate.style.display = 'block';
                document.getElementById('pin').focus();
            } else {
                accessError.style.display = 'block';
            }
        });
    }
    
    if (accessPasswordInput) {
        accessPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') accessBtn.click();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            loginError.style.display = 'none';
            
            const pin = document.getElementById('pin').value.trim();
            if (!pin) {
                loginError.style.display = 'block';
                return;
            }
            
            try {
                const payload = JSON.stringify({
                    action: 'login',
                    employee_id: selectedEmployeeId,
                    pin: pin
                });
                
                const body = new URLSearchParams();
                body.append('data', payload);
                
                const response = await fetch(WEBAPP_URL, {
                    method: 'POST',
                    body: body
                });
                
                const text = await response.text();
                const result = JSON.parse(text);
                
                if (result.ok) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: result.employee_id,
                        name: result.employee_name,
                        role: result.role
                    }));
                    window.location.href = 'pages/sakums.html';
                } else {
                    loginError.style.display = 'block';
                }
            } catch(err) {
                loginError.style.display = 'block';
            }
        });
    }
});
