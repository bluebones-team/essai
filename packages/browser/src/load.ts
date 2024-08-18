const container = Object.assign(document.createElement('div'), {
  style: `
        border: 8px solid; border-radius: 50%; border-color: #3498db #f3f3f3 #f3f3f3;
        width: 50px; height: 50px; box-sizing: border-box;
        position: absolute; left: 50%; top: 50%;
    `,
});
setTimeout(function mount() {
  if (!document.body) return setTimeout(mount);
  document.body.insertBefore(container, document.body.firstChild);
  document.addEventListener('DOMContentLoaded', () => {
    container.remove();
  });
});

let angle = 0;
requestAnimationFrame(function animate() {
  angle += 10;
  container.style.transform = `translate(-50%, -50%) rotate(${angle % 360}deg)`;
  requestAnimationFrame(animate);
});
// import Lottie from 'lottie-web';
// Lottie.loadAnimation({
//     container,
//     renderer: 'svg',
//     loop: true,
//     autoplay: true,
//     path: '/animation/loading-1.json',
// });
