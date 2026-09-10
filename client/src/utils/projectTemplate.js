function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function getBodyContent(source) {
  const bodyMatch = String(source || "").match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1].trim() : String(source || "").trim();
}

function getHeadContent(source) {
  const headMatch = String(source || "").match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return headMatch ? headMatch[1].trim() : "";
}

export function buildProjectHtml(name, pageHtml = "") {
  const safeName = escapeHtml(name || "Nova AI Project");
  const source = String(pageHtml || "").trim();
  const originalBody = getBodyContent(source) || `<section class="project-welcome"><span>Nova AI project</span><h1>${safeName}</h1><p>Your responsive project is ready. Ask Nova AI to shape the next screen.</p></section>`;
  const originalHead = getHeadContent(source);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeName}</title>
${originalHead}
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#edf3ff;background:#080b12;color-scheme:dark}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#080b12}body{display:block!important;padding:0!important;overflow-x:hidden!important}
.nova-shell{min-height:100vh;display:flex;background:#080b12}.nova-sidebar{position:fixed;inset:0 auto 0 0;width:256px;padding:22px 16px;background:#0d1421;border-right:1px solid #25344a;z-index:20}.nova-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 26px;font-weight:800;font-size:20px}.nova-brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#2d76e8,#6b8cff);color:#fff}.nova-nav{display:grid;gap:7px}.nova-nav a{display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;color:#9eacc2;text-decoration:none;font-size:14px}.nova-nav a:hover,.nova-nav a.active{color:#fff;background:#1a2a43}.nova-sidebar-note{position:absolute;left:16px;right:16px;bottom:20px;padding:14px;border:1px solid #263852;border-radius:12px;background:#111c2d;color:#9dafc8;font-size:12px;line-height:1.5}.nova-main{width:calc(100% - 256px);margin-left:256px;min-height:100vh}.nova-navbar{height:70px;display:flex;align-items:center;gap:14px;padding:0 clamp(16px,4vw,42px);border-bottom:1px solid #253044;background:#0b111c;position:sticky;top:0;z-index:10}.nova-menu{display:none;border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}.nova-navbar-title{font-weight:700}.nova-navbar-subtitle{color:#8191aa;font-size:12px;margin-left:auto}.nova-page{width:min(1180px,100%);margin:0 auto;padding:clamp(24px,5vw,64px)}.nova-page-content{max-width:100%}.nova-section{scroll-margin-top:90px;margin-top:28px;padding:24px;border:1px solid #263852;border-radius:16px;background:#101a29}.nova-section h2{margin:0 0 10px;color:#f5f8ff;font-size:clamp(1.25rem,3vw,1.8rem)}.nova-section p{margin:0;color:#a8b8cf;line-height:1.7}.nova-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.nova-feature{padding:16px;border-radius:12px;background:#17243a;color:#c5d5ea}.nova-feature strong{display:block;color:#fff;margin-bottom:6px}.nova-ai{margin-top:34px;padding:20px;border:1px solid #293b56;border-radius:16px;background:#111c2c;box-shadow:0 18px 50px #0005}.nova-ai-head{display:flex;align-items:center;gap:10px}.nova-ai-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#244b80;color:#a9d0ff}.nova-ai h2{margin:0;font-size:16px}.nova-ai p{color:#9aabc3;line-height:1.55}.nova-ai-form{display:flex;gap:8px}.nova-ai-input{flex:1;min-width:0;padding:12px;border:1px solid #344966;border-radius:9px;background:#080e18;color:#fff;font:inherit}.nova-ai-button{border:0;border-radius:9px;padding:0 16px;background:#eaf1ff;color:#0b1220;font-weight:700;cursor:pointer}.nova-ai-answer{display:none;margin-top:12px;padding:12px;border-radius:9px;background:#0a111d;color:#bfd0e8;white-space:pre-wrap}.project-welcome{max-width:780px;padding:clamp(28px,7vw,72px);border:1px solid #26354c;border-radius:28px;background:linear-gradient(145deg,#15233a,#0e1420);box-shadow:0 24px 80px #0008}.project-welcome span{color:#77b7ff;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.project-welcome h1{margin:18px 0 12px;font-size:clamp(2.1rem,7vw,4.8rem);line-height:.95}.project-welcome p{margin:0;color:#afbdd2;font-size:clamp(1rem,2vw,1.2rem);line-height:1.6}
@media(max-width:800px){.nova-sidebar{transform:translateX(-100%);transition:transform .25s ease;box-shadow:20px 0 50px #0008}.nova-sidebar.open{transform:translateX(0)}.nova-main{width:100%;margin-left:0}.nova-menu{display:block}.nova-navbar-subtitle{display:none}.nova-page{padding:24px 16px}.nova-feature-grid{grid-template-columns:1fr}.nova-ai-form{flex-direction:column}.nova-ai-button{min-height:44px}.nova-overlay{display:block!important;position:fixed;inset:0;background:#0009;z-index:15}}
.nova-overlay{display:none}
</style>
</head>
<body>
<div class="nova-shell hotel-shell-v2">
  <aside class="nova-sidebar" id="novaSidebar">
    <div class="nova-brand"><span class="nova-brand-mark">H</span><div>hotel</div></div>
    <nav class="nova-nav" aria-label="Project navigation">
      <a class="active" href="#home">⌂ <span>Home</span></a>
      <a href="#about">◈ <span>About</span></a>
      <a href="#features">✦ <span>Features</span></a>
      <a href="#contact">✉ <span>Contact</span></a>
    </nav>
    <div class="nova-sidebar-note">Built with AI<br><small>Responsive hotel website</small></div>
  </aside>
  <div class="nova-overlay" id="novaOverlay"></div>
  <div class="nova-main">
    <header class="nova-navbar"><button class="nova-menu" id="novaMenu" aria-label="Open navigation">☰</button><strong class="nova-navbar-title">hotel</strong><span class="nova-navbar-subtitle">Responsive hotel website</span></header>
    <main class="nova-page"><div class="nova-page-content" id="home">${originalBody}</div><section class="nova-section" id="about"><h2>About hotel</h2><p>Welcome to hotel, a comfortable place designed for relaxing stays, thoughtful service, and memorable experiences.</p></section><section class="nova-section" id="features"><h2>Features</h2><div class="nova-feature-grid"><div class="nova-feature"><strong>Comfortable rooms</strong>Clean, calm spaces for every stay.</div><div class="nova-feature"><strong>Guest support</strong>Helpful service whenever you need it.</div><div class="nova-feature"><strong>Easy booking</strong>Simple, responsive experience on every device.</div></div></section><section class="nova-section" id="contact"><h2>Contact</h2><p>Email: stay@hotel.example<br />Phone: +1 (555) 014-2026<br />Address: 24 Grand Avenue, Downtown</p></section><section class="nova-ai" id="novaAi"><div class="nova-ai-head"><span class="nova-ai-icon">✦</span><h2>AI assistant</h2></div><p>Ask AI about this hotel website or describe the next improvement.</p><form class="nova-ai-form" id="novaAiForm"><input class="nova-ai-input" id="novaAiInput" placeholder="Improve this hotel website..." aria-label="Ask AI" /><button class="nova-ai-button" type="submit">Ask AI</button></form><div class="nova-ai-answer" id="novaAiAnswer"></div></section></main>
  </div>
</div>
<script>
const sidebar=document.getElementById("novaSidebar"),overlay=document.getElementById("novaOverlay");
document.getElementById("novaMenu").addEventListener("click",()=>sidebar.classList.toggle("open"));
overlay.addEventListener("click",()=>sidebar.classList.remove("open"));
document.querySelectorAll(".nova-nav a").forEach(link=>link.addEventListener("click",()=>sidebar.classList.remove("open")));
document.getElementById("novaAiForm").addEventListener("submit",event=>{event.preventDefault();const input=document.getElementById("novaAiInput"),answer=document.getElementById("novaAiAnswer");if(!input.value.trim())return;answer.style.display="block";answer.textContent="Nova AI received: "+input.value.trim()+"\\n\\nYour request is ready to apply in the project workspace.";input.value="";});
</script>
</body>
</html>`;
}
