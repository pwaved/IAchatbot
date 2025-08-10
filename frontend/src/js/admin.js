// File: src/js/admin.js

import { loadingPromise } from '../utils/loading.js';
import themeManager from '../utils/theme.js';
import adminNavigation from './admin-navigation.js';
import adminOperators from './admin-usuario/operador_main.js';
import adminCategories from './admin-categoria/categoria_main.js';
import adminDocumentos from './admin-documentos/documento_main.js';
import adminAnalise from './admin-analise/analise_main.js';
import adminPerfis from './admin-perfil/perfil_main.js';
import { init as initAuth } from './auth/auth_main.js';
import { showLogoutConfirmation } from './auth/auth_ui.js';
import { ICONS, renderIcons } from '../utils/icons.js';
/**
 * Configura os componentes da interface que não dependem de dados do servidor.
 */
function initializeStaticContent() {
    renderIcons({
        'logout-icon': ICONS.logout,
        'back-arrow-icon': ICONS.backArrow,
        'user-menu-chevron-icon': ICONS.chevronDown,
        'users-tab-icon': ICONS.users,
        'profiles-tab-icon': ICONS.profiles,
        'categories-tab-icon': ICONS.categories,
        'documents-tab-icon': ICONS.knowledgeBase,
        'analytics-tab-icon': ICONS.analytics
    })
    themeManager.init();
    adminNavigation.init();

    document.getElementById('logout-button')?.addEventListener('click', showLogoutConfirmation);
    document.getElementById('back-to-chat-btn')?.addEventListener('click', () => {
        window.location.href = '/';
    });
}

/**
 * Orquestra o carregamento de todos os dados e módulos assíncronos.
 * PRIORIZA o conteúdo crítico (usuarios) para uma exibição mais rápida da UI.
 */
async function initializeAsyncContent() {
    // A autenticação é sempre necessária primeiro.
    await initAuth(); 
    // A lista de operadores é o conteúdo principal da primeira aba.
    await adminOperators.init(); 
    adminCategories.init();
    adminDocumentos.init();
    adminPerfis.init();

    document.getElementById('admin-content-container')?.addEventListener('tab:shown', (event) => {
        if (event.target.id === 'analytics-content') {
            adminAnalise.init();
        }
    });
}


/**
 * Realiza a transição visual final, garantindo que as animações sejam sequenciais.
 */
function showFinalApplication() {
    const skeletonLoader = document.getElementById('page-skeleton-loader');
    const mainApp = document.getElementById('app');
    let isDone = false; // Flag to prevent double execution.

    const revealApp = () => {
        // Ensure this logic only runs once.
        if (isDone) return;
        isDone = true;

        if (skeletonLoader) {
            skeletonLoader.remove();
        }

        if (mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.classList.add('opacity-0');
            // Use requestAnimationFrame for a smooth visual transition.
            requestAnimationFrame(() => {
                mainApp.classList.remove('opacity-0');
            });
        }
    };

    if (skeletonLoader) {
        const safetyTimeout = setTimeout(revealApp, 500);
        skeletonLoader.addEventListener('transitionend', () => {
            clearTimeout(safetyTimeout); 
            revealApp();
        }, { once: true });

        skeletonLoader.classList.add('opacity-0');

    } else {
        // Fallback: se esqueleto nao exisitr somente mostre o app
        revealApp();
    }
}


/**
 * Ponto de entrada principal da aplicação.
 */
async function main() {
    try {
        await loadingPromise;

        initializeStaticContent();
        await initializeAsyncContent();

    } catch (error) {
        console.error(" Falha crítica ao inicializar a página:", error);
    } finally {
        showFinalApplication();
    }
}

// Inicia a execução da aplicação.
main();