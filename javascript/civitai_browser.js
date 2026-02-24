// Civitai Browser - helper JS
// Adds Enter key support for triggering search
(function () {
    const MAX_TABS = 5;
    const ROOT_ID = "civitai-ext";

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
        const root = getRoot();
        const el = root.querySelector(".civitai-tabstrip .civitai-tab.active");
        const raw = el ? el.getAttribute("data-tab-index") : null;
        const idx = raw != null ? parseInt(raw, 10) : 0;
        return Number.isFinite(idx) ? idx : 0;
    }

    function getTabCount() {
        const root = getRoot();
        return root.querySelectorAll(".civitai-tabstrip .civitai-tab").length || 1;
    }

    function openUrlInTab(tabIndex, url) {
        const activeIdx = getActiveTabIndex();
        if (activeIdx !== tabIndex) {
            clickById(`civitai-switch-btn-${tabIndex}`);
        }

        setTimeout(() => {
            setInputValueById(`civitai-url-input-${tabIndex}`, url);
            const root = getRoot();
            const btn = root.querySelector(`#civitai-url-btn-${tabIndex} button, #civitai-url-btn-${tabIndex}`);
            if (btn) btn.click();
        }, 250);
    }

    function attachSendToTabButtons() {
        const root = getRoot();
        const nodes = root.querySelectorAll("[id^='civitai-send-tab-']");
        for (const node of nodes) {
            const btn = node.tagName === "BUTTON" ? node : node.querySelector("button");
            if (!btn) continue;
            if (btn.dataset.civitaiSendAttached === "1") continue;
            btn.dataset.civitaiSendAttached = "1";

            btn.addEventListener("click", () => {
                const m = (node.id || "").match(/^civitai-send-tab-(\d+)$/);
                const srcIdx = m ? parseInt(m[1], 10) : 0;
                const url = getInputValueById(`civitai-selected-url-${srcIdx}`);
                if (!url) return;

                const tabCount = getTabCount();
                if (tabCount < MAX_TABS) {
                    clickById("civitai-add-btn");
                    const newIndex = tabCount;
                    setTimeout(() => openUrlInTab(newIndex, url), 350);
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
        });
        attachSendToTabButtons();
        observer.observe(root, { childList: true, subtree: true });
    });
})();
