import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // Basic company details
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    companyGstin: { type: String, default: '' },

    // Used for GST calculations (same-state vs inter-state)
    companyHomeState: { type: String, default: 'Delhi' },

    // GST payment details (used when invoice.isGst === "yes")
    gstBankName: { type: String, default: '' },
    gstAccountName: { type: String, default: '' },
    gstAccountNo: { type: String, default: '' },
    gstIfsc: { type: String, default: '' },
    gstBranch: { type: String, default: '' },

    // Non-GST payment details (used when invoice.isGst === "no")
    nongstBankName: { type: String, default: '' },
    nongstAccountName: { type: String, default: '' },
    nongstAccountNo: { type: String, default: '' },
    nongstIfsc: { type: String, default: '' },
    nongstUpi: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);

