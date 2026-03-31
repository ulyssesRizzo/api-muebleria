// ==================== CONFIGURACIÓN ====================
const API_URL = 'http://localhost:3000/api/v1';

// Estado global
let currentUser = null;
let currentCarritoId = null;
let carritoItems = [];

// ==================== UTILIDADES ====================
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
}

function getUserFromToken() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
        throw new Error(error.error || 'Error en la petición');
    }
    
    return response.json();
}

function showModal(title, contentHtml, onSubmit = null) {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <h2>${title}</h2>
        ${contentHtml}
        <div class="modal-buttons" style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
            <button id="modalCancelBtn" class="btn-secondary">Cancelar</button>
            <button id="modalSubmitBtn" class="btn-primary">Guardar</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    document.getElementById('modalCancelBtn').onclick = () => {
        modal.style.display = 'none';
    };
    
    if (onSubmit) {
        document.getElementById('modalSubmitBtn').onclick = async () => {
            const success = await onSubmit();
            if (success) {
                modal.style.display = 'none';
            }
        };
    }
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function showMessage(message, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem;
        background: ${isError ? '#e74c3c' : '#27ae60'};
        color: white;
        border-radius: 5px;
        z-index: 1001;
        animation: fadeOut 3s forwards;
    `;
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 3000);
}

// ==================== AUTENTICACIÓN ====================
async function login(username, password) {
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        setToken(data.token);
        currentUser = data;
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}

async function registerCliente(formData) {
    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        showMessage('Registro exitoso. Ya puedes iniciar sesión.');
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}

function logout() {
    setToken(null);
    currentUser = null;
    currentCarritoId = null;
    carritoItems = [];
    location.reload();
}

// ==================== CARGAR DATOS DE CATÁLOGOS ====================
async function loadTiposDocumento() {
    try {
        // Nota: No tenemos endpoint directo, simulamos con datos fijos
        return [
            { TIPO_DOC_ID: 1, CODIGO: 'DPI', NOMBRE: 'DPI' },
            { TIPO_DOC_ID: 2, CODIGO: 'NIT', NOMBRE: 'NIT' }
        ];
    } catch (error) {
        return [{ TIPO_DOC_ID: 1, CODIGO: 'DPI', NOMBRE: 'DPI' }];
    }
}

async function loadCiudades() {
    try {
        const response = await fetch(`${API_URL}/clientes/ciudades`);
        return await response.json();
    } catch (error) {
        return [{ CIUDAD_ID: 1, NOMBRE: 'Ciudad de Guatemala' }];
    }
}

async function loadTiposMueble() {
    try {
        // Endpoint temporal
        return [
            { TIPO_MUEBLE_ID: 1, CODIGO: 'INTERIOR', NOMBRE: 'Interior' },
            { TIPO_MUEBLE_ID: 2, CODIGO: 'EXTERIOR', NOMBRE: 'Exterior' }
        ];
    } catch (error) {
        return [];
    }
}

async function loadCategorias() {
    try {
        const data = await apiRequest('/productos/categorias');
        return data;
    } catch (error) {
        return [];
    }
}

async function loadFormasPago() {
    try {
        return [
            { FORMA_PAGO_ID: 1, NOMBRE: 'Tarjeta' },
            { FORMA_PAGO_ID: 2, NOMBRE: 'Efectivo' },
            { FORMA_PAGO_ID: 3, NOMBRE: 'Transferencia' }
        ];
    } catch (error) {
        return [];
    }
}

async function loadMetodosEnvio() {
    try {
        return [
            { METODO_ENVIO_ID: 1, NOMBRE: 'Envío estándar', COSTO_BASE: 35 },
            { METODO_ENVIO_ID: 2, NOMBRE: 'Envío express', COSTO_BASE: 70 }
        ];
    } catch (error) {
        return [];
    }
}

// ==================== PRODUCTOS (catálogo) ====================
async function loadProductos(search = '', tipoMuebleId = '') {
    let url = '/productos';
    const params = new URLSearchParams();
    if (search) params.append('texto', search);
    if (tipoMuebleId) params.append('tipo_mueble_id', tipoMuebleId);
    if (params.toString()) url += '?' + params.toString();
    
    try {
        return await apiRequest(url);
    } catch (error) {
        showMessage(error.message, true);
        return [];
    }
}

async function getProductoById(id) {
    try {
        return await apiRequest(`/productos/${id}`);
    } catch (error) {
        return null;
    }
}

async function crearProducto(data) {
    try {
        return await apiRequest('/productos', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function actualizarProducto(id, data) {
    try {
        return await apiRequest(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function eliminarProducto(id) {
    try {
        return await apiRequest(`/productos/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== CLIENTES ====================
async function loadClientes(search = '', adminMode = false) {
    let url = '/clientes';
    const params = new URLSearchParams();
    if (search) params.append('texto', search);
    if (adminMode) params.append('admin', 'true');
    if (params.toString()) url += '?' + params.toString();
    
    try {
        return await apiRequest(url);
    } catch (error) {
        return [];
    }
}

async function getClienteById(id) {
    try {
        return await apiRequest(`/clientes/${id}`);
    } catch (error) {
        return null;
    }
}

async function actualizarCliente(id, data) {
    try {
        return await apiRequest(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function eliminarCliente(id) {
    try {
        return await apiRequest(`/clientes/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== INVENTARIO ====================
async function getInventario(productoId) {
    try {
        return await apiRequest(`/inventario/${productoId}`);
    } catch (error) {
        return null;
    }
}

async function actualizarInventario(productoId, precio, stock) {
    try {
        return await apiRequest(`/inventario/${productoId}`, {
            method: 'PUT',
            body: JSON.stringify({ precio_cop: precio, stock })
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== CARRITO ====================
async function obtenerOCrearCarrito() {
    try {
        const data = await apiRequest('/carrito');
        currentCarritoId = data.carrito_id;
        return currentCarritoId;
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function agregarAlCarrito(productoId, cantidad = 1) {
    if (!currentCarritoId) {
        await obtenerOCrearCarrito();
    }
    
    try {
        await apiRequest('/carrito/items', {
            method: 'POST',
            body: JSON.stringify({
                carrito_id: currentCarritoId,
                producto_id: productoId,
                cantidad
            })
        });
        await loadCarritoItems();
        showMessage('Producto agregado al carrito');
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}

async function loadCarritoItems() {
    if (!currentCarritoId) return [];
    
    try {
        const items = await apiRequest(`/carrito/${currentCarritoId}/items`);
        carritoItems = items;
        updateCartCount();
        return items;
    } catch (error) {
        return [];
    }
}

async function eliminarItemCarrito(productoId) {
    try {
        await apiRequest(`/carrito/${currentCarritoId}/items/${productoId}`, {
            method: 'DELETE'
        });
        await loadCarritoItems();
        showMessage('Producto eliminado del carrito');
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function vaciarCarrito() {
    try {
        await apiRequest(`/carrito/${currentCarritoId}`, {
            method: 'DELETE'
        });
        carritoItems = [];
        updateCartCount();
        showMessage('Carrito vaciado');
    } catch (error) {
        showMessage(error.message, true);
    }
}

function updateCartCount() {
    const count = carritoItems.reduce((sum, item) => sum + item.CANTIDAD, 0);
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) cartCountSpan.textContent = count;
}

// ==================== COMPRAS ====================
async function confirmarCompra(data) {
    try {
        const result = await apiRequest('/compras/confirmar', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showMessage(`Compra exitosa! Número de orden: ${result.numero_orden}`);
        currentCarritoId = null;
        carritoItems = [];
        updateCartCount();
        return result;
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function loadMisCompras() {
    try {
        return await apiRequest('/compras');
    } catch (error) {
        return [];
    }
}

async function getOrdenDetalle(ordenId) {
    try {
        return await apiRequest(`/compras/${ordenId}/detalle`);
    } catch (error) {
        return [];
    }
}

// ==================== CATEGORÍAS ====================
async function loadCategoriasAdmin() {
    try {
        return await apiRequest('/productos/categorias');
    } catch (error) {
        return [];
    }
}

async function crearCategoria(data) {
    try {
        return await apiRequest('/productos/categorias', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function actualizarCategoria(id, data) {
    try {
        return await apiRequest(`/productos/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function eliminarCategoria(id) {
    try {
        return await apiRequest(`/productos/categorias/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== BODEGAS ====================
async function loadBodegas() {
    try {
        return await apiRequest('/inventario/bodegas');
    } catch (error) {
        return [];
    }
}

async function crearBodega(data) {
    try {
        return await apiRequest('/inventario/bodegas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function actualizarStockBodega(productoId, bodegaId, cantidad) {
    try {
        return await apiRequest('/inventario/stock', {
            method: 'PUT',
            body: JSON.stringify({ producto_id: productoId, bodega_id: bodegaId, cantidad })
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== PROMOCIONES ====================
async function loadPromociones() {
    try {
        return await apiRequest('/promociones');
    } catch (error) {
        return [];
    }
}

async function crearPromocion(data) {
    try {
        return await apiRequest('/promociones', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function eliminarPromocion(id) {
    try {
        return await apiRequest(`/promociones/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== CUPONES ====================
async function loadCupones() {
    try {
        return await apiRequest('/cupones');
    } catch (error) {
        return [];
    }
}

async function crearCupon(data) {
    try {
        return await apiRequest('/cupones', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

async function eliminarCupon(id) {
    try {
        return await apiRequest(`/cupones/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        showMessage(error.message, true);
        return null;
    }
}

// ==================== REPORTES ====================
async function getVentasDiarias(fechaIni, fechaFin, ciudadId) {
    const params = new URLSearchParams();
    if (fechaIni) params.append('fecha_ini', fechaIni);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    if (ciudadId) params.append('ciudad_id', ciudadId);
    
    try {
        return await apiRequest(`/reportes/ventas-diarias?${params.toString()}`);
    } catch (error) {
        return [];
    }
}

async function getProductoMasVendido(fechaIni, fechaFin, ciudadId) {
    const params = new URLSearchParams();
    if (fechaIni) params.append('fecha_ini', fechaIni);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    if (ciudadId) params.append('ciudad_id', ciudadId);
    
    try {
        return await apiRequest(`/reportes/producto-mas-vendido?${params.toString()}`);
    } catch (error) {
        return null;
    }
}

async function getComprasPorCliente(clienteId, fechaIni, fechaFin) {
    const params = new URLSearchParams();
    if (fechaIni) params.append('fecha_ini', fechaIni);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    
    try {
        return await apiRequest(`/reportes/compras-cliente/${clienteId}?${params.toString()}`);
    } catch (error) {
        return [];
    }
}

// ==================== RENDERIZADO DE PANTALLAS ====================
async function renderCatalogo() {
    const search = document.getElementById('catalogoSearch')?.value || '';
    const tipo = document.getElementById('catalogoTipoFilter')?.value || '';
    
    const productos = await loadProductos(search, tipo);
    const container = document.getElementById('productosGrid');
    
    if (!productos.length) {
        container.innerHTML = '<p class="text-center">No hay productos disponibles.</p>';
        return;
    }
    
    container.innerHTML = productos.map(p => `
        <div class="producto-card">
            <div class="producto-img">
                ${p.FOTO_URL ? `<img src="${p.FOTO_URL}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-couch fa-4x"></i>'}
            </div>
            <div class="producto-info">
                <h3>${p.NOMBRE}</h3>
                <p>Ref: ${p.REFERENCIA}</p>
                <p>Material: ${p.MATERIAL || 'N/A'}</p>
                <div class="producto-precio">Q${parseFloat(p.PRECIO_GTQ).toFixed(2)}</div>
                <div class="producto-stock">Stock: ${p.STOCK || 0} unidades</div>
            </div>
            <button onclick="agregarAlCarritoHandler(${p.PRODUCTO_ID})">
                <i class="fas fa-cart-plus"></i> Agregar al carrito
            </button>
        </div>
    `).join('');
}

async function renderCarrito() {
    const items = await loadCarritoItems();
    const container = document.getElementById('carritoContent');
    
    if (!items.length) {
        container.innerHTML = '<p class="text-center">Tu carrito está vacío.</p>';
        return;
    }
    
    let subtotal = 0;
    const itemsHtml = items.map(item => {
        const total = item.CANTIDAD * item.PRECIO_COP;
        subtotal += total;
        return `
            <div class="carrito-item">
                <div>
                    <strong>${item.NOMBRE}</strong><br>
                    <small>Ref: ${item.REFERENCIA}</small>
                </div>
                <div>
                    <span>Cantidad: ${item.CANTIDAD}</span>
                    <span style="margin-left: 1rem;">Q${parseFloat(item.PRECIO_COP).toFixed(2)} c/u</span>
                    <span style="margin-left: 1rem; font-weight: bold;">Q${total.toFixed(2)}</span>
                    <button class="btn-danger" onclick="eliminarItemHandler(${item.PRODUCTO_ID})" style="margin-left: 1rem; padding: 0.3rem 0.6rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="carrito-items">${itemsHtml}</div>
        <div class="carrito-summary">
            <h3>Resumen de compra</h3>
            <p>Subtotal: Q${subtotal.toFixed(2)}</p>
            <div id="carritoEnvioSection">
                <div class="form-group">
                    <label>Método de envío:</label>
                    <select id="carritoMetodoEnvio"></select>
                </div>
                <div class="form-group">
                    <label>Ciudad de entrega:</label>
                    <select id="carritoCiudadEntrega"></select>
                </div>
                <div class="form-group">
                    <label>Dirección de entrega:</label>
                    <input type="text" id="carritoDireccion" placeholder="Ingrese su dirección">
                </div>
                <div class="form-group">
                    <label>Forma de pago:</label>
                    <select id="carritoFormaPago"></select>
                </div>
                <div class="form-group">
                    <label>Cupón de descuento:</label>
                    <input type="text" id="carritoCupon" placeholder="Código de cupón">
                </div>
                <div id="carritoTotalConEnvio"></div>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn-secondary" onclick="vaciarCarritoHandler()">Vaciar carrito</button>
                <button class="btn-success" onclick="procederPagoHandler()">Proceder al pago</button>
            </div>
        </div>
    `;
    
    // Cargar selects
    const metodosEnvio = await loadMetodosEnvio();
    const metodosSelect = document.getElementById('carritoMetodoEnvio');
    metodosSelect.innerHTML = metodosEnvio.map(m => `<option value="${m.METODO_ENVIO_ID}" data-costo="${m.COSTO_BASE}">${m.NOMBRE} - Q${m.COSTO_BASE}</option>`).join('');
    
    const ciudades = await loadCiudades();
    const ciudadesSelect = document.getElementById('carritoCiudadEntrega');
    ciudadesSelect.innerHTML = ciudades.map(c => `<option value="${c.CIUDAD_ID}">${c.NOMBRE}</option>`).join('');
    
    const formasPago = await loadFormasPago();
    const formasSelect = document.getElementById('carritoFormaPago');
    formasSelect.innerHTML = formasPago.map(f => `<option value="${f.FORMA_PAGO_ID}">${f.NOMBRE}</option>`).join('');
    
    // Actualizar total cuando cambia método de envío
    metodosSelect.onchange = () => updateCarritoTotal(subtotal);
    updateCarritoTotal(subtotal);
}

function updateCarritoTotal(subtotal) {
    const metodoSelect = document.getElementById('carritoMetodoEnvio');
    const selectedOption = metodoSelect.options[metodoSelect.selectedIndex];
    const costoEnvio = selectedOption ? parseFloat(selectedOption.dataset.costo) : 0;
    const total = subtotal + costoEnvio;
    const totalDiv = document.getElementById('carritoTotalConEnvio');
    totalDiv.innerHTML = `
        <p>Costo de envío: Q${costoEnvio.toFixed(2)}</p>
        <h3>Total: Q${total.toFixed(2)}</h3>
    `;
}

async function procederPagoHandler() {
    const metodoEnvio = document.getElementById('carritoMetodoEnvio')?.value;
    const ciudadEntrega = document.getElementById('carritoCiudadEntrega')?.value;
    const direccion = document.getElementById('carritoDireccion')?.value;
    const formaPago = document.getElementById('carritoFormaPago')?.value;
    const cupon = document.getElementById('carritoCupon')?.value;
    
    if (!metodoEnvio || !ciudadEntrega || !direccion || !formaPago) {
        showMessage('Complete todos los campos de envío y pago', true);
        return;
    }
    
    const result = await confirmarCompra({
        carrito_id: currentCarritoId,
        ciudad_entrega_id: parseInt(ciudadEntrega),
        direccion_entrega: direccion,
        forma_pago_id: parseInt(formaPago),
        metodo_envio_id: parseInt(metodoEnvio),
        cupon_codigo: cupon || null,
        descripcion: 'Compra realizada desde el portal'
    });
    
    if (result) {
        renderCarrito();
        // Cambiar a la pestaña de mis compras
        document.querySelector('[data-tab="mis-compras"]').click();
    }
}

async function renderMisCompras() {
    const compras = await loadMisCompras();
    const container = document.getElementById('misComprasContent');
    
    if (!compras.length) {
        container.innerHTML = '<p class="text-center">No has realizado ninguna compra aún.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>N° Orden</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    ${compras.map(c => `
                        <tr>
                            <td>${c.NUMERO_ORDEN}</td>
                            <td>${new Date(c.FECHA_ORDEN).toLocaleDateString()}</td>
                            <td>${c.ESTADO}</td>
                            <td>Q${parseFloat(c.TOTAL).toFixed(2)}</td>
                            <td><button class="btn-secondary" onclick="verDetalleOrden(${c.ORDEN_ID})">Ver detalle</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function verDetalleOrden(ordenId) {
    const detalle = await getOrdenDetalle(ordenId);
    const orden = (await loadMisCompras()).find(o => o.ORDEN_ID === ordenId);
    
    const modalHtml = `
        <h3>Orden #${orden?.NUMERO_ORDEN}</h3>
        <p>Fecha: ${new Date(orden?.FECHA_ORDEN).toLocaleString()}</p>
        <p>Estado: ${orden?.ESTADO}</p>
        <p>Total: Q${parseFloat(orden?.TOTAL).toFixed(2)}</p>
        <h4>Productos:</h4>
        <table style="width:100%">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
            <tbody>
                ${detalle.map(d => `
                    <tr>
                        <td>${d.NOMBRE_SNAPSHOT}</td>
                        <td>${d.CANTIDAD}</td>
                        <td>Q${parseFloat(d.PRECIO_UNITARIO).toFixed(2)}</td>
                        <td>Q${parseFloat(d.SUBTOTAL).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    showModal('Detalle de compra', modalHtml, null);
    document.getElementById('modalSubmitBtn').style.display = 'none';
}

// ==================== RENDERIZADO ADMIN ====================
async function renderClientes() {
    const search = document.getElementById('clientesSearch')?.value || '';
    const adminMode = document.getElementById('clientesAdminMode')?.checked || false;
    const clientes = await loadClientes(search, adminMode);
    const container = document.getElementById('clientesTableContainer');
    
    if (!clientes.length) {
        container.innerHTML = '<p class="text-center">No hay clientes registrados.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Documento</th>
                        <th>Nombre/Razón social</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientes.map(c => `
                        <tr>
                            <td>${c.CLIENTE_ID}</td>
                            <td>${c.NUM_DOCUMENTO}</td>
                            <td>${c.NOMBRE}</td>
                            <td>${c.EMAIL}</td>
                            <td>${c.TIPO_PERSONA === 'J' ? 'Jurídica' : 'Natural'}</td>
                            <td>${c.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}</td>
                            <td class="action-buttons">
                                <button class="btn-secondary" onclick="editarCliente(${c.CLIENTE_ID})">Editar</button>
                                <button class="btn-danger" onclick="eliminarClienteHandler(${c.CLIENTE_ID})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function editarCliente(id) {
    const cliente = await getClienteById(id);
    if (!cliente) return;
    
    const modalHtml = `
        <div class="form-group">
            <label>Teléfono residencia</label>
            <input type="text" id="editTelRes" value="${cliente.TEL_RESIDENCIA || ''}">
        </div>
        <div class="form-group">
            <label>Teléfono celular</label>
            <input type="text" id="editTelCel" value="${cliente.TEL_CELULAR || ''}">
        </div>
        <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="editDireccion" value="${cliente.DIRECCION || ''}">
        </div>
        <div class="form-group">
            <label>Ciudad</label>
            <select id="editCiudadId"></select>
        </div>
        <div class="form-group">
            <label>Profesión</label>
            <input type="text" id="editProfesion" value="${cliente.PROFESION || ''}">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" id="editEmail" value="${cliente.EMAIL || ''}">
        </div>
    `;
    
    showModal('Editar cliente', modalHtml, async () => {
        const ciudadSelect = document.getElementById('editCiudadId');
        const data = {
            tel_res: document.getElementById('editTelRes').value,
            tel_cel: document.getElementById('editTelCel').value,
            direccion: document.getElementById('editDireccion').value,
            ciudad_id: parseInt(ciudadSelect.value),
            profesion: document.getElementById('editProfesion').value,
            email: document.getElementById('editEmail').value,
            idioma_id: null
        };
        
        await actualizarCliente(id, data);
        await renderClientes();
        return true;
    });
    
    const ciudades = await loadCiudades();
    const ciudadSelect = document.getElementById('editCiudadId');
    ciudadSelect.innerHTML = ciudades.map(c => `<option value="${c.CIUDAD_ID}" ${c.CIUDAD_ID === cliente.CIUDAD_ID ? 'selected' : ''}>${c.NOMBRE}</option>`).join('');
}

async function eliminarClienteHandler(id) {
    if (confirm('¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
        await eliminarCliente(id);
        await renderClientes();
    }
}

async function renderProductosAdmin() {
    const search = document.getElementById('productosSearch')?.value || '';
    const tipo = document.getElementById('productosTipoFilter')?.value || '';
    const adminMode = document.getElementById('productosAdminMode')?.checked || false;
    
    let url = `/productos?texto=${encodeURIComponent(search)}`;
    if (tipo) url += `&tipo_mueble_id=${tipo}`;
    if (adminMode) url += `&admin=true`;
    
    try {
        const productos = await apiRequest(url);
        const container = document.getElementById('productosTableContainer');
        
        if (!productos.length) {
            container.innerHTML = '<p class="text-center">No hay productos registrados.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Referencia</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productos.map(p => `
                            <tr>
                                <td>${p.PRODUCTO_ID}</td>
                                <td>${p.REFERENCIA}</td>
                                <td>${p.NOMBRE}</td>
                                <td>${p.TIPO}</td>
                                <td>Q${parseFloat(p.PRECIO_GTQ || p.PRECIO_COP).toFixed(2)}</td>
                                <td>${p.STOCK || 0}</td>
                                <td>${p.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}</td>
                                <td class="action-buttons">
                                    <button class="btn-secondary" onclick="editarProducto(${p.PRODUCTO_ID})">Editar</button>
                                    <button class="btn-danger" onclick="eliminarProductoHandler(${p.PRODUCTO_ID})">Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function editarProducto(id) {
    const producto = await getProductoById(id);
    if (!producto) return;
    
    const tiposMueble = await loadTiposMueble();
    const categorias = await loadCategorias();
    
    const modalHtml = `
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="editNombre" value="${producto.NOMBRE || ''}" required>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="editDescripcion">${producto.DESCRIPCION || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Tipo de mueble *</label>
                <select id="editTipoMuebleId" required></select>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="editCategoriaId"><option value="">Sin categoría</option></select>
            </div>
        </div>
        <div class="form-group">
            <label>Material</label>
            <input type="text" id="editMaterial" value="${producto.MATERIAL || ''}">
        </div>
        <div class="form-row">
            <div class="form-group"><label>Alto (cm)</label><input type="number" id="editAltoCm" value="${producto.DIM_ALTO_CM || 0}"></div>
            <div class="form-group"><label>Ancho (cm)</label><input type="number" id="editAnchoCm" value="${producto.DIM_ANCHO_CM || 0}"></div>
            <div class="form-group"><label>Profundidad (cm)</label><input type="number" id="editProfCm" value="${producto.DIM_PROF_CM || 0}"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Color</label><input type="text" id="editColor" value="${producto.COLOR || ''}"></div>
            <div class="form-group"><label>Peso (gramos)</label><input type="number" id="editPesoGramos" value="${producto.PESO_GRAMOS || 0}"></div>
        </div>
        <div class="form-group">
            <label>Foto URL</label>
            <input type="text" id="editFotoUrl" value="${producto.FOTO_URL || ''}">
        </div>
    `;
    
    showModal('Editar producto', modalHtml, async () => {
        const data = {
            nombre: document.getElementById('editNombre').value,
            descripcion: document.getElementById('editDescripcion').value,
            tipo_mueble_id: parseInt(document.getElementById('editTipoMuebleId').value),
            categoria_id: document.getElementById('editCategoriaId').value ? parseInt(document.getElementById('editCategoriaId').value) : null,
            material: document.getElementById('editMaterial').value,
            alto_cm: parseFloat(document.getElementById('editAltoCm').value),
            ancho_cm: parseFloat(document.getElementById('editAnchoCm').value),
            prof_cm: parseFloat(document.getElementById('editProfCm').value),
            color: document.getElementById('editColor').value,
            peso_gramos: parseFloat(document.getElementById('editPesoGramos').value),
            foto_url: document.getElementById('editFotoUrl').value
        };
        
        await actualizarProducto(id, data);
        await renderProductosAdmin();
        return true;
    });
    
    const tipoSelect = document.getElementById('editTipoMuebleId');
    tipoSelect.innerHTML = tiposMueble.map(t => `<option value="${t.TIPO_MUEBLE_ID}" ${t.TIPO_MUEBLE_ID === producto.TIPO_MUEBLE_ID ? 'selected' : ''}>${t.NOMBRE}</option>`).join('');
    
    const catSelect = document.getElementById('editCategoriaId');
    catSelect.innerHTML += categorias.map(c => `<option value="${c.CATEGORIA_ID}" ${c.CATEGORIA_ID === producto.CATEGORIA_ID ? 'selected' : ''}>${c.NOMBRE}</option>`).join('');
}

async function eliminarProductoHandler(id) {
    if (confirm('¿Está seguro de eliminar este producto? Solo se puede si no ha sido comprado.')) {
        await eliminarProducto(id);
        await renderProductosAdmin();
    }
}

async function renderInventario() {
    const search = document.getElementById('inventarioSearch')?.value || '';
    let productos = await loadProductos(search);
    
    const container = document.getElementById('inventarioTableContainer');
    
    if (!productos.length) {
        container.innerHTML = '<p class="text-center">No hay productos registrados.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Referencia</th>
                        <th>Nombre</th>
                        <th>Precio (GTQ)</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                        <tr>
                            <td>${p.PRODUCTO_ID}</td>
                            <td>${p.REFERENCIA}</td>
                            <td>${p.NOMBRE}</td>
                            <td><input type="number" id="precio_${p.PRODUCTO_ID}" value="${p.PRECIO_GTQ || p.PRECIO_COP || 0}" step="0.01"></td>
                            <td><input type="number" id="stock_${p.PRODUCTO_ID}" value="${p.STOCK || 0}" step="1"></td>
                            <td><button class="btn-primary" onclick="guardarInventario(${p.PRODUCTO_ID})">Guardar</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function guardarInventario(productoId) {
    const precio = parseFloat(document.getElementById(`precio_${productoId}`).value);
    const stock = parseInt(document.getElementById(`stock_${productoId}`).value);
    
    if (isNaN(precio) || isNaN(stock)) {
        showMessage('Valores inválidos', true);
        return;
    }
    
    await actualizarInventario(productoId, precio, stock);
    showMessage('Inventario actualizado correctamente');
}

async function renderCategorias() {
    const categorias = await loadCategoriasAdmin();
    const container = document.getElementById('categoriasTableContainer');
    
    if (!categorias.length) {
        container.innerHTML = '<p class="text-center">No hay categorías registradas.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría padre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${categorias.map(c => `
                        <tr>
                            <td>${c.CATEGORIA_ID}</td>
                            <td>${c.NOMBRE}</td>
                            <td>${c.PADRE_NOMBRE || '-'}</td>
                            <td>${c.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}</td>
                            <td class="action-buttons">
                                <button class="btn-secondary" onclick="editarCategoria(${c.CATEGORIA_ID})">Editar</button>
                                <button class="btn-danger" onclick="eliminarCategoriaHandler(${c.CATEGORIA_ID})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function editarCategoria(id) {
    const categorias = await loadCategoriasAdmin();
    const categoria = categorias.find(c => c.CATEGORIA_ID === id);
    if (!categoria) return;
    
    const modalHtml = `
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="editNombre" value="${categoria.NOMBRE}" required>
        </div>
        <div class="form-group">
            <label>Categoría padre</label>
            <select id="editPadreId"><option value="">Ninguna</option></select>
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="editActivo">
                <option value="S" ${categoria.ACTIVO === 'S' ? 'selected' : ''}>Activo</option>
                <option value="N" ${categoria.ACTIVO === 'N' ? 'selected' : ''}>Inactivo</option>
            </select>
        </div>
    `;
    
    showModal('Editar categoría', modalHtml, async () => {
        const data = {
            nombre: document.getElementById('editNombre').value,
            padre_id: document.getElementById('editPadreId').value ? parseInt(document.getElementById('editPadreId').value) : null,
            activo: document.getElementById('editActivo').value
        };
        
        await actualizarCategoria(id, data);
        await renderCategorias();
        return true;
    });
    
    const padreSelect = document.getElementById('editPadreId');
    padreSelect.innerHTML = '<option value="">Ninguna</option>' + 
        categorias.filter(c => c.CATEGORIA_ID !== id).map(c => `<option value="${c.CATEGORIA_ID}" ${c.CATEGORIA_ID === categoria.PADRE_ID ? 'selected' : ''}>${c.NOMBRE}</option>`).join('');
}

async function eliminarCategoriaHandler(id) {
    if (confirm('¿Está seguro de eliminar esta categoría?')) {
        await eliminarCategoria(id);
        await renderCategorias();
    }
}

async function renderBodegas() {
    const bodegas = await loadBodegas();
    const container = document.getElementById('bodegasTableContainer');
    
    if (!bodegas.length) {
        container.innerHTML = '<p class="text-center">No hay bodegas registradas.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            表
                <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Dirección</th><th>Ciudad</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${bodegas.map(b => `
                        <tr>
                            <td>${b.BODEGA_ID}</td>
                            <td>${b.NOMBRE}</td>
                            <td>${b.DIRECCION || '-'}</td>
                            <td>${b.CIUDAD_NOMBRE || '-'}</td>
                            <td class="action-buttons">
                                <button class="btn-secondary" onclick="editarBodega(${b.BODEGA_ID})">Editar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            表
        </div>
    `;
}

async function renderPromociones() {
    const promociones = await loadPromociones();
    const container = document.getElementById('promocionesTableContainer');
    
    if (!promociones.length) {
        container.innerHTML = '<p class="text-center">No hay promociones registradas.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>ID</th><th>Código</th><th>Descripción</th><th>Descuento</th><th>Vigencia</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${promociones.map(p => `
                        <tr>
                            <td>${p.PROMOCION_ID}</td>
                            <td>${p.CODIGO || '-'}</td>
                            <td>${p.DESCRIPCION || '-'}</td>
                            <td>${p.TIPO_DESCUENTO === 'PORCENTAJE' ? p.VALOR_DESCUENTO + '%' : 'Q' + p.VALOR_DESCUENTO}</td>
                            <td>${p.FECHA_INICIO} a ${p.FECHA_FIN}</td>
                            <td class="action-buttons">
                                <button class="btn-danger" onclick="eliminarPromocionHandler(${p.PROMOCION_ID})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function eliminarPromocionHandler(id) {
    if (confirm('¿Está seguro de eliminar esta promoción?')) {
        await eliminarPromocion(id);
        await renderPromociones();
    }
}

async function renderCupones() {
    const cupones = await loadCupones();
    const container = document.getElementById('cuponesTableContainer');
    
    if (!cupones.length) {
        container.innerHTML = '<p class="text-center">No hay cupones registrados.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>ID</th><th>Código</th><th>Descuento</th><th>Usos</th><th>Vigencia</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${cupones.map(c => `
                        <tr>
                            <td>${c.CUPON_ID}</td>
                            <td>${c.CODIGO}</td>
                            <td>${c.DESCUENTO_PORCENTAJE ? c.DESCUENTO_PORCENTAJE + '%' : 'Q' + c.DESCUENTO_MONTO}</td>
                            <td>${c.USOS_ACTUALES}/${c.USOS_MAXIMOS || '∞'}</td>
                            <td>${c.FECHA_VALIDEZ || 'Sin fecha'}</td>
                            <td>${c.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}</td>
                            <td class="action-buttons">
                                <button class="btn-danger" onclick="eliminarCuponHandler(${c.CUPON_ID})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function eliminarCuponHandler(id) {
    if (confirm('¿Está seguro de eliminar este cupón?')) {
        await eliminarCupon(id);
        await renderCupones();
    }
}

async function renderReportes() {
    // Cargar ciudades para los filtros
    const ciudades = await loadCiudades();
    const ciudadSelects = ['ventasCiudad', 'productoCiudad'];
    ciudadSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Todas las ciudades</option>' + 
                ciudades.map(c => `<option value="${c.CIUDAD_ID}">${c.NOMBRE}</option>`).join('');
        }
    });
}

async function generarVentasReporte() {
    const fechaIni = document.getElementById('ventasFechaIni').value;
    const fechaFin = document.getElementById('ventasFechaFin').value;
    const ciudadId = document.getElementById('ventasCiudad').value;
    
    const data = await getVentasDiarias(fechaIni || null, fechaFin || null, ciudadId || null);
    const container = document.getElementById('ventasResultados');
    
    if (!data.length) {
        container.innerHTML = '<p>No hay datos para los filtros seleccionados.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Tipo mueble</th><th>Ciudad</th><th>Total ventas</th><th>Órdenes</th><th>Unidades</th></tr>
                </thead>
                <tbody>
                    ${data.map(r => `
                        <tr>
                            <td>${new Date(r.FECHA).toLocaleDateString()}</td>
                            <td>${r.TIPO_MUEBLE}</td>
                            <td>${r.CIUDAD}</td>
                            <td>Q${parseFloat(r.TOTAL_VENTAS).toFixed(2)}</td>
                            <td>${r.ORDENES}</td>
                            <td>${r.UNIDADES}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function generarProductoReporte() {
    const fechaIni = document.getElementById('productoFechaIni').value;
    const fechaFin = document.getElementById('productoFechaFin').value;
    const ciudadId = document.getElementById('productoCiudad').value;
    
    const data = await getProductoMasVendido(fechaIni || null, fechaFin || null, ciudadId || null);
    const container = document.getElementById('productoResultados');
    
    if (!data) {
        container.innerHTML = '<p>No hay datos para los filtros seleccionados.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="producto-mas-vendido">
            <p><strong>Producto:</strong> ${data.NOMBRE} (Ref: ${data.REFERENCIA})</p>
            <p><strong>Tipo:</strong> ${data.TIPO_MUEBLE}</p>
            <p><strong>Ciudad:</strong> ${data.CIUDAD}</p>
            <p><strong>Unidades vendidas:</strong> ${data.UNIDADES}</p>
            <p><strong>Total ventas:</strong> Q${parseFloat(data.TOTAL_VENTAS).toFixed(2)}</p>
        </div>
    `;
}

async function generarComprasReporte() {
    const clienteId = document.getElementById('comprasClienteId').value;
    const fechaIni = document.getElementById('comprasFechaIni').value;
    const fechaFin = document.getElementById('comprasFechaFin').value;
    
    if (!clienteId) {
        showMessage('Ingrese el ID del cliente', true);
        return;
    }
    
    const data = await getComprasPorCliente(clienteId, fechaIni || null, fechaFin || null);
    const container = document.getElementById('comprasResultados');
    
    if (!data.length) {
        container.innerHTML = '<p>No hay compras para este cliente en el período seleccionado.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>N° Orden</th><th>Fecha</th><th>Valor</th><th>Forma de pago</th><th>Muebles</th></tr>
                </thead>
                <tbody>
                    ${data.map(c => `
                        <tr>
                            <td>${c.NUMERO_ORDEN}</td>
                            <td>${new Date(c.FECHA_COMPRA).toLocaleDateString()}</td>
                            <td>Q${parseFloat(c.VALOR_COMPRA).toFixed(2)}</td>
                            <td>${c.FORMA_PAGO || '-'}</td>
                            <td>${c.MUEBLES}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ==================== MODALES DE CREACIÓN ====================
async function openCrearClienteModal() {
    const tiposDoc = await loadTiposDocumento();
    const ciudades = await loadCiudades();
    
    const modalHtml = `
        <div class="form-row">
            <div class="form-group">
                <label>Tipo persona *</label>
                <select id="modalTipoPersona" required>
                    <option value="N">Persona natural</option>
                    <option value="J">Persona jurídica</option>
                </select>
            </div>
            <div class="form-group">
                <label>Tipo documento *</label>
                <select id="modalTipoDocId" required></select>
            </div>
        </div>
        <div class="form-group">
            <label>Número documento *</label>
            <input type="text" id="modalNumDocumento" required>
        </div>
        <div id="modalNaturalFields">
            <div class="form-row">
                <div class="form-group"><label>Nombres *</label><input type="text" id="modalNombres"></div>
                <div class="form-group"><label>Apellidos *</label><input type="text" id="modalApellidos"></div>
            </div>
        </div>
        <div id="modalJuridicaFields" style="display: none;">
            <div class="form-group"><label>NIT *</label><input type="text" id="modalNit"></div>
            <div class="form-group"><label>Razón social *</label><input type="text" id="modalRazonSocial"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Teléfono residencia *</label><input type="text" id="modalTelRes" required></div>
            <div class="form-group"><label>Teléfono celular</label><input type="text" id="modalTelCel"></div>
        </div>
        <div class="form-group"><label>Dirección *</label><input type="text" id="modalDireccion" required></div>
        <div class="form-row">
            <div class="form-group"><label>Ciudad *</label><select id="modalCiudadId" required></select></div>
            <div class="form-group"><label>Profesión</label><input type="text" id="modalProfesion"></div>
        </div>
        <div class="form-group"><label>Email *</label><input type="email" id="modalEmail" required></div>
        <div class="form-row">
            <div class="form-group"><label>Usuario *</label><input type="text" id="modalUsername" required></div>
            <div class="form-group"><label>Contraseña *</label><input type="password" id="modalPassword" required></div>
        </div>
    `;
    
    showModal('Registrar nuevo cliente', modalHtml, async () => {
        const tipoPersona = document.getElementById('modalTipoPersona').value;
        
        const formData = {
            tipo_persona: tipoPersona,
            tipo_doc_id: parseInt(document.getElementById('modalTipoDocId').value),
            num_documento: document.getElementById('modalNumDocumento').value,
            tel_res: document.getElementById('modalTelRes').value,
            tel_cel: document.getElementById('modalTelCel').value,
            direccion: document.getElementById('modalDireccion').value,
            ciudad_id: parseInt(document.getElementById('modalCiudadId').value),
            profesion: document.getElementById('modalProfesion').value,
            email: document.getElementById('modalEmail').value,
            username: document.getElementById('modalUsername').value,
            password: document.getElementById('modalPassword').value,
            idioma_id: null
        };
        
        if (tipoPersona === 'J') {
            formData.nit = document.getElementById('modalNit').value;
            formData.razon_social = document.getElementById('modalRazonSocial').value;
            formData.nombres = null;
            formData.apellidos = null;
        } else {
            formData.nit = null;
            formData.razon_social = null;
            formData.nombres = document.getElementById('modalNombres').value;
            formData.apellidos = document.getElementById('modalApellidos').value;
        }
        
        const success = await registerCliente(formData);
        if (success) {
            await renderClientes();
        }
        return success;
    });
    
    // Llenar selects
    const tipoDocSelect = document.getElementById('modalTipoDocId');
    tipoDocSelect.innerHTML = tiposDoc.map(t => `<option value="${t.TIPO_DOC_ID}">${t.NOMBRE}</option>`).join('');
    
    const ciudadSelect = document.getElementById('modalCiudadId');
    ciudadSelect.innerHTML = ciudades.map(c => `<option value="${c.CIUDAD_ID}">${c.NOMBRE}</option>`).join('');
    
    // Mostrar/ocultar campos según tipo persona
    const tipoPersonaSelect = document.getElementById('modalTipoPersona');
    const naturalFields = document.getElementById('modalNaturalFields');
    const juridicaFields = document.getElementById('modalJuridicaFields');
    
    tipoPersonaSelect.onchange = () => {
        if (tipoPersonaSelect.value === 'J') {
            naturalFields.style.display = 'none';
            juridicaFields.style.display = 'block';
        } else {
            naturalFields.style.display = 'block';
            juridicaFields.style.display = 'none';
        }
    };
}

async function openCrearProductoModal() {
    const tiposMueble = await loadTiposMueble();
    const categorias = await loadCategorias();
    
    const modalHtml = `
        <div class="form-group">
            <label>Referencia *</label>
            <input type="text" id="modalReferencia" required>
        </div>
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="modalNombre" required>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="modalDescripcion"></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Tipo de mueble *</label>
                <select id="modalTipoMuebleId" required></select>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="modalCategoriaId"><option value="">Sin categoría</option></select>
            </div>
        </div>
        <div class="form-group">
            <label>Material</label>
            <input type="text" id="modalMaterial">
        </div>
        <div class="form-row">
            <div class="form-group"><label>Alto (cm) *</label><input type="number" id="modalAltoCm" step="0.01" required></div>
            <div class="form-group"><label>Ancho (cm) *</label><input type="number" id="modalAnchoCm" step="0.01" required></div>
            <div class="form-group"><label>Profundidad (cm) *</label><input type="number" id="modalProfCm" step="0.01" required></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Color</label><input type="text" id="modalColor"></div>
            <div class="form-group"><label>Peso (gramos) *</label><input type="number" id="modalPesoGramos" required></div>
        </div>
        <div class="form-group">
            <label>Foto URL</label>
            <input type="text" id="modalFotoUrl">
        </div>
    `;
    
    showModal('Crear nuevo producto', modalHtml, async () => {
        const data = {
            referencia: document.getElementById('modalReferencia').value,
            nombre: document.getElementById('modalNombre').value,
            descripcion: document.getElementById('modalDescripcion').value,
            tipo_mueble_id: parseInt(document.getElementById('modalTipoMuebleId').value),
            categoria_id: document.getElementById('modalCategoriaId').value ? parseInt(document.getElementById('modalCategoriaId').value) : null,
            material: document.getElementById('modalMaterial').value,
            alto_cm: parseFloat(document.getElementById('modalAltoCm').value),
            ancho_cm: parseFloat(document.getElementById('modalAnchoCm').value),
            prof_cm: parseFloat(document.getElementById('modalProfCm').value),
            color: document.getElementById('modalColor').value,
            peso_gramos: parseFloat(document.getElementById('modalPesoGramos').value),
            foto_url: document.getElementById('modalFotoUrl').value
        };
        
        const result = await crearProducto(data);
        if (result) {
            await renderProductosAdmin();
            await renderCatalogo();
            return true;
        }
        return false;
    });
    
    const tipoSelect = document.getElementById('modalTipoMuebleId');
    tipoSelect.innerHTML = tiposMueble.map(t => `<option value="${t.TIPO_MUEBLE_ID}">${t.NOMBRE}</option>`).join('');
    
    const catSelect = document.getElementById('modalCategoriaId');
    catSelect.innerHTML = '<option value="">Sin categoría</option>' + categorias.map(c => `<option value="${c.CATEGORIA_ID}">${c.NOMBRE}</option>`).join('');
}

async function openCrearCategoriaModal() {
    const categorias = await loadCategoriasAdmin();
    
    const modalHtml = `
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="modalNombre" required>
        </div>
        <div class="form-group">
            <label>Categoría padre</label>
            <select id="modalPadreId"><option value="">Ninguna</option></select>
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="modalActivo">
                <option value="S">Activo</option>
                <option value="N">Inactivo</option>
            </select>
        </div>
    `;
    
    showModal('Crear nueva categoría', modalHtml, async () => {
        const data = {
            nombre: document.getElementById('modalNombre').value,
            padre_id: document.getElementById('modalPadreId').value ? parseInt(document.getElementById('modalPadreId').value) : null,
            activo: document.getElementById('modalActivo').value
        };
        
        const result = await crearCategoria(data);
        if (result) {
            await renderCategorias();
            return true;
        }
        return false;
    });
    
    const padreSelect = document.getElementById('modalPadreId');
    padreSelect.innerHTML = '<option value="">Ninguna</option>' + categorias.map(c => `<option value="${c.CATEGORIA_ID}">${c.NOMBRE}</option>`).join('');
}

async function openCrearBodegaModal() {
    const ciudades = await loadCiudades();
    
    const modalHtml = `
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="modalNombre" required>
        </div>
        <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="modalDireccion">
        </div>
        <div class="form-group">
            <label>Ciudad</label>
            <select id="modalCiudadId"><option value="">Seleccionar</option></select>
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input type="text" id="modalTelefono">
        </div>
    `;
    
    showModal('Crear nueva bodega', modalHtml, async () => {
        const data = {
            nombre: document.getElementById('modalNombre').value,
            direccion: document.getElementById('modalDireccion').value,
            ciudad_id: document.getElementById('modalCiudadId').value ? parseInt(document.getElementById('modalCiudadId').value) : null,
            telefono: document.getElementById('modalTelefono').value
        };
        
        const result = await crearBodega(data);
        if (result) {
            await renderBodegas();
            return true;
        }
        return false;
    });
    
    const ciudadSelect = document.getElementById('modalCiudadId');
    ciudadSelect.innerHTML = '<option value="">Seleccionar</option>' + ciudades.map(c => `<option value="${c.CIUDAD_ID}">${c.NOMBRE}</option>`).join('');
}

async function openCrearPromocionModal() {
    const productos = await loadProductos();
    
    const modalHtml = `
        <div class="form-group">
            <label>Código</label>
            <input type="text" id="modalCodigo">
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="modalDescripcion"></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Tipo descuento *</label>
                <select id="modalTipoDescuento">
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO_FIJO">Monto fijo (Q)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Valor descuento *</label>
                <input type="number" id="modalValorDescuento" step="0.01" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Fecha inicio *</label><input type="date" id="modalFechaInicio" required></div>
            <div class="form-group"><label>Fecha fin *</label><input type="date" id="modalFechaFin" required></div>
        </div>
        <div class="form-group">
            <label>Productos incluidos</label>
            <select id="modalProductos" multiple size="5"></select>
            <small>Ctrl+clic para seleccionar múltiples</small>
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="modalActivo">
                <option value="S">Activo</option>
                <option value="N">Inactivo</option>
            </select>
        </div>
    `;
    
    showModal('Crear nueva promoción', modalHtml, async () => {
        const productosSeleccionados = Array.from(document.getElementById('modalProductos').selectedOptions).map(opt => parseInt(opt.value));
        
        const data = {
            codigo: document.getElementById('modalCodigo').value || null,
            descripcion: document.getElementById('modalDescripcion').value,
            tipo_descuento: document.getElementById('modalTipoDescuento').value,
            valor_descuento: parseFloat(document.getElementById('modalValorDescuento').value),
            fecha_inicio: document.getElementById('modalFechaInicio').value,
            fecha_fin: document.getElementById('modalFechaFin').value,
            productos: productosSeleccionados,
            activo: document.getElementById('modalActivo').value
        };
        
        const result = await crearPromocion(data);
        if (result) {
            await renderPromociones();
            return true;
        }
        return false;
    });
    
    const productosSelect = document.getElementById('modalProductos');
    productosSelect.innerHTML = productos.map(p => `<option value="${p.PRODUCTO_ID}">${p.NOMBRE} (${p.REFERENCIA})</option>`).join('');
}

async function openCrearCuponModal() {
    const modalHtml = `
        <div class="form-group">
            <label>Código *</label>
            <input type="text" id="modalCodigo" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Descuento porcentaje (%)</label>
                <input type="number" id="modalDescuentoPorcentaje" step="0.01">
            </div>
            <div class="form-group">
                <label>Descuento monto (Q)</label>
                <input type="number" id="modalDescuentoMonto" step="0.01">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Usos máximos</label>
                <input type="number" id="modalUsosMaximos">
            </div>
            <div class="form-group">
                <label>Fecha validez</label>
                <input type="date" id="modalFechaValidez">
            </div>
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="modalActivo">
                <option value="S">Activo</option>
                <option value="N">Inactivo</option>
            </select>
        </div>
    `;
    
    showModal('Crear nuevo cupón', modalHtml, async () => {
        const data = {
            codigo: document.getElementById('modalCodigo').value,
            descuento_porcentaje: document.getElementById('modalDescuentoPorcentaje').value ? parseFloat(document.getElementById('modalDescuentoPorcentaje').value) : null,
            descuento_monto: document.getElementById('modalDescuentoMonto').value ? parseFloat(document.getElementById('modalDescuentoMonto').value) : null,
            usos_maximos: document.getElementById('modalUsosMaximos').value ? parseInt(document.getElementById('modalUsosMaximos').value) : null,
            fecha_validez: document.getElementById('modalFechaValidez').value || null,
            activo: document.getElementById('modalActivo').value
        };
        
        if (!data.descuento_porcentaje && !data.descuento_monto) {
            showMessage('Debe ingresar al menos un tipo de descuento', true);
            return false;
        }
        
        const result = await crearCupon(data);
        if (result) {
            await renderCupones();
            return true;
        }
        return false;
    });
}

// ==================== MANEJADORES GLOBALES ====================
window.agregarAlCarritoHandler = agregarAlCarrito;
window.eliminarItemHandler = eliminarItemCarrito;
window.vaciarCarritoHandler = vaciarCarrito;
window.procederPagoHandler = procederPagoHandler;
window.verDetalleOrden = verDetalleOrden;
window.editarCliente = editarCliente;
window.eliminarClienteHandler = eliminarClienteHandler;
window.editarProducto = editarProducto;
window.eliminarProductoHandler = eliminarProductoHandler;
window.guardarInventario = guardarInventario;
window.editarCategoria = editarCategoria;
window.eliminarCategoriaHandler = eliminarCategoriaHandler;
window.eliminarPromocionHandler = eliminarPromocionHandler;
window.eliminarCuponHandler = eliminarCuponHandler;

// ==================== INICIALIZACIÓN ====================
async function init() {
    const user = getUserFromToken();
    
    if (user) {
        currentUser = user;
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userNameDisplay').innerText = user.rol === 'ADMIN' ? `Admin: ${user.usuario_id}` : `Cliente: ${user.usuario_id}`;
        document.getElementById('tabsContainer').style.display = 'flex';
        
        // Mostrar tabs según rol
        const isAdmin = user.rol === 'ADMIN';
        const adminTabs = ['adminClientesTab', 'adminProductosTab', 'adminInventarioTab', 'adminCategoriasTab', 'adminBodegasTab', 'adminPromocionesTab', 'adminCuponesTab', 'adminReportesTab'];
        adminTabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = isAdmin ? 'inline-flex' : 'none';
        });
        
        // Obtener carrito
        await obtenerOCrearCarrito();
        await loadCarritoItems();
        
        // Mostrar catálogo por defecto
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('catalogoScreen').style.display = 'block';
        await renderCatalogo();
        
        // Cargar filtros de catálogo
        const tiposMueble = await loadTiposMueble();
        const tipoFilter = document.getElementById('catalogoTipoFilter');
        tipoFilter.innerHTML = '<option value="">Todos</option>' + tiposMueble.map(t => `<option value="${t.TIPO_MUEBLE_ID}">${t.NOMBRE}</option>`).join('');
        
        const productosTipoFilter = document.getElementById('productosTipoFilter');
        if (productosTipoFilter) {
            productosTipoFilter.innerHTML = '<option value="">Todos</option>' + tiposMueble.map(t => `<option value="${t.TIPO_MUEBLE_ID}">${t.NOMBRE}</option>`).join('');
        }
        
    } else {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('tabsContainer').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('registerScreen').style.display = 'none';
    }
    
    // Eventos de navegación por tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tab = btn.dataset.tab;
            
            // Cambiar estilo activo
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Ocultar todas las pantallas
            document.querySelectorAll('.screen').forEach(screen => screen.style.display = 'none');
            
            // Mostrar la pantalla correspondiente
            const screenId = `${tab}Screen`;
            const screen = document.getElementById(screenId);
            if (screen) screen.style.display = 'block';
            
            // Renderizar contenido según tab
            switch (tab) {
                case 'catalogo':
                    await renderCatalogo();
                    break;
                case 'carrito':
                    await renderCarrito();
                    break;
                case 'mis-compras':
                    await renderMisCompras();
                    break;
                case 'clientes':
                    await renderClientes();
                    break;
                case 'productos':
                    await renderProductosAdmin();
                    break;
                case 'inventario':
                    await renderInventario();
                    break;
                case 'categorias':
                    await renderCategorias();
                    break;
                case 'bodegas':
                    await renderBodegas();
                    break;
                case 'promociones':
                    await renderPromociones();
                    break;
                case 'cupones':
                    await renderCupones();
                    break;
                case 'reportes':
                    await renderReportes();
                    break;
            }
        });
    });
    
    // Eventos de búsqueda
    document.getElementById('searchCatalogoBtn')?.addEventListener('click', renderCatalogo);
    document.getElementById('catalogoSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') renderCatalogo();
    });
    
    document.getElementById('searchClientesBtn')?.addEventListener('click', renderClientes);
    document.getElementById('searchProductosBtn')?.addEventListener('click', renderProductosAdmin);
    document.getElementById('searchInventarioBtn')?.addEventListener('click', renderInventario);
    
    document.getElementById('clientesAdminMode')?.addEventListener('change', renderClientes);
    document.getElementById('productosAdminMode')?.addEventListener('change', renderProductosAdmin);
    
    // Eventos de reportes
    document.getElementById('generarVentasBtn')?.addEventListener('click', generarVentasReporte);
    document.getElementById('generarProductoBtn')?.addEventListener('click', generarProductoReporte);
    document.getElementById('generarComprasBtn')?.addEventListener('click', generarComprasReporte);
    
    // Eventos de modales
    document.getElementById('openCrearClienteModal')?.addEventListener('click', openCrearClienteModal);
    document.getElementById('openCrearProductoModal')?.addEventListener('click', openCrearProductoModal);
    document.getElementById('openCrearCategoriaModal')?.addEventListener('click', openCrearCategoriaModal);
    document.getElementById('openCrearBodegaModal')?.addEventListener('click', openCrearBodegaModal);
    document.getElementById('openCrearPromocionModal')?.addEventListener('click', openCrearPromocionModal);
    document.getElementById('openCrearCuponModal')?.addEventListener('click', openCrearCuponModal);
    
    // Eventos de login/registro
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const success = await login(username, password);
        if (success) {
            location.reload();
        }
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipoPersona = document.getElementById('regTipoPersona').value;
        
        const formData = {
            tipo_persona: tipoPersona,
            tipo_doc_id: parseInt(document.getElementById('regTipoDocId').value),
            num_documento: document.getElementById('regNumDocumento').value,
            tel_res: document.getElementById('regTelRes').value,
            tel_cel: document.getElementById('regTelCel').value,
            direccion: document.getElementById('regDireccion').value,
            ciudad_id: parseInt(document.getElementById('regCiudadId').value),
            profesion: document.getElementById('regProfesion').value,
            email: document.getElementById('regEmail').value,
            username: document.getElementById('regUsername').value,
            password: document.getElementById('regPassword').value,
            idioma_id: null
        };
        
        if (tipoPersona === 'J') {
            formData.nit = document.getElementById('regNit').value;
            formData.razon_social = document.getElementById('regRazonSocial').value;
            formData.nombres = null;
            formData.apellidos = null;
        } else {
            formData.nit = null;
            formData.razon_social = null;
            formData.nombres = document.getElementById('regNombres').value;
            formData.apellidos = document.getElementById('regApellidos').value;
        }
        
        const success = await registerCliente(formData);
        if (success) {
            document.getElementById('registerScreen').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'block';
        }
    });
    
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
    });
    
    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'block';
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
    });
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Cargar datos para formularios de registro
    const tiposDoc = await loadTiposDocumento();
    const tiposDocSelect = document.getElementById('regTipoDocId');
    tiposDocSelect.innerHTML = tiposDoc.map(t => `<option value="${t.TIPO_DOC_ID}">${t.NOMBRE}</option>`).join('');
    
    const ciudades = await loadCiudades();
    const ciudadSelect = document.getElementById('regCiudadId');
    ciudadSelect.innerHTML = ciudades.map(c => `<option value="${c.CIUDAD_ID}">${c.NOMBRE}</option>`).join('');
    
    // Mostrar/ocultar campos según tipo persona en registro
    const regTipoPersona = document.getElementById('regTipoPersona');
    const regNaturalFields = document.getElementById('naturalFields');
    const regJuridicaFields = document.getElementById('juridicaFields');
    
    regTipoPersona.onchange = () => {
        if (regTipoPersona.value === 'J') {
            regNaturalFields.style.display = 'none';
            regJuridicaFields.style.display = 'block';
        } else {
            regNaturalFields.style.display = 'block';
            regJuridicaFields.style.display = 'none';
        }
    };
}

// Iniciar la aplicación
init();