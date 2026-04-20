//Julio Ruiz 2024-2009
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const Libro = require('./models/Libro');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.error(err));

app.post('/api/libros', async (req, res) => {
    try {
        const nuevoLibro = new Libro(req.body);
        await nuevoLibro.save();
        res.status(201).json(nuevoLibro);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/libros', async (req, res) => {
    try {
        const { busqueda } = req.query;
        let filtro = {};
        if (busqueda) {
            filtro = {
                $or: [
                    { titulo: { $regex: busqueda, $options: 'i' } },
                    { autor: { $regex: busqueda, $options: 'i' } }
                ]
            };
        }
        const libros = await Libro.find(filtro).sort({ updatedAt: -1 });
        res.json(libros);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/libros/:id', async (req, res) => {
    try {
        const libro = await Libro.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(libro);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/libros/:id', async (req, res) => {
    try {
        await Libro.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));