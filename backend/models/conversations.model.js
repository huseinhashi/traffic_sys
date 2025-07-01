import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Conversation = sequelize.define(
  "Conversation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "conversations",
    timestamps: true,
  }
);

export default Conversation;
