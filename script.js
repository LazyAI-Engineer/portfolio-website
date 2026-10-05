"use strict";

document.documentElement.classList.add("js");
document.getElementById("year").textContent = new Date().getFullYear();

const navigation = document.getElementById("navigation");
const navLinks = [...navigation.querySelectorAll('a[href^="#"]:not(.nav-github)')];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

navigation.addEventListener("focusin", (event) => {
  if (window.matchMedia("(max-width: 640px)").matches) {
    event.target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  // Only fragment links have section destinations; leave external links native.
  const href = link.getAttribute("href");
  const destination = href?.startsWith("#") ? document.getElementById(href.slice(1)) : null;
  if (destination) {
    destination.tabIndex = -1;
    destination.focus({ preventScroll: true });
  }
});

// Content stays visible without JavaScript or IntersectionObserver support.
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  if (!reducedMotion.matches) {
    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("reveal-ready");
      revealObserver.observe(element);
    });
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      revealObserver.disconnect();
      document.querySelectorAll(".reveal-ready").forEach((element) => element.classList.add("is-visible"));
    }
  });
}

// One scheduled read per scroll frame keeps the active link accurate for tall sections.
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));
let scrollScheduled = false;
function updateActiveSection() {
  let active = sections[0];
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 150) active = section;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3) {
    active = sections[sections.length - 1];
  }
  navLinks.forEach((link) => {
    if (link.getAttribute("href") === `#${active.id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollScheduled = false;
}
window.addEventListener("scroll", () => {
  if (!scrollScheduled) {
    scrollScheduled = true;
    window.requestAnimationFrame(updateActiveSection);
  }
}, { passive: true });
window.addEventListener("resize", updateActiveSection);
updateActiveSection();

// Draw once; CSS animates the globe without a JavaScript animation loop.
const network = document.getElementById("globe-network");
const svgNamespace = "http://www.w3.org/2000/svg";
const radius = 164;
const tilt = 0.35;
function globePoint(latitude, longitude) {
  const x = Math.cos(latitude) * Math.cos(longitude);
  const y = Math.sin(latitude);
  const z = Math.cos(latitude) * Math.sin(longitude);
  return [200 + radius * (x * Math.cos(tilt) - y * Math.sin(tilt)),
    200 + radius * (x * Math.sin(tilt) + y * Math.cos(tilt)), z];
}
for (let row = -4; row <= 4; row++) {
  const latitude = row * Math.PI / 10;
  for (let column = 0; column < 24; column++) {
    const longitude = column * Math.PI / 12;
    const [x, y, z] = globePoint(latitude, longitude);
    const next = globePoint(latitude, longitude + Math.PI / 12);
    const above = globePoint(latitude + Math.PI / 10, longitude);
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", `M${x},${y}L${next[0]},${next[1]}${row < 4 ? `M${x},${y}L${above[0]},${above[1]}` : ""}`);
    path.setAttribute("stroke", "#5edfe7");
    path.setAttribute("stroke-opacity", z > 0 ? "0.28" : "0.07");
    path.setAttribute("stroke-width", "0.7");
    path.setAttribute("fill", "none");
    network.appendChild(path);
    if (z > 0 && (row + column) % 2 === 0) {
      const dot = document.createElementNS(svgNamespace, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", column % 3 === 0 ? "2.5" : "1.4");
      dot.setAttribute("fill", "#91f4eb");
      dot.setAttribute("opacity", String(0.4 + z * 0.6));
      network.appendChild(dot);
    }
  }
}

// Run portfolioCheck() in the browser console for a small, dependency-free smoke check.
function portfolioCheck() {
  console.assert(!document.querySelector('.site-header button'), "Navigation should have no collapse or close button");
  console.assert(navigation.querySelectorAll("a").length === 7 && getComputedStyle(navigation).display === "flex", "All seven navigation links should always be available");
  if (window.matchMedia("(max-width: 640px)").matches) {
    console.assert(getComputedStyle(navigation).overflowX === "auto" && getComputedStyle(navigation).flexWrap === "nowrap", "Mobile navigation should scroll in one row");
    console.assert([...navigation.querySelectorAll("a")].every((link) => link.offsetHeight >= 44 && link.offsetWidth >= 44), "Mobile links should have touch-friendly targets");
    console.assert(document.documentElement.scrollWidth <= window.innerWidth, "Mobile navigation should not overflow the page");
  }
  console.assert(sections.every(Boolean), "Every navigation link should have a destination");
  console.assert([...document.querySelectorAll('a[href^="#"]')].every((link) => document.getElementById(link.hash.slice(1))), "Every fragment link should have a real destination, including Home and hero buttons");
  const githubLinks = document.querySelectorAll('a[href="https://github.com/LazyAI-Engineer"]');
  console.assert(githubLinks.length === 2 && [...githubLinks].every((link) => link.target === "_blank" && link.relList.contains("noopener") && link.relList.contains("noreferrer")), "Both GitHub profile links should open safely in new tabs");
  console.assert(navigation.querySelector('.nav-github')?.getAttribute("href") === "https://github.com/LazyAI-Engineer", "GitHub should be directly available in navigation");
  console.assert(document.querySelector('.contact-link[href="mailto:llazyaiengineer@gmail.com"]'), "Email should open the default mail application");
  console.assert(document.querySelector('.contact-link:disabled')?.textContent.includes("LinkedInComing Soon"), "LinkedIn should be disabled and marked Coming Soon");
  console.assert([...document.querySelectorAll(".project-links button")].every((button) => button.disabled), "Unpublished project links should stay disabled");
  console.assert(navigation.querySelectorAll('[aria-current="location"]').length === 1, "Exactly one navigation item should be active");
  console.assert(network.querySelectorAll("path").length === 216, "The globe should render its network");
  console.assert(document.getElementById("year").textContent === String(new Date().getFullYear()), "The footer should show the current year");
}
