const mongoose = require("mongoose");

const excerciseLibrarySchema = new mongoose.Schema({
    muscleGroup: {
        type: String,
        required: true,
    },

    excerciseName: {
        type: String,
        required: true,
    },

    instructions: {
        type: String,
        required: true,
    },

    difficultyLevel: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        required: true,
    },

    videoUrl: {
        type: String,
        required: true,
    },
});

const ExerciseLibrary = mongoose.model("ExerciseLibrary", excerciseLibrarySchema);

module.exports = ExerciseLibrary;