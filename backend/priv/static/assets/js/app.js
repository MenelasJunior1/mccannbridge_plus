const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
const savedTheme = localStorage.getItem("mccann_bridge_theme");
if (savedTheme === "dark") document.documentElement.dataset.bridgeTheme = "dark";

const Hooks = {};

Hooks.BridgeShell = {
  mounted() {
    if (localStorage.getItem("mccann_bridge_sidebar_collapsed") === "1") {
      this.el.classList.add("is-collapsed");
    }

    this.onClick = (event) => {
      if (event.target.closest("[data-bridge-collapse]")) {
        const collapsed = this.el.classList.toggle("is-collapsed");
        localStorage.setItem("mccann_bridge_sidebar_collapsed", collapsed ? "1" : "0");
      }

      if (event.target.closest("[data-bridge-menu]")) {
        this.el.classList.add("is-menu-open");
      }

      if (event.target.closest("[data-bridge-close]")) {
        this.el.classList.remove("is-menu-open");
      }

      if (event.target.closest("[data-bridge-theme]")) {
        const dark = document.documentElement.dataset.bridgeTheme !== "dark";
        document.documentElement.dataset.bridgeTheme = dark ? "dark" : "light";
        localStorage.setItem("mccann_bridge_theme", dark ? "dark" : "light");
      }
    };

    this.onKeydown = (event) => {
      if (event.key === "Escape") this.el.classList.remove("is-menu-open");
    };

    this.el.addEventListener("click", this.onClick);
    window.addEventListener("keydown", this.onKeydown);
  },

  destroyed() {
    this.el.removeEventListener("click", this.onClick);
    window.removeEventListener("keydown", this.onKeydown);
  }
};

const liveSocket = new LiveView.LiveSocket("/live", Phoenix.Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: Hooks
});

liveSocket.connect();
window.liveSocket = liveSocket;

// Handle flash close
// (you can safely remove this if you don't use the default flash component)
document.querySelectorAll("[role=alert][data-flash]").forEach((el) => {
  el.addEventListener("click", () => {
    el.setAttribute("hidden", "");
  });
});
