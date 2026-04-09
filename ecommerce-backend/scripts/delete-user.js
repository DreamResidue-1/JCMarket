import '../config.js';
import { sequelize } from '../models/index.js';
import { User } from '../models/User.js';

const emailToDelete = 'jmalaldynalqady145@gmail.com';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const normalized = emailToDelete.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalized } });

    if (!user) {
      console.log(`No user found with email ${normalized}`);
      await sequelize.close();
      process.exit(0);
    }

    console.log(`Found user: id=${user.id} email=${user.email}`);
    await user.destroy();
    console.log(`Deleted user with email ${normalized}`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error deleting user:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

main();
