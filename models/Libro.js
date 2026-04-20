//Julio Ruiz 2024-2009
const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema({
    titulo: { type: String, required: true, trim: true },
    autor: { type: String, required: true, trim: true },
    genero: { type: String, trim: true },
    estado: { type: String, required: true, enum: ['Leído', 'Pendiente', 'En progreso'] },
    calificacion: { type: Number, min: 1, max: 5 },
    resena: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Libro', libroSchema);