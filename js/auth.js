// Autentifikācija ar kopējo paroli un PIN

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
    if (accessPasswordInput) accessPasswordInput.addEventListener('keypress', function(e){ if(e.key==='Enter') accessBtn.click(); });
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); loginError.style.display = 'none';
            const pin = document.getElementById('pin').value.trim();
            if (!pin) { loginError.style.display = 'block'; return; }
            try {
                const body = new URLSearchParams(); body.append('data', JSON.stringify({ action:'login', employee_id:selectedEmployeeId, pin:pin }));
                const response = await fetch(WEBAPP_URL, { method:'POST', body: body });
                const result = JSON.parse(await response.text());
                if (result.ok) {
                    try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
                    localStorage.setItem('currentUser', JSON.stringify({ id:result.employee_id, name:result.employee_name, role:result.role }));
                    try { if (result.app_version) localStorage.setItem('srs_app_version', String(result.app_version)); else if (typeof APP_VERSION !== "undefined") localStorage.setItem('srs_app_version', APP_VERSION); } catch(e) {}
                    window.location.href = 'pages/sakums.html';
                } else loginError.style.display = 'block';
            } catch(err) { loginError.style.display = 'block'; }
        });
    }
});
