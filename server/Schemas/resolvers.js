const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

// resolvers.js: Define the query and mutation functionality to work with the Mongoose models.
// Hint: Use the functionality in the user-controller.js as a guide.

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("thoughts");
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookInput }, context) => {
      if (!context.user) {
        throw new AuthenticationError("Login First!");
      } else {
        const newBookUser = User.findByIdAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: {
              savedBooks: bookInput,
            },
          },
          { new: true }
        );
        return newBookUser;
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError("Login First!");
      } else {
        const newBookUser = User.findByIdAndUpdate(
          { _id: context.user._id },
          {
            $pull: {
              savedBooks: {
                bookId: bookId,
              },
            },
          },
          {
            new: true,
          }
        );
        return newBookUser;
      }
    },
  },
};

module.exports = resolvers;
