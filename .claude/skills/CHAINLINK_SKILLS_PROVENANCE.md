# Chainlink agent skills (vendored)

- Source: https://github.com/smartcontractkit/chainlink-agent-skills (MIT)
- Commit: d907b451ce36a510db3a6ad19e6b76c9e763175d (2026-10-28)
- Docs: https://docs.chain.link/resources/chainlink-developer-agent-skills
- Installed: 2026-11-02, project-level, all 9 skills (ace, ccip, confidential-ai-attester, cre, cre-connect, data-feeds, data-streams, nop, vrf). Evals and onboarding folders not vendored.
- Reviewed before install: no remote-exec or credential-harvesting instructions; the skills forbid signing, broadcasting and handling keys, consistent with Zobiris authority rules.
- Zobiris relevance: data-feeds and data-streams are the primary research inputs (onchain price references, report timestamps). The rest are available but research-only here: no deployments, transactions or signing without explicit owner approval.
- Update: re-clone the repo, diff, review, and replace these folders.
