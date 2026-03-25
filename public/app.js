const API_URL = 'http://localhost:3000/api/v1';

// Helper para obtener token
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
}

function getUser() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

function updateUI() {
    const user = getUser();
    const authLinks = document.getElementById('authLinks');
    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (user) {
        authLinks.style.display = 'none';
        userInfo.style.display = 'inline';
        usernameDisplay.innerText = user.rol === 'ADMIN' ? 'Admin' : user.usuario_id;
    } else {
        authLinks.style.display = 'inline';
        userInfo.style.display = 'none';
    }
}

async function fetchProductos() {
    const response = await fetch(`${API_URL}/productos`);
    const productos = await response.json();
    const container = document.getElementById('productos');
    container.innerHTML = '';
    productos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'producto';
        div.innerHTML = `
            <h3>${p.NOMBRE}</h3>
            <p>Ref: ${p.REFERENCIA}</p>
            <p>Precio: $${p.PRECIO_COP}</p>
            <p>Stock: ${p.STOCK}</p>
            <button onclick="agregarAlCarrito(${p.PRODUCTO_ID})">Agregar al carrito</button>
        `;
        container.appendChild(div);
    });
}

async function agregarAlCarrito(productoId) {
    const token = getToken();
    if (!token) {
        alert('Debes iniciar sesión primero');
        window.location.href = 'login.html';
        return;
    }

    // Primero obtener el carrito activo
    const carritoResp = await fetch(`${API_URL}/carrito`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { carrito_id } = await carritoResp.json();

    const response = await fetch(`${API_URL}/carrito/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ carrito_id, producto_id: productoId, cantidad: 1 })
    });
    if (response.ok) {
        alert('Producto agregado al carrito');
    } else {
        const error = await response.json();
        alert(error.error || 'Error al agregar');
    }
}

function logout() {
    setToken(null);
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    fetchProductos();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});