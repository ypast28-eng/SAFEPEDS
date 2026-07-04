/** Map Postgres / Supabase errors to user-friendly bloodwork messages. */
export function formatBloodworkInsertError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("null value in column") && lower.includes("marker_name")) {
    return "Could not save extracted markers because a marker name was missing. Please try re-uploading the PDF or enter results manually.";
  }
  if (lower.includes("null value in column") && lower.includes("result_value")) {
    return "Could not save extracted markers because a result value was missing. Please try re-uploading the PDF or enter results manually.";
  }
  if (lower.includes("null value in column") && lower.includes("category")) {
    return "Could not save extracted markers because a marker category was missing. Please try again or enter results manually.";
  }
  if (lower.includes("null value in column") && lower.includes("unit")) {
    return "Could not save extracted markers because a unit was missing. Please try again or enter results manually.";
  }
  if (lower.includes("violates not-null constraint")) {
    return "Could not save extracted markers because required data was missing. Please try again or enter results manually.";
  }
  if (lower.includes("could not find") && lower.includes("column") && lower.includes("schema cache")) {
    return "Database schema is out of date. Run the latest Supabase migrations, then retry extraction.";
  }

  return message;
}
