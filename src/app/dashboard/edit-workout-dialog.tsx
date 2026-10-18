"use client"

import { format } from "date-fns";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { editWorkout, removeWorkout } from "./actions";

type ExerciseOption = { id: number; name: string; muscleGroup: string | null };
type SetRow = { reps: string; weight: string };
type ExerciseRow = { exerciseId: string; sets: SetRow[] };

export type EditableWorkout = {
  id: number;
  name: string | null;
  notes: string | null;
  performedAt: Date;
  workoutExercises: {
    exerciseId: number;
    sets: { reps: number | null; weight: string | null }[];
  }[];
};

const emptySet: SetRow = { reps: "", weight: "" };

// Form state mirrors the saved workout; numeric weights are normalised ("50.00" -> "50").
function toRows(workout: EditableWorkout): ExerciseRow[] {
  return workout.workoutExercises.map((we) => ({
    exerciseId: String(we.exerciseId),
    sets: we.sets.map((s) => ({
      reps: s.reps === null ? "" : String(s.reps),
      weight: s.weight === null ? "" : String(Number(s.weight)),
    })),
  }));
}

// The workout and exercise catalog arrive as props from the server page.
// Ownership is enforced server-side in the `editWorkout`/`removeWorkout` actions.
export function EditWorkoutDialog({
  workout,
  exercises,
}: {
  workout: EditableWorkout;
  exercises: ExerciseOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(workout.name ?? "");
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [rows, setRows] = useState<ExerciseRow[]>(() => toRows(workout));

  const dateParam = format(workout.performedAt, "yyyy-MM-dd");
  const items = exercises.map((e) => ({ value: String(e.id), label: e.name }));

  function resetToSaved() {
    setName(workout.name ?? "");
    setNotes(workout.notes ?? "");
    setRows(toRows(workout));
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    // Reopening always starts from the saved data, discarding abandoned edits.
    if (next) resetToSaved();
    setOpen(next);
  }

  function updateRow(index: number, next: Partial<ExerciseRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...next } : r)));
  }

  function updateSet(rowIndex: number, setIndex: number, next: Partial<SetRow>) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? { ...r, sets: r.sets.map((s, j) => (j === setIndex ? { ...s, ...next } : s)) }
          : r,
      ),
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await editWorkout(workout.id, { name, notes, exercises: rows });
      if (result.ok) {
        toast.success("Workout was updated");
        setOpen(false);
        router.push(`/dashboard?date=${dateParam}`);
      } else {
        setError(result.error);
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await removeWorkout(workout.id);
      setConfirmOpen(false);
      if (result.ok) {
        toast.success("Workout was deleted");
        setOpen(false);
        router.push(`/dashboard?date=${dateParam}`);
      } else {
        setError(result.error);
      }
    });
  }

  // "No" leaves the edit dialog and returns to the dashboard.
  function declineDelete() {
    setConfirmOpen(false);
    setOpen(false);
    router.push("/dashboard");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="w-fit" />}>
        <PencilIcon />
        Edit workout
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit workout</DialogTitle>
            <DialogDescription>
              Workout on {format(workout.performedAt, "do MMM yyyy")}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-workout-name">Name</Label>
            <Input
              id="edit-workout-name"
              placeholder="e.g. Push day"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-workout-notes">Notes</Label>
            <Input
              id="edit-workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Select
                  items={items}
                  value={row.exerciseId || null}
                  onValueChange={(value) =>
                    updateRow(rowIndex, { exerciseId: value ?? "" })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove exercise"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== rowIndex))}
                >
                  <TrashIcon />
                </Button>
              </div>

              {row.sets.map((s, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2">
                  <span className="w-12 text-sm text-muted-foreground">
                    Set {setIndex + 1}
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Reps"
                    aria-label={`Set ${setIndex + 1} reps`}
                    value={s.reps}
                    onChange={(e) => updateSet(rowIndex, setIndex, { reps: e.target.value })}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="Weight (kg)"
                    aria-label={`Set ${setIndex + 1} weight in kg`}
                    value={s.weight}
                    onChange={(e) => updateSet(rowIndex, setIndex, { weight: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove set"
                    onClick={() =>
                      updateRow(rowIndex, {
                        sets: row.sets.filter((_, j) => j !== setIndex),
                      })
                    }
                  >
                    <TrashIcon />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => updateRow(rowIndex, { sets: [...row.sets, emptySet] })}
              >
                <PlusIcon />
                Add set
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setRows((prev) => [...prev, { exerciseId: "", sets: [emptySet] }])}
          >
            <PlusIcon />
            Add exercise
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
            >
              Delete
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Do you want to delete the workout?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the workout and all its sets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={declineDelete} disabled={pending}>
                No
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>
                Yes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
