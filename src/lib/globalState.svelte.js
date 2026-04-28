import { browser } from '$app/environment';

class GlobalState {
    language = $state('KR');
    isDarkMode = $state(false);

    setLanguage(newLang) {
        this.language = newLang;
        if (browser) {
            localStorage.setItem('language', newLang);
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        if (browser) {
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
            if (this.isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
}

export const globalState = new GlobalState();