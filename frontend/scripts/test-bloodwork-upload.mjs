/**
 * Quick validation tests for bloodwork upload helpers.
 * Run: node scripts/test-bloodwork-upload.mjs
 */

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX = 20 * 1024 * 1024;

function validateBloodworkUploadFile(file) {
  if (!ALLOWED.has(file.type)) {
    return "Please upload a PDF, JPG, or PNG file.";
  }
  if (file.size > MAX) {
    return "File must be 20 MB or smaller.";
  }
  return null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pdf = { type: "application/pdf", size: 1024 };
const jpg = { type: "image/jpeg", size: 1024 };
const bad = { type: "text/plain", size: 1024 };
const huge = { type: "application/pdf", size: MAX + 1 };

assert(validateBloodworkUploadFile(pdf) === null, "pdf should pass");
assert(validateBloodworkUploadFile(jpg) === null, "jpg should pass");
assert(validateBloodworkUploadFile(bad) !== null, "txt should fail");
assert(validateBloodworkUploadFile(huge) !== null, "oversize should fail");

console.log("bloodwork upload validation: OK");
