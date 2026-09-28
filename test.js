async function go() {
  const r1 = await fetch('https://tehyan-pos-v1-pos.vercel.app');
  const t = await r1.text();
  const m = t.match(/src="\/assets\/(index-[^\.]+\.js)"/);
  if (m) {
    const r2 = await fetch('https://tehyan-pos-v1-pos.vercel.app/assets/' + m[1]);
    const c = await r2.text();
    console.log('Contains localhost:5000?', c.includes('localhost:5000'));
    console.log('Contains backend.vercel.app?', c.includes('tehyan-pos-v1-backend.vercel.app'));
  }
}
go();
