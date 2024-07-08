const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  const { username, password, email } = JSON.parse(event.body);

  // Hash the password
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password: hashedPassword, email, moons: 25 }]);

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }

  // Auto-login the user
  return {
    statusCode: 200,
    body: JSON.stringify({ user: data[0] }),
  };
};
