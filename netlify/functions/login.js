const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  const { username, password } = JSON.parse(event.body);

  // Hash the password
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', hashedPassword)
    .single();

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }

  const currentDate = new Date();
  let moons = data.moons;
  let loginStreak = data.login_streak;

  // Check if the user logged in yesterday to continue the streak
  if (data.last_login) {
    const lastLoginDate = new Date(data.last_login);
    const diffDays = Math.floor((currentDate - lastLoginDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      loginStreak += 1;
    } else if (diffDays > 1) {
      loginStreak = 1;
    }

    if (loginStreak >= 5) {
      moons += 5; // Add bonus moons for 5-day streak
    }
  } else {
    loginStreak = 1;
  }

  // Update the user's last login and moons
  const { error: updateError } = await supabase
    .from('users')
    .update({ last_login: currentDate, moons, login_streak: loginStreak })
    .eq('id', data.id);

  if (updateError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: updateError.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ user: data }),
  };
};
