import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User, { USER_ROLES } from '../models/User.js';
import MaintenanceRequest, {
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
} from '../models/MaintenanceRequest.js';
import {
  isDuplicateKeyError,
  publicUser,
  validatePassword,
  validateProfile,
} from '../utils/auth.js';
import HttpError from '../utils/HttpError.js';

const TECHNICIAN_ROLES = Object.freeze([
  USER_ROLES.ICT_TECHNICIAN,
  USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD,
]);

function queryValue(value, label) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${label} must be a single value.`);
  }
  return value;
}

function publicRequest(request) {
  const id = String(request._id ?? request.id);
  const reference = (value) => value == null
    ? null
    : String(value._id ?? value.id ?? value);

  return {
    id,
    title: request.title,
    category: request.category,
    description: request.description,
    building: request.building,
    room: request.room,
    priority: request.priority,
    status: request.status,
    requester: reference(request.requester),
    assignedTechnician: reference(request.assignedTechnician),
    attachmentUrl: request.attachmentUrl ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export function createAdminController(
  UserModel = User,
  RequestModel = MaintenanceRequest,
) {
  return {
    stats: async (req, res) => {
      const [
        totalUsers,
        totalStaff,
        totalTechnicians,
        totalRequests,
        pendingRequests,
        completedRequests,
      ] = await Promise.all([
        UserModel.countDocuments({}),
        UserModel.countDocuments({ role: USER_ROLES.STAFF }),
        UserModel.countDocuments({ role: USER_ROLES.ICT_TECHNICIAN }),
        RequestModel.countDocuments({}),
        RequestModel.countDocuments({ status: 'PENDING' }),
        RequestModel.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } }),
      ]);

      return res.status(200).json({
        stats: {
          totalUsers,
          totalStaff,
          totalTechnicians,
          totalRequests,
          pendingRequests,
          completedRequests,
        },
      });
    },

    listUsers: async (req, res) => {
      const filter = {};
      if (req.query.role !== undefined) {
        const role = queryValue(req.query.role, 'role');
        if (!Object.values(USER_ROLES).includes(role)) {
          throw new HttpError(400, 'A valid user role is required.');
        }
        filter.role = role;
      }

      if (req.query.search !== undefined) {
        const search = queryValue(req.query.search, 'search').trim();
        if (search.length > 100) {
          throw new HttpError(400, 'Search must be no more than 100 characters.');
        }
        if (search) {
          const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchField = { $regex: escapedSearch, $options: 'i' };
          filter.$or = [
            { fullName: searchField },
            { email: searchField },
            { department: searchField },
          ];
        }
      }

      const users = await UserModel.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({ users: users.map(publicUser) });
    },

    listRequests: async (req, res) => {
      const filter = {};
      const filters = [
        ['status', REQUEST_STATUSES],
        ['category', REQUEST_CATEGORIES],
        ['priority', REQUEST_PRIORITIES],
      ];

      for (const [field, values] of filters) {
        if (req.query[field] === undefined) continue;
        const value = queryValue(req.query[field], field);
        if (!values.includes(value)) {
          throw new HttpError(400, `A valid request ${field} is required.`);
        }
        filter[field] = value;
      }

      const requests = await RequestModel.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({ requests: requests.map(publicRequest) });
    },

    createUser: async (req, res) => {
      const body = req.body ?? {};
      if (!TECHNICIAN_ROLES.includes(body.role)) {
        throw new HttpError(400, 'Role must be ICT_TECHNICIAN or ICT_TECHNICIAN_TEAM_LEAD.');
      }

      const profile = validateProfile(body);
      validatePassword(body.password);
      if (body.password !== body.confirmPassword) {
        throw new HttpError(400, 'Passwords do not match.');
      }

      try {
        const user = await UserModel.create({
          ...profile,
          password: await bcrypt.hash(body.password, 12),
          role: body.role,
          isActive: true,
        });
        return res.status(201).json({ user: publicUser(user) });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new HttpError(409, 'An account with this email already exists.');
        }
        throw error;
      }
    },

    updateUserStatus: async (req, res) => {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        throw new HttpError(400, 'Invalid user identifier.');
      }

      const { isActive } = req.body ?? {};
      if (typeof isActive !== 'boolean') {
        throw new HttpError(400, 'isActive must be a boolean.');
      }

      const target = await UserModel.findById(id);
      if (!target) throw new HttpError(404, 'User not found.');

      if (
        String(req.user._id ?? req.user.id).toLowerCase() === id.toLowerCase() &&
        !isActive
      ) {
        throw new HttpError(400, 'You cannot deactivate your own account.');
      }

      if (
        target.role === USER_ROLES.ICT_ADMIN &&
        target.isActive &&
        !isActive &&
        await UserModel.countDocuments({
          role: USER_ROLES.ICT_ADMIN,
          isActive: true,
        }) <= 1
      ) {
        throw new HttpError(409, 'The last active ICT Admin cannot be deactivated.');
      }

      target.isActive = isActive;
      await target.save();
      return res.status(200).json({ user: publicUser(target) });
    },
  };
}
