# ai-watchlist (data branch)

Written once a day by a scheduled Claude review; read by the Zobiris server from
`https://raw.githubusercontent.com/Loki6543/Zobiris/ai-watchlist/ai-watchlist.json`.

This branch holds data only. It is not built, tested or deployed (CI runs on `main` and `feat/**`;
Railway deploys `main`). The server validates the file strictly and the review can only veto a coin
or move its opening score by at most 10%. It never overrides a failed contract or liquidity check.

Format: `{ "version": 1, "generatedAt": ISO-8601, "items": [ { symbol, geckoId, name, verdict
(CONSIDER|WATCH|AVOID), aiScore 0-100, socialScore 0-100, mindshareTrend (RISING|FLAT|FALLING|UNKNOWN),
narrative, thesis, greenFlags[], redFlags[], sources[https URLs] } ] }`, at most 40 items.
