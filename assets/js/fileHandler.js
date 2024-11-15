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

            console.log('Files in zip:', Object.keys(zip.files));

            for (const [path, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    console.log('Processing file:', path);
                    
                    // Split path and clean it
                    const pathParts = path.split(/[\/\\]/).filter(part => part.length > 0);
                    console.log('Path parts:', pathParts);

                    // Expecting: valorant_scrims/2024-03-20T15-30-00-000Z_Ascent/file.csv
                    if (pathParts.length >= 2) {
                        const gameId = pathParts[1]; // The folder with timestamp and map
                        const fileName = pathParts[2]; // The CSV file name

                        console.log('Game ID:', gameId, 'File:', fileName);

                        if (gameId && fileName && fileName.endsWith('.csv')) {
                            if (!gameFiles.has(gameId)) {
                                gameFiles.set(gameId, {});
                            }

                            const content = await zipEntry.async('string');
                            const dataType = fileName.replace('.csv', '');
                            gameFiles.get(gameId)[dataType] = content;
                            console.log('Added data for', gameId, dataType);
                        }
                    }
                }
            }

            console.log('Processed games:', gameFiles);

            // Store processed games
            this.dashboardManager.games = gameFiles;

            status.textContent = `Upload successful! Found ${gameFiles.size} games.`;
            setTimeout(() => {
                status.textContent = '';
            }, 3000);

            if (gameFiles.size === 0) {
                throw new Error('No valid game data found in ZIP file');
            }

            this.dashboardManager.loadGamesFromMemory();
        } catch (error) {
            console.error('Error processing zip:', error);
            status.textContent = `Error: ${error.message}`;
            status.style.color = '#ff4444';
            setTimeout(() => {
                status.textContent = '';
                status.style.color = '#0d94e9';
            }, 5000);
        }
    }
}