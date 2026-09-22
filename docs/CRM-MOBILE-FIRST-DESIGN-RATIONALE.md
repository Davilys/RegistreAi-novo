# RegistreAi admin: mobile-first product rationale

Status: non-production preview, synthetic data only.

## Why the first preview was superseded
The first preview expressed the right functional scope but used a desktop-dashboard grammar: metric cards, a conventional sidebar, a generic chart, repeated containers and a responsive collapse. That does not match an operation used mostly on mobile or the RegistreAi ambition.

## Product model
The replacement starts from four daily jobs:
1. decide what deserves attention now;
2. enter a conversation in one tap;
3. understand where a trademark is and why;
4. preserve proof and human accountability before any official act.

The five persistent mobile destinations are Início, Conversas, Marcas, Prioridades and Mais. They stay within thumb reach. Desktop derives from these same destinations instead of introducing a different product.

## Distinctive system
- Priority engine first, totals second. Home begins with decisions, dependencies, time and evidence rather than vanity KPIs.
- Operational river. Trademark phases read as a living flow and lead to an explainable process map.
- Evidence-aware intelligence. Reg summaries say when content is synthetic, cite evidence counts and never imply authorization.
- Living dossier. A timeline shows what happened, what source backs it and the next human decision.
- Direct Meta boundary. Channel health is explicit, fail-closed and separate from product state. The preview does not inherit providers from any other project.
- Sparse surface language. Lines, whitespace and typography replace repeated rounded cards. Lime is reserved for selected navigation and verified progress; red only marks material risk.

## Interaction and accessibility
- Persistent bottom navigation on mobile with labels and 44px+ targets.
- Natural-language command sheet, explicitly local and non-executing.
- One-tap thread opening, visible back action, local-only handoff control and disabled send in preview.
- Reduced-motion support and no meaning conveyed by color alone.
- Mobile widths inspected at 390 and 430 px; desktop at 1440 px.

## Deliberate states
The preview specifies normal, risk, blocked, offline, no-source, restricted and synchronizing states. The real product must bind each state to canonical events, actor and timestamp. No absent source may be translated into a positive business status.

## Sources reviewed as pattern guidance
- Nielsen Norman Group, “Basic Patterns for Mobile Navigation: A Primer”: persistent tab bars improve discoverability, while mobile must prioritize content over chrome. https://www.nngroup.com/articles/mobile-navigation-patterns/
- Material Design 3 navigation guidance: bottom navigation is suited to a small number of top-level destinations and should preserve stable destination semantics. https://m3.material.io/components/navigation-bar/overview
- Apple Human Interface Guidelines, navigation and search: direct, predictable navigation and reachable controls. https://developer.apple.com/design/human-interface-guidelines/navigation-and-search

Patterns were interpreted for trademark operations; no brand interface was copied.

## V3 conversation workspace
The process map was frozen after owner approval. V3 changes only the conversation experience.

The chat is no longer a WhatsApp-style transcript with a context panel. It is an operations workspace where three layers remain visually distinct:
- customer and Reg messages retain familiar, quiet reading patterns;
- machine interpretation appears as small, bordered intelligence events;
- process controls appear as explicit deadline, document, decision and official-lock objects.

New conversation primitives:
- a three-state intelligence strip for live reading, journey and evidence;
- live Reg summary with confidence clearly marked as demo;
- audio waveform plus a separate transcript-understanding object;
- interpreted document object with origin/extraction action;
- deadline and procedural event inside the chronological timeline;
- decision object comparing two paths without authorizing either;
- proactive next-action composer that labels drafts as unsent;
- visible human/Reg handoff state;
- evidence sheet that explains the suggestion and the source state;
- direct Meta offline state and a persistent official-act lock.

Motion is short, functional and removed under reduced-motion preferences. The mobile surface is tested at 390 and 430 px, including tabs, sheet, smart composer and handoff. Desktop adds a living context column without changing the conversation model.
