const mongoose = require('mongoose');

// Department mapping from initial categories
const CATEGORY_DEPARTMENT_MAP = {
  Roads: 'Public Works & Roads',
  'Waste Management': 'Waste Management',
  'Water Supply': 'Water Supply & Sanitation',
  Electricity: 'Electricity & Power',
  'Public Safety': 'General Administration',
  Environment: 'Health & Environment',
  'Street Lighting': 'Electricity & Power',
  Drainage: 'Water Supply & Sanitation',
  Other: 'General Administration',
};

const grievanceSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the grievance'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a grievance category'],
      enum: [
        'Roads',
        'Waste Management',
        'Water Supply',
        'Electricity',
        'Public Safety',
        'Environment',
        'Street Lighting',
        'Drainage',
        'Other',
      ],
      index: true,
    },
    department: {
      type: String,
      required: true,
      enum: [
        'Public Works & Roads',
        'Waste Management',
        'Water Supply & Sanitation',
        'Electricity & Power',
        'Health & Environment',
        'Traffic & Transport',
        'General Administration',
        'None',
      ],
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected',
      ],
      default: 'Submitted',
      index: true,
    },
    location: {
      address: {
        type: String,
        required: [true, 'Please provide the incident address/landmark'],
        trim: true,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      landmark: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        default: 'Bhubaneswar',
      },
      ward: {
        type: String,
        default: '',
      },
      pincode: {
        type: String,
        trim: true,
        default: '',
      },
    },
    images: [
      {
        type: String, // base64 or URL
      },
    ],
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    aiAnalysis: {
      category: { type: String, default: null },
      department: { type: String, default: null },
      priority: { type: String, default: null },
      summary: { type: String, default: null },
      suggestedAction: { type: String, default: null },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
      confidenceScore: { type: Number, default: 0.9 },
      analyzedAt: { type: Date, default: null },
      rawResponse: { type: String, select: false },
    },
    resolution: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      actionTaken: {
        type: String,
        default: '',
      },
      remarks: {
        type: String,
        default: '',
      },
      resolutionProofImages: [
        {
          type: String,
        },
      ],
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: {
          type: String,
          default: '',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: auto-generate tracking ID and map default department if empty
grievanceSchema.pre('validate', function (next) {
  if (!this.department && this.category) {
    this.department = CATEGORY_DEPARTMENT_MAP[this.category] || 'General Administration';
  }

  if (!this.trackingId) {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().getFullYear();
    this.trackingId = `CIVIC-${dateStr}-${randomHex}`;
  }

  next();
});

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = { Grievance, CATEGORY_DEPARTMENT_MAP };
