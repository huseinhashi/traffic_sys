import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const JamPost = sequelize.define(
  "JamPost",
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
        model: "users",
        key: "id",
      },
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
      allowNull: false,
    },
  },
  {
    tableName: "jam_posts",
    timestamps: true,
  }
);

export default JamPost;
