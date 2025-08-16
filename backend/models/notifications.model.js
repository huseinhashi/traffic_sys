import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import User from "./users.model.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    jam_post_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "jam_posts",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("nearby_jam", "jam_update", "jam_resolved", "general"),
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    distance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Distance in meters from user to jam",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);

export default Notification; 