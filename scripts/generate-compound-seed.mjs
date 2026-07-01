#!/usr/bin/env node
/**
 * Generates supabase/migrations/20250702000001_seed_compounds.sql
 * Run: node scripts/generate-compound-seed.mjs
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATEGORIES = [
  { name: "Testosterone", description: "Testosterone esters and base compounds" },
  { name: "DHT Derivatives", description: "Dihydrotestosterone-derived anabolic agents" },
  { name: "19-Nor", description: "19-nortestosterone derived compounds" },
  { name: "Oral Anabolics", description: "Oral anabolic-androgenic steroids" },
  { name: "Injectable Anabolics", description: "Injectable anabolic-androgenic steroids" },
  { name: "Growth Hormones", description: "Growth hormone and secretagogues" },
  { name: "Peptides", description: "Peptide-based performance and recovery compounds" },
  { name: "SARMs", description: "Selective androgen receptor modulators and related" },
  { name: "Fat Loss", description: "Fat loss and metabolic agents" },
  { name: "PCT", description: "Post-cycle therapy compounds" },
  { name: "Estrogen Control", description: "Aromatase inhibitors and estrogen management" },
  { name: "Prolactin Control", description: "Prolactin management compounds" },
  { name: "Blood Pressure Support", description: "Cardiovascular blood pressure support" },
  { name: "Liver Support", description: "Hepatoprotective supplements and compounds" },
  { name: "Cholesterol Support", description: "Lipid and cholesterol management support" },
  { name: "Kidney Support", description: "Renal support compounds" },
  { name: "General Health", description: "General health and wellness support" },
];

const COMPOUNDS = {
  Testosterone: [
    "Testosterone Enanthate",
    "Testosterone Cypionate",
    "Testosterone Propionate",
    "Testosterone Suspension",
    "Testosterone Undecanoate",
  ],
  "DHT Derivatives": [
    "Masteron Enanthate",
    "Masteron Propionate",
    "Primobolan Enanthate",
    "Primobolan Acetate",
    "Anavar",
    "Winstrol",
    "Proviron",
    "Superdrol",
    "Halotestin",
  ],
  "19-Nor": [
    "Trenbolone Acetate",
    "Trenbolone Enanthate",
    "Trenbolone Hex",
    "Deca Durabolin",
    "NPP",
    "MENT (Trestolone)",
  ],
  "Injectable Anabolics": ["Equipoise", "DHB (1-Testosterone Cypionate)"],
  "Oral Anabolics": ["Dianabol", "Anadrol", "Turinabol", "Methyltestosterone"],
  "Growth Hormones": [
    "Human Growth Hormone (HGH)",
    "IGF-1 LR3",
    "IGF-1 DES",
    "MK-677",
    "Insulin",
  ],
  Peptides: [
    "BPC-157",
    "TB-500",
    "CJC-1295 DAC",
    "CJC-1295 No DAC",
    "Ipamorelin",
    "GHRP-2",
    "GHRP-6",
    "Hexarelin",
    "Sermorelin",
    "Tesamorelin",
    "PEG-MGF",
    "AOD-9604",
    "Kisspeptin-10",
    "Thymosin Alpha-1",
    "Thymalin",
    "Epitalon",
    "MOTS-c",
    "SS-31",
    "GHK-Cu",
    "KPV",
    "B7-33",
    "Follistatin-344",
  ],
  SARMs: [
    "Ostarine (MK-2866)",
    "Ligandrol (LGD-4033)",
    "RAD-140",
    "S23",
    "ACP-105",
    "AC-262536",
    "Andarine (S4)",
    "Cardarine (GW-501516)",
    "SR9009",
    "YK-11",
  ],
  "Fat Loss": ["Clenbuterol", "Salbutamol", "Yohimbine", "T3", "T4"],
  PCT: ["HCG", "Enclomiphene", "Clomiphene", "Tamoxifen", "Raloxifene"],
  "Estrogen Control": ["Arimidex (Anastrozole)", "Aromasin (Exemestane)", "Letrozole"],
  "Prolactin Control": ["Cabergoline", "Pramipexole"],
  "Liver Support": ["TUDCA", "NAC"],
  "Blood Pressure Support": ["Telmisartan", "Nebivolol"],
  "Cholesterol Support": ["Ezetimibe", "Omega-3 Fish Oil", "Citrus Bergamot"],
  "General Health": ["CoQ10"],
};

function inferMeta(category, name) {
  const lower = name.toLowerCase();
  let compound_type = "other";
  let administration = "other";
  let ester = null;

  if (["Testosterone", "DHT Derivatives", "19-Nor", "Oral Anabolics", "Injectable Anabolics"].includes(category)) {
    compound_type = "anabolic";
  } else if (category === "Peptides") {
    compound_type = "peptide";
    administration = lower.includes("oral") ? "oral" : "subcutaneous";
  } else if (category === "Growth Hormones") {
    compound_type = "hormone";
    administration = name === "Insulin" ? "subcutaneous" : "subcutaneous";
    if (name.includes("HGH")) administration = "subcutaneous";
    if (name === "MK-677") {
      compound_type = "other";
      administration = "oral";
    }
  } else if (category === "SARMs") {
    compound_type = "sarm";
    administration = "oral";
  } else if (category === "Fat Loss") {
    compound_type = "fat_loss";
    administration = ["T3", "T4"].includes(name) ? "oral" : lower.includes("oral") ? "oral" : "oral";
    if (name === "Clenbuterol" || name === "Salbutamol") administration = "oral";
  } else if (category === "PCT") {
    compound_type = "pct";
    administration = name === "HCG" ? "subcutaneous" : "oral";
  } else if (category === "Estrogen Control" || category === "Prolactin Control") {
    compound_type = "ancillary";
    administration = "oral";
  } else if (
    ["Blood Pressure Support", "Liver Support", "Cholesterol Support", "Kidney Support", "General Health"].includes(
      category
    )
  ) {
    compound_type = "support";
    administration = "oral";
  }

  if (lower.includes("enanthate")) ester = "Enanthate";
  else if (lower.includes("cypionate")) ester = "Cypionate";
  else if (lower.includes("propionate")) ester = "Propionate";
  else if (lower.includes("acetate")) ester = "Acetate";
  else if (lower.includes("undecanoate")) ester = "Undecanoate";
  else if (lower.includes("hex")) ester = "Hexahydrobenzylcarbonate";

  if (
    ["Anavar", "Winstrol", "Superdrol", "Halotestin", "Dianabol", "Anadrol", "Turinabol", "Methyltestosterone", "Proviron"].some(
      (o) => name.includes(o) || name === o
    )
  ) {
    administration = "oral";
  } else if (
    compound_type === "anabolic" &&
    !["oral"].includes(administration) &&
    administration === "other"
  ) {
    administration = lower.includes("suspension") ? "intramuscular" : "intramuscular";
  }

  if (name === "Proviron") {
    compound_type = "androgen";
    administration = "oral";
  }

  const escaped = name.replace(/'/g, "''");
  const desc = `Educational profile for ${escaped}. Risk scores pending evidence-based review.`;

  return { compound_type, administration, ester, description: desc };
}

function sqlStr(v) {
  if (v === null || v === undefined) return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

let sql = `-- PED Health AI — Seed compound categories and compounds (generated)\n\n`;

sql += `-- Categories\n`;
for (const cat of CATEGORIES) {
  sql += `INSERT INTO public.compound_categories (name, description)\nVALUES (${sqlStr(cat.name)}, ${sqlStr(cat.description)})\nON CONFLICT (name) DO NOTHING;\n\n`;
}

sql += `-- Compounds + placeholder profiles\n`;
for (const [category, names] of Object.entries(COMPOUNDS)) {
  for (const name of names) {
    const meta = inferMeta(category, name);
    sql += `INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)\n`;
    sql += `SELECT c.id, ${sqlStr(name)}, ${sqlStr(meta.compound_type)}::public.compound_type_enum, ${sqlStr(meta.administration)}::public.administration_enum, ${sqlStr(meta.ester)}, ${sqlStr(meta.description)}\n`;
    sql += `FROM public.compound_categories c WHERE c.name = ${sqlStr(category)}\n`;
    sql += `ON CONFLICT (category_id, name) DO NOTHING;\n\n`;

    sql += `INSERT INTO public.compound_profiles (compound_id, notes)\n`;
    sql += `SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'\n`;
    sql += `FROM public.compounds comp\n`;
    sql += `JOIN public.compound_categories cat ON cat.id = comp.category_id\n`;
    sql += `WHERE cat.name = ${sqlStr(category)} AND comp.name = ${sqlStr(name)}\n`;
    sql += `ON CONFLICT (compound_id) DO NOTHING;\n\n`;
  }
}

const outPath = join(__dirname, "../supabase/migrations/20250702000001_seed_compounds.sql");
writeFileSync(outPath, sql);
const total = Object.values(COMPOUNDS).flat().length;
console.log(`Wrote ${outPath} (${CATEGORIES.length} categories, ${total} compounds)`);
