document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const task = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        owner: document.getElementById('owner').value,
        status: document.getElementById('status').value
    };

    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.className = 'success';
            messageDiv.textContent = 'Tarefa salva com sucesso! ID: ' + data.id;
            document.getElementById('taskForm').reset();
        } else {
            messageDiv.className = 'error';
            messageDiv.textContent = 'Erro: ' + (data.erro || 'Falha ao salvar');
        }
    } catch (err) {
        messageDiv.className = 'error';
        messageDiv.textContent = 'Erro de conexão com o servidor';
    }
});
