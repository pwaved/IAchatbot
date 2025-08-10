export function init() {
    const sidebar = document.getElementById('faq-sidebar');
    const toggleButton = document.getElementById('faq-toggle');
    const closeButton = document.getElementById('close-faq-sidebar-button');
    const backdrop = document.getElementById('faq-sidebar-backdrop');

    if (!sidebar || !toggleButton || !closeButton || !backdrop) {
        console.error("Um ou mais elementos do FAQ sidebar não foram encontrados.");
        return;
    }

    const openSidebar = () => {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        backdrop.classList.remove('hidden');
        toggleButton.setAttribute('aria-expanded', 'true');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        toggleButton.setAttribute('aria-expanded', 'false');
    };

    // Event Listeners
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar();
    });

    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSidebar();
    });

    backdrop.addEventListener('click', () => {
        closeSidebar();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('translate-x-0')) {
            closeSidebar();
        }
    });
}
