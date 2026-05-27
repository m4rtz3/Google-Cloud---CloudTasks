# AV-03-ICL-GoogleCloud — CloudTasks
## Roteiro de Instruções Executadas no Google Cloud

**Aluno:** Marty Menezes  
**Projeto:** cloudtasks-marty  
**Data:** 27/05/2026

---

## Links de Acesso

| Recurso | URL |
|---------|-----|
| Front-end (App Engine) | https://cloudtasks-marty.rj.r.appspot.com |
| Listar tarefas (Cloud Function) | https://southamerica-east1-cloudtasks-marty.cloudfunctions.net/listarTarefas |
| Console Firestore | https://console.cloud.google.com/firestore/databases?project=cloudtasks-marty |
| Console App Engine | https://console.cloud.google.com/appengine?project=cloudtasks-marty |
| Console Cloud Functions | https://console.cloud.google.com/functions/details/southamerica-east1/listarTarefas?project=cloudtasks-marty |

---

## Passo 1 — Criar o projeto e vincular faturamento

```bash
gcloud projects create cloudtasks-marty

gcloud config set project cloudtasks-marty

gcloud beta billing accounts list --filter="open=true"

gcloud beta billing projects link cloudtasks-marty --billing-account=0191AC-AA9070-A867DF
```

---

## Passo 2 — Habilitar APIs necessárias

```bash
gcloud services enable appengine.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## Passo 3 — Criar o App Engine

```bash
gcloud app create --region=southamerica-east1
```

---

## Passo 4 — Criar o banco de dados Firestore

O banco `(default)` foi criado automaticamente em modo DATASTORE_MODE, que é incompatível com a biblioteca Firestore do Node.js. A solução foi criar um banco nomeado em modo FIRESTORE_NATIVE:

```bash
gcloud firestore databases create \
  --location=southamerica-east1 \
  --database=cloudtasks-db \
  --type=firestore-native
```

---

## Passo 5 — Preparar e fazer deploy do App Engine

### 5.1 Criar a estrutura de diretórios

```bash
mkdir -p cloudtasks-appengine/public
cd cloudtasks-appengine
```

### 5.2 Criar o package.json

```bash
cat <<'EOF' > package.json
{
  "name": "cloudtasks-appengine",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^5.2.1",
    "@google-cloud/firestore": "^7.11.0"
  }
}
EOF
```

### 5.3 Criar o app.js (servidor Express + endpoint POST /api/tasks)

```bash
cat <<'EOF' > app.js
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
EOF
```

### 5.4 Criar o app.yaml (configuração do App Engine)

```bash
cat <<'EOF' > app.yaml
runtime: nodejs22
entrypoint: node app.js
instance_class: F1
env_variables:
  NODE_ENV: production
automatic_scaling:
  min_instances: 1
  max_instances: 3
  target_cpu_utilization: 0.6
EOF
```

### 5.5 Criar os arquivos do front-end

**public/index.html**

```bash
cat <<'EOF' > public/index.html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudTasks</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>☁️ CloudTasks</h1>
            <p class="subtitle">Gerenciamento de tarefas na Google Cloud</p>
            <form id="taskForm">
                <label>Título</label>
                <input type="text" id="title" required>
                <label>Descrição</label>
                <textarea id="description" required></textarea>
                <label>Responsável</label>
                <input type="text" id="owner" required>
                <label>Status</label>
                <select id="status">
                    <option>PENDENTE</option>
                    <option>EM_ANDAMENTO</option>
                    <option>FINALIZADA</option>
                </select>
                <button type="submit">Salvar tarefa</button>
            </form>
            <div id="message"></div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
EOF
```

**public/style.css**

```bash
cat <<'EOF' > public/style.css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
}
body {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.container {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 20px;
}
.card {
    background: white;
    width: 500px;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
h1 {
    color: #0f172a;
    margin-bottom: 10px;
}
.subtitle {
    margin-bottom: 30px;
    color: #64748b;
}
form {
    display: flex;
    flex-direction: column;
}
label {
    margin-top: 15px;
    margin-bottom: 5px;
    color: #334155;
    font-weight: bold;
}
input, textarea, select {
    padding: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 15px;
}
textarea {
    resize: none;
    height: 100px;
}
button {
    margin-top: 25px;
    padding: 14px;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
}
button:hover {
    background: #1d4ed8;
}
#message {
    margin-top: 20px;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    font-weight: bold;
    display: none;
}
#message.success {
    display: block;
    background: #dcfce7;
    color: #166534;
}
#message.error {
    display: block;
    background: #fee2e2;
    color: #991b1b;
}
EOF
```

**public/app.js**

```bash
cat <<'EOF' > public/app.js
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
EOF
```

### 5.6 Fazer o deploy do App Engine

```bash
gcloud app deploy --quiet
```

Saída obtida:

```
Deployed service [default] to [https://cloudtasks-marty.rj.r.appspot.com]
```

---

## Passo 6 — Testar o cadastro de tarefas

### 6.1 Via curl

```bash
curl -X POST https://cloudtasks-marty.rj.r.appspot.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Primeira tarefa","description":"Testar a aplicação","owner":"Marty","status":"PENDENTE"}'
```

Resposta:

```json
{"mensagem":"Tarefa criada com sucesso","id":"V9PA7bGW6ZuVMyUKLayn"}
```

```bash
curl -X POST https://cloudtasks-marty.rj.r.appspot.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Segunda tarefa","description":"Configurar Cloud Function","owner":"Maria","status":"EM_ANDAMENTO"}'
```

Resposta:

```json
{"mensagem":"Tarefa criada com sucesso","id":"jDAGs1ZjXD3jvHHEM5mX"}
```

### 6.2 Verificação nos logs

```bash
gcloud app logs tail -s default
```

Os logs confirmaram status **201** (sucesso) para todas as requisições POST após a criação do banco `cloudtasks-db`.

---

## Passo 7 — Criar a Cloud Function para listar tarefas

### 7.1 Criar a estrutura

```bash
cd ~
mkdir cloudtasks-function
cd cloudtasks-function
```

### 7.2 Criar o package.json

```bash
cat <<'EOF' > package.json
{
  "name": "cloudtasks-function",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@google-cloud/firestore": "^7.11.0"
  }
}
EOF
```

### 7.3 Criar o index.js

```bash
cat <<'EOF' > index.js
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
EOF
```

### 7.4 Fazer o deploy da Cloud Function

```bash
gcloud functions deploy listarTarefas \
  --runtime=nodejs22 \
  --trigger-http \
  --allow-unauthenticated \
  --region=southamerica-east1
```

A API `run.googleapis.com` foi habilitada automaticamente durante o deploy (gen2). Saída final:

```
url: https://southamerica-east1-cloudtasks-marty.cloudfunctions.net/listarTarefas
state: ACTIVE
```

### 7.5 Testar a listagem

```bash
curl https://southamerica-east1-cloudtasks-marty.cloudfunctions.net/listarTarefas
```

Resposta (JSON com as tarefas cadastradas):

```json
[
  {
    "id": "7EndtPgc3kPmolE0BAAk",
    "owner": "Sensato",
    "title": "mostrando pro sensato",
    "status": "EM_ANDAMENTO",
    "criadoEm": "2026-05-27T23:29:08.258Z",
    "description": "mostrando pro sensato"
  },
  {
    "id": "V9PA7bGW6ZuVMyUKLayn",
    "criadoEm": "2026-05-27T23:21:02.502Z",
    "owner": "Marty",
    "description": "Testar a aplicação",
    "title": "Primeira tarefa",
    "status": "PENDENTE"
  },
  {
    "id": "jDAGs1ZjXD3jvHHEM5mX",
    "owner": "Maria",
    "criadoEm": "2026-05-27T23:21:17.317Z",
    "status": "EM_ANDAMENTO",
    "description": "Configurar Cloud Function",
    "title": "Segunda tarefa"
  }
]
```

---

## Estrutura dos Códigos-Fonte

```
cloudtasks-appengine/           ← App Engine (deploy com gcloud app deploy)
├── app.js                      ← Servidor Express + POST /api/tasks + Firestore
├── app.yaml                    ← Configuração do App Engine (runtime nodejs22, scaling)
├── package.json                ← Dependências (express, @google-cloud/firestore)
└── public/
    ├── index.html              ← Formulário de cadastro de tarefas
    ├── style.css               ← Estilos visuais
    └── app.js                  ← Script JS que faz fetch POST ao submeter o form

cloudtasks-function/            ← Cloud Function (deploy com gcloud functions deploy)
├── index.js                    ← Função listarTarefas — lê collection "tasks" e retorna JSON
└── package.json                ← Dependência (@google-cloud/firestore)
```

---

## Arquitetura da Solução

```
┌─────────────────┐    POST /api/tasks    ┌──────────────────┐    add()     ┌──────────────┐
│   Navegador     │ ───────────────────── │   App Engine     │ ──────────  │   Firestore  │
│   (index.html)  │                       │   (app.js)       │             │  cloudtasks-db│
└─────────────────┘                       └──────────────────┘             │  collection:  │
                                                                           │  tasks        │
┌─────────────────┐    GET (HTTP)         ┌──────────────────┐    get()    │               │
│   Navegador     │ ───────────────────── │  Cloud Function  │ ──────────  │               │
│   (JSON)        │                       │  listarTarefas   │             └──────────────┘
└─────────────────┘                       └──────────────────┘
```
