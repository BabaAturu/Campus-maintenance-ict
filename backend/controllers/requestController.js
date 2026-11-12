import mongoose from 'mongoose';
import MaintenanceRequest, {
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
} from '../models/MaintenanceRequest.js';
import HttpError from '../utils/HttpError.js';

const FIELD_LIMITS = Object.freeze({
  title: 140,
  description: 3000,
  building: 160,
  room: 40,
});

function validateRequest(body) {
  const values = {};
  const errors = {};

  for (const [field, maxLength] of Object.entries(FIELD_LIMITS)) {
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (!value) {
      errors[field] = `${field} is required.`;
    } else if (value.length > maxLength) {
      errors[field] = `${field} must be no more than ${maxLength} characters.`;
    } else {
      values[field] = value;
    }
  }

  if (!REQUEST_CATEGORIES.includes(body.category)) {
    errors.category = 'A valid ICT request category is required.';
  } else {
    values.category = body.category;
  }

  if (!REQUEST_PRIORITIES.includes(body.priority)) {
    errors.priority = 'Priority must be LOW, MEDIUM, HIGH, or URGENT.';
  } else {
    values.priority = body.priority;
  }

  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Please correct the request details.');
  }

  return values;
}

function requesterId(user) {
  return String(user._id ?? user.id);
}

export function createRequestController(RequestModel = MaintenanceRequest) {
  return {
    create: async (req, res) => {
      const details = validateRequest(req.body ?? {});
      const request = await RequestModel.create({
        ...details,
        requester: requesterId(req.user),
      });
      return res.status(201).json({ request });
    },

    listMine: async (req, res) => {
      const requests = await RequestModel.find({ requester: requesterId(req.user) })
        .sort({ createdAt: -1 });
      return res.status(200).json({ requests });
    },

    getOne: async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) {
        throw new HttpError(400, 'Invalid request identifier.');
      }

      const request = await RequestModel.findById(req.params.id);
      if (!request || String(request.requester?._id ?? request.requester) !== requesterId(req.user)) {
        throw new HttpError(404, 'Request not found.');
      }
      return res.status(200).json({ request });
    },
  };
}
