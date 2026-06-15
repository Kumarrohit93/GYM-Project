const Membership = require("../../Models/MembershiModel");
const Member = require("../../Models/MemberModel");
const Plan = require("../../Models/PlanModel");
const calculateMembershipExpiry = require("../Utils/calculateMembershipExpiry");
const { membershipSchema, renewMembershipSchema } = require("../Validations/membershipValidation");

const createMembership = async (req, res) => {
  try {
    const { error } = membershipSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { memberId, planId, startDate } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const endDate = calculateMembershipExpiry(startDate, plan.durationMonths);

    const newMembership = new Membership({
      memberId,
      planId,
      startDate,
      endDate,
      isActive: true,
    });
    await newMembership.save();

    // Sync member status and expiry
    member.membershipExpiry = endDate;
    member.status = "active";
    await member.save();

    return res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data: newMembership,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating membership",
      error: err.message,
    });
  }
};

const renewMembership = async (req, res) => {
  try {
    const { error } = renewMembershipSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { planId, startDate } = req.body;
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found" });
    }

    const member = await Member.findById(membership.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member associated with membership not found" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const endDate = calculateMembershipExpiry(startDate, plan.durationMonths);

    membership.planId = planId;
    membership.startDate = startDate;
    membership.endDate = endDate;
    membership.isActive = true;
    await membership.save();

    // Sync member status and expiry
    member.membershipExpiry = endDate;
    member.status = "active";
    await member.save();

    return res.status(200).json({
      success: true,
      message: "Membership renewed successfully",
      data: membership,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error renewing membership",
      error: err.message,
    });
  }
};

const getMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate("memberId", "-password")
      .populate("planId");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Membership retrieved successfully",
      data: membership,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving membership",
      error: err.message,
    });
  }
};

const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find()
      .populate("memberId", "-password")
      .populate("planId");
    return res.status(200).json({
      success: true,
      message: "Memberships retrieved successfully",
      data: memberships,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving memberships",
      error: err.message,
    });
  }
};

const getAllPlans = async (req, res) => {
  try {
    let plans = await Plan.find();
    if (plans.length === 0) {
      plans = await Plan.insertMany([
        { name: "Monthly Plan", durationMonths: 1, price: 50 },
        { name: "Quarterly Plan", durationMonths: 3, price: 130 },
        { name: "Half-Yearly Plan", durationMonths: 6, price: 240 },
        { name: "Yearly Plan", durationMonths: 12, price: 400 },
      ]);
    }
    return res.status(200).json({
      success: true,
      message: "Plans retrieved successfully",
      data: plans,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving plans",
      error: err.message,
    });
  }
};

module.exports = {
  createMembership,
  renewMembership,
  getMembership,
  getAllMemberships,
  getAllPlans,
};
