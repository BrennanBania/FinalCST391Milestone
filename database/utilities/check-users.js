const db = require('./db');

async function checkUsers() {
  try {
    console.log('Checking all users with navarrobania@gmail.com...\n');
    
    const result = await db.query(
      `SELECT user_id, username, email, role, created_at FROM users WHERE email LIKE '%navarrobania%' ORDER BY user_id`
    );
    
    console.log(`Found ${result.rows.length} user(s):\n`);
    result.rows.forEach(user => {
      console.log(`ID: ${user.user_id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();
