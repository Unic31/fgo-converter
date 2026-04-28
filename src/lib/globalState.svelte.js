import { browser } from '$app/environment';

class GlobalState {
    isSideBar = $state(false);
    toggleSidebar() {
        this.isSideBar = !this.isSideBar;
    }

    language = $state('KR');
    setLanguage(newLang) {
        this.language = newLang;
        if (browser) {
            localStorage.setItem('language', newLang);
        }
    }

    isDarkMode = $state(false);
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