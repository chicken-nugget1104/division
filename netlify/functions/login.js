const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  try {
    const { username, password } = JSON.parse(event.body);

    // Retrieve all users with the matching username
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (!usersData || usersData.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid username or password.' }),
      };
    }

    // Find the user with the matching plain text password
    const validUser = usersData.find(user => user.password === password);

    if (!validUser) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid username or password.' }),
      };
    }

    // Update login details
    const currentDate = new Date();
    let moons = validUser.moons;
    let loginStreak = validUser.login_streak || 0;

    if (validUser.last_login) {
      const lastLoginDate = new Date(validUser.last_login);
      const diffDays = Math.floor((currentDate - lastLoginDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        loginStreak += 1;
      } else if (diffDays > 1) {
        loginStreak = 1;
      }

      if (loginStreak >= 5) {
        moons += 5;
        loginStreak = 0;
      }
    } else {
      loginStreak = 1;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: currentDate, moons, login_streak: loginStreak })
      .eq('id', validUser.id);

    if (updateError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: updateError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ user: { ...validUser } }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request.' }),
    };
  }
};
