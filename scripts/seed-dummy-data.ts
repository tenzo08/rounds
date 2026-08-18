import { config } from "dotenv";
config({ path: ".env.production-sg.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

interface CardSeed {
  subject: string;
  topic: string;
  folder: string;
  focus: string;
  description: string;
  shared: boolean;
}

const USER_A_CARDS: CardSeed[] = [
  { subject: "Pharmacology", folder: "Prelims", topic: "Beta-blockers", focus: "Metoprolol", description: "Selective beta-1 blocker used for hypertension and tachyarrhythmias. Hold if HR < 60 bpm or SBP < 90 mmHg. Never stop abruptly — taper to avoid rebound hypertension/tachycardia.", shared: true },
  { subject: "Pharmacology", folder: "Prelims", topic: "Loop diuretics", focus: "Furosemide", description: "Acts on the loop of Henle to promote potent diuresis. Monitor for hypokalemia, ototoxicity at high doses, and orthostatic hypotension. Often paired with potassium supplementation.", shared: true },
  { subject: "Pharmacology", folder: "Prelims", topic: "Anticoagulant reversal", focus: "Vitamin K", description: "Reverses warfarin by restoring clotting factor synthesis (II, VII, IX, X). Onset takes hours to days — give fresh frozen plasma first if bleeding is urgent.", shared: true },
  { subject: "Pharmacology", folder: "Prelims", topic: "Opioid overdose antidote", focus: "Naloxone", description: "Competitive opioid receptor antagonist. Rapid onset (2-3 min IV), short half-life — repeat dosing often needed since the opioid may outlast the antidote.", shared: true },
  { subject: "Pharmacology", folder: "Midterms", topic: "Insulin onset comparison", focus: "Rapid-acting insulin", description: "Lispro/aspart/glulisine: onset ~15 min, peak 1-2 hr, duration 3-5 hr. Give immediately before meals — timing mismatches risk hypoglycemia.", shared: false },
  { subject: "Pharmacology", folder: "Midterms", topic: "Digoxin toxicity signs", focus: "Digoxin toxicity", description: "Watch for nausea, visual halos/yellow-green vision, bradycardia, and arrhythmias. Narrow therapeutic index (0.5-2.0 ng/mL) — hypokalemia increases toxicity risk.", shared: false },
  { subject: "Med-Surg", folder: "Prelims", topic: "DVT prevention", focus: "Sequential compression devices", description: "Mechanical prophylaxis for immobile post-op patients. Promotes venous return, reducing stasis. Combine with early ambulation and pharmacologic prophylaxis per orders.", shared: true },
  { subject: "Med-Surg", folder: "Prelims", topic: "Chest tube management", focus: "Tidaling", description: "Normal fluctuation of the water seal chamber with respiration. Absence may mean a full lung re-expansion or a kink/obstruction — assess both before assuming resolution.", shared: true },
  { subject: "Med-Surg", folder: "Prelims", topic: "Post-op fever timeline", focus: "The 5 W's", description: "Wind (atelectasis/pneumonia, day 1-2), Water (UTI, day 3-5), Walking (DVT/PE, day 4-6), Wound (infection, day 5-7), Wonder drugs (drug fever, any time).", shared: true },
  { subject: "Med-Surg", folder: "Midterms", topic: "Compartment syndrome", focus: "The 6 P's", description: "Pain (out of proportion, worsens with passive stretch), Pallor, Paresthesia, Pulselessness (late sign), Poikilothermia, Paralysis (late sign). Report pain out of proportion immediately.", shared: false },
  { subject: "Med-Surg", folder: "Midterms", topic: "Autonomic dysreflexia trigger", focus: "Bladder distension", description: "Most common trigger in spinal cord injury above T6. Presents as severe hypertension with bradycardia and pounding headache. Check for a kinked catheter first.", shared: false },
  { subject: "OB & Peds", folder: "Prelims", topic: "Late decelerations", focus: "Uteroplacental insufficiency", description: "Gradual FHR decrease starting after the contraction peak, returning to baseline after it ends. Reposition to left lateral, give O2, and increase IV fluids — notify provider.", shared: true },
  { subject: "OB & Peds", folder: "Prelims", topic: "Postpartum hemorrhage cause", focus: "Uterine atony", description: "Most common cause of PPH — a boggy, non-contracted uterus. First action is fundal massage; notify provider if it doesn't firm up or bleeding continues.", shared: true },
  { subject: "OB & Peds", folder: "Prelims", topic: "Newborn APGAR timing", focus: "APGAR score", description: "Assessed at 1 and 5 minutes after birth: Appearance, Pulse, Grimace, Activity, Respiration, each scored 0-2. Score 7-10 is reassuring; <7 needs continued assessment.", shared: true },
  { subject: "OB & Peds", folder: "Midterms", topic: "Pediatric dehydration sign", focus: "Sunken fontanelle", description: "In infants, a sunken anterior fontanelle plus decreased tearing/urine output and dry mucous membranes signals moderate-to-severe dehydration.", shared: false },
  { subject: "Psych Mental Health", folder: "Midterms", topic: "Lithium toxicity range", focus: "Lithium therapeutic level", description: "Therapeutic range 0.6-1.2 mEq/L. Toxicity signs: coarse tremor, ataxia, confusion, vomiting. Maintain adequate sodium/fluid intake — dehydration raises lithium levels.", shared: true },
  { subject: "Psych Mental Health", folder: "Midterms", topic: "Serotonin syndrome triad", focus: "Serotonin syndrome", description: "Altered mental status, autonomic instability (hyperthermia, tachycardia), and neuromuscular abnormalities (clonus, hyperreflexia). Risk rises when combining serotonergic drugs.", shared: true },
  { subject: "Fundamentals", folder: "Prelims", topic: "Hand hygiene priority", focus: "Alcohol-based hand rub", description: "Preferred over soap and water for routine decontamination unless hands are visibly soiled or caring for a patient with C. diff — then soap and water is required.", shared: false },
  { subject: "Fundamentals", folder: "Prelims", topic: "Restraint reassessment", focus: "Restraint monitoring", description: "Check circulation, movement, sensation, and skin integrity at least every 2 hours; document need for continued restraint per facility policy and obtain timely orders.", shared: false },
];

const USER_B_CARDS: CardSeed[] = [
  { subject: "Pharmacology", folder: "Prelims", topic: "ACE inhibitor side effect", focus: "Dry cough", description: "Caused by bradykinin accumulation from ACE inhibition. If intolerable, switch to an ARB (e.g. losartan), which doesn't affect bradykinin.", shared: true },
  { subject: "Pharmacology", folder: "Prelims", topic: "Heparin antidote", focus: "Protamine sulfate", description: "Binds and neutralizes heparin's anticoagulant effect. Give slowly IV — rapid administration can cause hypotension and anaphylactoid reactions.", shared: true },
  { subject: "Pharmacology", folder: "Prelims", topic: "Steroid taper reason", focus: "Adrenal suppression", description: "Long-term corticosteroid use suppresses the HPA axis. Abrupt discontinuation risks adrenal crisis — always taper gradually.", shared: true },
  { subject: "Pharmacology", folder: "Midterms", topic: "NSAID contraindication", focus: "Peptic ulcer disease", description: "NSAIDs inhibit prostaglandins that protect gastric mucosa, increasing GI bleed risk — use cautiously with a history of ulcers or on anticoagulants.", shared: false },
  { subject: "Pharmacology", folder: "Midterms", topic: "MAOI dietary restriction", focus: "Tyramine", description: "Aged cheese, cured meats, and fermented foods can trigger a hypertensive crisis in patients on MAOIs by preventing tyramine breakdown.", shared: false },
  { subject: "Med-Surg", folder: "Prelims", topic: "Hypovolemic shock early sign", focus: "Tachycardia", description: "The body compensates for blood/fluid loss by increasing heart rate before blood pressure drops — a falling BP is a later, more ominous sign.", shared: true },
  { subject: "Med-Surg", folder: "Prelims", topic: "Diabetic ketoacidosis breath", focus: "Kussmaul respirations", description: "Deep, rapid breathing that compensates for metabolic acidosis by blowing off CO2. Often accompanied by a fruity (acetone) breath odor.", shared: true },
  { subject: "Med-Surg", folder: "Prelims", topic: "Pressure injury staging", focus: "Stage 2 pressure injury", description: "Partial-thickness skin loss with exposed dermis — presents as a shallow open ulcer or an intact/ruptured serum-filled blister, no slough present.", shared: true },
  { subject: "Med-Surg", folder: "Midterms", topic: "Cushing's triad", focus: "Cushing's triad", description: "Widening pulse pressure, bradycardia, and irregular respirations — a late sign of increased intracranial pressure requiring immediate escalation.", shared: false },
  { subject: "Critical Care", folder: "Finals", topic: "Ventilator alarm priority", focus: "High-pressure alarm", description: "Usually indicates obstruction — kinked tubing, biting, secretions, or coughing. Assess the patient first, then the circuit, before troubleshooting the machine.", shared: true },
  { subject: "Critical Care", folder: "Finals", topic: "Sepsis bundle first hour", focus: "Sepsis 1-hour bundle", description: "Draw lactate and blood cultures, give broad-spectrum antibiotics, start 30 mL/kg crystalloid for hypotension/lactate ≥4, all within the first hour of recognition.", shared: true },
  { subject: "Critical Care", folder: "Finals", topic: "ARDS oxygenation criterion", focus: "PaO2/FiO2 ratio", description: "Used to classify ARDS severity: mild 200-300, moderate 100-200, severe <100 (with PEEP ≥5 cmH2O). Reflects how poorly the lungs are oxygenating blood.", shared: false },
  { subject: "Psych Mental Health", folder: "Prelims", topic: "Suicide risk priority action", focus: "Direct suicide assessment", description: "Ask directly about suicidal ideation, plan, means, and intent — asking does not increase risk and is essential for accurate safety planning.", shared: true },
  { subject: "Psych Mental Health", folder: "Prelims", topic: "Alcohol withdrawal timeline", focus: "Delirium tremens", description: "Most severe withdrawal complication, typically onset 48-96 hours after last drink — confusion, autonomic instability, and hallucinations; can be fatal untreated.", shared: false },
  { subject: "Fundamentals", folder: "Prelims", topic: "Braden Scale purpose", focus: "Braden Scale", description: "Assesses pressure injury risk across six subscales (sensory perception, moisture, activity, mobility, nutrition, friction/shear) — lower score means higher risk.", shared: false },
  { subject: "Fundamentals", folder: "Prelims", topic: "Standard vs. contact precautions", focus: "Contact precautions", description: "Gown and gloves for organisms spread by direct/indirect contact (e.g. MRSA, C. diff) — used in addition to, not instead of, standard precautions.", shared: false },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  if (users.length < 2) {
    throw new Error(`Expected at least 2 users, found ${users.length}`);
  }
  const [userA, userB] = users;

  const existingNoteCount = await prisma.note.count();
  if (existingNoteCount > 0) {
    console.log(`Notes already exist (${existingNoteCount}) — skipping seed to avoid duplicates.`);
    await prisma.$disconnect();
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      memberships: { some: { userId: userA.id } },
      AND: { memberships: { some: { userId: userB.id } } },
    },
  });
  if (!group) {
    throw new Error("Expected a group both seeded users already belong to.");
  }

  async function seedCards(userId: string, cards: CardSeed[]): Promise<void> {
    for (const card of cards) {
      const subject = await prisma.subject.upsert({
        where: { ownerId_name: { ownerId: userId, name: card.subject } },
        update: {},
        create: { ownerId: userId, name: card.subject },
      });
      const topic = await prisma.topic.upsert({
        where: { subjectId_name: { subjectId: subject.id, name: card.topic } },
        update: {},
        create: { subjectId: subject.id, name: card.topic },
      });
      const folder = await prisma.folder.upsert({
        where: { topicId_name: { topicId: topic.id, name: card.folder } },
        update: {},
        create: { topicId: topic.id, name: card.folder },
      });
      const note = await prisma.note.create({
        data: {
          ownerId: userId,
          folderId: folder.id,
          focus: card.focus,
          description: card.description,
        },
      });
      if (card.shared) {
        await prisma.noteShare.create({
          data: { noteId: note.id, groupId: group.id },
        });
      }
    }
  }

  await seedCards(userA.id, USER_A_CARDS);
  await seedCards(userB.id, USER_B_CARDS);

  const sharedCount = [...USER_A_CARDS, ...USER_B_CARDS].filter((c) => c.shared).length;
  const privateCount = [...USER_A_CARDS, ...USER_B_CARDS].length - sharedCount;
  console.log(
    `Seeded ${USER_A_CARDS.length} cards for ${userA.displayName} and ${USER_B_CARDS.length} for ${userB.displayName}.`,
  );
  console.log(`${sharedCount} shared into "${group.name}", ${privateCount} private.`);

  await prisma.$disconnect();
}

main();
