import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import JamPost from "./jamPosts.model.js";
import User from "./users.model.js";

const JamPostApproval = sequelize.define(
  "JamPostApproval",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jam_post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "jam_posts", key: "id" },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("approve", "disapprove"),
      allowNull: false,
    },
  },
  {
    tableName: "jam_post_approvals",
    timestamps: true,
    indexes: [{ unique: true, fields: ["jam_post_id", "user_id"] }],
  }
);

JamPost.hasMany(JamPostApproval, { foreignKey: "jam_post_id" });
JamPostApproval.belongsTo(JamPost, { foreignKey: "jam_post_id" });
User.hasMany(JamPostApproval, { foreignKey: "user_id" });
JamPostApproval.belongsTo(User, { foreignKey: "user_id" });

export default JamPostApproval;
