-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  avatar_url TEXT,
  whatsapp TEXT,
  interests TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (needed for matching algorithm)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- Courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy: Published courses viewable by all, unpublished only by creator
CREATE POLICY "Published courses are viewable by everyone" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Creators can view their own courses" ON courses FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Teachers can create courses" ON courses FOR INSERT WITH CHECK (auth.uid() = creator_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));
CREATE POLICY "Creators can update their courses" ON courses FOR UPDATE USING (auth.uid() = creator_id);

-- Course content (lessons)
CREATE TABLE course_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- or JSON for structured content
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course content viewable by purchasers" ON course_content FOR SELECT USING (
  EXISTS (SELECT 1 FROM purchases WHERE user_id = auth.uid() AND course_id = course_content.course_id)
  OR auth.uid() = (SELECT creator_id FROM courses WHERE id = course_content.course_id)
);

-- Purchases table
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credits table
CREATE TABLE credits (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0)
);

-- Enable RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credits" ON credits FOR SELECT USING (auth.uid() = user_id);

-- Transactions table for credits history
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('earn', 'spend', 'purchase', 'refund')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_courses_creator ON courses(creator_id);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_course_content_course ON course_content(course_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Conversations table for private messaging
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT unique_conversation UNIQUE(LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
-- Policy: Users can create conversations involving themselves
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
-- Policy: Users can update conversations they're part of
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
) WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages table for live chat
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c
          WHERE c.id = messages.conversation_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);
-- Policy: Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM conversations c
          WHERE c.id = conversation_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);
-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

-- Matches table for connections between users
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'done')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT unique_match UNIQUE(LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
);

-- Enable RLS on matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view matches they're involved in
CREATE POLICY "Users can view their matches" ON matches FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
-- Policy: Users can insert matches involving themselves
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
-- Policy: Users can update matches they're involved in
CREATE POLICY "Users can update their matches" ON matches FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
) WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
-- Policy: Users can delete matches they're involved in
CREATE POLICY "Users can delete their matches" ON matches FOR DELETE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Index for better performance
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Trigger to update matches updated_at
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversations updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation last_message_at when new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update conversation last_message_at on new messages
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();