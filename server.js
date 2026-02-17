require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware para verificar token y pasar usuario
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });
    req.user = data.user;
    next();
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

// Ruta ejemplo para obtener leads activos del usuario
app.get('/api/leads', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('asignado_a', req.user.id)
      .limit(100);
    if (error) return res.status(500).json(error);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

app.post('/api/leads', authMiddleware, async (req, res) => {
  try {
    const lead = req.body;
    lead.asignado_a = req.user.id;
    const { data, error } = await supabase.from('leads').insert([lead]);
    if (error) return res.status(400).json(error);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear lead' });
  }
});

// Puerto para servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
