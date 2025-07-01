import sequelize from "./connection.js";
import { User } from "../models/index.js";

const seedDatabase = async () => {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log("Database connected successfully!");

    // Clear existing data (optional, for development only)
    //seed the first user just check if their admin user if not create admin user
    const adminUser = await User.findOne({ where: { role: "admin" } });
    if (!adminUser) {
      await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin123",
        role: "admin",
      });
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists!");
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

export default seedDatabase;
