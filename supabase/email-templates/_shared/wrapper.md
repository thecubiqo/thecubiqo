# Shared CubiQo email wrapper

All CubiQo auth emails use the same outer scaffolding so they look identical to the user.
The per-event templates (confirm-signup.html, magic-link.html, etc.) replace only the
`{{ HEADLINE }}` / `{{ BODY }}` / `{{ CTA_LABEL }}` / `{{ CTA_URL }}` placeholders.

Design tokens:
  bg-page       #06060a  (dark)
  bg-card       #0c0c12  (panel)
  border        #1f1f2a
  text-strong   #f4f4f5
  text-body     #c0c0c8
  text-muted    #71717a
  brand-cyan    #67e8f9
  brand-violet  #a78bfa
  brand-gradient  linear-gradient(135deg, #67e8f9 0%, #a78bfa 100%)

Footer always includes:
  - "CubiQo™ — Home to General Intelligence"
  - link to cubiqo.ai
  - "you received this because you signed up at cubiqo.ai. If this wasn't you, ignore this email."

All emails use inline CSS (no external stylesheet — most clients strip them) and
table-based layout for Outlook compatibility.
