"use client";

import { useRef } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

// TODO(human): replace this with the red glowing border classes for the modal.
const MODAL_GLOW = "border border-red-500";

export function AuthModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-current px-4 py-2 text-sm font-medium"
      >
        Account
      </button>

      <dialog
        ref={dialogRef}
        className={`m-auto rounded-2xl bg-background p-8 text-foreground backdrop:bg-black/60 ${MODAL_GLOW}`}
      >
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-semibold">Welcome to your diary</h2>
          <div className="flex gap-3">
            <SignInButton />
            <SignUpButton />
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-sm opacity-70 hover:opacity-100"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
