/**
 * Supabase database types — profiles table
 * Regenerate with Supabase CLI when schema grows.
 */

export type Sex = "male" | "female" | "other" | "prefer_not_to_say";

export type TrainingExperience =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "elite";

export interface Profile {
  id: string;
  email: string;
  age: number | null;
  sex: Sex | null;
  height: number | null;
  weight: number | null;
  body_fat: number | null;
  training_experience: TrainingExperience | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = {
  email?: string;
  age?: number | null;
  sex?: Sex | null;
  height?: number | null;
  weight?: number | null;
  body_fat?: number | null;
  training_experience?: TrainingExperience | null;
  is_admin?: boolean;
  updated_at?: string;
};
