import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    const error = new Error('Activity payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const candidate = input as Record<string, unknown>;
  const userId = typeof candidate.userId === 'string' ? candidate.userId : undefined;
  const teamId = typeof candidate.teamId === 'string' ? candidate.teamId : undefined;
  const type = typeof candidate.type === 'string' ? candidate.type.trim() : '';
  const minutesValue = typeof candidate.minutes === 'string' ? Number(candidate.minutes) : candidate.minutes;

  if (!userId || !teamId || !type || typeof minutesValue !== 'number' || Number.isNaN(minutesValue) || minutesValue <= 0) {
    const error = new Error('Activity payload is invalid');
    Object.assign(error, { status: 400 });
    throw error;
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    const error = new Error('Activity references must be valid Mongo ObjectIds');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    const error = new Error('Activity references must match existing users and teams');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const pointsByType: Record<string, number> = {
    run: 1,
    cycle: 1,
    strength: 2,
  };
  const multiplier = pointsByType[type.toLowerCase()] ?? 1;
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue * multiplier)),
    occurredAt: new Date(),
  });

  return activity.toObject ? activity.toObject() : activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    const error = new Error('Team payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const candidate = input as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const mascot = typeof candidate.mascot === 'string' ? candidate.mascot.trim() : '';
  const membersValue = candidate.members;

  if (!name || !mascot || !Array.isArray(membersValue)) {
    const error = new Error('Team payload is invalid');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const members = membersValue.map((id) => String(id));
  if (members.some((memberId) => !mongoose.isValidObjectId(memberId))) {
    const error = new Error('Team member ids must be valid Mongo ObjectIds');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const team = await Team.create({
    name,
    mascot,
    members: members.map((memberId) => new mongoose.Types.ObjectId(memberId)),
  });

  return team.toObject ? team.toObject() : team;
}

export async function getLeaderboard() {
  const leaderboardEntries = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $unwind: '$team',
    },
    {
      $project: {
        _id: 0,
        teamId: '$_id',
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
  ]);

  return leaderboardEntries.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail?.trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentType = recentActivity?.type?.toLowerCase();
  const focusByType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
  };
  const preferredFocus = recentType && focusByType[recentType] ? focusByType[recentType] : String(user.fitnessGoal ?? 'endurance').toLowerCase();

  const workouts = await Workout.find({ focus: preferredFocus }).lean();
  if (workouts.length === 0) {
    return [];
  }

  const reasonBase = recentType
    ? `Based on your ${recentType} activity, this ${preferredFocus} workout matches your routine.`
    : `Based on your ${user.fitnessGoal} goal, this ${preferredFocus} workout fits your plan.`;

  return workouts.map((workout) => ({
    ...workout,
    reason: reasonBase,
  }));
}

export { User };
