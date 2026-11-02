// Sociālās rehabilitācijas sistēma - galvenais fails
// Lietotnes vadība un navigācija

let currentUser = null;
let currentContent = 'dashboard';

// Inicializācija
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
});

// Pārbauda sesiju
function checkSession() {
    if (typeof google === 'undefined' || !google.script) {
        document.getElementById('loginScreen').style.display = 'flex';
        return;
    }
    google.script.run.withSuccessHandler(function(user) {
        if (user) {
            currentUser = user;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            document.getElementById('userName').textContent = user.employee_name;
            buildNav();
            loadDashboard();
        } else {
            document.getElementById('loginScreen').style.display = 'flex';
        }
    }).withFailureHandler(function(error) {
        console.error('Sesijas pārbaudes kļūda:', error);
        document.getElementById('loginScreen').style.display = 'flex';
    }).checkSession();
}

// Pieteikšanās
function doLogin() {
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';
    if (typeof google === 'undefined' || !google.script) {
        errorDiv.textContent = 'Google Apps Script nav pieejams (lokāls priekšskatījums).';
        errorDiv.style.display = 'block';
        return;
    }
    google.script.run.withSuccessHandler(function(user) {
        if (user) {
            currentUser = user;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            document.getElementById('userName').textContent = user.employee_name;
            buildNav();
            loadDashboard();
        } else {
            errorDiv.textContent = 'Pieteikšanās neizdevās. Pārbaudiet savu kontu.';
            errorDiv.style.display = 'block';
        }
    }).withFailureHandler(function(error) {
        errorDiv.textContent = 'Kļūda: ' + error;
        errorDiv.style.display = 'block';
    }).login();
}

// Iziet
function logout() {
    google.script.run.withSuccessHandler(function() {
        currentUser = null;
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }).logout();
}

// Navigācija
function buildNav() {
    const menu = document.getElementById('navMenu');
    const items = [
        { id: 'dashboard', text: 'Sākums', roles: ['ADMIN', 'DARBINIEKS'] },
        { id: 'activity', text: 'Jauna nodarbība', roles: ['ADMIN', 'DARBINIEKS'] },
        { id: 'clients', text: 'Klienti', roles: ['ADMIN', 'DARBINIEKS'] },
        { id: 'history', text: 'Nodarbību vēsture', roles: ['ADMIN', 'DARBINIEKS'] },
        { id: 'cascades', text: 'Kaskādes', roles: ['ADMIN'] },
        { id: 'users', text: 'Lietotāji', roles: ['ADMIN'] },
        { id: 'settings', text: 'Iestatījumi', roles: ['ADMIN'] }
    ];
    
    menu.innerHTML = '';
    items.forEach(item => {
        if (item.roles.includes(currentUser.role)) {
            const li = document.createElement('li');
            li.textContent = item.text;
            li.className = item.id === currentContent ? 'active' : '';
            li.onclick = () => loadContent(item.id);
            menu.appendChild(li);
        }
    });
}

function loadContent(section) {
    currentContent = section;
    buildNav();
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading">Ielādē...</div>';
    
    google.script.run.withSuccessHandler(function(html) {
        content.innerHTML = html;
    }).withFailureHandler(function(error) {
        content.innerHTML = '<p class="error">Kļūda: ' + error + '</p>';
    }).renderSection(section);
}

function loadDashboard() {
    loadContent('dashboard');
}

// Palīdzētās funkcijas
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showLoading() {
    return '<div class="loading">Ielādē...</div>';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('lv-LV');
}
function api(action, data) { return new Promise((resolve) => { if (typeof google === 'undefined' || !google.script) { resolve({ ok: false, error: 'Nav savienojuma' }); return; } google.script.run.withSuccessHandler(resolve).withFailureHandler(e => resolve({ ok:false, error: String(e) }))[action](data||{}); }); }
