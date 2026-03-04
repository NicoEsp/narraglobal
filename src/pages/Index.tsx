import { useEffect, useRef } from 'react';
import { clientLogos } from '../components/clientLogos';

const SIGNATURE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAuEAAADaCAYAAAAIYpzVAAARB0lEQVR42u3dXZLjqrIG0O6KnoTnPzgPo85TRfjU9o+QMiGBtSLOy709XRKWkg+M0J8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcN3tdvvWCgAAZPjSBK8DuCAOAIAQPjCQAwCAEA4AAEL4Gsx8AwAghAMAgBAOAAAI4QAAIIQDAABCOAAACOEAACCEAwAAQvh49/v9r1YAAEAIBwAAIRwAABDCAQBACK/vdrt9awUAAIRwAAAQwvdhZxQAAIRwAAAQwgHYje12+/YMDYAQHtapaAWA47VS3QQQwsNZDw4AgBAOwFBmvgHi/NMEAFQL9H6NBIRwnQEAF4Nya519/PcCOSCEA0BS8H73OYI4sBprwp9Q7AGuheboXxj9YgkI4QBsGayzwvf9fv97ZPJDEAdWsv2M77OibiYc4H2t/F0njwTkM7VVjQZWZU04AKEBPTIw3+/3v2bAgRVZjhLcYQAI4MeXmESHfgAhHIClg/arpSLR4dvkCCCEb9KxAPA+FFurDSCEAwwdzO82oBfAAYTwUDoR4GwY3fmXNbUTQAgHIGmgIYADCOHpHQsA7wngAEK4zgRgUSZNACEcAP6MnbgwaQII4TpOAGG4/5IQy1AAIXyjTgWAPUM/gBAOIChicAMI4TpOAGG4/5IQy1AAIXyjTgWAPUM/gBAOYECvPQVwQAjfgyIPqCUCOIAQDsA2wVgAB4TwTTsVALVk7aAPIIQXo9gDCOAAQjiAAb0ADiCEr130AehbLwVwgM1CuKIPGNDXazu1GBDCAeCFq2FZAAfYMISbuQKqhtMdCOAAm4ZwxR9AAAeo6J8mAGgPlM6x7XMEcID/t+xMuKUoADXqrgAOsFEI1wkA6okADiCEAyCAA7BuCLcUBaBPzRTAAc7Z4sFMnQFgUN+nbdRbACEcgI4DEwEc4LjllqOYtQIy7R40BXAAIVyHCSCAAwjhAKwRrAVwgFxLrQm3FAVQU/q1wbMA3tpmo0O8wQUghCdQRAHya2vEFoe96/WnY77dbt9XjqmlTSLP3Y41MI9lbkyFB8iuKyvWlLMz1xm/EvRo3+yZ+qq/nugPoR5bFAIYZEwfMisct+VLgBBu1A9Qvgb/Dq1Xl4CcDcePf/NskK4cwPWHIISnMfsAMF/Qu9/vf7ODeMuDpdF9yafz6NF3CeAghBv1Awb3am2J7/DocR/9d2efSXr1b2bbYQYQwgGYLHw/mw0fEcAjj+Fs+4zaUQUy7jXX7gYh3GwVwFqBL2N7wHefd2V3rat9kODNbhnr8TN3v6aXmwlXpAC1Zd/zjggNV845I7zr15gpZPcccAvhACwRtlf9ZbF1FjwzwBz9bwRvVgnagviiIdxSFADe9QlVlqEI3+yWh7J3HxLCi3/hAAjgvfqQZ/+98E3r9dvj4eERGetVKLccxahvyvNXtAH181xgyF6GcuTfqOE1wtjv72rEg8ij788Rbe/6X2gmfKcv8+cGFcQB9TNmaUhUG6wSvnsF48f2GtGnPfu+eh5Hz8AtLwjhJIyY3VgAx8LG1QD+LjR9ClQzvtwos48ZGYA/fVc9jiMjgMsDQvhSI0fnzajvVjF1r7HGdzXrm0UzA+nI763CNXP1GPQPQrgCB4mF2EMr7Cprn+7eg92Zlp0c+Xc9l+z0Pt+qW3Sq/0L4lAVjp7DG2t+pMI5acv1cIgL4Si/Y2fFV4+8CeKV2V+v38aUJYI4gZCAGceElK+jc7/e/Mwfw7OMfVcdmCeDsZfrlKDuMGKNv3LOfZ3Te51q2RAU1NLaORdTQHjOYI//G4+dmhcVXv0Zkh9MKz9zYL57pQ7hR5LUb9mr79QyAo/dtHdkhHOkM7YqDSYbztTDj3jn7mWe2V4z+W6NqyahdUKoGcPYz9XIUIWRMERgxa7FKEWvtEN79NKyws2KNjQ6YPe6TM8d8u92+e97DRwN4VmhVr2QaFgvhwvO44tfz50rfZd3XGEPleykqUEZPYvS+b1+1w8gX0lSbBdenMcI0y1FcyLHtFrGMJXpJxI4BvPUndPcB7rG2gWrv4He17aPXZl8NopWW7swQ/M/WcrPgQvhyBXf1DvNTG0QVoSMPDPbooGZdBx3Zbs+Kt/XhGBTkfXbUszQttfzT7iW9guisy1Ai+r7MczeZwo8plqO4YGsMXH7/fJn54gahsu17dI+wy2TG2Xox4mG8IxMpv2e+RwXwXjVkxKvgK13nz45Ff7evKWfCXbBjBy7Z7e/7PdZGgjcGBbmD0rNbBrb8ipmxdV1EAJ9xFtyEDkI4XUL0KoVl9SDZe/cDHQ7up7718nHr1qN1O/PNm5UDeO/6VO0ZAJMnTBfCXbDzF6MVj5P2e9Z3S4/aPmot+NHnWjJr4dHg+zNgzwjKo+5/WQEhXEhD0ex2fpVmVc4EEPcyLdfDLm/6zTreZw90r1K/j/wA2XM9fPZgCyFcSKN759Ojc5q9IPZeknLlHu35BlbWrKctu4pUbqvs5R8t5/OqhlS9flr2jR+1NSJMGcJ3HTHusB686gyuddX9vz9tTtb1Vvm66vWA+5m2myVIVjvOT8cjoDNNCHex7kUIO99uFXYgiPpM18G4e67CK9QrfGbGm21HtudqDwNWHZCdOS71DrujsO0Aa4YXhaw4kHrXNmbFOXq9ZCxfWyWA/z6WzCB+ZMY962HPKt+JnVBYPoTrmBGS89shap/mo//+2fcgiO9nVEg7clxn9wpfsda1vO7+atvMMiCyNznLhfCdA9Iu+4Mz/rs8G4Afg0nEW1gFcddnhWN/dR1WbqdPAfDsrwgtwXJ0AI9o/7Oz1gI4S4ZwF/W+g4weAzGz4NeXhETek362de1VvFdbXr4zUxsfOeaj9+TVvzPrA7cRe6HLNZQM4Trj/cyypd6OIWhk4DEb7v4/8t9EXM+rPFT3KTxfOebf9+OZv3P1uxrRV1w5ZxMMTBfCjRa1xchzz9qvt3fIzuoERwYIDD4z7uFZlxS0LJ+JPp8jYTTqmutZ+3stSZJr+PGlCXTCuxzDikHkyJviZg4bQvm+dajHd3/2npgpREUe6+52+z6yF3bEjPfP/6q3VevSPQGcR6VmwnW4+aP6lTsI/ns/vZuVetX2vhPheObQox65j3v0ndZ/E+Gr+s3gK9IWBniuc/q2c8b3UO0FPSvXhOr30QzH926SQp0iSpmZcCFp7TaYYSlEz+Pptfb80xpR9x0V77fs6/JKPaq6M8dMA9nMF/uYFGAmZWfCXfxrh/yeHXDPAcDoNr66nrV6wGDv2pM1eJ0luH4Kr1HnMdPyJJhZiZlwHW9eQfNA5j6FfrUHyqBHLfJw8rk60+NNnLC6kjPhbkgDnuzznb0dRu2NjJowKvj2frX96MAesctIdDs9nn9UW+jv2dk/TVDfzEWq2syTWfC52kYHrZ59+qyIZyN2GhRFttPv/3vGntoghC9acHbp8HZt45bznuklPWbBmSUkn7nOejwTcnRQ2vM+aQ2wVdpJwIbzyi1HcROvM/AZFfRe/Yy7wrW18stFDAzWb9ez12HLf/d4vtEz4FnbLB7Z8STzHp7plwJYydCZcJ1un7YYMRves6jPdh2N6Eyjj+nn76y8vGeH+pR5jr3a79l3VX0LvKNt0zr4OHNuAjiMU2om3E2vTVo6jtYHl2YPHFGz4FeP9chMo2t/73oTuQ935C89ref37N+ffWCypWYdmfl+dWytx+Peg3GGzYSbBR8fYnvvlT3TuuuIMJN9rCM6yqxzUg/Wqi0R4be1Rn26564shXn2uRnX7OgaKXxDX1+aYA+zF9dR23VVCZCZy0wqvqBHGJjzuo38LqO2MYxYT519PZ49xuidZtwV0FeZLQoVgDGdcHS7j37T2oozqkeDzSz7PasFNWtt7324Z+tLon/ditxn++pxuedgoxDup2cd/8qBLXuLt6z1r2oBBlT5g/3MgWvrcQnfsGEIVwjGBJHsdcpXPjtiT+8j23z1Ouesdj577hVDr2Uoa9ScHR/u+3Qfjjr3I/uIu8dg4xBu5qvW4CTzAc0j5xH1Qp0Vfwqvfq9EXzfCwXzfpaBX97zdTyCEKxQFO4leD2RFhcuIa6TK/uRHj6NllrjHkpVeb+djHgI4wOQhnHU746jQ9Wm2fsQylMy/s/oyDctQ6t+vAjjAYiHc7FfdTrnCWxwzdjjpvRd674BaeXtEAXwOR9r/6AtmtCbAcUP3CVe0xwxMqq1bjtjHd4Yg0yugVl2XPnsA33USQQAHyNFtJtwsOBmddtQb8lp+Dfh0LZ99pXXr8c90T5kBX/M+9B0CnDdsJlzxrtU+UcHxyHn1OLdPfyNyN4gzn/X4OVUDalTIF8D/2x6zDKAyXgMPQMcQbha8Xrv07EB/gnf1ByQzdzt59neuhLHsB+MiHrZ9dX67B/AqdfHI95D1GngA7I5CUkjrGbgfj6Xl77Zu15i5q0SlkPouOP/+/638hr7sl1v9tF/1NhG4ARZYMWY6iqK8dwK8G1tbrI3KmveUNmJmvnz5zjJUeDnXf1w7RvguADUK4pSj7tssM53g2jIwK4Bnf0eP/Ph1TpfZaJRD3uE9+/q6lJAAbhXCdsWA94zlGrNvueV9EvyHz3b9tCXJCX70gDsAGIdwsuHAx82x4r7cC9g5HZx/IawnY2eF7ph1GVrpXAIjjwcwBqjzUmDGoevYw2ywPn414aDLi886+0CdqkNHru312vDNcWwAwPITrLNed7Xr8bl8F8erXwKcg3rIEIzPQP37+lfac4X5ceXZ41gErwM75LbJGf2UfLHsOHlqXeFQKRhG7SWS9LOjTca50ve3wunSBG2CuDBSZY7rNhOtsXm//NvuA5d264FdLCKpfE5nH5l7IHejNeP/McE8AEMua8EWDXq9wdGTGt2Xvbd+58L1j+7kuAITw7p2qoLFP8NytDa68zdN9MT6gqmMATBfCq3SilYPGLME04kHFV6F0h+tH8D4fcrUdAEI4KQG8cgDKCpctgw8hbN8A/vhvel4HkYNOANaQ9exOeAj3E+61AD6qo+/98hCBhplqiusVQBCP/swvzVongM8SagQSFF4AKB7Cd+zAVn/BiNuGXa4j1zsAWawJ7xS+K8+C916KAp/uiZHXn+ANgBC+QACv3qG3HJ9wQqXr8mxQdx0DIIQvHL6PdPa9Z/taX4pij2tWGUACMGeWWrkP8GDmhQum+vKTx+O7slOLsAMA9M5S0cG9GjPhCV96pQB+dZmMAA4AjMhTqxPCi4Xv2+32ffVzvIkQAFg5gK+QZYTwgItkpgtBAAcAZBQhfOrR2dWL5ffDjxGf6bXbAAD1hYey2bbqq/BE7s8xRC1nEcABILbvv0o/LK+kh/BPF/fIxt3lde3Rs+sA7BMWWc9sE6G75Ja/vRu2R2NHFq1ZL4TI2XUAYRcEd0F8khA+c1ETXAGEY6BfdjrzPhMhfIECKnQDCMnA2Ly1WxDvemJVirXQDQjM7Bx2cI+7ljcL4b0vFkUI0ImiX4F5a48QDqBDQscMdK6PQjigyIKOE+jYn3gwE4Q0EJoBEMIRvkFQBkAIRwAHwRgAhHAEcIRcAKjqnyZAUAIA6OtLEyBoAwD0JVTR7N2yFEEdAOAzM+E0exe0rRsHABDCEcQBAIRw1g/ilqQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDof4wpI11Q00g9AAAAAElFTkSuQmCC';

const Index = () => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Navbar scroll handler
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Hero chart animation
    const marca = [[100,120],[150,92],[200,68],[250,52],[300,44]];
    const sector = [[100,108],[150,110],[200,112],[250,108],[300,110]];
    const comp = [[100,92],[150,116],[200,136],[250,152],[300,162]];
    const L1 = document.getElementById('hL1');
    const L2 = document.getElementById('hL2');
    const L3 = document.getElementById('hL3');
    const D1 = document.getElementById('hD1');
    const D2 = document.getElementById('hD2');
    const D3 = document.getElementById('hD3');
    const A = document.getElementById('hArea');
    const xlabels = document.querySelectorAll('.xl');

    if (L1) {
      const dur = 5500;
      let st: number | null = null;
      let lastL = -1;
      let breatheId: number;

      function ease(t: number) { return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
      function lerp(a: number, b: number, t: number) { return a+(b-a)*t; }
      function getPts(data: number[][], p: number) {
        const seg = data.length-1;
        const cl = p*seg;
        const pts: number[][] = [];
        for (let i=0; i<data.length; i++) {
          if (i<=cl) pts.push([data[i][0],data[i][1]]);
          else if (i-1<cl) {
            const sp = cl-(i-1);
            pts.push([lerp(data[i-1][0],data[i][0],sp),lerp(data[i-1][1],data[i][1],sp)]);
            break;
          }
        }
        return pts;
      }
      function p2s(pts: number[][]) {
        let s = '';
        for (let i=0; i<pts.length; i++) s += pts[i][0].toFixed(1)+','+pts[i][1].toFixed(1)+' ';
        return s.trim();
      }
      function bArea(pts: number[][]) {
        if (pts.length<2) return '';
        let d = 'M'+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
        for (let i=1; i<pts.length; i++) d += ' L'+pts[i][0].toFixed(1)+','+pts[i][1].toFixed(1);
        d += ' L'+pts[pts.length-1][0].toFixed(1)+',176 L'+pts[0][0].toFixed(1)+',176 Z';
        return d;
      }
      function sL(i: number) {
        const el = xlabels[i] as HTMLElement;
        if (el) { el.style.transition = 'opacity 0.8s'; el.style.opacity = '1'; }
      }

      function draw(ts: number) {
        if (!st) st = ts;
        const el = ts - st;
        const rp = Math.min(el/dur, 1);
        const p = ease(rp);
        const p1 = getPts(marca, p);
        const p2 = getPts(sector, p);
        const p3 = getPts(comp, p);
        L1!.setAttribute('points', p2s(p1));
        L2!.setAttribute('points', p2s(p2));
        L3!.setAttribute('points', p2s(p3));
        const l1 = p1[p1.length-1];
        const l2 = p2[p2.length-1];
        const l3 = p3[p3.length-1];
        D1!.setAttribute('cx', String(l1[0])); D1!.setAttribute('cy', String(l1[1])); D1!.setAttribute('r', '5');
        D2!.setAttribute('cx', String(l2[0])); D2!.setAttribute('cy', String(l2[1])); D2!.setAttribute('r', '3');
        D3!.setAttribute('cx', String(l3[0])); D3!.setAttribute('cy', String(l3[1])); D3!.setAttribute('r', '3');
        A!.setAttribute('d', bArea(p1)); A!.setAttribute('opacity', '0.25');
        const cl = Math.floor(p*(marca.length-1));
        while (lastL < cl) { lastL++; sL(lastL); }
        if (rp < 1) {
          requestAnimationFrame(draw);
        } else {
          sL(4);
          setTimeout(() => {
            ['hBadge','hRuido','hUmbral','hUmT1','hUmT2','hLeg'].forEach(id => {
              const e = document.getElementById(id);
              if (e) { e.style.transition = 'opacity 1.2s'; e.setAttribute('opacity', '1'); }
            });
          }, 400);
          setTimeout(() => { breatheId = requestAnimationFrame(heroBreathe); }, 1400);
        }
      }

      let bt = 0;
      function heroBreathe() {
        bt += 0.02;
        let s1='', s2='', s3='';
        for (let i=0; i<marca.length; i++) {
          s1 += marca[i][0]+','+(marca[i][1]+Math.sin(bt*1.1+i*0.9)*3).toFixed(1)+' ';
          s2 += sector[i][0]+','+(sector[i][1]+Math.sin(bt*0.8+i*0.6)*1.5).toFixed(1)+' ';
          s3 += comp[i][0]+','+(comp[i][1]+Math.sin(bt*0.7+i*1.1)*2.5).toFixed(1)+' ';
        }
        L1!.setAttribute('points', s1.trim());
        L2!.setAttribute('points', s2.trim());
        L3!.setAttribute('points', s3.trim());
        D1!.setAttribute('cy', (marca[4][1]+Math.sin(bt*1.1+4*0.9)*3).toFixed(1));
        D3!.setAttribute('cy', (comp[4][1]+Math.sin(bt*0.7+4*1.1)*2.5).toFixed(1));
        breatheId = requestAnimationFrame(heroBreathe);
      }

      const drawTimeout = setTimeout(() => { requestAnimationFrame(draw); }, 700);

      // IntersectionObserver for donut and bars
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      document.querySelectorAll('.na-msg').forEach((el, i) => {
        (el as HTMLElement).style.transitionDelay = (i * 0.3) + 's';
        observer.observe(el);
      });

      const donut = document.querySelector('.donut-score') as HTMLElement;
      let donutObs: IntersectionObserver | null = null;
      if (donut) {
        const target = 78;
        let current = 0;
        donutObs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            const iv = setInterval(() => {
              current++;
              donut.textContent = current + '%';
              if (current >= target) clearInterval(iv);
            }, 20);
            donutObs?.disconnect();
          }
        }, { threshold: 0.5 });
        donutObs.observe(donut);
      }

      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(drawTimeout);
        if (breatheId) cancelAnimationFrame(breatheId);
        observer.disconnect();
        donutObs?.disconnect();
      };
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className="navbar" ref={navRef}>
        <a className="logo" href="#">
          <svg viewBox="0 0 310 28" height={24} style={{ display: 'block' }}>
            <text x="0" y="22" fontFamily="DM Sans,sans-serif" fontWeight="700" fontSize="21" letterSpacing="2" fill="#FFFFFF">NARRA</text>
            <text x="120" y="22" fontFamily="Source Serif 4,Georgia,serif" fontWeight="600" fontSize="21" letterSpacing="2" fill="#3E1CFF">GLOBAL</text>
          </svg>
        </a>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a className="nav-cta" href="https://narra-assist.lovable.app/" target="_blank" rel="noopener noreferrer">NarraAsist</a>
          <a className="nav-cta" href="#narraasist">Medir mi narrativa</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="halftone"></div>
        <div className="dark-grad"></div>

        <div className="hero-chart">
          <svg viewBox="0 0 420 260" preserveAspectRatio="xMidYMid meet" id="heroChart">
            <line x1="50" y1="24" x2="350" y2="24" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="50" y1="56" x2="350" y2="56" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="50" y1="88" x2="350" y2="88" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3,3"/>
            <line x1="50" y1="120" x2="350" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="50" y1="152" x2="350" y2="152" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <line x1="150" y1="24" x2="150" y2="176" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            <line x1="250" y1="24" x2="250" y2="176" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            <text x="42" y="27" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">100</text>
            <text x="42" y="59" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">80</text>
            <text x="42" y="91" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">60</text>
            <text x="42" y="123" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">40</text>
            <text x="42" y="155" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">20</text>
            <text x="100" y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>S1</text>
            <text x="150" y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>S2</text>
            <text x="200" y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>S3</text>
            <text x="250" y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>S4</text>
            <text x="300" y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>S5</text>
            <rect id="hUmbral" x="50" y="152" width="300" height="24" fill="rgba(255,255,255,0.06)" opacity="0"/>
            <text id="hUmT1" x="355" y="164" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Mono,monospace" opacity="0">UMBRAL</text>
            <text id="hUmT2" x="355" y="173" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Mono,monospace" opacity="0">DE RUIDO</text>
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#FFF" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path id="hArea" fill="url(#ag)" opacity="0"/>
            <polyline id="hL1" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points="100,120 150,92 200,68 250,52 300,44"/>
            <polyline id="hL2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points="100,108 150,110 200,112 250,108 300,110"/>
            <polyline id="hL3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points="100,92 150,116 200,136 250,152 300,162"/>
            <circle id="hD1" r="0" fill="#FFF"/>
            <circle id="hD2" r="0" fill="rgba(255,255,255,0.4)"/>
            <circle id="hD3" r="0" fill="rgba(255,255,255,0.3)"/>
            <g id="hBadge" opacity="1"><rect x="306" y="33" width="42" height="22" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/><text x="327" y="48" fill="#FFF" fontSize="11" textAnchor="middle" fontFamily="Space Mono,monospace" fontWeight="700">78%</text></g>
            <g id="hRuido" opacity="1"><rect x="306" y="150" width="42" height="16" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/><text x="327" y="161" fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle" fontFamily="Space Mono,monospace" fontWeight="700">RUIDO</text></g>
            <g id="hLeg" opacity="0">
              <circle cx="60" cy="215" r="4" fill="#FFF"/><text x="70" y="219" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="DM Sans,sans-serif">Tu marca</text>
              <circle cx="160" cy="215" r="4" fill="rgba(255,255,255,0.35)"/><text x="170" y="219" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Sans,sans-serif">Prom. sector</text>
              <circle cx="280" cy="215" r="4" fill="rgba(255,255,255,0.25)"/><text x="290" y="219" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Sans,sans-serif">Competidor</text>
            </g>
          </svg>
        </div>

        <div className="hero-inner">
          <h1>Amamos las<br/><span className="serif">narrativas.</span><br/>Y sabemos<br/>medirlas.</h1>
          <p className="claim">Más de una década midiendo con NarraNoise® cómo empresas, políticos y figuras públicas entregan sus mensajes a sus audiencias.</p>
        </div>
        <a href="#medicion" className="hero-reportes-link">Conocé nuestro modelo NarraNoise® ↓</a>
      </section>

      {/* LOGOS */}
      <section className="sec-logos">
        <div className="logos-label">Miden su narrativa con nosotros</div>
        <div className="logos-track">
          <div className="logos-slide">
            {clientLogos.map((logo, i) => (
              <img key={i} className="client-logo" src={logo.src} alt={logo.alt} />
            ))}
            {/* Duplicate for infinite scroll */}
            {clientLogos.map((logo, i) => (
              <img key={`dup-${i}`} className="client-logo" src={logo.src} alt={logo.alt} />
            ))}
          </div>
        </div>
      </section>

      {/* REPORTES */}
      <section className="sec-pubs" id="pubs">
        <div className="pubs-halftone"></div>
        <div className="pubs-glow"></div>
        <div className="inner">
          <div className="pubs-layout">
            <div className="pubs-left">
              <h2>Reportes e <span className="serif">Insights</span></h2>
              <p className="intro">Cada semana publicamos rankings y análisis de efectividad narrativa en negocios, política y entretenimiento. Disponibles en tiempo real y gratis en nuestro canal de WhatsApp.</p>
              <a href="https://wa.me/5491130731011?text=Quiero%20recibir%20los%20reportes" className="pubs-wa-cta" target="_blank" rel="noopener noreferrer">
                <svg className="wa-svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.634-1.215A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.115 0-4.093-.65-5.727-1.763l-.41-.244-2.75.721.735-2.683-.268-.426A9.71 9.71 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                Unirme al canal
              </a>
              <div className="pubs-press">
                <div className="pubs-press-label">Nuestros datos son publicados en</div>
                <div className="pubs-press-logos">
                  <span>CNN</span><span>Forbes</span><span>Univision</span><span>TVE</span><span>Infobae</span><span>TN</span><span style={{ whiteSpace: 'nowrap' }}>La Nación</span><span>Clarín</span>
                </div>
              </div>
            </div>
            <div className="pubs-index">
              <div className="pubs-index-item" style={{ cursor: 'default' }}>
                <div className="pubs-idx-cover">
                  <svg viewBox="0 0 24 30" width="24" height="30" fill="none"><rect x="2" y="2" width="20" height="26" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/><line x1="6" y1="8" x2="18" y2="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="12" x2="18" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="16" x2="14" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/></svg>
                </div>
                <div className="pubs-idx-content">
                  <div className="pubs-idx-type">Política</div>
                  <div className="pubs-idx-title">Elecciones Argentinas 2025</div>
                  <div className="pubs-idx-meta">56% ruido comunicacional</div>
                </div>
                <div className="pubs-idx-arrow">→</div>
              </div>
              <div className="pubs-index-item" style={{ cursor: 'default' }}>
                <div className="pubs-idx-cover">
                  <svg viewBox="0 0 24 30" width="24" height="30" fill="none"><rect x="2" y="2" width="20" height="26" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/><line x1="6" y1="8" x2="18" y2="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="12" x2="18" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="16" x2="14" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/></svg>
                </div>
                <div className="pubs-idx-content">
                  <div className="pubs-idx-type">Política</div>
                  <div className="pubs-idx-title">Narrativa Milei como IP Global</div>
                  <div className="pubs-idx-meta">El camino difícil hacia la inmersión</div>
                </div>
                <div className="pubs-idx-arrow">→</div>
              </div>
              <div className="pubs-index-item" style={{ cursor: 'default' }}>
                <div className="pubs-idx-cover">
                  <svg viewBox="0 0 24 30" width="24" height="30" fill="none"><rect x="2" y="2" width="20" height="26" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/><line x1="6" y1="8" x2="18" y2="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="12" x2="18" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/><line x1="6" y1="16" x2="14" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/></svg>
                </div>
                <div className="pubs-idx-content">
                  <div className="pubs-idx-type">Deportes</div>
                  <div className="pubs-idx-title">¿Narrativa para ganar tanda de penales? Análisis del caso River Plate</div>
                  <div className="pubs-idx-meta">Cómo viajan los mensajes en ventanas de alta exigencia</div>
                </div>
                <div className="pubs-idx-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="sec-products" id="medicion">
        <div className="prod-inner">
          <div className="prod-headline">
            <h2 className="prod-h2">Nuestro modelo de medición +<br/>un asistente 24/7 <span className="serif">para vos.</span></h2>
          </div>
          <div className="prod-grid">
            {/* NarraNoise® */}
            <div className="prod-col col-noise">
              <div className="prod-stag">Modelo de medición</div>
              <div className="prod-title-row">
                <div className="prod-logo-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="4" y="14" width="4" height="6" rx="1" fill="rgba(255,255,255,0.5)"/><rect x="10" y="9" width="4" height="11" rx="1" fill="rgba(255,255,255,0.75)"/><rect x="16" y="4" width="4" height="16" rx="1" fill="#fff"/></svg>
                </div>
                <div className="prod-title" style={{ marginBottom: 0 }}>Narra<span className="serif">Noise®</span></div>
              </div>
              <p className="prod-desc">Diagnóstico basado en parámetros técnicos de atención, credibilidad e inmersión que miden qué tan efectivo es tu mensaje y qué porcentaje se pierde en el ruido comunicacional. <strong>54 marcadores, curvas de evolución, comparativas con tu sector y tu competencia.</strong> Reporte ejecutivo con plan de acción. Entrega en 10 días hábiles.</p>
              <div className="prod-visual">
                <div className="prod-mini-card">
                  <div className="prod-mini-hdr">
                    <div className="prod-mini-badge">Reporte</div>
                    <div className="prod-mini-score">78% <span>efectividad</span></div>
                  </div>
                  <div className="prod-bar"><span className="prod-bar-name">Atención</span><div className="prod-bar-track"><div className="prod-bar-fill" style={{ width: '82%' }}></div></div><span className="prod-bar-val">82</span></div>
                  <div className="prod-bar"><span className="prod-bar-name">Credibilidad</span><div className="prod-bar-track"><div className="prod-bar-fill" style={{ width: '74%' }}></div></div><span className="prod-bar-val">74</span></div>
                  <div className="prod-bar"><span className="prod-bar-name">Inmersión</span><div className="prod-bar-track"><div className="prod-bar-fill low" style={{ width: '12%' }}></div></div><span className="prod-bar-val">12</span></div>
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                    <svg viewBox="0 0 300 50" style={{ width: '100%', height: '50px' }} preserveAspectRatio="none">
                      <text x="0" y="8" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="Space Mono,monospace">EVOLUCIÓN</text>
                      <rect x="0" y="38" width="300" height="10" fill="rgba(255,255,255,0.015)"/>
                      <text x="290" y="46" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="Space Mono,monospace" textAnchor="end">RUIDO</text>
                      <polyline points="0,35 43,30 86,27 129,24 172,21 215,18 258,14 300,10" fill="none" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                      <polyline points="0,25 43,26 86,26 129,25 172,26 215,27 258,26 300,26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '2px', background: 'var(--white)', borderRadius: '1px', display: 'block' }}></span><span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Tu marca</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', display: 'block' }}></span><span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>Sector</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* + Central */}
            <div className="prod-plus">
              <div className="prod-plus-icon">+</div>
            </div>

            {/* NarraAsist */}
            <div className="prod-col col-asist">
              <div className="prod-stag">Asistente IA</div>
              <div className="prod-title-row">
                <div className="prod-logo-icon">NA</div>
                <div className="prod-title" style={{ marginBottom: 0 }}>Narra<span className="serif">Asist</span></div>
              </div>
              <p className="prod-desc">Tu asistente de narrativa con IA, activo desde el día uno. <strong>Chateá con tus datos, pedí sugerencias, prepará presentaciones y discursos.</strong> Hacks semanales y alertas inteligentes.</p>
              <div className="prod-visual">
                <div className="prod-chat">
                  <div className="prod-chat-hdr">
                    <div className="prod-chat-dot"></div>
                    <div className="prod-chat-label">NarraAsist · Sesión activa</div>
                  </div>
                  <div className="prod-chat-body">
                    <div className="prod-chat-msg">
                      <div className="prod-chat-av ai">NA</div>
                      <div className="prod-chat-text">Tu <strong>inmersión cayó 12%</strong> en 3 semanas. Te sugiero anclar cada dato a una <span className="hl">historia personal</span>. ¿Querés que te arme un ejemplo?</div>
                    </div>
                    <div className="prod-chat-msg">
                      <div className="prod-chat-av user">TÚ</div>
                      <div className="prod-chat-text">Sí, armame uno con mis datos.</div>
                    </div>
                    <div className="prod-chat-msg">
                      <div className="prod-chat-av ai">NA</div>
                      <div className="prod-chat-text">Tu competidor mejoró <strong>23% con esta técnica</strong>. Acá va adaptado a tu último discurso&hellip;</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared banner */}
          <div className="prod-included">
            <div className="prod-included-text"><span>NarraNoise®</span> + <span>NarraAsist</span> Incluido en todos los planes</div>
          </div>
        </div>
      </section>

      {/* NARRAASIST */}
      <section className="sec-naasist" id="narraasist">
        <div className="na-halftone"></div>
        <div className="na-glow na-glow-1"></div>
        <div className="na-glow na-glow-2"></div>
        <div className="na-container">
          <div className="na-header" style={{ marginBottom: '40px' }}>
            <h2 className="na-tagline">Cómo <span className="serif">funciona.</span></h2>
            <p className="na-subtitle">Subí tus archivos, recibí tu diagnóstico NarraNoise® y empezá a mejorar con NarraAsist. Sin esperar.</p>
          </div>

          <div className="na-timeline">
            <div className="na-tl-step">
              <div className="na-tl-dot">⬆</div>
              <div className="na-tl-text">
                <div className="na-tl-when">Hoy</div>
                <div className="na-tl-title">Subí tus archivos</div>
                <div className="na-tl-desc">PDFs, capturas, links, PPTs, videos.</div>
              </div>
            </div>
            <div className="na-tl-step">
              <div className="na-tl-dot" style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'DM Sans,sans-serif' }}>NA</div>
              <div className="na-tl-text">
                <div className="na-tl-when">Inmediato</div>
                <div className="na-tl-title">Chateá con NarraAsist</div>
                <div className="na-tl-desc">Mientras esperás tu reporte, ya tenés acceso al asistente.</div>
              </div>
            </div>
            <div className="na-tl-step">
              <div className="na-tl-dot">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="5" y="14" width="3.5" height="5" rx="0.5" fill="rgba(255,255,255,0.5)"/><rect x="10.25" y="10" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.7)"/><rect x="15.5" y="5" width="3.5" height="14" rx="0.5" fill="#fff"/></svg>
              </div>
              <div className="na-tl-text">
                <div className="na-tl-when">10 días</div>
                <div className="na-tl-title">Recibí tu NarraNoise®</div>
                <div className="na-tl-desc">Reporte ejecutivo con plan de acción.</div>
              </div>
            </div>
            <div className="na-tl-step">
              <div className="na-tl-dot na-tl-dot-upgrade" style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'DM Sans,sans-serif', background: 'linear-gradient(135deg,#C9A84C,#E8C547)', borderColor: '#C9A84C', color: '#1a1060', boxShadow: '0 0 20px rgba(201,168,76,0.4),0 0 0 4px rgba(201,168,76,0.15)' }}>NA</div>
              <div className="na-tl-text">
                <div className="na-tl-when">Continuo</div>
                <div className="na-tl-title">NarraAsist customizado</div>
                <div className="na-tl-desc">Todos los insights del reporte integrados al chat. Experiencia 100% a medida.</div>
              </div>
            </div>
          </div>

          <div className="na-pricing-intro">
            <h3>Elegí tu plan mensual</h3>
            <p>Probá un mes. Quedate el tiempo que quieras.</p>
          </div>

          <div className="na-pricing">
            {/* PLAN DATA */}
            <div className="na-plan">
              <div className="na-plan-name">Plan Data</div>
              <h3>Plan Data</h3>
              <div className="na-plan-price">
                <span className="amount"><span className="curr">USD</span>299</span>
                <span className="period">/ mes</span>
              </div>
              <div className="na-plan-sub">Tus datos actualizados mes a mes.</div>
              <ul className="na-plan-feats">
                <li className="feat-strong">1 medición NarraNoise® — hasta 2 archivos</li>
                <li className="feat-strong">Hacks semanales para mejorar tu narrativa</li>
                <li className="feat-strong">Chat NarraAsist customizado con tus datos, 24/7</li>
              </ul>
              <a href="https://wa.me/5491130731011?text=Hola%2C%20me%20interesa%20el%20Plan%20Data" target="_blank" rel="noopener noreferrer" className="na-plan-cta cta-outline">Empezar con Data →</a>
            </div>

            {/* PLAN DATA + ESTRATEGIA */}
            <div className="na-plan featured">
              <div className="na-plan-name">Plan Data + Estrategia</div>
              <h3>Plan Data + Estrategia</h3>
              <div className="na-plan-price">
                <span className="amount"><span className="curr">USD</span>899</span>
                <span className="period">/ mes</span>
              </div>
              <div className="na-plan-sub">Datos atados a estrategia.</div>
              <ul className="na-plan-feats">
                <li className="feat-strong">Todo Plan Data</li>
                <li className="feat-strong">1 medición NarraNoise® — hasta 10 archivos o 1 feed de social media</li>
                <li className="feat-highlight">1 sesión virtual de estrategia</li>
                <li className="feat-strong">Chat NarraAsist customizado con tus datos y los insights de estrategia, 24/7</li>
              </ul>
              <a href="https://wa.me/5491130731011?text=Hola%2C%20me%20interesa%20el%20Plan%20Data%20%2B%20Estrategia" target="_blank" rel="noopener noreferrer" className="na-plan-cta cta-blue">Empezar con Estrategia →</a>
            </div>

            {/* PLAN MESA CHICA */}
            <div className="na-plan">
              <div className="na-plan-name">Plan Mesa Chica</div>
              <h3>Plan Mesa Chica</h3>
              <div className="na-plan-price">
                <span className="amount"><span className="desde">Desde </span><span className="curr">USD</span>2,999</span>
                <span className="period">/ mes</span>
              </div>
              <div className="na-plan-sub">Data, estrategia y entrenamiento.</div>
              <ul className="na-plan-feats">
                <li className="feat-strong">Todo Plan Data + Estrategia</li>
                <li className="feat-strong">1 medición NarraNoise® — hasta 20 archivos o 3 feeds de social media</li>
                <li className="feat-strong">1 medición NarraNoise® de tus competidores y tu vertical</li>
                <li className="feat-strong">1 hoja de ruta para blindaje reputacional y anticipación a crisis</li>
                <li className="feat-highlight">1 sesión presencial de entrenamiento a equipo o voceros</li>
                <li className="feat-strong">NarraAsist optimizado para equipos</li>
              </ul>
              <a href="https://wa.me/5491130731011?text=Hola%2C%20me%20interesa%20el%20Plan%20Mesa%20Chica" target="_blank" rel="noopener noreferrer" className="na-plan-cta cta-outline">Consultar disponibilidad →</a>
            </div>
          </div>

          {/* Security badge */}
          <div className="na-security">
            <span className="na-security-text">100% confidencial · Encriptado · Datos nunca compartidos</span>
          </div>
        </div>
      </section>

      {/* CARTA DEL FOUNDER */}
      <section className="sec-letter">
        <div className="letter-inner">
          <h2 className="letter-headline">¿Tu comunicación funciona?<br/>No debería ser tan difícil <span className="serif">saberlo.</span></h2>
          <div className="letter-cols">
            <div>
              <p>Hay mil formas de comunicar. Y miles de consultoras prometiendo ayudarte. Seguramente ya probaste alguna.</p>
              <p><strong>La mayoría de las empresas gastan fortunas en producir contenido y cero en entender si ese contenido llega, se entiende, o se pierde en el ruido.</strong> Es como hacer publicidad con los ojos cerrados.</p>
              <p>NarraNoise® nació de una obsesión simple: convertir algo que siempre fue subjetivo — "¿mi mensaje funciona?" — en un número. <strong>Un número que podés comparar, trackear y mejorar.</strong></p>
            </div>
            <div>
              <p><strong>NARRAGLOBAL es medición pura, efectiva y concreta.</strong> Medimos 54 marcadores, los cruzamos con tu sector y tu competencia, y te decimos exactamente dónde estás parado y qué mover.</p>
              <p>Después, NarraAsist — nuestro asistente con IA — se queda con vos para que no dependas de nosotros cada vez que necesitás ajustar algo. <strong>La idea es que seas autónomo, no rehén de una consultora.</strong></p>
              <p>Escribime directo. Leo todo, contesto todo. Sin asistentes, sin bots. Gracias.</p>
              <div className="letter-sig">
                <img src={SIGNATURE_BASE64} alt="Firma" style={{ height: '100px', width: 'auto', display: 'block', marginBottom: '10px' }}/>
                <div className="sig-line">Lisandro Bregant, <a href="mailto:lisandro@narraglobal.com">lisandro@narraglobal.com</a></div>
                <div className="sig-role">Fundador, NARRAGLOBAL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NARRAWORK */}
      <section className="nw" id="narrawork">
        <div className="nw-wrap">
          <div className="nw-tag">Narrawork</div>
          <h2 className="nw-h">
            Workshops <em>in-company</em> donde <strong>medimos la performance narrativa de tus colaboradores</strong> y dejamos <strong>capacidad instalada</strong> para que tu equipo comunique mejor.
          </h2>
          <div className="nw-div"></div>
          <div className="nw-cols">
            <div className="nw-what">
              <p>No es coaching genérico. Cada sesión está construida sobre <strong>datos reales del modelo NarraNoise®</strong> — 54 marcadores que miden cómo tu audiencia procesa lo que decís.</p>
              <p>Trabajamos con un challenge concreto de tu equipo, lo medimos, lo mejoramos y entregamos resultados comparables.</p>
              <p><strong>Construimos capacidad instalada: que tu equipo domine la narrativa sin depender de terceros.</strong></p>
            </div>
            <div>
              <div className="nw-verts-label">Verticales</div>
              <div className="nw-verts">
                <div className="nw-pill nw-pill--com"><span>COM</span> Comercial</div>
                <div className="nw-pill nw-pill--pol"><span>POL</span> Política</div>
                <div className="nw-pill nw-pill--sports"><span>SPORTS</span> Clubes y figuras públicas</div>
                <div className="nw-pill nw-pill--start"><span>START</span> Startups</div>
                <div className="nw-pill nw-pill--show"><span>SHOW</span> Entretenimiento</div>
              </div>
              <div className="nw-fmts">
                <strong>Cápsula</strong> — 1 encuentro, 2hs<br/>
                <strong>Serie</strong> — 3 encuentros con challenge real<br/>
                <strong>Programa</strong> — 6 módulos, capacidad instalada
              </div>
            </div>
          </div>
          <div className="nw-method">
            Todos los programas incluyen medición <strong>NarraNoise®</strong> pre y post entrenamiento. Online, presencial o híbrido.
          </div>
          <div className="nw-cta-area">
            <a href="mailto:lisandro@narraglobal.com?subject=NARRAWORK" className="nw-cta">Hablemos de tu desafío →</a>
            <span className="nw-cta-sub">Respuesta en 24hs</span>
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="sec-close">
        <div className="ht"></div>
        <div className="content">
          <h2>La narrativa no es lo que decís.<br/>Es lo que el otro <span className="serif">entiende.</span></h2>
          <p className="sub">Es tiempo que puedas tomar decisiones de comunicación basadas en evidencia.</p>
          <div className="ctas">
            <a href="#narraasist" className="btn-white">Comenzá ahora</a>
            <a href="#narrawork" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>Cotizá tu workshop →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg viewBox="0 0 310 28" height={16} style={{ display: 'block' }}>
            <text x="0" y="22" fontFamily="DM Sans,sans-serif" fontWeight="700" fontSize="21" letterSpacing="2" fill="#FFFFFF">NARRA</text>
            <text x="120" y="22" fontFamily="Source Serif 4,Georgia,serif" fontWeight="600" fontSize="21" letterSpacing="2" fill="#3E1CFF">GLOBAL</text>
          </svg>
          <span style={{ color: 'var(--grey-600)' }}>· Desde 2012</span>
        </div>
        <div>
          <a href="mailto:lisandro@narraglobal.com">lisandro@narraglobal.com</a> · <a href="https://narraglobal.com">narraglobal.com</a>
        </div>
      </footer>
    </>
  );
};

export default Index;
