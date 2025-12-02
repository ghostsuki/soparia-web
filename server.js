const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS) para rodar tudo na porta 3000
app.use(express.static(path.join(__dirname, '.')));

// --- CONEXÃO COM BANCO NA NUVEM (AIVEN) ---
const db = mysql.createConnection({
    host: 'mysql-25911050-soparia.g.aivencloud.com',
    port: 26105,
    user: 'avnadmin',
    password: process.env.DB_PASSWORD, // <--- TROQUE A SENHA REAL POR ISSO
    database: 'soparia_db',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) console.error('❌ Erro ao conectar no MySQL Aiven:', err);
    else console.log('✅ Conectado ao Banco na Nuvem com sucesso!');
});

// --- ROTAS DA API ---

// Listar Produtos
app.get('/api/produtos', (req, res) => {
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
    
    const checkSql = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(checkSql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro no banco." });
        if (results.length > 0) return res.status(400).json({ message: 'Email já cadastrado' });
        
        // Correção anterior: 'cliente' passado como parâmetro
        const insertSql = 'INSERT INTO usuarios (nome, email, senha, endereco, tipo) VALUES (?, ?, ?, ?, ?)';
        db.query(insertSql, [nome, email, senha, endereco, 'cliente'], (err, result) => {
            if (err) return res.status(500).json({ message: "Erro ao salvar usuário." });
            res.json({ success: true, message: 'Usuário criado!' });
        });
    });
});

// ROTA DE PEDIDOS (CORRIGIDA AGORA)
app.post('/api/pedidos', (req, res) => {
    const { usuario_id, total, metodo, endereco, itens } = req.body;
    
    console.log("📦 Novo Pedido:", req.body);

    // CORREÇÃO AQUI: Trocamos "pendente" por ?
    const sqlPedido = 'INSERT INTO pedidos (usuario_id, total, metodo_pagamento, endereco_entrega, status) VALUES (?, ?, ?, ?, ?)';
    
    // Passamos 'pendente' dentro do array de valores
    db.query(sqlPedido, [usuario_id, total, metodo, endereco, 'pendente'], (err, result) => {
        if (err) {
            console.error("❌ Erro Pedido:", err);
            return res.status(500).json(err);
        }
        const pedidoId = result.insertId;
        
        const itensValues = itens.map(i => [pedidoId, i.id, i.quantidade, i.preco]);
        const sqlItens = 'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ?';
        
        db.query(sqlItens, [itensValues], (errItens) => {
            if (errItens) {
                console.error("❌ Erro Itens:", errItens);
                return res.status(500).json(errItens);
            }
            res.json({ success: true, pedidoId });
        });
    });
});

// --- ROTAS ADMIN ---

app.get('/api/admin/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/admin/pedidos', (req, res) => {
    const sql = `SELECT p.*, u.nome as cliente_nome, u.email as cliente_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.data_pedido DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put('/api/admin/pedidos/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.post('/api/admin/produtos', (req, res) => {
    const { id, nome, preco, imagem, esgotado, categoria } = req.body;
    const catMap = { 'Sopas e Pratos': 1, 'Bebidas': 2, 'Sobremesas': 3 };
    const catId = catMap[categoria] || 1;

    // Converte booleano true/false para 1/0 do MySQL
    const esgotadoBit = esgotado ? 1 : 0;

    if (id) {
        db.query('UPDATE produtos SET nome=?, preco=?, imagem=?, esgotado=?, categoria_id=? WHERE id=?', [nome, preco, imagem, esgotadoBit, catId, id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    } else {
        db.query('INSERT INTO produtos (nome, preco, imagem, esgotado, categoria_id) VALUES (?, ?, ?, ?, ?)', [nome, preco, imagem, esgotadoBit, catId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    }
});

app.delete('/api/admin/produtos/:id', (req, res) => {
    db.query('DELETE FROM produtos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Configuração para Vercel
if (require.main === module) {
    app.listen(3000, () => console.log('🚀 Rodando localmente em http://localhost:3000'));
}

module.exports = app;