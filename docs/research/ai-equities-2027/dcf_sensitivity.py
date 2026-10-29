"""Sensitivity grid for reverse_dcf.py: implied 10y growth of steady-state FCF across
discount rates 8/9/11% and terminal growth 2/3/4%. Same inputs and caveats as reverse_dcf.py."""
import importlib.util, io, contextlib
spec = importlib.util.spec_from_file_location('r', __file__.replace('dcf_sensitivity.py', 'reverse_dcf.py'))
m = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(m)
D = dict(m.D); D['AVGO (after SBC)'] = (1679, 24.0-59.4, 38.5-4*2.02, 38.5-4*2.02, 'SBC $2.02bn/qtr per filing')
def implied(f0, tgt, r, tg):
    lo, hi = -0.5, 1.0
    for _ in range(200):
        g = (lo+hi)/2
        lo, hi = (g, hi) if m.value(f0, g, r, tg) < tgt else (lo, g)
    return g
print(f"{'':22}" + "".join(f"  r{int(r*100)}/tg{int(tg*100)}" for r in (0.08,0.09,0.11) for tg in (0.02,0.03,0.04)))
for k,(mc,nc,rep,st,_) in D.items():
    if k == 'AVGO': continue
    print(f"{k:22}" + "".join(f"{implied(st, mc-nc, r, tg)*100:10.1f}" for r in (0.08,0.09,0.11) for tg in (0.02,0.03,0.04)))
