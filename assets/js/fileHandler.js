class FileHandler {
    constructor(dashboardManager) {
        this.dashboardManager = dashboardManager;
    }

    async handleZipFile(file) {
        const status = document.getElementById('upload-status');
        status.textContent = 'Processing zip file...';

        try {
            const zip = await JSZip.loadAsync(file);
            this.dashboardManager.games.clear();

            for (const [path, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    const pathParts = path.split('/');
                    const gameId = pathParts[1];
                    const fileName = pathParts[2];

                    if (!this.dashboardManager.games.has(gameId)) {
                        this.dashboardManager.games.set(gameId, {});
                    }

                    if (fileName) {
                        const content = await zipEntry.async('string');
                        this.dashboardManager.games.get(gameId)[fileName.replace('.csv', '')] = content;
                    }
                }
            }

            status.textContent = 'Upload successful!';
            setTimeout(() => {
                status.textContent = '';
            }, 3000);

            this.dashboardManager.loadGamesFromMemory();
        } catch (error) {
            console.error('Error processing zip:', error);
            status.textContent = 'Error processing zip file';
        }
    }
}