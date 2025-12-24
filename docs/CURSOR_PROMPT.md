# CURSOR_PROMPT.md
CreationHub — Implementation Instructions for Cursor

READ FIRST:
- Architecture is FIXED.
- Do not redesign.
- Do not simplify by breaking rules.

GOAL:
Implement install.sh and supporting files exactly as defined.

RULES:
- install.sh is an orchestrator
- Whiptail UI never applies changes
- Install → Configure → Start phases are never mixed
- DNS/WireGuard policy is absolute
- Docker uses CGNAT networks only
- Services are modular via compose files
- Re-running install.sh must be safe

FILES:
- install.sh
- apply_config.sh
- compose/*.yml
- .env
- state/*.json
- logs/install.log

SUCCESS:
- Deterministic behavior
- No partial states
- No hidden assumptions
