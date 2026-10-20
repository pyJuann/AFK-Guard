// Prints which voice dependencies (encryption, DAVE, Opus) @discordjs/voice can find.
// Phase 0 uses this to decide which encryption library to pin. Record the output in ADR 0008.
import { generateDependencyReport } from '@discordjs/voice';

console.log(generateDependencyReport());
