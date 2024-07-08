const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  console.log('Event Body:', event.body);

  try {
    const { username, password } = JSON.parse(event.body);
    console.log('Parsed Username:', username);

    // Hash the password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    console.log('Hashed Password:', hashedPassword);

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Supabase Error:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (!userData) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid username or password.' }),
      };
    }

    // Check hashed password
    if (userData.password !== hashedPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid username or password.' }),
      };
    }

    const currentDate = new Date();
    let moons = userData.moons;
    let loginStreak = userData.login_streak;

    if (userData.last_login) {
      const lastLoginDate = new Date(userData.last_login);
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

    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: currentDate, moons, login_streak: loginStreak })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Update Error:', updateError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: updateError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ user: { ...userData } }),
    };
  } catch (error) {
    console.error('Catch Error:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request.' }),
    };
  }
};
