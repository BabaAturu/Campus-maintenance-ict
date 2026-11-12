import bcrypt from 'bcryptjs';
import User, { USER_ROLES } from '../models/User.js';
import {
  isDuplicateKeyError,
  publicUser,
  validatePassword,
  validateProfile,
} from '../utils/auth.js';
import HttpError from '../utils/HttpError.js';

function createRoleHandler(UserModel, role) {
  return async (req, res) => {
    const profile = validateProfile(req.body ?? {});
    validatePassword(req.body?.password);
    if (req.body.password !== req.body.confirmPassword) {
      throw new HttpError(400, 'Passwords do not match.');
    }

    try {
      const user = await UserModel.create({
        ...profile,
        password: await bcrypt.hash(req.body.password, 12),
        role,
        isActive: true,
      });
      return res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new HttpError(409, 'An account with this email already exists.');
      }
      throw error;
    }
  };
}

export function createUserController(UserModel = User) {
  return {
    list: async (req, res) => {
      const users = await UserModel.find({});
      return res.status(200).json({ users: users.map(publicUser) });
    },

    createTeamLead: createRoleHandler(UserModel, USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD),

    createTechnician: createRoleHandler(UserModel, USER_ROLES.ICT_TECHNICIAN),

    updateStatus: async (req, res) => {
      const { userId } = req.params;
      const { isActive } = req.body ?? {};
      if (typeof isActive !== 'boolean') {
        throw new HttpError(400, 'isActive must be a boolean.');
      }
      if (String(req.user._id ?? req.user.id) === userId && !isActive) {
        throw new HttpError(400, 'You cannot deactivate your own account.');
      }

      const target = await UserModel.findById(userId);
      if (!target) throw new HttpError(404, 'User not found.');
      if (
        target.role === USER_ROLES.ICT_ADMIN &&
        target.isActive &&
        !isActive &&
        await UserModel.countDocuments({ role: USER_ROLES.ICT_ADMIN, isActive: true }) <= 1
      ) {
        throw new HttpError(409, 'The last active ICT Admin cannot be deactivated.');
      }

      target.isActive = isActive;
      await target.save();
      return res.status(200).json({ user: publicUser(target) });
    },

    updateRole: async (req, res) => {
      const { userId } = req.params;
      const { role } = req.body ?? {};
      if (!Object.values(USER_ROLES).includes(role)) {
        throw new HttpError(400, 'A valid user role is required.');
      }

      const target = await UserModel.findById(userId);
      if (!target) throw new HttpError(404, 'User not found.');
      if (
        String(req.user._id ?? req.user.id) === userId &&
        target.role !== role
      ) {
        throw new HttpError(400, 'You cannot change your own role.');
      }
      if (
        target.role === USER_ROLES.ICT_ADMIN &&
        target.isActive &&
        role !== USER_ROLES.ICT_ADMIN &&
        await UserModel.countDocuments({ role: USER_ROLES.ICT_ADMIN, isActive: true }) <= 1
      ) {
        throw new HttpError(409, 'The last active ICT Admin cannot be demoted.');
      }

      target.role = role;
      await target.save();
      return res.status(200).json({ user: publicUser(target) });
    },
  };
}
