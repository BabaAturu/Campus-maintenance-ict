import mongoose from 'mongoose';

export const REQUEST_CATEGORIES = Object.freeze([
  'Computer Hardware',
  'Software & Operating System',
  'Network & Internet',
  'Printer & Scanner',
  'Server & Storage',
  'ICT Classroom & Laboratory Equipment',
  'ICT Security & Other Technical Issues',
]);

export const REQUEST_PRIORITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const REQUEST_STATUSES = Object.freeze([
  'SUBMITTED',
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
]);

const maintenanceRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, required: true, enum: REQUEST_CATEGORIES },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    building: { type: String, required: true, trim: true, maxlength: 160 },
    room: { type: String, required: true, trim: true, maxlength: 40 },
    priority: { type: String, required: true, enum: REQUEST_PRIORITIES },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'SUBMITTED',
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

maintenanceRequestSchema.index({ requester: 1, createdAt: -1 });

const MaintenanceRequest = mongoose.models.MaintenanceRequest ||
  mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;
