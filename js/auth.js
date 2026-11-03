// AUTENTIFIKĀCIJA DEBUG ar kopējo paroli un PIN

const ACCESS_PASSWORD = "VainodeSAC123*";
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxNjSCOxjSGdDr7qb0TlssqqeWbiDERgCZ4kg3kYYBqQvEM5QnJE81B-ZZZ1tpwEvSTAQ/exec";


let selectedEmployeeId = "D001";

document.addEventListener('DOMContentLoaded', function() {
    console.log("%c[SRS] DOM READY", "color:#a855f7;font-weight:bold");
    
    const accessBtn = document.getElementById('accessBtn');
    const accessPasswordInput = document.getElementById('accessPassword');
    const accessGate = document.getElementById('accessGate');
    const pinGate = document.getElementById('pinGate');
    const accessError = document.getElementById('accessError');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (accessBtn) {
        accessBtn.addEventListener('click', function() {
            console.log("%c[SRS] KOPĒJĀ PAROLE", "color:#22c55e;font-weight:bold", accessPasswordInput.value);
            accessError.style.display = 'none';
            if (accessPasswordInput.value === ACCESS_PASSWORD) {
                console.log("%c[SRS] PAROLE PAREIZA -> PIN LOGS", "color:#22c55e;font-weight:bold");
                accessGate.style.display = 'none';
                pinGate.style.display = 'block';
                document.getElementById('pin').focus();
            } else {
                console.log("%c[SRS] PAROLE NEPAREIZA", "color:#ef4444;font-weight:bold");
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
            console.log("%c[SRS] PIN IESNIEGTS", "color:#06b6d4;font-weight:bold");
            loginError.style.display = 'none';
            
            const pin = document.getElementById('pin').value.trim();
            console.log("[SRS] PIN:", pin, "EMP:", selectedEmployeeId);
            
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
                
                console.log("[SRS] SŪTĀM:", payload);
                
                const body = new URLSearchParams();
                body.append('data', payload);
                
                const response = await fetch(WEBAPP_URL, {
                    method: 'POST',
                    body: body
                });
                
                console.log("[SRS] STATUS:", response.status);
                const text = await response.text();
                console.log("[SRS] TEXT:", text);
                
                const result = JSON.parse(text);
                console.log("[SRS] JSON:", result);
                
                if (result.ok) {
                    console.log("%c[SRS] VEIKSMĪGI -> SĀKUMS", "color:#22c55e;font-weight:bold");
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: result.employee_id,
                        name: result.employee_name,
                        role: result.role
                    }));
                    window.location.href = 'pages/sakums.html';
                } else {
                    console.log("%c[SRS] NEVEIKSMĪGI", "color:#ef4444;font-weight:bold", result.reason);
                    loginError.style.display = 'block';
                }
            } catch(err) {
                console.error("[SRS] ERR:", err);
                loginError.style.display = 'block';
            }
        });
    }
});