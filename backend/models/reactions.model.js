import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Reaction = sequelize.define(
  "Reaction",
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
    reaction_type: {
      type: DataTypes.ENUM("like", "dislike", "helpful", "accurate"),
      allowNull: false,
    },
  },
  {
    tableName: "reactions",
    timestamps: true,
  }
);

export default Reaction;
