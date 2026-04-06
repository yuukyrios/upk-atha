// createAdmin.js (utility script)
const pool = require('./src/config/database');
const { hashPassword } = require('./src/utils/passwordUtils');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function createAdmin() {
    try {
        console.log('🤖 MechaDex Admin Creator\n');

        const nickname = await question('Enter admin nickname: ');
        const password = await question('Enter admin password: ');
        const email = await question('Enter admin email (optional): ');

        if (!nickname || !password) {
            console.log('❌ Nickname and password are required');
            process.exit(1);
        }

        const passwordHash = await hashPassword(password);

        const [result] = await pool.execute(
            'INSERT INTO users (nickname, password_hash, email, user_type) VALUES (?, ?, ?, ?)',
            [nickname, passwordHash, email || null, 'admin']
        );

        console.log(`\n✅ Admin user created successfully!`);
        console.log(`   User ID: ${result.insertId}`);
        console.log(`   Nickname: ${nickname}`);
        
        rl.close();
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('❌ Error: Nickname or email already exists');
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
        rl.close();
        process.exit(1);
    }
}

createAdmin();