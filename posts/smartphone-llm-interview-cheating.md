---
title: Smartphone LLM cheating in live coding interviews leaves visible signals
date: 2026-06-23
tags: [llm, interview, hiring]
---

I caught a candidate using a smartphone LLM during a live video coding interview. The giveaway was not one dramatic moment. It was a pattern of small delays, gaze shifts and lighting changes that did not match the shared screen.

Taken alone, each signal can have an innocent explanation. Together, they formed a clear picture.

## The pattern

1. **Background blur was enabled.** That hides objects behind the candidate, including a phone held below or beside the screen.
2. **Their eyes moved to more than two places.** During a normal coding round, the main gaze points are the screen and keyboard. Here there was a repeated third point.
3. **The shared screen stayed still while their face brightness changed.** The code editor did not change, but their face had subtle light shifts when their shoulder moved. That is consistent with holding or adjusting a bright phone near the screen.
4. **They repeated or simplified the question multiple times.** This bought time to type or speak the prompt into another device.
5. **They used filler words until the answer arrived.** The pauses were not thinking pauses. They were waiting pauses.
6. **The answer quality changed suddenly.** They started with vague or incorrect fragments, then switched into polished, structured answers.

## What I learned

The signal is not "they looked away once". People look away when thinking. The signal is the mismatch between three streams:

- what their face and eyes are doing
- what the shared screen is doing
- how the answer quality changes over time

If the screen is static, the face lighting keeps shifting and the answer moves from gibberish to perfect in one jump, the interview is no longer measuring the candidate. It is measuring their ability to proxy an LLM through a hidden device.

For live coding rounds, I now watch the timing chain: question asked, eyes move, filler starts, screen stays still, answer suddenly improves. That sequence is harder to fake than any single behavior.
