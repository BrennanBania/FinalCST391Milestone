const db = require('./db');

async function updateUserToAdmin() {
  try {
    console.log('Updating user to admin role...');
    
    const result = await db.query(
      `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING user_id, username, email, role`,
      ['navarrobania@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User updated to admin:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ User not found with that email');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

updateUserToAdmin();
