// Autentifikācija ar kopējo paroli un PIN

let selectedEmployeeId = "";
let _employees = [];

function rememberAccess() {
    try { localStorage.setItem(ACCESS_REMEMBER_KEY, String(Date.now())); } catch (e) {}
}
function isAccessRemembered() {
    try {
        var t = localStorage.getItem(ACCESS_REMEMBER_KEY);
        if (!t) return false;
        return (Date.now() - Number(t)) < ACCESS_REMEMBER_MS;
    } catch (e) { return false; }
}
function clearAccessRemember() {
    try { localStorage.removeItem(ACCESS_REMEMBER_KEY); } catch (e) {}
}

async function loadEmployees() {
    try {
        const body = new URLSearchParams({ data: JSON.stringify({ action: 'getEmployees' }) });
        const response = await fetch(WEBAPP_URL, { method: 'POST', body: body });
        const result = await response.json();
        if (result.ok) _employees = result.employees || [];
    } catch (e) { _employees = []; }
}

function renderEmployeeSelect() {
    const sel = document.getElementById('employeeSelect');
    if (!sel) return;
    sel.innerHTML = '';
    const def = document.createElement('option');
    def.value = ''; def.textContent = 'Izvēlieties...';
    sel.appendChild(def);
    (_employees || []).forEach(function (e) {
        const o = document.createElement('option');
        o.value = e.employee_id;
        o.textContent = e.employee_name + ' (' + e.employee_id + ') · ' + e.role;
        sel.appendChild(o);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const accessBtn = document.getElementById('accessBtn');
    const accessPasswordInput = document.getElementById('accessPassword');
    const accessGate = document.getElementById('accessGate');
    const employeeGate = document.getElementById('employeeGate');
    const employeeNextBtn = document.getElementById('employeeNextBtn');
    const employeeError = document.getElementById('employeeError');
    const employeeSelect = document.getElementById('employeeSelect');
    const pinGate = document.getElementById('pinGate');
    const accessError = document.getElementById('accessError');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    async function gotoEmployeeStep() {
        await loadEmployees();
        renderEmployeeSelect();
        if (accessGate) accessGate.style.display = 'none';
        if (employeeError) employeeError.style.display = 'none';
        if (employeeGate) employeeGate.style.display = 'block';
    }

    // Ja parole jau atcerēta (8h), pietuvot arī PIN ievadi
    if (isAccessRemembered()) {
        if (accessPasswordInput) accessPasswordInput.value = '';
        if (accessGate) accessGate.style.display = 'none';
        gotoEmployeeStep();
    }

    if (accessBtn) {
        accessBtn.addEventListener('click', async function() {
            accessError.style.display = 'none';
            if (accessPasswordInput.value === ACCESS_PASSWORD) {
                rememberAccess();
                await gotoEmployeeStep();
            } else {
                accessError.style.display = 'block';
            }
        });
    }
    if (accessPasswordInput) accessPasswordInput.addEventListener('keypress', function(e){ if(e.key==='Enter') accessBtn.click(); });

    if (employeeNextBtn) {
        employeeNextBtn.addEventListener('click', function() {
            if (employeeError) employeeError.style.display = 'none';
            if (!employeeSelect || !employeeSelect.value) {
                if (employeeError) { employeeError.textContent = 'Lūdzu izvēlieties darbinieku.'; employeeError.style.display = 'block'; }
                return;
            }
            selectedEmployeeId = employeeSelect.value;
            if (employeeGate) employeeGate.style.display = 'none';
            if (pinGate) { pinGate.style.display = 'block'; if (document.getElementById('pin')) document.getElementById('pin').focus(); }
        });
    }
    if (employeeSelect) employeeSelect.addEventListener('change', function(){ if (employeeError) employeeError.style.display = 'none'; });

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); loginError.style.display = 'none';
            const pin = document.getElementById('pin').value.trim();
            if (!pin) { loginError.style.display = 'block'; return; }
            try {
                const body = new URLSearchParams(); body.append('data', JSON.stringify({ action:'login', employee_id:selectedEmployeeId, pin:pin }));
                const response = await fetch(WEBAPP_URL, { method:'POST', body: body });
                const result = await response.json();
                if (result.ok) {
                    try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
                    rememberAccess();
                    localStorage.setItem('currentUser', JSON.stringify({ id:result.employee_id, name:result.employee_name, role:result.role }));
                    try { if (result.app_version) localStorage.setItem('srs_app_version', String(result.app_version)); else if (typeof APP_VERSION !== "undefined") localStorage.setItem('srs_app_version', APP_VERSION); } catch(e) {}
                    window.location.href = 'pages/sakums.html';
                } else loginError.style.display = 'block';
            } catch(err) { loginError.style.display = 'block'; }
        });
    }
});
