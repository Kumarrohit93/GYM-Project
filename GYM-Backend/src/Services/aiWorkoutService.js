const ExerciseLibrary = require("../../Models/ExerciseLibraryModel");

const generateWorkoutPlan = async ({ goal, weight, height, age, experienceLevel, injuries, previousWorkoutHistory }) => {
  // Map member details to difficulty
  let difficulty = "Beginner";
  if (experienceLevel === "intermediate") difficulty = "Intermediate";
  if (experienceLevel === "advanced") difficulty = "Advanced";

  // Progressive overload from previous workout history
  const previousWeightMap = {};
  if (previousWorkoutHistory && previousWorkoutHistory.length > 0) {
    for (const session of previousWorkoutHistory) {
      for (const ex of session.exercises || []) {
        const maxWeight = Math.max(...(ex.sets || []).map(s => s.actualWeight || s.targetWeight || 0), 0);
        if (maxWeight > 0) {
          previousWeightMap[ex.name] = maxWeight;
        }
      }
    }
  }

  let sets = 3;
  let reps = 12;
  let restTime = 60;
  let intensity = "Moderate";

  switch (goal) {
    case "muscle_gain":
      sets = 4;
      reps = 10;
      restTime = 90;
      intensity = "High";
      break;
    case "fat_loss":
      sets = 3;
      reps = 15;
      restTime = 45;
      intensity = "Moderate-High";
      break;
    case "strength":
      sets = 5;
      reps = 5;
      restTime = 180;
      intensity = "Very High";
      break;
    case "endurance":
      sets = 3;
      reps = 20;
      restTime = 45;
      intensity = "Low-Moderate";
      break;
    default: // general_fitness
      sets = 3;
      reps = 12;
      restTime = 60;
      intensity = "Moderate";
  }

  if (age && age > 50) {
    reps = Math.max(reps - 2, 8);
    restTime += 15;
  }

  // Fetch exercises from library matching difficulty
  let libraryExercises = await ExerciseLibrary.find({ difficultyLevel: difficulty });

  // If library is empty, fall back to a rich mock static exercise list
  if (libraryExercises.length === 0) {
    libraryExercises = [
      { muscleGroup: "Chest", excerciseName: "Bench Press", instructions: "Lie on bench, press bar up", difficultyLevel: "Intermediate", videoUrl: "http://example.com/bench" },
      { muscleGroup: "Chest", excerciseName: "Push-ups", instructions: "Standard pushups", difficultyLevel: "Beginner", videoUrl: "http://example.com/pushup" },
      { muscleGroup: "Back", excerciseName: "Lat Pulldown", instructions: "Pull bar to chest", difficultyLevel: "Beginner", videoUrl: "http://example.com/lat" },
      { muscleGroup: "Back", excerciseName: "Pull-ups", instructions: "Pull chin over bar", difficultyLevel: "Advanced", videoUrl: "http://example.com/pullup" },
      { muscleGroup: "Legs", excerciseName: "Squats", instructions: "Squat down with weight", difficultyLevel: "Intermediate", videoUrl: "http://example.com/squat" },
      { muscleGroup: "Legs", excerciseName: "Leg Press", instructions: "Push platform away", difficultyLevel: "Beginner", videoUrl: "http://example.com/legpress" },
      { muscleGroup: "Shoulders", excerciseName: "Overhead Press", instructions: "Press bar overhead", difficultyLevel: "Intermediate", videoUrl: "http://example.com/overhead" },
      { muscleGroup: "Arms", excerciseName: "Bicep Curls", instructions: "Curl dumbbells", difficultyLevel: "Beginner", videoUrl: "http://example.com/curl" },
      { muscleGroup: "Arms", excerciseName: "Tricep Pushdowns", instructions: "Push rope down", difficultyLevel: "Beginner", videoUrl: "http://example.com/tricep" },
    ].filter(ex => ex.difficultyLevel === difficulty || difficulty === "Advanced"); // advanced can do intermediate
  }

  // Filter out exercises based on injuries
  // e.g. if injuries contains "knee", filter out "Legs" muscle group
  let filteredExercises = [...libraryExercises];
  if (injuries && injuries.length > 0) {
    const injuryKeywords = injuries.map(i => i.toLowerCase());
    filteredExercises = filteredExercises.filter(ex => {
      const muscle = ex.muscleGroup.toLowerCase();
      if (injuryKeywords.some(k => k.includes("knee") || k.includes("leg")) && muscle.includes("leg")) return false;
      if (injuryKeywords.some(k => k.includes("shoulder")) && muscle.includes("shoulder")) return false;
      if (injuryKeywords.some(k => k.includes("back")) && muscle.includes("back")) return false;
      return true;
    });
  }

  // If too few exercises left, use the unfiltered list
  if (filteredExercises.length === 0) {
    filteredExercises = libraryExercises;
  }

  // Select up to 5 exercises randomly or by muscle group variety
  const selectedExercises = [];
  const muscleGroupsSeen = new Set();

  // Try to get one exercise per muscle group first
  for (const ex of filteredExercises) {
    if (!muscleGroupsSeen.has(ex.muscleGroup) && selectedExercises.length < 5) {
      selectedExercises.push(ex);
      muscleGroupsSeen.add(ex.muscleGroup);
    }
  }

  // Fill up if we have less than 4 exercises
  while (selectedExercises.length < Math.min(4, filteredExercises.length)) {
    const randomEx = filteredExercises[Math.floor(Math.random() * filteredExercises.length)];
    if (!selectedExercises.includes(randomEx)) {
      selectedExercises.push(randomEx);
    }
  }

  // Map to the workout exercise structure
  const exercisesList = selectedExercises.map(ex => {
    // Calculate target weight based on user weight and exercise type
    let targetweight = 0;
    const userWeight = weight || 70;
    if (ex.muscleGroup === "Chest" || ex.muscleGroup === "Back" || ex.muscleGroup === "Legs") {
      targetweight = Math.round(userWeight * 0.5);
    } else {
      targetweight = Math.round(userWeight * 0.15);
    }

    if (previousWeightMap[ex.excerciseName]) {
      targetweight = Math.round(previousWeightMap[ex.excerciseName] * 1.05);
    }

    return {
      excerciseName: ex.excerciseName,
      sets,
      reps,
      restTime,
      targetweight,
      actualweight: 0,
      actualreps: 0,
      completed: false
    };
  });

  return {
    goal,
    experienceLevel,
    intensity,
    generatedAt: new Date(),
    exercises: exercisesList
  };
};

module.exports = { generateWorkoutPlan };
