import { Sequelize } from 'sequelize';
import sqlJsAsSqlite3 from 'sql.js-as-sqlite3';
import fs from 'fs';

const getFirstEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
};

const getBooleanEnv = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const dbType = getFirstEnv('DB_TYPE', 'DB_DIALECT') || 'mysql';
const dbHost = getFirstEnv('DB_HOST', 'MYSQL_HOST', 'RDS_HOSTNAME');
const dbName = getFirstEnv('DB_NAME', 'MYSQL_DATABASE', 'RDS_DB_NAME');
const dbUsername = getFirstEnv('DB_USER', 'DB_USERNAME', 'MYSQL_USER', 'RDS_USERNAME');
const dbPassword = getFirstEnv('DB_PASSWORD', 'MYSQL_PASSWORD', 'RDS_PASSWORD');
const dbPort = Number.parseInt(getFirstEnv('DB_PORT', 'MYSQL_PORT', 'RDS_PORT') || '', 10);
const isUsingExternalDatabase = Boolean(dbHost && dbName && dbUsername && dbPassword);
const defaultPorts = {
  mysql: 3306,
  postgres: 5432,
};
const defaultPort = defaultPorts[dbType];

export let sequelize;

if (isUsingExternalDatabase) {
  const useSsl = getBooleanEnv(process.env.DB_SSL);

  sequelize = new Sequelize({
    database: dbName,
    username: dbUsername,
    password: dbPassword,
    host: dbHost,
    port: Number.isFinite(dbPort) ? dbPort : defaultPort,
    dialect: dbType,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: getBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true)
          }
        }
      : undefined,
    logging: false
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlJsAsSqlite3,
    logging: false
  });

  // Save database to file after write operations.
  sequelize.addHook('afterCreate', saveDatabaseToFile);
  sequelize.addHook('afterDestroy', saveDatabaseToFile);
  sequelize.addHook('afterUpdate', saveDatabaseToFile);
  sequelize.addHook('afterSave', saveDatabaseToFile);
  sequelize.addHook('afterUpsert', saveDatabaseToFile);
  sequelize.addHook('afterBulkCreate', saveDatabaseToFile);
  sequelize.addHook('afterBulkDestroy', saveDatabaseToFile);
  sequelize.addHook('afterBulkUpdate', saveDatabaseToFile);
}

export async function saveDatabaseToFile() {
  const dbInstance = await sequelize.connectionManager.getConnection();
  const binaryArray = dbInstance.database.export();
  const buffer = Buffer.from(binaryArray);
  fs.writeFileSync('database.sqlite', buffer);
}
