# Relay module

Relay is a local-first assistant surface. Reusable UI pieces live under
`assets/scripts/components/`; reusable client capability calls live under
`assets/scripts/agent/`.

Use `HomebaseAgent.tools()` to discover safe local capabilities and
`HomebaseAgent.query(scope, query)` for metadata-only lookup. Do not add direct
filesystem or shell execution to the client.
