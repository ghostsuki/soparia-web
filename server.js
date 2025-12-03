const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXÃO BANCO ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Luiz0803', // <--- LEMBRE DE COLOCAR SUA SENHA AQUI
    database: 'soparia_db'
});

db.connect((err) => {
    if (err) console.error('❌ Erro MySQL:', err);
    else console.log('✅ MySQL Conectado!');
});

// --- ROTAS PÚBLICAS ---

// Listar Produtos
app.get('/api/produtos', (req, res) => {
    // Busca produtos e junta com o nome da categoria
    const sql = `SELECT p.*, c.nome as categoria_nome FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.query('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) res.json({ success: true, user: results[0] });
        else res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    });
});

// Cadastro
app.post('/api/cadastro', (req, res) => {
    const { nome, email, senha, endereco } = req.body;
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (results.length > 0) return res.status(400).json({ message: 'Email já existe' });
        
        db.query('INSERT INTO usuarios (nome, email, senha, endereco, tipo) VALUES (?, ?, ?, ?, "cliente")', 
        [nome, email, senha, endereco], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    });
});

// Criar Pedido
app.post('/api/pedidos', (req, res) => {
    const { usuario_id, total, metodo, endereco, itens } = req.body;
    
    db.query('INSERT INTO pedidos (usuario_id, total, metodo_pagamento, endereco_entrega, status) VALUES (?, ?, ?, ?, "pendente")', 
    [usuario_id, total, metodo, endereco], (err, result) => {
        if (err) return res.status(500).json(err);
        const pedidoId = result.insertId;
        
        const itensValues = itens.map(i => [pedidoId, i.id, i.quantidade, i.preco]);
        db.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ?', [itensValues], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    });
});

// --- ROTAS DE ADMIN ---

// Listar Todos os Usuários
app.get('/api/admin/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Listar Pedidos (Com detalhes do usuário)
app.get('/api/admin/pedidos', (req, res) => {
    const sql = `
        SELECT p.*, u.nome as cliente_nome, u.email as cliente_email 
        FROM pedidos p 
        JOIN usuarios u ON p.usuario_id = u.id 
        ORDER BY p.data_pedido DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Atualizar Status do Pedido (Aprovar)
app.put('/api/admin/pedidos/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Salvar/Editar Produto
app.post('/api/admin/produtos', (req, res) => {
    const { id, nome, preco, imagem, esgotado, categoria } = req.body;
    
    // Mapeamento simples de categoria texto para ID (Ideal seria buscar do banco)
    const catMap = { 'Sopas e Pratos': 1, 'Bebidas': 2, 'Sobremesas': 3 };
    const catId = catMap[categoria] || 1;

    if (id) {
        // Atualizar
        const sql = 'UPDATE produtos SET nome=?, preco=?, imagem=?, esgotado=?, categoria_id=? WHERE id=?';
        db.query(sql, [nome, preco, imagem, esgotado, catId, id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    } else {
        // Criar Novo
        const sql = 'INSERT INTO produtos (nome, preco, imagem, esgotado, categoria_id) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [nome, preco, imagem, esgotado, catId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    }
});

// Deletar Produto
app.delete('/api/admin/produtos/:id', (req, res) => {
    db.query('DELETE FROM produtos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Iniciar
app.listen(3000, () => console.log('🚀 Servidor API rodando na porta 3000'));