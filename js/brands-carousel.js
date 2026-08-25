// ============================================================
// Manlung Brands Carousel
// ============================================================
// Auto-sweeps through a set of images on the hero. IMPORTANT: these must
// be DIRECT image file links (ending in .jpg/.png/etc, usually on an
// i.postimg.cc subdomain) — a postimg.cc/XXXXX viewer page link will not
// display as an image. On each postimg.cc page, click "Direct link" and
// use that URL instead.

window.BRANDS_CAROUSEL_IMAGES = [
  "https://i.postimg.cc/3rXPvwBN/DSC1691-JPG-Photoroom.png",
  "https://i.postimg.cc/3J9VtbVg/IMG-4140-JPG-Photoroom.png",
  "https://i.postimg.cc/PrK9SF9F/IMG-5081-(1)-JPG-Photoroom.png",
  "https://i.postimg.cc/7YqjMysN/DSC1692-JPG-Photoroom.png",
  "https://i.postimg.cc/QxSwfnwq/IMG-4144-JPG-Photoroom.png",
  "https://i.postimg.cc/bNLWmFW4/IMG-5085-(1)-JPG-Photoroom.png",
  "https://i.postimg.cc/yY72XzQj/DSC1695-JPG-Photoroom.png",
  "https://i.postimg.cc/dtnp5Sp6/IMG-4147-JPG-Photoroom.png",
  "https://i.postimg.cc/pXk4s14g/IMG-5087-(1)-JPG-Photoroom.png",
  "https://i.postimg.cc/Prd0zk34/DSC1697-JPG-Photoroom.png",
  "https://i.postimg.cc/15M2vY2v/IMG-4148-JPG-Photoroom.png",
  "https://i.postimg.cc/zXp6xP4m/IMG-5089-(1)-JPG-Photoroom.png",
  "https://i.postimg.cc/qMpWXdbx/DSC1701-JPG-Photoroom.png",
  "https://i.postimg.cc/8Pw9Zn9y/IMG-5073-(1)-JPG-Photoroom.png",
  "https://i.postimg.cc/gk4QgBQ3/DSC1704-JPG-Photoroom.png",
  "https://i.postimg.cc/ncTg3wgR/IMG-5079-(1)-JPG-Photoroom.png"
];

function initBrandsCarousel() {
  const wrap = document.getElementById("brandsCarousel");
  if (!wrap) return;

  const images = window.BRANDS_CAROUSEL_IMAGES || [];
  if (!images.length) return;

  const imgEls = wrap.querySelectorAll(".brands-carousel-img");
  let index = 0;
  let showingFirst = true;

  imgEls[0].src = images[0];
  imgEls[1].src = images[1] || images[0];

  setInterval(() => {
    index = (index + 1) % images.length;
    const nextEl = showingFirst ? imgEls[1] : imgEls[0];
    const currentEl = showingFirst ? imgEls[0] : imgEls[1];

    nextEl.src = images[index];
    nextEl.classList.add("active");
    currentEl.classList.remove("active");
    showingFirst = !showingFirst;
  }, 3000);
}

window.brandsCarouselFunctions = { initBrandsCarousel };
