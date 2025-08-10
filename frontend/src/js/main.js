// File: src/js/main.js
import { loadingPromise } from '../utils/loading.js';
import themeManager from '../utils/theme.js';
import { init as initAuth  } from './auth/auth_main.js';
import chat from './chat.js';
import { init as initFaq } from './faq-toggle.js'; 

/**
 * Realiza a transição final do skeleton para a aplicação
 */
function showFinalApplication() {
    const skeletonLoader = document.getElementById('page-skeleton-loader');
    const mainApp = document.getElementById('app');
    let appRevealed = false; // Flag para evitar execução dupla

    const revealApp = () => {
        if (appRevealed) return;
        appRevealed = true;
        
        skeletonLoader?.remove();

        if (mainApp) {
            console.log("DEBUG: Removendo 'hidden' e iniciando fade-in do #app.");
            mainApp.classList.remove('hidden');
            mainApp.classList.add('opacity-0');
            requestAnimationFrame(() => {
                mainApp.classList.remove('opacity-0');
            });
        }
    };

    if (skeletonLoader) {
        skeletonLoader.addEventListener('transitionend', revealApp, { once: true });
        setTimeout(revealApp, 400); // Fallback de segurança
        skeletonLoader.classList.add('opacity-0');
    } else {
        revealApp();
    }
}

/**
 * Inicia o carregamento de dados e módulos assíncronos de forma progressiva.
 */
async function initializeAsyncModules() {
    initFaq(); 
    //  Inicializa o chat para que ele esteja pronto para receber comandos
    await chat.init();
    
    // Verifica o status do login
    const isLoggedIn = await initAuth();
    chat.setAuthState(isLoggedIn);
}

/**
 * Ponto de entrada principal da aplicação.
 */
async function main() {
    // Inicializa módulos síncronos (não dependem de dados/API)
    themeManager.init();
    try {
        //  Espera o loader crítico terminar (Spinner -> Skeleton)
        await loadingPromise;
        //  Carrega os módulos da aplicação enquanto o skeleton é exibido
        await initializeAsyncModules();

    } catch (error) {

        document.body.innerHTML = '<p class="text-center text-red-500 p-8">Ocorreu um erro ao carregar a aplicação. Por favor, tente novamente.</p>';
    } finally {
        //  SEMPRE executa para garantir que a UI final seja mostrada
        showFinalApplication();
    }
}

// Inicia todo o processo.
main();