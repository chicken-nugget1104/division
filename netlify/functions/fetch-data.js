import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qqzriultfznavgjtzphj.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async function(event, context) {
  const { data, error } = await supabase.from('your_table').select('*');

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
