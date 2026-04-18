require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'NexoLearn API is running' });
});

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Role middleware
const requireRole = (roles) => async (req, res, next) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !roles.includes(data.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

// Profile routes
app.get('/profile', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/profile', authenticate, async (req, res) => {
  const { full_name, bio, avatar_url } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, bio, avatar_url, updated_at: new Date() })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Courses routes
app.get('/courses', async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
    .eq('is_published', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/courses/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('courses')
    .select('*, course_content(*)')
    .eq('id', id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Check if user purchased or is creator
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('course_id', id)
    .single();

  if (!purchase && data.creator_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(data);
});

app.post('/courses', authenticate, requireRole(['teacher', 'admin']), async (req, res) => {
  const { title, description, price, category, thumbnail_url } = req.body;
  const { data, error } = await supabase
    .from('courses')
    .insert({ title, description, price, category, thumbnail_url, creator_id: req.user.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/courses/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { data: course } = await supabase
    .from('courses')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (course.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const updates = req.body;
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Purchases
app.post('/purchase/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;

  // Check if already purchased
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('course_id', courseId)
    .single();

  if (existing) return res.status(400).json({ error: 'Already purchased' });

  // Get course price
  const { data: course } = await supabase
    .from('courses')
    .select('price')
    .eq('id', courseId)
    .single();

  // Get user credits
  const { data: credits } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', req.user.id)
    .single();

  if (!credits || credits.balance < course.price) return res.status(400).json({ error: 'Insufficient credits' });

  // Deduct credits
  await supabase
    .from('credits')
    .update({ balance: credits.balance - course.price })
    .eq('user_id', req.user.id);

  // Add transaction
  await supabase
    .from('transactions')
    .insert({ user_id: req.user.id, amount: -course.price, type: 'purchase', description: `Purchased course ${courseId}` });

  // Add purchase
  const { data, error } = await supabase
    .from('purchases')
    .insert({ user_id: req.user.id, course_id: courseId, amount: course.price })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Credits
app.get('/credits', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/transactions', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});