import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

// Models
import User from "./users.model.js";
import JamPost from "./jamPosts.model.js";
import Comment from "./comments.model.js";
import Reaction from "./reactions.model.js";
import Conversation from "./conversations.model.js";
import Message from "./messages.model.js";
import JamPostApproval from "./jamPostApprovals.model.js";

// User - JamPost relationships
User.hasMany(JamPost, { foreignKey: "user_id" });
JamPost.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User - Comment relationships
User.hasMany(Comment, { foreignKey: "user_id" });
Comment.belongsTo(User, { foreignKey: "user_id", as: "user" });

// JamPost - Comment relationships
JamPost.hasMany(Comment, { foreignKey: "jam_post_id" });
Comment.belongsTo(JamPost, { foreignKey: "jam_post_id", as: "jamPost" });

// User - Reaction relationships
User.hasMany(Reaction, { foreignKey: "user_id" });
Reaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

// JamPost - Reaction relationships
JamPost.hasMany(Reaction, { foreignKey: "jam_post_id" });
Reaction.belongsTo(JamPost, { foreignKey: "jam_post_id", as: "jamPost" });

// Conversation - Message relationships
Conversation.hasMany(Message, {
  foreignKey: "conversation_id",
  as: "messages",
});
Message.belongsTo(Conversation, {
  foreignKey: "conversation_id",
  as: "conversation",
});

// User - Message relationships (sender)
User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// Conversation - User relationships (direct messages between two users)
User.hasMany(Conversation, {
  foreignKey: "user1_id",
  as: "ConversationsAsUser1",
});
User.hasMany(Conversation, {
  foreignKey: "user2_id",
  as: "ConversationsAsUser2",
});
Conversation.belongsTo(User, { foreignKey: "user1_id", as: "user1" });
Conversation.belongsTo(User, { foreignKey: "user2_id", as: "user2" });

export {
  User,
  JamPost,
  Comment,
  Reaction,
  Conversation,
  Message,
  JamPostApproval,
  sequelize,
};
