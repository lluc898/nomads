"use client";

import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_MAX_BYTES,
} from "@viajeroshub/shared";
import { useActionState, useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";

import { type ProfileActionState, updateProfileAction } from "./actions";

type ProfileFormProps = {
  profile: {
    name: string | null;
    username: string | null;
    image: string | null;
    instagramUrl: string | null;
  };
  callbackUrl?: string;
};

const initialState: ProfileActionState = { status: "idle" };

type UsernameAvailability = "idle" | "checking" | "available" | "taken";

export function ProfileForm({ profile, callbackUrl }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [previewUrl, setPreviewUrl] = useState(profile.image ?? "");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [username, setUsername] = useState(profile.username ?? "");
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailability>("idle");
  const objectUrl = useRef<string | null>(null);
  const usernameIsFixed = Boolean(profile.username);

  useEffect(
    () => () => {
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (usernameIsFixed || !/^[a-z0-9_]{3,24}$/.test(username)) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setUsernameAvailability("checking");

      try {
        const response = await fetch(
          `/api/usernames/${encodeURIComponent(username)}/availability`,
          { signal: controller.signal },
        );
        const result = (await response.json()) as { available?: boolean };
        setUsernameAvailability(result.available ? "available" : "taken");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setUsernameAvailability("idle");
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [username, usernameIsFixed]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }

    if (!file) {
      setPhotoError(null);
      setPreviewUrl(state.imageUrl ?? profile.image ?? "");
      return;
    }

    if (!PROFILE_PHOTO_ACCEPT.split(",").includes(file.type)) {
      setPhotoError("Selecciona una imagen JPEG, PNG o WebP.");
      setPreviewUrl(state.imageUrl ?? profile.image ?? "");
      event.target.value = "";
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setPhotoError("La foto no puede superar los 5 MB.");
      setPreviewUrl(state.imageUrl ?? profile.image ?? "");
      event.target.value = "";
      return;
    }

    objectUrl.current = URL.createObjectURL(file);
    setPhotoError(null);
    setPreviewUrl(objectUrl.current);
  }

  return (
    <form action={formAction} className="mt-8 space-y-7">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5">
        <label
          htmlFor="photo"
          className="group relative shrink-0 cursor-pointer rounded-full outline-none has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-200"
          aria-label="Cambiar foto de perfil"
        >
          <input
            key={state.imageUrl ?? "initial-photo"}
            id="photo"
            name="photo"
            type="file"
            accept={PROFILE_PHOTO_ACCEPT}
            onChange={handlePhotoChange}
            aria-describedby="photo-description"
            aria-invalid={Boolean(photoError || state.errors?.photo)}
            className="sr-only"
          />
          <UserAvatar
            image={previewUrl || null}
            name={profile.name}
            username={profile.username}
            size="lg"
          />
          <span className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full border-4 border-slate-50 bg-[#0B6EFD] text-white shadow-md transition group-hover:bg-[#0857C9]">
            <PencilIcon />
          </span>
        </label>
        <div>
          <p className="font-bold text-slate-950">Tu foto pública</p>
          <p
            id="photo-description"
            className="mt-1 text-sm leading-5 text-slate-600"
          >
            Pulsa sobre la foto para cambiarla. JPEG, PNG o WebP, máximo 5 MB.
          </p>
          {[
            ...(photoError ? [photoError] : []),
            ...(state.errors?.photo ?? []),
          ].map((error) => (
            <p key={error} className="mt-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          ))}
        </div>
      </div>

      <FormField
        id="username"
        label="Nombre de usuario"
        hint={
          usernameIsFixed
            ? "Es tu identificador público y ya no se puede modificar."
            : "Elígelo bien: después de guardarlo no se podrá cambiar."
        }
        errors={state.errors?.username}
      >
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-bold text-slate-500">
            @
          </span>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value.replace(/^@/, "").toLowerCase());
              setUsernameAvailability("idle");
            }}
            disabled={usernameIsFixed}
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            autoComplete="username"
            aria-describedby="username-description"
            aria-invalid={Boolean(state.errors?.username)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pr-4 pl-9 text-slate-950 transition outline-none focus:border-[#0B6EFD] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {usernameIsFixed ? (
            <input
              type="hidden"
              name="username"
              value={profile.username ?? ""}
            />
          ) : null}
        </div>
        {!usernameIsFixed && usernameAvailability !== "idle" ? (
          <p
            className={`mt-2 text-sm font-semibold ${
              usernameAvailability === "available"
                ? "text-green-700"
                : usernameAvailability === "taken"
                  ? "text-red-600"
                  : "text-slate-500"
            }`}
            aria-live="polite"
          >
            {usernameAvailability === "checking"
              ? "Comprobando disponibilidad…"
              : usernameAvailability === "available"
                ? "Nombre de usuario disponible."
                : "Ese nombre de usuario ya está en uso."}
          </p>
        ) : null}
      </FormField>

      <FormField
        id="instagram"
        label="Instagram"
        hint="Opcional. Puedes escribir @usuario o pegar el enlace completo."
        errors={state.errors?.instagram}
      >
        <input
          id="instagram"
          name="instagram"
          defaultValue={profile.instagramUrl ?? ""}
          placeholder="@tuusuario"
          maxLength={255}
          autoComplete="url"
          aria-describedby="instagram-description"
          aria-invalid={Boolean(state.errors?.instagram)}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 transition outline-none placeholder:text-slate-400 focus:border-[#0B6EFD] focus:ring-4 focus:ring-blue-100"
        />
      </FormField>

      {state.message ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm font-semibold ${
            state.status === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || usernameAvailability === "taken"}
        className="min-h-12 w-full cursor-pointer rounded-xl bg-[#0B6EFD] px-5 font-bold text-white transition hover:bg-[#0857C9] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {pending
          ? "Guardando…"
          : usernameIsFixed
            ? "Guardar cambios"
            : "Crear perfil"}
      </button>
    </form>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="m4 20 4.25-1 10.5-10.5a2.12 2.12 0 0 0-3-3L5.25 16 4 20Z" />
      <path d="m14.5 6.5 3 3" />
    </svg>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  hint: string;
  errors?: string[];
  children: React.ReactNode;
};

function FormField({ id, label, hint, errors, children }: FormFieldProps) {
  const descriptionId = `${id}-description`;

  return (
    <div>
      <label htmlFor={id} className="block font-bold text-slate-900">
        {label}
      </label>
      <p id={descriptionId} className="mt-1 text-sm text-slate-600">
        {hint}
      </p>
      <div className="mt-2">{children}</div>
      {errors?.map((error) => (
        <p key={error} className="mt-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      ))}
    </div>
  );
}
