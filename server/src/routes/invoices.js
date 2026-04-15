import { Router } from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { logAction } from "../utils/logAction.js";
import { COMPANY_HOME_STATE, FIXED_HSN_SAC } from "../config.js";
import {
  buildLineItems,
  computeTax,
  nextInvoiceNumber,
  resolveTerms,
} from "../utils/invoiceHelpers.js";

const router = Router();
router.use(authRequired);

function todayStr() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function markOverdueForQuery(filter) {
  const today = todayStr();
  await Invoice.updateMany(
    { ...filter, status: "pending", dueDate: { $lt: today } },
    { $set: { status: "overdue" } },
  );
}

function serializeInvoice(doc, userName = null) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const id = o._id?.toString?.() ?? o._id;
  return {
    id,
    userId: o.userId?.toString?.() ?? o.userId,
    userName: userName ?? undefined,
    number: o.number,
    clientName: o.clientName,
    clientEmail: o.clientEmail,
    clientPhone: o.clientPhone,
    clientAddress: o.clientAddress,
    dueDate: o.dueDate,
    items: o.items || [],
    subtotal: o.subtotal,
    taxRate: o.taxRate,
    taxAmount: o.taxAmount,
    total: o.total,
    status: o.status,
    terms: o.terms || [],
    isGst: o.isGst,
    gstNumber: o.gstNumber,
    clientState: o.clientState,
    companyState: o.companyState,
    cgst: o.cgst,
    sgst: o.sgst,
    igst: o.igst,
    hsnSac: o.hsnSac,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function statsForFilter(filter) {
  const agg = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        submitted: {
          $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] },
        },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        revenue: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] },
        },
      },
    },
  ]);
  const s = agg[0] || {};
  return {
    total: s.total || 0,
    paid: s.paid || 0,
    pending: s.pending || 0,
    overdue: s.overdue || 0,
    draft: s.draft || 0,
    submitted: s.submitted || 0,
    rejected: s.rejected || 0,
    revenue: s.revenue || 0,
  };
}

router.get("/stats", async (req, res) => {
  try {
    const isAdmin = req.userRole === "admin";
    const filter = isAdmin
      ? {}
      : { userId: new mongoose.Types.ObjectId(req.userId) };
    await markOverdueForQuery(filter);
    const stats = await statsForFilter(filter);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const isAdmin = req.userRole === "admin";
    const filter = isAdmin ? {} : { userId: req.userId };
    await markOverdueForQuery(filter);

    let list;
    if (isAdmin) {
      list = await Invoice.find(filter)
        .sort({ createdAt: -1 })
        .populate("userId", "name")
        .lean();
    } else {
      list = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    }

    const invoices = list.map((row) => {
      const userName =
        isAdmin && row.userId?.name ? row.userId.name : undefined;
      const userIdStr = row.userId?._id
        ? row.userId._id.toString()
        : String(row.userId);
      return serializeInvoice({ ...row, userId: userIdStr }, userName);
    });

    res.json({ invoices });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate("userId", "name")
      .lean();
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    const ownerId = inv.userId?._id?.toString?.() || inv.userId?.toString?.();
    if (req.userRole !== "admin" && ownerId !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const userName = inv.userId?.name;
    const plain = { ...inv, userId: ownerId };
    res.json({
      invoice: serializeInvoice(
        plain,
        req.userRole === "admin" ? userName : null,
      ),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const clientName = (body.clientName || "").trim();
    const dueDate = body.dueDate;
    if (!clientName || !dueDate) {
      return res
        .status(400)
        .json({ message: "Client name and due date are required" });
    }

    const isGst = body.invoiceType === "gst";
    const gstNumber =
      isGst && body.gstNumber
        ? String(body.gstNumber).trim().toUpperCase() || null
        : null;
    const clientState =
      isGst && body.clientState
        ? String(body.clientState).trim() || null
        : null;

    const { validItems, subtotal } = buildLineItems(body.items, FIXED_HSN_SAC);
    if (!validItems.length) {
      return res
        .status(400)
        .json({ message: "At least one line item is required" });
    }

    const taxRate = Math.max(0, Math.min(100, parseFloat(body.taxRate) || 0));
    const { cgst, sgst, igst, taxAmount, total } = computeTax({
      isGst,
      subtotal,

      taxRate,
      clientState,
    });

    const terms = resolveTerms(
      body.termsOption || "predefined1",
      body.customTerms,
    );
    const number = await nextInvoiceNumber(Invoice, isGst);

    const doc = await Invoice.create({
      userId: req.userId,
      number,
      clientName,
      clientEmail: (body.clientEmail || "").trim(),
      clientPhone: (body.clientPhone || "").trim(),
      clientAddress: (body.clientAddress || "").trim(),
      dueDate: String(dueDate).slice(0, 10),
      items: validItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: "draft",
      terms,
      isGst: isGst ? "yes" : "no",
      gstNumber,
      clientState,
      companyState: COMPANY_HOME_STATE,
      cgst,
      sgst,
      igst,
      hsnSac: FIXED_HSN_SAC,
    });

    await logAction(
      req.userId,
      "create_invoice",
      doc._id,
      `Created invoice #${number}`,
    );
    res.status(201).json({ invoice: serializeInvoice(doc) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    if (req.userRole !== "admin" && inv.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (inv.status === "paid" && req.userRole !== "admin") {
      return res.status(403).json({ message: "Cannot edit paid invoice" });
    }

    const body = req.body;
    const clientName = (body.clientName || "").trim();
    if (!clientName)
      return res.status(400).json({ message: "Client name is required" });
    const email = (body.clientEmail || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid client email" });
    }

    const isGst = body.invoiceType === "gst";
    const gstNumber =
      isGst && body.gstNumber
        ? String(body.gstNumber).trim().toUpperCase() || null
        : null;
    const clientState =
      isGst && body.clientState
        ? String(body.clientState).trim() || null
        : null;

    const { validItems, subtotal } = buildLineItems(body.items, FIXED_HSN_SAC);
    if (!validItems.length) {
      return res
        .status(400)
        .json({ message: "At least one line item is required" });
    }

    const taxRate = Math.max(0, Math.min(100, parseFloat(body.taxRate) || 0));
    const { cgst, sgst, igst, taxAmount, total } = computeTax({
      isGst,
      subtotal,
      taxRate,
      clientState,
    });

    const terms = resolveTerms(
      body.termsOption || "predefined1",
      body.customTerms,
    );

    inv.clientName = clientName;
    inv.clientEmail = email;
    inv.clientPhone = (body.clientPhone || "").trim();
    inv.clientAddress = (body.clientAddress || "").trim();
    inv.dueDate = body.dueDate
      ? String(body.dueDate).slice(0, 10)
      : inv.dueDate;
    inv.items = validItems;
    inv.subtotal = subtotal;
    inv.taxRate = taxRate;
    inv.taxAmount = taxAmount;
    inv.total = total;
    inv.terms = terms;
    inv.isGst = isGst ? "yes" : "no";
    inv.gstNumber = gstNumber;
    inv.clientState = clientState;
    inv.companyState = COMPANY_HOME_STATE;
    inv.cgst = cgst;
    inv.sgst = sgst;
    inv.igst = igst;
    inv.hsnSac = FIXED_HSN_SAC;
    await inv.save();

    await logAction(
      req.userId,
      "edit_invoice",
      inv._id,
      `Edited invoice #${inv.number}`,
    );
    res.json({ invoice: serializeInvoice(inv) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const allowed = [
      "draft",
      "submitted",
      "pending",
      "paid",
      "overdue",
      "rejected",
    ];
    const status = req.body.status;
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    if (req.userRole !== "admin" && inv.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    inv.status = status;
    await inv.save();
    await logAction(
      req.userId,
      "update_status",
      inv._id,
      `Updated invoice status to ${status}`,
    );
    res.json({ invoice: serializeInvoice(inv) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    const num = inv.number;
    await inv.deleteOne();
    await logAction(
      req.userId,
      "delete_invoice",
      req.params.id,
      `Deleted invoice #${num}`,
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
