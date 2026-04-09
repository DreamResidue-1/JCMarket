import '../config.js';
import { sequelize } from '../models/index.js';
import { User } from '../models/User.js';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const all = await User.findAll();
    const exampleUsers = all.filter(u => typeof u.email === 'string' && u.email.endsWith('@example.com'));

    if (exampleUsers.length === 0) {
      console.log('No users with @example.com found.');
      await sequelize.close();
      return process.exit(0);
    }

    for (const user of exampleUsers) {
      const hasCode = !!user.passwordResetCodeHash || !!user.passwordResetCodeExpiresAt;
      console.log(`User: id=${user.id} email=${user.email} resetActive=${hasCode}`);

      if (hasCode) {
        user.passwordResetCodeHash = null;
        user.passwordResetCodeExpiresAt = null;
        await user.save();
        console.log(`  -> cleared reset code for ${user.email}`);
      }
    }

    await sequelize.close();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

main();
