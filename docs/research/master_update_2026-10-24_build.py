"""Build the 24 Oct synthesis chapter and merge it ahead of the supplied 176-page master (bookmarks preserved)."""
import sys
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle

pdfmetrics.registerFont(TTFont('Body', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
INK, MUTED, ACCENT, RULE, TINT = (colors.HexColor(h) for h in ('#16211d', '#55615b', '#1f6f5c', '#cfd6d2', '#eef3f0'))
S = {
    'eyebrow': ParagraphStyle('e', fontName='Bold', fontSize=8.5, textColor=ACCENT, leading=11, spaceAfter=3),
    'h1': ParagraphStyle('h1', fontName='Bold', fontSize=18, leading=22, textColor=INK, spaceAfter=6),
    'h2': ParagraphStyle('h2', fontName='Bold', fontSize=12.5, leading=16, textColor=INK, spaceBefore=8, spaceAfter=5),
    'body': ParagraphStyle('b', fontName='Body', fontSize=9.6, leading=13.4, textColor=INK, spaceAfter=5),
    'note': ParagraphStyle('n', fontName='Body', fontSize=8.2, leading=11, textColor=MUTED, spaceAfter=5),
    'cell': ParagraphStyle('c', fontName='Body', fontSize=8.2, leading=10.6, textColor=INK),
    'head': ParagraphStyle('hd', fontName='Bold', fontSize=8.2, leading=10.6, textColor=colors.white),
}
P = lambda t, s='body': Paragraph(t, S[s])
W = A4[0] - 30 * mm


def table(rows, widths):
    data = [[Paragraph(str(c), S['head'] if i == 0 else S['cell']) for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=[w * W for w in widths], repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), INK), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TINT]), ('LINEBELOW', (0, 0), (-1, -1), 0.4, RULE),
                           ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                           ('LEFTPADDING', (0, 0), (-1, -1), 3.5), ('RIGHTPADDING', (0, 0), (-1, -1), 3.5)]))
    t.spaceAfter = 6
    return t


def footer(c, d):
    c.saveState(); c.setFont('Body', 7.5); c.setFillColor(MUTED)
    c.drawString(15 * mm, 9 * mm, 'ZOBIRIS | 24 Oct 2026 synthesis (Claude) | research only, no trading authority')
    c.drawRightString(A4[0] - 15 * mm, 9 * mm, str(d.page)); c.restoreState()


story = []
# 1 Summary
story += [P('ZOBIRIS / MASTER UPDATE / 24 OCTOBER 2026', 'eyebrow'), P('Examination and synthesis of the 176-page master', 'h1'),
    P('<b>Bottom line.</b> The 46 new pages hold up. Their numbers reproduce on Kraken, their method reviews are correct, and their '
      'indicator research reaches the same verdict as a separate four-agent study run on 23–24 Oct: almost nothing outside price momentum '
      'has tested power to call BTC direction days to weeks ahead, but several inputs reliably flag risk regimes. The two efforts are '
      'complementary, and together they define six bounded experiments. Three conflicts need the owner: the fee tier, the GRAM listing, and '
      'how basket calls are attributed.'),
    table([['New section (pages)', 'What it says', 'Verdict'],
           ['Research-process audit (1–5)', 'Recovers 6 omitted sources; adds a source-disposition rule; queues HY-spread momentum and downside-risk targeting as challengers', 'Sound. Adopt the disposition rule.'],
           ['Allocation redesign review (6–14)', 'Reported PBO 57%, DSR 0.33 and replay table are unverified; corrects KAMA, liquidity identity, HRP, labels, CPCV', 'Sound. Spot-checked: break-even 52.67%, KAMA SC 0.0601 at ER 0.30, CPCV 15 splits / 5 paths all correct.'],
           ['Missing predictors (15–35)', 'Ranks BTC-equity correlation change and derivatives stress first; Kalshi macro repricing predicts volatility; 16 endpoint checks', 'Agrees with the independent study; adds two citations it lacked (Yae & Tian 2022; Mohanty & Krishnamachari 2026).'],
           ['Oct 23 scorecard (36–37)', 'Oct 22 firm group beat weak group at 24h (PASS, Brier 0.2025); two new 60% calls to Oct 24 17:00 UTC', 'Reproduced exactly: firm −0.010%, weak −1.174%, BTC +0.004%. New calls open.'],
           ['Oct 18 leaders (38)', 'ZEC +10.8%, INJ +8.3%, ZRO +7.7%, UNI +6.6% in 6h from depressed range positions', 'Consistent with the verification chapter.'],
           ['Oct 22 resilience study (39–44)', 'Separates retained gains from current downside defense; frozen 24h test', 'Consistent with Claude\'s Oct 22–23 rankings; adds useful thin-market flags.'],
           ['Market-watch addendum (175–176)', 'Oct 8–22 level map and ETF-flow chronology', 'Historical context; ETF figures match other reports.']],
          [0.22, 0.46, 0.32]),
    P('Method: every new page read in full; claimed figures re-derived from public Kraken 15-minute candles on 24 Oct 01:34 UTC; formula examples recomputed. '
      'No production code, settings or orders were touched.', 'note'), PageBreak()]

# 2 Conflicts
story += [P('1 | Conflicts and corrections', 'h2'),
    table([['Issue', 'Finding', 'Action'],
           ['Kraken fee tier', 'The new chapter (p. 30) uses the owner-reported 0.20% maker / 0.38% taker. On 22 Oct the owner confirmed the app\'s tier-1 default, 0.40% / 0.80%. Research studies used 0.40% round trip (0.20% per side).',
            '<b>Owner to confirm one tier.</b> If 0.20/0.38 is right, set ZOBIRIS_KRAKEN_FEE_TIER=4 (0.20/0.35) or add the exact schedule.'],
           ['GRAM on Kraken', 'Claude reported GRAM unavailable on Kraken. The new chapter is right: GRAM is the former Toncoin and trades as TON/USD.', 'Corrected. Map GRAM to TONUSD in the call log and monitors.'],
           ['Basket-call attribution', 'The other model\'s 22 Oct firm-vs-weak call (55%, 24h) is its own. Separately, the call logged as the owner\'s 72h basket (65%) used a probability Claude suggested and the owner accepted.', 'Both stand as logged; the 65% record now notes its origin. Score owner-originated probabilities separately from accepted suggestions.'],
           ['Floor calls', 'The other model\'s 60% floor call covers 24h; Claude\'s and the owner\'s run to 29 Oct. Different questions.', 'Score each on its own window. No merging.'],
           ['Deploy status', 'Cost-schedule fix merged to main (0c9cb4f) on 22 Oct with CI green, but Railway had not redeployed.', 'Owner to trigger a deploy in the Railway dashboard.']],
          [0.18, 0.52, 0.30])]

# 3 Combined indicator ranking
story += [P('2 | Combined indicator ranking', 'h2'),
    P('Both studies converge. The benchmark every new input must beat is plain momentum (price versus its 50-day average): Liu & Tsyvinski (RFS 2021) find '
      'a one-standard-deviation weekly return predicts +3.16% next week, and BGeometrics\' Oct 2026 holdout found most on-chain rules no better than a 50-day filter.'),
    table([['#', 'Input', 'Role', 'Best evidence', 'Free source'],
           ['1', 'BTC–equity correlation change', 'Direction candidate', 'Yae & Tian (Physica A 2022): best daily OOS predictor, R² 2.69%. Correlation swung −0.68 to +0.74 in 2026.', 'Kraken + FRED/Yahoo'],
           ['2', 'Futures carry (basis)', 'Crash-risk flag', 'BIS WP 1087 (2023): high carry predicts crashes', 'Deribit, OKX, CME settlements'],
           ['3', 'Derivatives stress pack: quantity OI, funding extremes, ATM IV, skew', 'Risk / volatility', 'Funding extremes ±1.8%/24h, regime-dependent (SSRN 2026); OI must be converted to coin units', 'OKX, Deribit, Hyperliquid'],
           ['4', 'Implied vs realized vol (DVOL − RV)', 'Regime flag', 'DVOL above next-30d realized vol on 73.7% of days; DVOL 37.3 on 19 Oct, lowest since 2021', 'Deribit'],
           ['5', 'Kalshi macro repricing', 'Volatility forecast', 'Mohanty & Krishnamachari (2026 preprint): recession-risk repricing cuts BTC vol forecast error 2.1% (MSFE 0.979)', 'Kalshi, Polymarket'],
           ['6', 'Token-unlock calendar', 'Alt demote flag', 'Keyrock (16,000 events): 90% negative, pressure starts ~30 days before; large unlocks about −15%', 'Tokenomist, CryptoRank'],
           ['7', 'Coinbase premium; Korea premium', 'Direction candidate (untested)', 'Mechanism documented (Makarov & Schoar, JFE 2020); no forecasting test found. Coinbase premium negative 20 straight days to 13 Oct', 'Coinbase, Upbit + FX'],
           ['8', 'Fed/CPI/payroll surprise (not level)', 'Event risk', 'NY Fed SR 1052: BTC mostly ignores macro news except CPI', 'BLS, FRED/ALFRED'],
           ['9', 'Stablecoin supply and exchange inflows', 'Confirm only', 'Supply follows price (Wei 2018); USDT exchange inflows predict BTC at 1–2h only (2025)', 'DeFiLlama'],
           ['10', 'MVRV, realized price, cost bases', 'Cycle context', 'Cycle valuation only; MVRV 1.50 (realized price ~$54k); ETF cost basis ~$81.5k; 2-yr buyers above ~$88k', 'Coin Metrics community']],
          [0.05, 0.22, 0.14, 0.40, 0.19]),
    P('<b>Skip or use as negative controls:</b> the global-M2 "10–12 week lead" (lags fitted after the fact), hash ribbons, max pain, CME gap fills, liquidation-map "magnets" '
      '(cascades are real; attraction is unproven), lunar cycles, Fear &amp; Greed as a contrarian signal (it leans momentum and fails OOS), LLM news sentiment, whale alerts.', 'note')]

# 4 Market record
story += [P('3 | Market record, 22–24 October', 'h2'),
    table([['Driver', 'Reading', 'Bearing on open calls'],
           ['BTC', '$81.4–81.7k; Oct 15 floor $79,709 held twice; 24h low since Oct 23 17:00 UTC $80,418', 'Floor intact so far'],
           ['Stocks', 'Nasdaq −2.58% on 22 Oct (AI doubts: AMD −8%, Micron −6%, Nvidia −4%); S&amp;P −1.19%; Brent $116.7', 'Base rate: after a Nasdaq −2.5% close, BTC traded 5%+ lower within 7 days 59% of the time vs 42% normally (n=37)'],
           ['Fed and jobs', 'Hold expected 27–28 Oct, December hike priced; hot Sep CPI; Sep payrolls +29k vs ~84k expected, unemployment 4.2%', 'Stagflation mix: a headwind for risk assets'],
           ['Flows', 'Spot ETFs +$526.6M on 19 Oct (IBIT +$665M) after −$910M over two weeks; Strategy bought only 267 BTC; corporate net buying fell to 5.6k BTC in Q3', 'ETFs, not Strategy, are the marginal buyer'],
           ['Liquidations (Hyperliquid)', '$621M of longs vs $147M of shorts within ±10%; ~$175M of long liquidations at $79.3–80.3k; largest cluster $99M at $74.4–74.9k; Apex tier net short', 'A floor break could cascade toward $77k'],
           ['Prediction markets', 'Polymarket: dip to $80k by 25 Oct 25.5%; to $77.5k in October 30.5%; above $80k on 29 Oct 69%. Kalshi: above $79.5k at 30 Oct ~73%', 'Crowd puts the floor holding at ~60–65%'],
           ['Supply events', 'MSCI rule for Strategy 30 Nov; Nakamoto–Kraken loan due December; MARA sending 500-BTC batches; Mt. Gox ~34k BTC deferred to Oct 2027', 'Calendar flags, mostly priced in'],
           ['Leaders since 18 Oct low', 'CVX +30, COMP +17, DASH +16, ZEC +15 vs BTC; TIA −7, STX −7, SAND −6', 'Leaders held at the bottom on 1.7× volume vs 1.0× for laggards']],
          [0.17, 0.50, 0.33]),
    P('4 | Forecast ledger', 'h2'),
    table([['Forecaster', 'Call', 'p', 'Resolves', 'Status'],
           ['Other model', 'Oct 22 firm group beats weak group, 24h', '0.55', '23 Oct 16:00', 'PASS (verified), Brier 0.2025'],
           ['Other model', 'BTC holds $79,700, 24h', '0.60', '24 Oct 17:00', 'Open; low $80,418 so far'],
           ['Other model', 'UNI, ZEC, SOL beat HBAR, AVAX, TIA, 24h', '0.60', '24 Oct 17:00', 'Open; −3.73% vs −1.73% so far'],
           ['Owner (p suggested by Claude)', '11 firm coins beat 7 weak coins, 72h', '0.65', '25 Oct 13:52', 'Open'],
           ['Claude', 'Same baskets, from 23 Oct', '0.55', '25 Oct 13:25', 'Open'],
           ['Owner', 'BTC holds $79,709 through 29 Oct', '0.85', '29 Oct 23:38', 'Open'],
           ['Claude', 'Same; original / updated after macro data', '0.45 / 0.35', '29 Oct 23:25 / 23:47', 'Open'],
           ['Claude', 'CVX, COMP, DASH, ZEC beat BTC, 7 days', '0.45', '30 Oct 16:25', 'Open'],
           ['Claude (scored)', 'Oct 21 rotation buckets; TIA breakout', '0.45; 0.30', '22 Oct', 'Both missed as leaned; Brier 0.20, 0.09']],
          [0.18, 0.38, 0.10, 0.16, 0.18])]

# 5 Plan
story += [P('5 | Merged experiment plan', 'h2'),
    P('Fix data first, then test one challenger at a time against the momentum benchmark, with Kraken costs and a locked chronological holdout. '
      'Register each test before outcomes; keep every null result.'),
    table([['#', 'Experiment', 'Target and pass rule', 'Source'],
           ['0', 'Data contract and fee tier', 'Every observation timestamped by first availability; one confirmed fee schedule; GRAM→TON mapping', 'Both'],
           ['A', 'BTC–equity correlation change', 'Next-day BTC return; OOS error below zero and expanding-mean forecasts after momentum controls', 'Other model'],
           ['B', 'Derivatives stress + carry + DVOL−RV', '1h/24h volatility and tail events; calibrated tail probabilities beat a realized-vol (HAR) baseline', 'Both'],
           ['C', 'Kalshi macro repricing', 'Next-day realized vol; replicate MSFE &lt; 1 including the failed Fed result', 'Other model'],
           ['D', 'Token-unlock demote flag', 'Alt 30-day excess vs BTC for coins with large unlocks ahead vs matched coins without', 'Claude'],
           ['E', 'Coinbase premium', 'Next 1–7 day BTC return; must add beyond ETF flows', 'Claude'],
           ['F', 'Volume at the BTC turn (registered 23 Oct)', 'Top-third vs bottom-third relative volume at the turn, 72h excess vs BTC, after 6 turns', 'Claude'],
           ['G', 'Post-drop relative strength (registered 22 Oct)', 'Least- vs most-fallen fifth, 72h, after 10 drops; daily monitor live', 'Claude']],
          [0.05, 0.28, 0.50, 0.17]),
    P('<b>Not doing:</b> a simultaneous v4 overhaul; promoting any reported-but-unreproduced PBO/DSR figure; replacing risk caps with HRP; treating liquidation clusters as targets.', 'note'),
    P('6 | Sources', 'h2'),
    P('Kraken public OHLC (XBTUSD, TONUSD and 11 alt pairs, 15m, fetched 24 Oct 01:34 UTC). Independent study: /home/user/reports/Bitcoin indicators not yet tracked.md and its four note files; '
      'repo copy docs/research/BITCOIN_INDICATORS_NOT_YET_TRACKED_2026-10-24.md. Market notes and ledgers: docs/market-memory/MARKET_NOTES_2026-10-22_23.md, owner-calls.jsonl; '
      'registry: docs/research/registry/. Key papers: Liu &amp; Tsyvinski (RFS 2021); Yae &amp; Tian (Physica A 2022); Schmeling, Schrimpf &amp; Todorov (BIS WP 1087); '
      'Benigno &amp; Rosa (NY Fed SR 1052); Mohanty &amp; Krishnamachari (arXiv 2604.01431); Makarov &amp; Schoar (JFE 2020); Keyrock token-unlock study; Liquidations: Coinversa Pulse (Hyperliquid), 23 Oct 21:27 UTC.', 'note')]

doc = SimpleDocTemplate(sys.argv[1], pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=14 * mm, bottomMargin=16 * mm,
                        title='Zobiris master update 24 Oct 2026', author='Claude')
doc.build(story, onFirstPage=footer, onLaterPages=footer)

ch, base = PdfReader(sys.argv[1]), PdfReader(sys.argv[2])
w = PdfWriter()
for p in ch.pages: w.add_page(p)
n = len(ch.pages)
w.append(base, import_outline=False)
top = w.add_outline_item('24 Oct 2026: examination and synthesis (Claude)', 0)
def page_of(text):
    return next(i for i, p in enumerate(ch.pages) if text in (p.extract_text() or ''))
for title, key in (('Summary and verdicts', 'Examination and synthesis'), ('Conflicts and corrections', 'Conflicts and corrections'),
                   ('Combined indicator ranking', 'Combined indicator ranking'), ('Market record, 22-24 Oct', 'Market record'),
                   ('Forecast ledger', 'Forecast ledger'), ('Merged experiment plan', 'Merged experiment plan')):
    w.add_outline_item(title, page_of(key), parent=top)
prev = w.add_outline_item('Previous master - 176 pages (23 Oct update)', n)


def copy(items, parent):
    last = None
    for it in items:
        if isinstance(it, list):
            copy(it, last); continue
        last = w.add_outline_item(it.title, n + base.get_destination_page_number(it), parent=parent)


copy(base.outline, prev)
w.write(sys.argv[3])
print('chapter pages', n, 'total', len(w.pages))
