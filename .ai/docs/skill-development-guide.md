# Skill Development Guide

Follow these principles when developing new AI skills:
- **Single Responsibility**: Do one thing well.
- **Stateless Operation**: Do not rely on conversation history alone. Read from generated `.ai/context/` files.
- **Deterministic Routing**: Be clear on trigger conditions so the Engineering Orchestrator knows when to invoke you.
