import test from "node:test";
import assert from "node:assert/strict";
import { parseRaymondLessonHeader } from "../src/lib/raymondLesson.ts";

test("only an explicit valid Raymond header selects a local reaction", () => {
  assert.deepEqual(parseRaymondLessonHeader("[!RAYMOND:curious] Forudsig før du kører"), { reaction: "curious", title: "Forudsig før du kører" });
  assert.deepEqual(parseRaymondLessonHeader("[!RAYMOND:foreign-key] Hvem ejer relationen?"), { reaction: "foreign-key", title: "Hvem ejer relationen?" });
});

test("ordinary quotes, unknown reactions and a missing paragraph break stay ordinary Markdown", () => {
  for (const text of ["Raymond siger: Prøv én ting ad gangen.", "[!NOTE] Almindelig note", "[!RAYMOND:unknown] Ukendt billede", "[!RAYMOND:../../outside] Ugyldig sti", "[!RAYMOND:curious]", "[!RAYMOND:curious] Titel\nBrødtekst uden blank linje"]) {
    assert.equal(parseRaymondLessonHeader(text), null, text);
  }
});
