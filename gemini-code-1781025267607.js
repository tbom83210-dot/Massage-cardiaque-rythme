if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker enregistré avec succès !'))
        .catch(err => console.log('Échec de l\'enregistrement du SW :', err));
    });
}