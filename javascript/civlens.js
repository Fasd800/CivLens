// CivLens - helper JS
// Adds Enter key support for triggering search
(function () {
    const MAX_TABS = 5;
    const ROOT_ID = "civlens-ext";

    function getRoot() {
        return document.getElementById(ROOT_ID) || document;
    }

    function getInputValueById(id) {
        const root = getRoot();
        const el = root.querySelector(`#${id} input, #${id} textarea`);
        return el ? String(el.value || "") : "";
    }

    function setInputValueById(id, value) {
        const root = getRoot();
        const el = root.querySelector(`#${id} input, #${id} textarea`);
        if (!el) return false;
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function clickById(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        el.click();
        return true;
    }

    function getActiveTabIndex() {
        const buttons = getSearchTabButtons();
        const idx = buttons.findIndex((btn) => btn.classList.contains("selected"));
        return idx >= 0 ? idx : 0;
    }

    function getTabNav() {
        const root = getRoot();
        return root.querySelector("#civlens-search-tabs .tab-nav");
    }

    function getTabButtons() {
        const nav = getTabNav();
        if (!nav) return [];
        return Array.from(nav.querySelectorAll("button"));
    }

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style && style.display !== "none" && style.visibility !== "hidden";
    }

    function getVisibleSearchButtons() {
        const buttons = getTabButtons();
        if (!buttons.length) return [];
        return buttons.slice(0, -1).filter(isVisible);
    }

    function getSearchTabButtons() {
        const buttons = getTabButtons();
        if (!buttons.length) return [];
        return buttons.slice(0, -1);
    }

    function getTabCount() {
        return getVisibleSearchButtons().length || 1;
    }

    function clickSearchTab(index) {
        const buttons = getSearchTabButtons();
        const btn = buttons[index];
        if (!btn || !isVisible(btn)) return false;
        btn.click();
        return true;
    }

    function clickAddTab() {
        const buttons = getTabButtons();
        if (!buttons.length) return false;
        const addBtn = buttons[buttons.length - 1];
        if (!addBtn || addBtn.classList.contains("civlens-tab-add-disabled")) return false;
        addBtn.click();
        return true;
    }

    function updateAddTabDisabled() {
        const buttons = getTabButtons();
        if (!buttons.length) return;
        const addBtn = buttons[buttons.length - 1];
        const visibleCount = getVisibleSearchButtons().length;
        if (visibleCount >= MAX_TABS) {
            addBtn.classList.add("civlens-tab-add-disabled");
            addBtn.setAttribute("aria-disabled", "true");
        } else {
            addBtn.classList.remove("civlens-tab-add-disabled");
            addBtn.removeAttribute("aria-disabled");
        }
    }

    function attachTabCloseButtons() {
        const buttons = getTabButtons();
        if (!buttons.length) return;
        const searchButtons = buttons.slice(0, -1);
        for (const btn of searchButtons) {
            if (!isVisible(btn)) continue;
            if (btn.querySelector(".civlens-tab-close-btn")) continue;
            const close = document.createElement("span");
            close.className = "civlens-tab-close-btn";
            close.textContent = "×";
            close.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const text = btn.textContent || "";
                const match = text.match(/Search\s+(\d+)/);
                if (!match) return;
                const idx = parseInt(match[1], 10) - 1;
                clickById(`civlens-close-btn-${idx}`);
            });
            btn.appendChild(close);
        }
    }

    function openUrlInTab(tabIndex, url) {
        const activeIdx = getActiveTabIndex();
        if (activeIdx !== tabIndex) {
            clickSearchTab(tabIndex);
        }

        setTimeout(() => {
            setInputValueById(`civlens-url-input-${tabIndex}`, url);
            const root = getRoot();
            const btn = root.querySelector(`#civlens-url-btn-${tabIndex} button, #civlens-url-btn-${tabIndex}`);
            if (btn) btn.click();
        }, 250);
    }

    function attachSendToTabButtons() {
        const root = getRoot();
        const nodes = root.querySelectorAll("[id^='civlens-send-tab-']");
        for (const node of nodes) {
            const btn = node.tagName === "BUTTON" ? node : node.querySelector("button");
            if (!btn) continue;
            if (btn.dataset.civitaiSendAttached === "1") continue;
            btn.dataset.civitaiSendAttached = "1";

            btn.addEventListener("click", () => {
                const m = (node.id || "").match(/^civlens-send-tab-(\d+)$/);
                const srcIdx = m ? parseInt(m[1], 10) : 0;
                const url = getInputValueById(`civlens-selected-url-${srcIdx}`);
                if (!url) return;

                const tabCount = getTabCount();
                if (tabCount < MAX_TABS) {
                    if (!clickAddTab()) return;
                    const newIndex = tabCount;
                    let attempts = 0;
                    const waitForTab = () => {
                        const btns = getSearchTabButtons();
                        const btn = btns[newIndex];
                        if (btn && isVisible(btn)) {
                            btn.click();
                            setTimeout(() => openUrlInTab(newIndex, url), 200);
                            return;
                        }
                        attempts += 1;
                        if (attempts < 12) {
                            setTimeout(waitForTab, 150);
                        }
                    };
                    waitForTab();
                } else {
                    window.alert(`Maximum tabs reached (${MAX_TABS}). Close a tab to send the model to a new one.`);
                }
            });
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        const root = getRoot();
        if (!root) return;
        const observer = new MutationObserver(() => {
            attachSendToTabButtons();
            attachTabCloseButtons();
            updateAddTabDisabled();
        });
        attachSendToTabButtons();
        attachTabCloseButtons();
        updateAddTabDisabled();
        observer.observe(root, { childList: true, subtree: true });
        setInterval(() => {
            updateAddTabDisabled();
        }, 500);
    });
})();
