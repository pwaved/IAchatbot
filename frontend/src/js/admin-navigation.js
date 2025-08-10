// A função init encapsula toda a lógica de navegação do painel
function init() {
    const backToChatButton = document.getElementById('back-to-chat-btn');
    const tabsContainer = document.getElementById('admin-tabs-container');
    const contentContainer = document.getElementById('admin-content-container');

    // Lógica para o botão "Voltar ao Chat"
    if (backToChatButton) {
        backToChatButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    //  Lógica para a navegação por abas
    if (tabsContainer && contentContainer) {
        const tabButtons = tabsContainer.querySelectorAll('.tab-button-admin');
        const tabContents = contentContainer.querySelectorAll('.tab-content');

        const showTab = (targetId) => {
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            tabButtons.forEach(button => {
                button.classList.remove('border-brand-green', 'text-brand-green');
                button.classList.add('border-transparent', 'text-neutral-500');
            });

            const activeContent = document.getElementById(`${targetId}-content`);
            if (activeContent) {
                activeContent.classList.remove('hidden');
                activeContent.dispatchEvent(new CustomEvent('tab:shown', { bubbles: true }));
            }

            const activeButton = tabsContainer.querySelector(`[data-target="${targetId}"]`);
            if (activeButton) {
                activeButton.classList.add('border-brand-green', 'text-brand-green');
                activeButton.classList.remove('border-transparent', 'text-neutral-500');
            }
        };

        tabsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.tab-button-admin');
            if (button && button.dataset.target) {
                const target = button.dataset.target;
                showTab(target);
            }
        });

        // Define a aba inicial como ativa ao carregar a página
        showTab('operators');
    }
}

export default {
    init
};