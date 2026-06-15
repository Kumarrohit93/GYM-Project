const cron = require("node-cron");
const Member = require("../../Models/MemberModel");
const Workout = require("../../Models/WorkoutModel");
const Exercise = require("../../Models/ExerciseModel");
const aiWorkoutService = require("../Services/aiWorkoutService");
const { getPreviousWorkoutHistory, buildExerciseRecords } = require("../Controllers/WorkoutController");

const runDailyAIWorkoutGeneration = async () => {
  console.log("[AIWorkoutJob] Starting daily workout generation at 3 AM...");
  try {
    const now = new Date();
    const activeMembers = await Member.find({
      status: "active",
      $or: [
        { membershipExpiry: { $exists: false } },
        { membershipExpiry: null },
        { membershipExpiry: { $gte: now } },
      ],
    });
    console.log(`[AIWorkoutJob] Found ${activeMembers.length} active members to generate workouts for.`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let generatedCount = 0;

    for (const member of activeMembers) {
      // Check if a workout has already been generated/assigned for this member today
      const existingWorkout = await Workout.findOne({
        memberId: member._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingWorkout) {
        continue;
      }

      const previousWorkoutHistory = await getPreviousWorkoutHistory(member._id);

      const plan = await aiWorkoutService.generateWorkoutPlan({
        goal: member.goal,
        weight: member.weight || 70,
        height: member.height || 170,
        age: member.age,
        experienceLevel: member.experienceLevel,
        injuries: member.injuries,
        previousWorkoutHistory,
      });

      const newWorkout = new Workout({
        memberId: member._id,
        date: new Date(),
        status: "Pending",
        generatedByAI: true,
      });
      await newWorkout.save();

      const exercisesToSave = buildExerciseRecords(newWorkout._id, plan);
      await Exercise.insertMany(exercisesToSave);
      generatedCount++;
    }
    console.log(`[AIWorkoutJob] Generated and saved workouts for ${generatedCount} members.`);
  } catch (err) {
    console.error("[AIWorkoutJob] Error in daily workout generation:", err);
  }
};

const initAIWorkoutJob = () => {
  // Run daily at 3:00 AM
  cron.schedule("0 3 * * *", runDailyAIWorkoutGeneration);
  console.log("[AIWorkoutJob] AI workout job scheduled daily at 3:00 AM");
};

module.exports = {
  initAIWorkoutJob,
  runDailyAIWorkoutGeneration,
};
