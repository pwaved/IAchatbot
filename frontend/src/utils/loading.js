// adicionado uma tela de loading, que é executado após o DOM ser parseado
// para garantir que a estilização principal seja carregada antes de exibir o conteúdo.
export class Loading {
    constructor() {
        this.isSkeletonReady = false;
        this.readyPromise = new Promise(resolve => {
            this.resolveReadyPromise = resolve;
        });
    }

    init() {
        // previne alguns Flashs of Unstyled Contents no firefox 
        this.preventFOUC();
        this._setupListeners();
        this.setupFallbacks();
    }

    preventFOUC() {
        // controla a visibilidade 
        document.documentElement.classList.add('loading-content');
        
        // exclusivamente para o firefox
        if (this.isFirefox()) {
            document.documentElement.classList.add('firefox-loading');
        }
    }

    isFirefox() {
        return navigator.userAgent.toLowerCase().includes('firefox');
    }

    
     
    /**
     * Configura os listeners para monitorar o carregamento do CSS e do DOM.
     */
    _setupListeners() {
        const mainStylesheet = document.querySelector('link[href*="main.css"]');

        const cssPromise = new Promise((resolve) => {
            if (mainStylesheet?.sheet) return resolve();
            
            // Caso contrário, aguarda o evento 'load'.
            mainStylesheet?.addEventListener('load', resolve, { once: true });
            
            // Se o CSS falhar, resolve mesmo assim para não travar a aplicação.
            mainStylesheet?.addEventListener('error', () => {
                console.warn('O arquivo de estilo principal (main.css) falhou ao carregar.');
                resolve(); 
            }, { once: true });

            // Fallback de tempo: se o CSS demorar muito, continua o processo.
            setTimeout(() => resolve(), 2000); // 2 segundos de timeout
        });

        // Quando o CSS estiver pronto e o DOM carregado, mostra o skeleton.
        Promise.all([
            cssPromise,
            new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve))
        ]).then(() => {
            this._showSkeleton();
        });
    }

    monitorCSSLoad(linkElement) {
        return new Promise((resolve) => {
            // checa a promise
            if (linkElement.sheet) {
                resolve();
                return;
            }

            // event listeners
            const onLoad = () => {
                linkElement.removeEventListener('load', onLoad);
                linkElement.removeEventListener('error', onError);
                resolve();
            };

            const onError = () => {
                linkElement.removeEventListener('load', onLoad);
                linkElement.removeEventListener('error', onError);
                console.warn(`CSS failed to load: ${linkElement.href}`);
                resolve(); // resolve em caso de erro
            };

            linkElement.addEventListener('load', onLoad);
            linkElement.addEventListener('error', onError);

            // fallback se é firefox
            if (this.isFirefox()) {
                this.pollCSSLoad(linkElement, resolve);
            }
        });
    }

    pollCSSLoad(linkElement, resolve) {
        const poll = () => {
            try {
                if (linkElement.sheet && linkElement.sheet.cssRules) {
                    resolve();
                    return;
                }
            } catch (e) {
                // CSS pode ainda estar carregando
            }

            // Continue polling
            setTimeout(poll, 50);
        };

        setTimeout(poll, 10);
    }

    onCSSReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._showSkeleton());
        } else {
            this._showSkeleton();
        }
    }

   
    setupFallbacks() {
        // O fallback agora chama showSkeleton
        setTimeout(() => {
            if (!this.isReadyForApp) {
                this._showSkeleton();
            }
        }, this.maxWaitTime);
    }

       /**
     * Realiza a transição do spinner para o skeleton.
     */
    _showSkeleton() {
        if (this.isSkeletonReady) return;
        this.isSkeletonReady = true;

        // Revela o conteúdo do body (que contém o skeleton e o app oculto).
        document.documentElement.classList.remove('loading-content');
        document.documentElement.classList.add('content-ready');

        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('loaded');
            loadingScreen.addEventListener('transitionend', () => {
                loadingScreen.remove();
            }, { once: true });
        }
        
        this.resolveReadyPromise();
    }
}
const loading = new Loading();
loading.init();

export default loading;
export const loadingPromise = loading.readyPromise;