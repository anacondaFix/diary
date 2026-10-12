CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"muscle_group" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_exercise_id" integer NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight" numeric(6, 2),
	"is_warmup" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sets_workout_exercise_id_set_number_unique" UNIQUE("workout_exercise_id","set_number")
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"position" integer NOT NULL,
	"notes" text,
	CONSTRAINT "workout_exercises_workout_id_position_unique" UNIQUE("workout_id","position")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text,
	"performed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_user_id_name_idx" ON "exercises" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "workout_exercises_exercise_id_idx" ON "workout_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workouts_user_id_performed_at_idx" ON "workouts" USING btree ("user_id","performed_at" DESC NULLS LAST);