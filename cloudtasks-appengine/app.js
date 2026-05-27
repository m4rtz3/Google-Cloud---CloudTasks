const express = require('express');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const db = new Firestore({
    databaseId: 'cloudtasks-db'
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Endpoint para criar uma tarefa no Firestore
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, owner, status } = req.body;

        if (!title || !description || !owner || !status) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }

        const docRef = await db.collection('tasks').add({
            title,
            description,
            owner,
            status,
            criadoEm: new Date().toISOString()
        });

        res.status(201).json({
            mensagem: 'Tarefa criada com sucesso',
            id: docRef.id
        });

    } catch (erro) {
        console.error('Erro ao salvar tarefa:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
