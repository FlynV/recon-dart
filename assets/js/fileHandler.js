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

            // Group files by game session
            const gameFiles = new Map();

            for (const [path, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    // Split path into components
                    const pathParts = path.split('/');
                    
                    // Skip if not in correct structure
                    if (pathParts.length < 2) continue;

                    // Get game session ID (folder name with date and map)
                    const gameId = pathParts[1]; // Gets the folder name
                    const fileName = pathParts[2]; // Gets the file name

                    if (!gameId || !fileName) continue;

                    // Initialize game session if not exists
                    if (!gameFiles.has(gameId)) {
                        gameFiles.set(gameId, {});
                    }

                    // Read file content
                    if (fileName.endsWith('.csv')) {
                        const content = await zipEntry.async('string');
                        const dataType = fileName.replace('.csv', '');
                        gameFiles.get(gameId)[dataType] = content;
                    }
                }
            }

            // Store processed games
            this.dashboardManager.games = gameFiles;

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