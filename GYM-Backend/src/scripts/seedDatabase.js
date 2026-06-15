const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const GymConfig = require("../../Models/GymConfigModel");
const ExerciseLibrary = require("../../Models/ExerciseLibraryModel");

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/gymdb";

const defaultExercises = [
  { muscleGroup: "chest", excerciseName: "Bench Press", instructions: "Flat bench press", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "chest", excerciseName: "Incline Dumbbell Press", instructions: "Incline press with dumbbells", difficultyLevel: "Intermediate", videoUrl: "" },
  { muscleGroup: "back", excerciseName: "Lat Pulldown", instructions: "Wide grip lat pulldown", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "back", excerciseName: "Barbell Row", instructions: "Bent over barbell row", difficultyLevel: "Intermediate", videoUrl: "" },
  { muscleGroup: "legs", excerciseName: "Squat", instructions: "Barbell back squat", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "legs", excerciseName: "Leg Press", instructions: "Machine leg press", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "shoulders", excerciseName: "Overhead Press", instructions: "Standing barbell press", difficultyLevel: "Intermediate", videoUrl: "" },
  { muscleGroup: "shoulders", excerciseName: "Lateral Raise", instructions: "Dumbbell lateral raise", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "arms", excerciseName: "Bicep Curl", instructions: "Standing dumbbell curl", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "arms", excerciseName: "Tricep Pushdown", instructions: "Cable tricep pushdown", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "core", excerciseName: "Plank", instructions: "Hold plank position", difficultyLevel: "Beginner", videoUrl: "" },
  { muscleGroup: "core", excerciseName: "Crunches", instructions: "Standard crunches", difficultyLevel: "Beginner", videoUrl: "" },
];

const seed = async () => {
  await mongoose.connect(DB_URL);
  console.log("Connected to MongoDB for seeding...");

  const existingConfig = await GymConfig.findOne();
  if (!existingConfig) {
    await GymConfig.create({ latitude: 28.6139, longitude: 77.2090, radius: 100 });
    console.log("GymConfig seeded with default coordinates.");
  }

  for (const exercise of defaultExercises) {
    const exists = await ExerciseLibrary.findOne({ excerciseName: exercise.excerciseName });
    if (!exists) {
      await ExerciseLibrary.create(exercise);
    }
  }
  console.log("Exercise library seeded.");

  await mongoose.disconnect();
  console.log("Seeding complete.");
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
