const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONEXÃO COM O BANCO DE DADOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Luiz0803', // <--- COLOQUE SUA SENHA DO MYSQL AQUI
    database: 'soparia_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar no MySQL:', err);
        return;
    }
    console.log('✅ Conectado ao MySQL com sucesso!');
});

// --- 2. ROTAS DA API (ENDPOINTS) ---

// ROTA: Buscar Cardápio (Produtos)
app.get('/api/produtos', (req, res) => {
    const sql = `
        SELECT p.*, c.nome as categoria_nome 
        FROM produtos p 
        JOIN categorias c ON p.categoria_id = c.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ROTA: Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';
    
    db.query(sql, [email, senha], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
    });
});

// ROTA: Cadastro de Usuário
app.post('/api/cadastro', (req, res) => {
    const { nome, email, senha, endereco } = req.body;
    // Verifica se email já existe
    const checkSql = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(checkSql, [email], (err, results) => {
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        
        const insertSql = 'INSERT INTO usuarios (nome, email, senha, endereco, tipo) VALUES (?, ?, ?, ?, "cliente")';
        db.query(insertSql, [nome, email, senha, endereco], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true, message: 'Usuário criado!' });
        });
    });
});

// ROTA: Criar Pedido
app.post('/api/pedidos', (req, res) => {
    const { usuario_id, total, metodo, endereco, itens } = req.body;

    // 1. Cria o Pedido na tabela 'pedidos'
    const sqlPedido = 'INSERT INTO pedidos (usuario_id, total, metodo_pagamento, endereco_entrega, status) VALUES (?, ?, ?, ?, "pendente")';
    
    db.query(sqlPedido, [usuario_id, total, metodo, endereco], (err, result) => {
        if (err) return res.status(500).json(err);
        
        const pedidoId = result.insertId;
        
        // 2. Cria os Itens na tabela 'itens_pedido'
        const itensValues = itens.map(item => [pedidoId, item.id, item.quantidade, item.preco]);
        const sqlItens = 'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ?';
        
        db.query(sqlItens, [itensValues], (errItens) => {
            if (errItens) return res.status(500).json(errItens);
            res.json({ success: true, pedidoId: pedidoId });
        });
    });
});

// --- 3. INICIAR SERVIDOR ---
app.listen(3000, () => {
    console.log('🚀 Servidor rodando na porta 3000 (http://localhost:3000)');
});