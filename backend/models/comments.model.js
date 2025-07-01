import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Comment = sequelize.define(
  "Comment",
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
    jam_post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jam_posts",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "comments",
    timestamps: true,
  }
);

export default Comment;
