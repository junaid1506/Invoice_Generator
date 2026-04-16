import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    description: String,
    quantity: Number,
    price: Number,
    amount: Number,
    hsn_sac: String,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, default: '' },
    clientPhone: { type: String, default: '' },
    clientAddress: { type: String, default: '' },
    dueDate: { type: String, required: true },
    items: [itemSchema],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'pending', 'paid', 'overdue', 'rejected'],
      default: 'draft',
    },
    terms: [String],
    isGst: { type: String, enum: ['yes', 'no'], default: 'no' },
    gstNumber: { type: String, default: null },
    clientState: { type: String, default: null },
    companyState: { type: String, default: null },

    // Snapshot of “Your Company Details” at invoice creation time
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    companyGstin: { type: String, default: '' },

    // GST payment details
    gstBankName: { type: String, default: '' },
    gstAccountName: { type: String, default: '' },
    gstAccountNo: { type: String, default: '' },
    gstIfsc: { type: String, default: '' },
    gstBranch: { type: String, default: '' },

    // Non-GST payment details
    nongstBankName: { type: String, default: '' },
    nongstAccountName: { type: String, default: '' },
    nongstAccountNo: { type: String, default: '' },
    nongstIfsc: { type: String, default: '' },
    nongstUpi: { type: String, default: '' },

    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    hsnSac: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.index({ number: 1 });

export default mongoose.model('Invoice', invoiceSchema);
