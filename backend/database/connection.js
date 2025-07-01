import { Sequelize } from "sequelize";
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } from "../config/env.js";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
  // logging: process.env.NODE_ENV === "development", // Enable logging in development mode
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

export default sequelize;
