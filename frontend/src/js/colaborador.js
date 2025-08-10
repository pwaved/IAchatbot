import { loadingPromise } from '../utils/loading.js';
import themeManager from '../utils/theme.js';
import * as auth from './auth/auth_main.js';
import * as colaboradorPanel from './colaborador/colaborador_main.js';
import { ICONS, renderIcons } from '../utils/icons.js';

/**
 * Configura os componentes da interface que não dependem de dados do servidor.
 * Esta função é executada de forma síncrona.
 */
function initializeStaticContent() {
    themeManager.init();
    renderIcons({
        'user-menu-chevron-icon': ICONS.chevronDown
    });
}

/**
 * Orquestra o carregamento de todos os módulos e dados assíncronos.
 */
async function initializeAsyncContent() {
    // As inicializações de autenticação e do painel podem ocorrer em paralelo.
    await Promise.all([
        auth.init(),
        colaboradorPanel.init()
    ]);
}

/**
 * Realiza a transição visual final, removendo o skeleton e revelando a aplicação.
 * Usa um listener de transição com um fallback de tempo para maior robustez.
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
            // Remove 'hidden' para que o elemento ocupe espaço.
            mainApp.classList.remove('hidden');
            // Define a opacidade inicial como 0 para a animação de fade-in.
            mainApp.classList.add('opacity-0');
            
            // Solicita ao navegador que execute a animação no próximo quadro de pintura.
            requestAnimationFrame(() => {
                mainApp.classList.remove('opacity-0');
            });
        }
    };

    if (skeletonLoader) {
        // Aguarda o fim da animação de fade-out do skeleton.
        skeletonLoader.addEventListener('transitionend', revealApp, { once: true });
        
        // Fallback de segurança: se o evento de transição não disparar, revela o app mesmo assim.
        setTimeout(revealApp, 500); 

        // Inicia a animação de fade-out usando a classe de opacidade do TailwindCSS.
        skeletonLoader.classList.add('opacity-0');
    } else {
        // Se o skeleton não existir, revela o app diretamente.
        revealApp();
    }
}

/**
 * Mostra uma mensagem de erro em tela cheia se a inicialização falhar.
 */
function showFatalError() {
    // Esconde todos os loaders para mostrar apenas a mensagem de erro.
    document.getElementById('loading-screen')?.remove();
    document.getElementById('page-skeleton-loader')?.remove();
    document.body.innerHTML = `<div class="w-full h-screen flex items-center justify-center p-8">
        <p class="text-red-500 text-center font-semibold">Ocorreu um erro ao carregar a aplicação. Por favor, <a href="" class="underline">recarregue a página</a>.</p>
    </div>`;
}

/**
 * Ponto de entrada principal da aplicação.
 */
async function main() {
    try {
        //  Espera a transição inicial (Spinner -> Skeleton) terminar.
        await loadingPromise;
        
        //  Inicializa componentes estáticos enquanto o skeleton é exibido.
        initializeStaticContent();
        
        //  Carrega todos os dados e módulos necessários de forma assíncrona.
        await initializeAsyncContent();

    } catch (error) {
        showFatalError();
    } finally {
        //  SEMPRE executa para garantir que a UI final seja mostrada.
        showFinalApplication();
    }
}

// Inicia todo o processo.
main();