//Julio Ruiz 2024-2009
const API_URL = 'http://localhost:3000/api/libros';
let myChart = null;
let librosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavegacion();
    cargarDatos();
});

document.getElementById('libroForm').addEventListener('submit', guardarLibro);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

function mostrarLoader() { document.getElementById('loader').classList.remove('oculto'); }
function ocultarLoader() { document.getElementById('loader').classList.add('oculto'); }

function initNavegacion() {
    const botones = document.querySelectorAll('.nav-btn');
    const vistas = document.querySelectorAll('.view');
    botones.forEach(btn => {
        btn.addEventListener('click', () => {
            botones.forEach(b => b.classList.remove('active'));
            vistas.forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            if (target === 'view-dashboard') cargarDatos();
            if (target === 'view-list') cargarLibros();
        });
    });
}

function cambiarVista(vistaId) {
    document.querySelector(`.nav-btn[data-target="${vistaId}"]`).click();
}

function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    cargarDatos(); 
}

async function cargarDatos() {
    try {
        mostrarLoader();
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        const libros = await res.json();
        
        const leidos = libros.filter(l => l.estado === 'Leído').length;
        const pendientes = libros.filter(l => l.estado === 'Pendiente').length;
        const progreso = libros.filter(l => l.estado === 'En progreso').length;

        document.getElementById('kpi-total').innerText = libros.length;
        document.getElementById('kpi-leidos').innerText = leidos;
        document.getElementById('kpi-pendientes').innerText = pendientes;
        document.getElementById('kpi-progreso').innerText = progreso;

        actualizarGrafico(leidos, pendientes, progreso);
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error de conexión', text: error.message });
    } finally {
        ocultarLoader();
    }
}

function actualizarGrafico(leidos, pendientes, progreso) {
    const ctx = document.getElementById('graficoEstados');
    if (!ctx) return;
    const textColor = document.body.getAttribute('data-theme') === 'dark' ? '#fff' : '#333';
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Leídos', 'Pendientes', 'En progreso'],
            datasets: [{
                data: [leidos, pendientes, progreso],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { labels: { color: textColor, font: { family: 'Inter', size: 14 } } } }, cutout: '70%' }
    });
}

async function cargarLibros() {
    try {
        mostrarLoader();
        const busqueda = document.getElementById('buscador').value;
        const res = await fetch(`${API_URL}?busqueda=${busqueda}`);
        if (!res.ok) throw new Error('Error al obtener libros');
        let libros = await res.json();
        librosGlobal = libros;
        
        const filtro = document.getElementById('filtroEstado').value;
        if (filtro !== 'Todos') {
            libros = libros.filter(l => l.estado === filtro);
        }

        const lista = document.getElementById('listaLibros');
        lista.innerHTML = '';

        if (libros.length === 0) {
            lista.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No se encontraron libros.</p>';
            return;
        }

        libros.forEach(libro => {
            const estadoClase = libro.estado === 'En progreso' ? 'progreso' : libro.estado.toLowerCase();
            let estrellas = '';
            for(let i=0; i < (libro.calificacion || 0); i++) estrellas += '⭐';

            const div = document.createElement('div');
            div.className = 'libro-card';
            div.innerHTML = `
                <div>
                    <div class="libro-header">
                        <h3>${libro.titulo}</h3>
                        <p style="color: var(--text-muted);"><i class="fa-solid fa-pen-nib"></i> ${libro.autor}</p>
                    </div>
                    <p><span class="badge badge-${estadoClase}">${libro.estado}</span></p>
                    <p style="font-size: 0.9em; margin-top: 10px;"><strong>Calificación:</strong> ${estrellas || 'Sin calificar'}</p>
                </div>
                <div class="libro-actions">
                    <button class="btn-info" onclick="abrirModal('${libro._id}')
                    " title="Ver Detalles"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-warning" onclick="prepararEdicion('${libro._id}')
                    " title="Editar"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn-danger" onclick="eliminarLibro('${libro._id}')
                    " title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
        ocultarLoader();
    }
}

async function guardarLibro(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const calificacion = document.getElementById('calificacion').value;

    if(titulo.length < 2 || autor.length < 2) {
        return Swal.fire({ icon: 'warning', title: 'Datos inválidos', text: 'El título y autor deben tener al menos 2 caracteres.' });
    }
    if(calificacion && (calificacion < 1 || calificacion > 5)) {
        return Swal.fire({ icon: 'warning', title: 'Datos inválidos', text: 'La calificación debe estar entre 1 y 5.' });
    }

    const id = document.getElementById('libroId').value;
    const datos = {
        titulo: titulo,
        autor: autor,
        genero: document.getElementById('genero').value.trim(),
        estado: document.getElementById('estado').value,
        calificacion: calificacion,
        resena: document.getElementById('resena').value.trim()
    };

    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
        mostrarLoader();
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!res.ok) throw new Error('Error al guardar en el servidor');

        Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Operación exitosa.', timer: 1500, showConfirmButton: false });
        cancelarEdicion();
        cambiarVista('view-list');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
        ocultarLoader();
    }
}

async function prepararEdicion(id) {
    try {
        mostrarLoader();
        const res = await fetch(API_URL);
        if(!res.ok) throw new Error('No se pudo cargar la información');
        const libros = await res.json();
        const libro = libros.find(l => l._id === id);

        document.getElementById('libroId').value = libro._id;
        document.getElementById('titulo').value = libro.titulo;
        document.getElementById('autor').value = libro.autor;
        document.getElementById('genero').value = libro.genero || '';
        document.getElementById('estado').value = libro.estado;
        document.getElementById('calificacion').value = libro.calificacion || '';
        document.getElementById('resena').value = libro.resena || '';
        
        document.getElementById('form-title').innerText = 'Editar Libro';
        document.getElementById('btnGuardar').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar';
        document.getElementById('btnCancelar').classList.remove('oculto');
        
        cambiarVista('view-add');
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } finally {
        ocultarLoader();
    }
}

function cancelarEdicion() {
    document.getElementById('libroForm').reset();
    document.getElementById('libroId').value = '';
    document.getElementById('form-title').innerText = 'Añadir Nuevo Libro';
    document.getElementById('btnGuardar').innerHTML = '<i class="fa-solid fa-save"></i> Guardar';
    document.getElementById('btnCancelar').classList.add('oculto');
}

async function eliminarLibro(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            mostrarLoader();
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if(!res.ok) throw new Error('No se pudo eliminar el registro');
            Swal.fire({ icon: 'success', title: 'Eliminado', showConfirmButton: false, timer: 1000 });
            cargarLibros();
            if(document.getElementById('view-dashboard').classList.contains('active')) cargarDatos();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        } finally {
            ocultarLoader();
        }
    }
}

function abrirModal(id) {
    const libro = librosGlobal.find(l => l._id === id);
    if (!libro) return;
    
    document.getElementById('modal-titulo').innerText = libro.titulo;
    document.getElementById('modal-autor').innerText = libro.autor;
    document.getElementById('modal-genero').innerText = libro.genero || 'N/A';
    document.getElementById('modal-estado').innerText = libro.estado;
    document.getElementById('modal-calificacion').innerText = libro.calificacion ? `${libro.calificacion}/5` : 'Sin calificar';
    document.getElementById('modal-resena').innerText = libro.resena || 'Sin reseña disponible.';
    document.getElementById('modal-fecha').innerText = new Date(libro.createdAt).toLocaleDateString();
    
    document.getElementById('modalDetalle').classList.remove('oculto');
}

function cerrarModal() {
    document.getElementById('modalDetalle').classList.add('oculto');
}

window.onclick = function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target == modal) {
        cerrarModal();
    }
}