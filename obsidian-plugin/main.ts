import { ItemView, Plugin, WorkspaceLeaf } from 'obsidian';

const VIEW_TYPE_GEMINI_TRANSLATOR = 'gemini-translator-view';

class GeminiTranslatorView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_GEMINI_TRANSLATOR;
    }

    getDisplayText() {
        return 'Gemini Translator';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h4', { text: 'Gemini Translator' });

        // Explanation to user
        const info = container.createEl('p', { text: 'Loading Translator...' });
        info.style.fontSize = '0.8rem';
        info.style.color = '#888';

        // MVP: Embed IFrame to localhost or hosted URL
        // Reason: Web Speech API works reliably in Browsers, but has issues in Electron (Obsidian Desktop)
        // unless specific keys are configured. The safest way is to embed the web app.

        const iframe = container.createEl('iframe');
        iframe.setAttribute('src', 'http://localhost:5173'); // Default vite dev server
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100% - 50px)';
        iframe.style.border = 'none';
        iframe.setAttribute('allow', 'microphone'); // Important for Speech API

        // Add a reload button
        const btnContainer = container.createEl('div');
        btnContainer.style.marginBottom = '10px';

        const btn = btnContainer.createEl('button', { text: 'Reload / Set URL' });
        btn.onclick = () => {
            // Simple interaction to allow changing URL if needed or just reload
            const newUrl = prompt("Enter Translator URL (e.g. http://localhost:5173 or https://your-deployed-app.com)", iframe.src);
            if (newUrl) iframe.setAttribute('src', newUrl);
        };
    }

    async onClose() {
        // Cleanup
    }
}

export default class GeminiTranslatorPlugin extends Plugin {
    async onload() {
        this.registerView(
            VIEW_TYPE_GEMINI_TRANSLATOR,
            (leaf) => new GeminiTranslatorView(leaf)
        );

        this.addRibbonIcon('languages', 'Open Gemini Translator', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-gemini-translator',
            name: 'Open Gemini Translator',
            callback: () => {
                this.activateView();
            }
        });
    }

    async onunload() {

    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_GEMINI_TRANSLATOR);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for default
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({ type: VIEW_TYPE_GEMINI_TRANSLATOR, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
