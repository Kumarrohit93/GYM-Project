const Exercise = require("../../Models/ExerciseModel");
const Workout = require("../../Models/WorkoutModel");

const createExercise = async (req, res) => {
  try {
    const { workoutId, excerciseName, restTime, sets } = req.body;
    if (!workoutId || !excerciseName || restTime === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields: workoutId, excerciseName, restTime" });
    }

    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    const setsArray = Array.isArray(sets) ? sets : [];
    const normalizedSets = setsArray.map((set, index) => ({
      setNumber: set.setNumber || index + 1,
      targetReps: Number(set.targetReps) || 10,
      actualReps: Number(set.actualReps) || 0,
      targetWeight: Number(set.targetWeight) || 0,
      actualWeight: Number(set.actualWeight) || 0,
      completed: Boolean(set.completed),
    }));

    const newExercise = new Exercise({
      workoutId,
      excerciseName,
      restTime: Number(restTime),
      sets: normalizedSets,
      completed: false,
    });
    await newExercise.save();

    return res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      data: newExercise,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating exercise",
      error: err.message,
    });
  }
};

const getExercises = async (req, res) => {
  try {
    const { workoutId } = req.query;
    const filter = workoutId ? { workoutId } : {};
    const exercises = await Exercise.find(filter).populate("workoutId");

    return res.status(200).json({
      success: true,
      message: "Exercises retrieved successfully",
      data: exercises,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving exercises",
      error: err.message,
    });
  }
};

const updateExercise = async (req, res) => {
  try {
    const updateData = { ...req.body };

    let exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }

    if (updateData.excerciseName !== undefined) exercise.excerciseName = updateData.excerciseName;
    if (updateData.restTime !== undefined) exercise.restTime = Number(updateData.restTime);
    if (updateData.sets !== undefined) {
      exercise.sets = updateData.sets;
      const allSetsCompleted = exercise.sets.length > 0 && exercise.sets.every(s => s.completed);
      exercise.completed = allSetsCompleted;
      if (allSetsCompleted) {
        exercise.completedAt = new Date();
      } else {
        exercise.completedAt = null;
      }
    } else if (updateData.completed !== undefined) {
      exercise.completed = updateData.completed;
      exercise.completedAt = updateData.completed ? new Date() : null;
    }

    await exercise.save();

    const workoutId = exercise.workoutId;
    if (workoutId) {
      const allExercises = await Exercise.find({ workoutId });
      const allCompleted = allExercises.length > 0 && allExercises.every(ex => ex.completed);

      await Workout.findByIdAndUpdate(workoutId, {
        status: allCompleted ? "completed" : "Pending",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exercise updated successfully",
      data: exercise,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating exercise",
      error: err.message,
    });
  }
};

const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error deleting exercise",
      error: err.message,
    });
  }
};

module.exports = {
  createExercise,
  getExercises,
  updateExercise,
  deleteExercise,
};
