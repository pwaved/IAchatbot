/**
 * Classe para criar e gerenciar modais dinamicamente.

 */
export default class Modal {
    /**
     * @param {string} id - Um ID único para o modal.
     * @param {string} title - O título a ser exibido no cabeçalho do modal.
     * @param {string|HTMLElement} content - O HTML ou o elemento DOM que será o corpo do modal.
     * @param {Array<object>} footerButtons - Um array de objetos para os botões do rodapé.
     * Ex: [{ text: 'Salvar', type: 'primary', onClick: () => {} }]
     */
    constructor({ id, title, content, footerButtons = [] }) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.footerButtons = footerButtons;
        this.modalElement = null; // Manterá a referência ao elemento do modal
        this._createModal();
    }

    _createModal() {
        const backdrop = document.createElement('div');
        backdrop.id = this.id;
        // Classes do Tailwind para o fundo e posicionamento
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop hidden';

        // Construção do HTML interno usando Template Literals
        const modalHTML = `
            <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg transform transition-all">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-xl font-bold text-neutral-800 dark:text-white">${this.title}</h2>
                    <button data-close-button class="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors">✕</button>
                </div>
                <div id="modal-content-${this.id}" class="space-y-4">
                    </div>
                <div id="modal-footer-${this.id}" class="flex justify-end space-x-4 pt-4 mt-4">
                    </div>
            </div>
        `;
        
        backdrop.innerHTML = modalHTML;
        document.body.appendChild(backdrop);
        
        this.modalElement = backdrop;

        // Inserir o conteúdo (pode ser uma string HTML ou um nó do DOM)
        const contentContainer = this.modalElement.querySelector(`#modal-content-${this.id}`);
        if (typeof this.content === 'string') {
            contentContainer.innerHTML = this.content;
        } else if (this.content instanceof HTMLElement) {
            contentContainer.appendChild(this.content);
        }

        // Criar e adicionar os botões do rodapé
        const footerContainer = this.modalElement.querySelector(`#modal-footer-${this.id}`);
        this.footerButtons.forEach(buttonInfo => {
            const button = this._createButton(buttonInfo);
            footerContainer.appendChild(button);
        });
        
        // Adicionar listener para o botão de fechar
        this.modalElement.querySelector('[data-close-button]').addEventListener('click', () => this.destroy());
    }

    _createButton({ text, type = 'secondary', onClick }) {
        const button = document.createElement('button');
        button.textContent = text;
        // Classes padrão e customizadas baseadas no tipo
        const baseClasses = 'font-semibold rounded-lg px-4 py-2 transition';
        let typeClasses = 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-500'; // secondary (default)
        
        if (type === 'primary') {
            typeClasses = 'bg-green-500 text-white hover:bg-green-600';
        } else if (type === 'danger') {
            typeClasses = 'bg-red-600 text-white hover:bg-red-700';
        }
        
        button.className = `${baseClasses} ${typeClasses}`;
        button.addEventListener('click', onClick);
        return button;
    }

    show() {
        this.modalElement.classList.remove('hidden');
    }

    hide() {
        this.modalElement.classList.add('hidden');
    }

    // Método para remover o modal completamente do DOM (evita acúmulo de elementos)
    destroy() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
    }
}