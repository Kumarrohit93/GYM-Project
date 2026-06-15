const calculateWorkoutDuration = (checkInTime, checkOutTime) => {
  const inTime = new Date(checkInTime);
  const outTime = new Date(checkOutTime);
  const diffMs = outTime - inTime;
  return Math.max(0, Math.round(diffMs / 1000 / 60)); // Duration in minutes
};

module.exports = calculateWorkoutDuration;
