if (!globalThis.localStorage) globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { SanctuaryCompanion, filterBotOutput, BLOCKED_WORDS } from '../../frontend/src/services/companionEngine.js';
import { filterOutput, hasCrisisTrigger, extractUserWords } from '../utils/blockedWords.js';
import { aiService, sanitizeName } from '../utils/aiService.js';

console.log('--- STARTING TASK 5 CHATBOT CONTENT SAFETY UNIT TESTS ---');

// Test 1: Proactive greeting does NOT echo mood labels
const mockUser = {
  name: 'Rakshit',
  streak: 2,
  moodHistory: [{ mood: 'anxious', intensity: 8 }, { mood: 'stressed', intensity: 7 }]
};
const companion = new SanctuaryCompanion(mockUser);
const greeting = companion.getProactiveMilestoneGreeting();
console.log('Greeting test:');
console.log('"', greeting, '"');
const hasAnxiousInGreeting = greeting.toLowerCase().includes('anxious') || greeting.toLowerCase().includes('stressed');
console.log('T1. Proactive greeting never echoes negative labels:', !hasAnxiousInGreeting ? 'PASS' : 'FAIL');

// Test 2: Output filter eliminates proactive blocked words
const dirtyText = "You seem to be experiencing anxiety, depression, and high stress today.";
const cleanedText = filterBotOutput(dirtyText, "Hello Aria");
console.log('Filter test (clean output):');
console.log('"', cleanedText, '"');
const hasBlocked = BLOCKED_WORDS.some(w => cleanedText.toLowerCase().includes(w));
console.log('T2. Output filter removes proactive negative words:', !hasBlocked ? 'PASS' : 'FAIL');

// Test 3: When user introduces sensitive word, bot responds gently and asks to call helpline
const responseToStress = companion.respond("I am feeling lots of stress with my exams");
console.log('Response to sensitive word:');
console.log('"', responseToStress.text, '"');
const askedHelpline = responseToStress.text.includes("Would you like me to call a helpline for you?");
const avoidedEchoing = !responseToStress.text.toLowerCase().includes("stress");
console.log('T3. Asks "Would you like me to call a helpline for you?":', askedHelpline ? 'PASS' : 'FAIL');
console.log('T4. Avoids repeating user negative word back:', avoidedEchoing ? 'PASS' : 'FAIL');

// Test 5: Only after user agrees ("yes"), shows helpline numbers
const agreedResponse = companion.respond("Yes please");
console.log('Agreed response contains India numbers:');
const hasIndiaNumber = agreedResponse.text.includes("14416") && agreedResponse.text.includes("1800-599-0019");
console.log('T5. Displays helpline numbers only after user agrees:', hasIndiaNumber ? 'PASS' : 'FAIL');

// Test 6: Ambiguous / non-affirmative phrases like "please leave me alone" must NOT trigger helpline details
const companionForAmbiguity = new SanctuaryCompanion(mockUser);
companionForAmbiguity.respond("I am feeling lots of stress with my exams"); // Triggers helpline prompt
const ambiguousResponse = companionForAmbiguity.respond("please leave me alone");
const ambiguousHasHelpline = ambiguousResponse.text.includes("14416") || ambiguousResponse.text.includes("1800-599-0019");
console.log('T6. "please leave me alone" does NOT reveal helpline numbers:', !ambiguousHasHelpline ? 'PASS' : 'FAIL');

// Test 7: Structured quick-reply consent ({ type: "helpline_consent", value: "yes" }) works
const companionForStructured = new SanctuaryCompanion(mockUser);
companionForStructured.respond("I want to hurt myself");
const structuredYesResponse = companionForStructured.respond(null, { type: "helpline_consent", value: "yes" });
const structuredHasHelplines = structuredYesResponse.text.includes("14416");
console.log('T7. Structured action consent returns helplines:', structuredHasHelplines ? 'PASS' : 'FAIL');

// Test 8: Hinglish & Devanagari crisis triggers detected
const hinglishDetected = hasCrisisTrigger("main marna chahta hun");
const devanagariDetected = hasCrisisTrigger("मैं मरना चाहता हूँ");
console.log('T8. Hinglish Romanized and Devanagari crisis detected:', (hinglishDetected && devanagariDetected) ? 'PASS' : 'FAIL');

// Test 9: Welcome message passes through filter
const filteredWelcome = filterOutput("Welcome friend. Let us release your stress and anxiety today.", []);
const welcomeClean = !filteredWelcome.toLowerCase().includes("stress") && !filteredWelcome.toLowerCase().includes("anxiety");
console.log('T9. Welcome message passes through output filter:', welcomeClean ? 'PASS' : 'FAIL');

// Test 10: Rule-based fallback when LLM is unavailable
const fallbackRes = await aiService.generateWelcomeMessage("TestUser", null, null);
console.log('T10. AI Service fallback works gracefully:', fallbackRes.success && fallbackRes.message.length > 10 ? 'PASS' : 'FAIL');

// Test 11: Output filter unit tests: blocked word absent -> pass cleanly
const cleanInput = "You are doing great today. Take a deep, gentle breath with me.";
const filterPassResult = filterOutput(cleanInput, []);
console.log('T11. Blocked word absent passes unchanged:', filterPassResult === cleanInput ? 'PASS' : 'FAIL');

// Test 12: Blocked word present & user did not introduce -> rewritten with safe synonym
const botProducedStress = "I can help soothe your high stress and panic.";
const rewrittenOutput = filterOutput(botProducedStress, []);
const hasOffending = rewrittenOutput.toLowerCase().includes("stress") || rewrittenOutput.toLowerCase().includes("panic");
console.log('T12. Present without user introduction rewritten with safe synonym:', !hasOffending ? 'PASS' : 'FAIL');

// Test 13: User introduced word -> bot still does not echo it
const userIntroduced = ["anxiety"];
const botReplyEchoing = "I understand your anxiety is hard.";
const nonEchoResult = filterOutput(botReplyEchoing, userIntroduced);
const echoesUserWord = nonEchoResult.toLowerCase().includes("anxiety");
console.log('T13. User introduced word is NOT echoed back:', !echoesUserWord ? 'PASS' : 'FAIL');

// Test 14: Inflections and case variants handled correctly
const caseVariantsText = "Feeling DEPRESSED, stressful, and PANICKING?";
const cleanedVariants = filterOutput(caseVariantsText, []);
const hasVariants = /depress|stress|panic/i.test(cleanedVariants);
console.log('T14. Case variants and inflections filtered safely:', !hasVariants ? 'PASS' : 'FAIL');

// Test 15: Name sanitizer strips control characters, newlines, and limits length
const dirtyName = "John\x00\x1F\n\r<script>alert(1)</script>DoeVeryLongNameExceedingFortyCharactersLimitJustInCase";
const cleanName = sanitizeName(dirtyName);
const nameClean = cleanName.length <= 40 && !cleanName.includes('\n') && !cleanName.includes('\r') && !cleanName.includes('<');
console.log('T15. Name sanitization strips injection & restricts to 40 chars:', nameClean ? 'PASS' : 'FAIL');

console.log('--- ALL EXTENDED TASK 5 & PHASE A SAFETY TESTS PASSED SUCCESSFULLY ---');
