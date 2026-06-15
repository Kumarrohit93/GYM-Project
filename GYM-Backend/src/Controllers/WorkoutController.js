const Workout = require("../../Models/WorkoutModel");
const Exercise = require("../../Models/ExerciseModel");
const Member = require("../../Models/MemberModel");
const aiWorkoutService = require("../Services/aiWorkoutService");

const getPreviousWorkoutHistory = async (memberId, limit = 5) => {
  const pastWorkouts = await Workout.find({ memberId, status: "completed" })
    .sort({ date: -1 })
    .limit(limit);

  const workoutIds = pastWorkouts.map(w => w._id);
  const exercises = await Exercise.find({ workoutId: { $in: workoutIds } });

  return pastWorkouts.map(w => ({
    date: w.date,
    exercises: exercises
      .filter(ex => ex.workoutId.toString() === w._id.toString())
      .map(ex => ({
        name: ex.excerciseName,
        sets: ex.sets,
        completed: ex.completed,
      })),
  }));
};

const buildExerciseRecords = (workoutId, plan) => {
  return plan.exercises.map(ex => {
    const setsArray = [];
    const numSets = Number(ex.sets) || 3;
    for (let i = 1; i <= numSets; i++) {
      setsArray.push({
        setNumber: i,
        targetReps: Number(ex.reps) || 10,
        actualReps: 0,
        targetWeight: Number(ex.targetweight) || 0,
        actualWeight: 0,
        completed: false,
      });
    }
    return {
      workoutId,
      excerciseName: ex.excerciseName,
      restTime: Number(ex.restTime) || 60,
      sets: setsArray,
      completed: false,
    };
  });
};

const generateWorkout = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: "Member ID is required" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingWorkout = await Workout.findOne({
      memberId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingWorkout) {
      const exercises = await Exercise.find({ workoutId: existingWorkout._id });
      return res.status(200).json({
        success: true,
        message: "Today's workout already exists",
        data: { workout: existingWorkout, exercises },
      });
    }

    const previousWorkoutHistory = await getPreviousWorkoutHistory(memberId);

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
      memberId,
      date: new Date(),
      status: "Pending",
      generatedByAI: true,
    });
    await newWorkout.save();

    const exercisesToSave = buildExerciseRecords(newWorkout._id, plan);
    const savedExercises = await Exercise.insertMany(exercisesToSave);

    return res.status(201).json({
      success: true,
      message: "Workout generated successfully by AI",
      data: {
        workout: newWorkout,
        exercises: savedExercises,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error generating workout",
      error: err.message,
    });
  }
};

const getTodayWorkout = async (req, res) => {
  try {
    const { memberId } = req.params;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const workout = await Workout.findOne({
      memberId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!workout) {
      return res.status(200).json({
        success: true,
        message: "No workout found for today",
        data: null,
      });
    }

    const exercises = await Exercise.find({ workoutId: workout._id });

    return res.status(200).json({
      success: true,
      message: "Today's workout retrieved successfully",
      data: {
        workout,
        exercises,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving today's workout",
      error: err.message,
    });
  }
};

const getWorkoutHistory = async (req, res) => {
  try {
    const { memberId } = req.params;
    const workouts = await Workout.find({ memberId }).sort({ date: -1 });

    const workoutIds = workouts.map(w => w._id);
    const exercises = await Exercise.find({ workoutId: { $in: workoutIds } });

    const workoutHistory = workouts.map(w => ({
      workout: w,
      exercises: exercises.filter(ex => ex.workoutId.toString() === w._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      message: "Workout history retrieved successfully",
      data: workoutHistory,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving workout history",
      error: err.message,
    });
  }
};

module.exports = {
  generateWorkout,
  getTodayWorkout,
  getWorkoutHistory,
  getPreviousWorkoutHistory,
  buildExerciseRecords,
};
