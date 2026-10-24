import { getUserProfileById, updateUserProfile } from "@viajeroshub/database";
import { profileInputSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";
import {
  deleteStoredProfilePhoto,
  ProfilePhotoError,
  storeProfilePhoto,
} from "@/lib/profile/avatar-storage";

export type SaveProfileResult =
  | {
      ok: true;
      profile: NonNullable<Awaited<ReturnType<typeof getUserProfileById>>>;
      wasFirstSave: boolean;
    }
  | {
      ok: false;
      status: number;
      message: string;
      errors?: Partial<Record<"username" | "photo" | "instagram", string[]>>;
    };

export async function saveProfile(
  userId: string,
  formData: FormData,
): Promise<SaveProfileResult> {
  const database = getDatabase();
  const currentProfile = await getUserProfileById(database, userId);

  if (!currentProfile) {
    return {
      ok: false,
      status: 404,
      message: "No hemos encontrado tu cuenta.",
    };
  }

  const result = profileInputSchema.safeParse({
    username: formData.get("username"),
    instagram: formData.get("instagram"),
  });

  if (!result.success) {
    return {
      ok: false,
      status: 400,
      message: "Revisa los campos marcados.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  if (
    currentProfile.username &&
    currentProfile.username !== result.data.username
  ) {
    return {
      ok: false,
      status: 409,
      message: "El nombre de usuario no se puede cambiar una vez guardado.",
      errors: { username: ["Este nombre de usuario ya es definitivo."] },
    };
  }

  const photo = formData.get("photo");
  let nextImageUrl = currentProfile.image;
  let storedAvatarUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    try {
      storedAvatarUrl = await storeProfilePhoto(photo);
      nextImageUrl = storedAvatarUrl;
    } catch (error) {
      if (error instanceof ProfilePhotoError) {
        return {
          ok: false,
          status: 400,
          message: "Revisa la foto seleccionada.",
          errors: { photo: [error.message] },
        };
      }
      console.error("No se ha podido almacenar la foto de perfil", error);
      return {
        ok: false,
        status: 500,
        message: "No hemos podido guardar la foto. Inténtalo de nuevo.",
      };
    }
  }

  if (!nextImageUrl) {
    return {
      ok: false,
      status: 400,
      message: "Añade una foto para completar tu perfil.",
      errors: { photo: ["Selecciona una foto de perfil."] },
    };
  }

  let updatedProfile;
  try {
    updatedProfile = await updateUserProfile(database, {
      userId,
      currentUsername: currentProfile.username,
      username: result.data.username,
      imageUrl: nextImageUrl,
      instagramUrl: result.data.instagram,
    });
  } catch (error) {
    await cleanNewAvatar(storedAvatarUrl);
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        status: 409,
        message: "Ese nombre de usuario ya está ocupado.",
        errors: { username: ["Prueba con otro nombre de usuario."] },
      };
    }
    console.error("No se ha podido actualizar el perfil", error);
    return {
      ok: false,
      status: 500,
      message: "No hemos podido guardar el perfil. Inténtalo de nuevo.",
    };
  }

  if (!updatedProfile) {
    await cleanNewAvatar(storedAvatarUrl);
    return {
      ok: false,
      status: 409,
      message:
        "Tu perfil ha cambiado. Actualiza la pantalla e inténtalo de nuevo.",
    };
  }

  if (storedAvatarUrl && currentProfile.image !== storedAvatarUrl) {
    await deleteStoredProfilePhoto(currentProfile.image).catch((error) => {
      console.error("No se ha podido eliminar la foto anterior", error);
    });
  }

  return {
    ok: true,
    profile: updatedProfile,
    wasFirstSave: !currentProfile.username,
  };
}

async function cleanNewAvatar(imageUrl: string | null) {
  await deleteStoredProfilePhoto(imageUrl).catch((error) => {
    console.error("No se ha podido limpiar la nueva foto", error);
  });
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
