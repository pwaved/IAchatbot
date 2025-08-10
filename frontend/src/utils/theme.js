// src/utils/theme.js

import ICONS from "./icons.js";

const themeManager = {
    toggleButton: null, // Armazena referência do botão de alternância

    init() {
        this.toggleButton = document.getElementById('theme-toggle');

        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleTheme());
        }

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (prefersDark) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    },

    /**
     * Alterna o tema entre claro e escuro.
     */
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(isDark ? 'light' : 'dark');
    },

    /**
     * Define o tema da aplicação para o valor especificado.
     * @param {string} theme - The theme to set ('light' or 'dark').
     */
    setTheme(theme) {
        const htmlElement = document.documentElement;

        if (theme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
        this._updateToggleButton(theme);
    },

    /**
     * Função auxiliar privada para atualizar o ícone e aria-label do botão.
     * @param {string} theme - tema atual ('light' ou 'dark').
     */
    _updateToggleButton(theme) {
        if (!this.toggleButton) return;

        if (theme === 'dark') {
            this.toggleButton.innerHTML = ICONS.sun; // mostra icon do sol no modo escuro
            this.toggleButton.setAttribute('aria-label', 'Mudar para o modo claro');
        } else {
            this.toggleButton.innerHTML = ICONS.moon; // mostra icon da lua no modo claro
            this.toggleButton.setAttribute('aria-label', 'Mudar para o modo escuro');
        }
    }
};

export default themeManager;