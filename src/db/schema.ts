import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// Catalog of movements. user_id null = built-in, set = a user's custom exercise.
export const exercises = pgTable(
  'exercises',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id'),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('exercises_user_id_name_idx').on(t.userId, t.name)],
);

// One training session. userId is the Clerk user id.
export const workouts = pgTable(
  'workouts',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name'),
    performedAt: timestamp('performed_at', { withTimezone: true }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('workouts_user_id_performed_at_idx').on(t.userId, t.performedAt.desc())],
);

// An exercise performed within a workout (join table with ordering and notes).
export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: serial('id').primaryKey(),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    notes: text('notes'),
  },
  (t) => [
    unique('workout_exercises_workout_id_position_unique').on(t.workoutId, t.position),
    index('workout_exercises_exercise_id_idx').on(t.exerciseId),
  ],
);

// One set of an exercise within a workout. Weight is stored in kg.
export const sets = pgTable(
  'sets',
  {
    id: serial('id').primaryKey(),
    workoutExerciseId: integer('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    reps: integer('reps'),
    weight: numeric('weight', { precision: 6, scale: 2 }),
    isWarmup: boolean('is_warmup').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('sets_workout_exercise_id_set_number_unique').on(t.workoutExerciseId, t.setNumber),
  ],
);

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
export type WorkoutSet = typeof sets.$inferSelect;
export type NewWorkoutSet = typeof sets.$inferInsert;
