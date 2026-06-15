import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Dumbbell, Sparkles, AlertCircle, History, Calendar, CheckCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Workouts = () => {
  const { role, userId } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [todayWorkout, setTodayWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // History detailed modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryWorkout, setSelectedHistoryWorkout] = useState(null);

  const handleSetInputChange = (exerciseId, setIndex, field, value) => {
    setTodayWorkout(prev => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex._id === exerciseId) {
          const updatedSets = [...ex.sets];
          updatedSets[setIndex] = {
            ...updatedSets[setIndex],
            [field]: value === "" ? "" : Number(value)
          };
          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  const handleSaveSet = async (exerciseId, setIndex, field, value) => {
    if (role === "admin") return;
    
    const targetExercise = todayWorkout.exercises.find(ex => ex._id === exerciseId);
    if (!targetExercise) return;

    const updatedSets = targetExercise.sets.map((set, idx) => {
      if (idx === setIndex) {
        let updatedVal = value;
        if (field === "completed") {
          updatedVal = !!value;
        } else {
          updatedVal = value === "" ? 0 : Number(value);
        }
        return {
          ...set,
          [field]: updatedVal
        };
      }
      return set;
    });

    setTodayWorkout(prev => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex._id === exerciseId) {
          const allSetsCompleted = updatedSets.length > 0 && updatedSets.every(s => s.completed);
          return {
            ...ex,
            sets: updatedSets,
            completed: allSetsCompleted
          };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });

    try {
      await API.put(`/exercise/${exerciseId}`, { sets: updatedSets });
      
      const todayRes = await API.get(`/workout/today/${selectedMember}`);
      setTodayWorkout(todayRes.data?.data || null);
      
      const historyRes = await API.get(`/workout/history/${selectedMember}`);
      setWorkoutHistory(historyRes.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to persist workout set progress");
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchMembers();
    } else if (role === "member" && userId) {
      setSelectedMember(userId);
      fetchWorkoutDetails(userId);
    }
  }, [role, userId]);

  const fetchMembers = async () => {
    try {
      const response = await API.get("/member");
      setMembers(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkoutDetails = async (memberId) => {
    if (!memberId) {
      setTodayWorkout(null);
      setWorkoutHistory([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [todayRes, historyRes] = await Promise.all([
        API.get(`/workout/today/${memberId}`).catch(() => ({ data: { data: null } })),
        API.get(`/workout/history/${memberId}`).catch(() => ({ data: { data: [] } }))
      ]);
      setTodayWorkout(todayRes.data?.data || null);
      setWorkoutHistory(historyRes.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch workout details");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (e) => {
    const id = e.target.value;
    setSelectedMember(id);
    fetchWorkoutDetails(id);
  };

  const handleGenerateWorkout = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    setError("");
    try {
      await API.post("/workout/generate", { memberId: selectedMember });
      fetchWorkoutDetails(selectedMember);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error generating AI workout plan");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#111827]">AI Workouts</h2>
        <p className="text-sm text-gray-500">
          {role === "admin" 
            ? "Generate dynamic AI workout schedules and monitor training logs"
            : "Review your today's custom workout program generated by AI"}
        </p>
      </div>

      {role === "admin" && (
        <div className="rounded-xl border border-borders bg-white p-5 shadow-sm max-w-md">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Member</label>
          <select
            value={selectedMember}
            onChange={handleMemberChange}
            className="mt-2 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
          >
            <option value="">-- Choose Member --</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.fullName} ({member.phone})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-[#EF4444] font-medium flex gap-2 max-w-xl">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedMember ? (
        loading ? (
          <div className="space-y-4">
            <div className="h-48 w-full animate-pulse rounded-lg bg-white" />
            <div className="h-48 w-full animate-pulse rounded-lg bg-white" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-borders bg-white p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
                  <div className="flex items-center gap-2 text-[#FF6B00]">
                    <Calendar size={18} />
                    <h3 className="text-base font-bold text-[#111827]">Today's Routine</h3>
                  </div>
                  {todayWorkout && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-[#22C55E] capitalize">
                      {todayWorkout.workout?.status || "Pending"}
                    </span>
                  )}
                </div>

                {todayWorkout ? (
                  <div className="space-y-6">
                    {todayWorkout.exercises && todayWorkout.exercises.map((ex) => (
                      <div key={ex._id} className="border border-borders rounded-xl p-4 bg-gray-50/50 space-y-4">
                        <div className="flex justify-between items-start border-b border-borders pb-2">
                          <div>
                            <h4 className="font-bold text-[#111827] text-sm">{ex.excerciseName}</h4>
                            <p className="text-xs text-gray-400">Rest Time: {ex.restTime}s</p>
                          </div>
                          {ex.completed ? (
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle size={12} /> Completed
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              In Progress
                            </span>
                          )}
                        </div>

                        {/* Sets Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-gray-400 font-bold border-b border-borders">
                                <th className="pb-2">Set</th>
                                <th className="pb-2">Target (Reps/Wt)</th>
                                <th className="pb-2 w-20">Actual Wt</th>
                                <th className="pb-2 w-20">Actual Reps</th>
                                <th className="pb-2 text-right">Done</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-borders text-[#111827]">
                              {ex.sets && ex.sets.map((set, setIndex) => (
                                <tr key={set._id || setIndex} className="hover:bg-gray-100/30">
                                  <td className="py-2 font-semibold text-gray-500">#{set.setNumber}</td>
                                  <td className="py-2 text-gray-600 font-medium">
                                    {set.targetReps} reps @ {set.targetWeight} kg
                                  </td>
                                  <td className="py-2">
                                    <input
                                      type="number"
                                      value={set.actualWeight || ""}
                                      onChange={(e) => handleSetInputChange(ex._id, setIndex, "actualWeight", e.target.value)}
                                      onBlur={(e) => handleSaveSet(ex._id, setIndex, "actualWeight", e.target.value)}
                                      disabled={role === "admin" || actionLoading}
                                      className="w-16 rounded border border-borders bg-white px-2 py-0.5 text-center text-xs outline-none focus:border-[#FF6B00]"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="py-2">
                                    <input
                                      type="number"
                                      value={set.actualReps || ""}
                                      onChange={(e) => handleSetInputChange(ex._id, setIndex, "actualReps", e.target.value)}
                                      onBlur={(e) => handleSaveSet(ex._id, setIndex, "actualReps", e.target.value)}
                                      disabled={role === "admin" || actionLoading}
                                      className="w-16 rounded border border-borders bg-white px-2 py-0.5 text-center text-xs outline-none focus:border-[#FF6B00]"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="py-2 text-right">
                                    <input
                                      type="checkbox"
                                      checked={set.completed}
                                      onChange={(e) => handleSaveSet(ex._id, setIndex, "completed", e.target.checked)}
                                      disabled={role === "admin" || actionLoading}
                                      className="rounded text-[#FF6B00] focus:ring-[#FF6B00] h-4 w-4 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Dumbbell size={36} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-[#111827]">No Routine Assigned Today</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[250px]">
                      Generate a workout plan below using the profile goals.
                    </p>
                  </div>
                )}
              </div>

              {!todayWorkout && (
                <button
                  onClick={handleGenerateWorkout}
                  disabled={actionLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] py-3 text-sm font-semibold text-white hover:bg-[#E05E00] disabled:bg-orange-300 transition-colors"
                >
                  <Sparkles size={16} />
                  {actionLoading ? "Synthesizing Plan..." : "Generate AI Routine"}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-borders bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-purple-600 border-b border-borders pb-4 mb-4">
                <History size={18} />
                <h3 className="text-base font-bold text-[#111827]">Routines History</h3>
              </div>

              {workoutHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-semibold text-[#111827]">No Past Workouts</p>
                  <p className="text-xs text-gray-400">There is no recorded workout history.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {workoutHistory.map((h) => (
                    <div
                      key={h.workout?._id}
                      onClick={() => {
                        setSelectedHistoryWorkout(h);
                        setHistoryModalOpen(true);
                      }}
                      className="rounded-lg border border-borders bg-gray-50/50 p-3 text-sm cursor-pointer hover:bg-gray-50 hover:border-[#FF6B00] transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-borders pb-2 mb-2">
                        <span className="font-mono text-xs text-gray-400 font-semibold">
                          {new Date(h.workout?.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span
                          className={`text-xs font-bold capitalize ${
                            h.workout?.status === "completed" ? "text-green-500" : "text-amber-500"
                          }`}
                        >
                          {h.workout?.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between items-center">
                        <span className="font-medium">{h.exercises?.length || 0} Exercises</span>
                        <span className="text-[#FF6B00] font-bold text-[11px]">View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm max-w-4xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <Dumbbell size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Member Selected</h3>
          <p className="text-xs text-gray-400 mt-1">
            Choose a member above to inspect today's routines, generate workouts, and review history.
          </p>
        </div>
      )}

      {/* Workout History Details Modal */}
      {historyModalOpen && selectedHistoryWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-borders max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <History className="text-purple-600" size={20} />
                <span>Workout Session Details</span>
              </h3>
              <button
                onClick={() => {
                  setHistoryModalOpen(false);
                  setSelectedHistoryWorkout(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Session Date</span>
                <span className="font-bold text-[#111827]">
                  {new Date(selectedHistoryWorkout.workout?.date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  selectedHistoryWorkout.workout?.status === "completed" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {selectedHistoryWorkout.workout?.status}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {selectedHistoryWorkout.exercises && selectedHistoryWorkout.exercises.map((ex) => (
                <div key={ex._id} className="border border-borders rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center border-b border-borders pb-2">
                    <h4 className="font-bold text-[#111827] text-sm">{ex.excerciseName}</h4>
                    <span className={`text-[10px] font-bold ${ex.completed ? "text-green-600" : "text-amber-600"}`}>
                      {ex.completed ? "✓ Completed" : "Incomplete"}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-400 font-bold border-b border-borders">
                        <th className="pb-2">Set</th>
                        <th className="pb-2">Target (Reps/Wt)</th>
                        <th className="pb-2">Logged Wt</th>
                        <th className="pb-2">Logged Reps</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borders text-[#111827]">
                      {ex.sets && ex.sets.map((set, setIndex) => (
                        <tr key={set._id || setIndex}>
                          <td className="py-2 text-gray-500">Set #{set.setNumber}</td>
                          <td className="py-2 text-gray-600 font-medium">
                            {set.targetReps} reps @ {set.targetWeight} kg
                          </td>
                          <td className="py-2 font-bold">{set.actualWeight || 0} kg</td>
                          <td className="py-2 font-bold">{set.actualReps || 0} reps</td>
                          <td className="py-2 text-right">
                            <span className={set.completed ? "text-green-500 font-semibold" : "text-gray-400"}>
                              {set.completed ? "Done" : "Skipped"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-borders pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setHistoryModalOpen(false);
                  setSelectedHistoryWorkout(null);
                }}
                className="rounded-lg bg-[#111827] px-5 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
