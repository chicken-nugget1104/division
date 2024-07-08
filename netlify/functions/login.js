const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qqzriultfznavgjtzphj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  const { email, password } = JSON.parse(event.body);

  const { session, error } = await supabase.auth.signIn({
    email,
    password,
  });

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ session }),
  };
};
