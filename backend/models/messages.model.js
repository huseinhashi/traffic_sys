import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "conversations",
        key: "id",
      },
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    message_type: {
      type: DataTypes.ENUM("text", "image", "text_image"),
      defaultValue: "text",
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  }
);

export default Message;
