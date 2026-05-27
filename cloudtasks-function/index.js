const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
    databaseId: 'cloudtasks-db'
});

exports.listarTarefas = async (req, res) => {
    try {
        const snapshot = await db.collection('tasks').get();

        const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(tasks);

    } catch (erro) {
        console.error('Erro ao listar tarefas:', erro);
        res.status(500).json({ erro: 'Erro ao buscar tarefas' });
    }
};
